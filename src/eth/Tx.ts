import { Transaction, TransactionReceipt } from 'web3-eth'
import Web3 from 'web3'
import BigNumber from 'bignumber.js'

import { EthBlock } from './Block'
import Tx from '../model/tx'
import { e1_18, zero, convertAddressFromHex64 } from './utils'
import prisma from '../model/db'
import EthTxEvent from './Event'
import Contract from './Contract'
import { BalanceEvent, updaterETHTransfer } from './Push'
import { rejects } from 'assert'


// 非合约调用
const TxTypePeer = 0
const TxTypeToken = 1
const TxTypeContract = 2

const TxStatusConfirmed = 0
const TxStatusConfirming = 1
const TxStatusPending = 2


// event 是否是 transfer
function isTransfer(topics: string[]): boolean {
    if (topics.length !== 3) {
        return false
    }
    return topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
}

// Eth transaction
class EthTx implements Tx {
    hash: string
    block: number
    pos: number
    status: number
    timestamp: number
    fee: BigNumber
    value: BigNumber  // msg.value
    amount: BigNumber
    from: string
    to: string
    realTo: string // contract transfer to address
    nonce: number
    gasPrice: BigNumber
    gasLimit: number
    gasUsed: number
    input: string
    interact: boolean
    transferType: number
    isContractCall: number
    contractCreated: string

    txLogs: any[]

    constructor(tx: Transaction, timestamp: number) {
        this.hash = tx.hash
        this.block = tx.blockNumber ?? 0
        this.from = tx.from
        this.to = tx.to ?? ''
        this.nonce = tx.nonce
        this.gasPrice = new BigNumber(tx.gasPrice)
        this.gasLimit = tx.gas
        this.gasUsed = tx.gas
        this.value = new BigNumber(tx.value)
        this.amount = new BigNumber(0)
        this.pos = tx.transactionIndex ?? 0
        this.input = tx.input
        this.interact = false
        this.transferType = TxTypePeer
        // this.transferType = timestamp
        this.status = TxStatusConfirmed
        this.fee = new BigNumber(0)
        this.timestamp = timestamp
        this.isContractCall = 0
        this.realTo = ''

        // 当to为null时, 创建合约
        this.contractCreated = ''
        if (this.input === '0x') {
            this.gasUsed = 21000
            this.fee = EthTx.calcTxFee(this.gasPrice, this.gasUsed)
            // todo 通知kafka 触发余额变更事件
        }
        this.txLogs = []
    }

    // 手续费计算
    static calcTxFee(price: BigNumber, gas: string | number) {
        let gasPrice = new BigNumber(price)
            , gasUsed = new BigNumber(gas)     // tx.gas 是 gasLimit
        let gasReal = gasPrice.multipliedBy(gasUsed)

        // console.log('price:', price, 'gas:', gas, 'used:', gasReal.toString(), gasReal.div(10**18).toString())
        return gasReal
    }

    // 获取创建合约地址
    // 获取gasUsed, 计算实际手续费
    // 获取合约事件
    fillReceipt(receipt: TransactionReceipt)  {
        this.gasUsed = receipt.gasUsed
        this.fee = EthTx.calcTxFee(this.gasPrice, this.gasUsed)
        this.txLogs = receipt.logs

        if (receipt.contractAddress) {
            this.contractCreated = receipt.contractAddress
            // 合约创建的input太长, 单独放在合约的表中, 这里把input截断
            // todo 合约创建
            console.info('contract created: creater: %s contract: %s', this.from, this.contractCreated)
            let contract = new Contract(this.contractCreated, this.from, this.hash, '', '', this.block)
            this.input = ''
            return contract
        }
    }

    // 处理log
    doTxEvents(logs: Array<any>): Array<EthTxEvent> {
        // todo 很多工作需要进一步细化
        let events = []
        for (let i = 0; i < logs.length; i ++) {
            let evt = new EthTxEvent(this.from, this.to, logs[i])
            // set name
            events.push(evt)
        }

        if (logs.length === 1 && isTransfer(logs[0].topics)) {
            // todo 疑似 erc20, 生成 token, 推送kafka, 更新 token
            this.transferType = TxTypeToken
            // 设置amount
            // console.info('token transfer amount:', this.hash, logs[0].data)
            this.amount = new BigNumber(logs[0].data)
            this.realTo = convertAddressFromHex64(logs[0].topics[2])
            // token更新事件
        }

        return events
    }

    // insert to db
    async create() {
        await prisma.eth_tx.create({
            data: {
                hash: this.hash,
                block: this.block,
                pos: this.pos,
                status: this.status,
                timestamp: this.timestamp,
                fee: this.fee.toString(),
                value: this.value.toString(),  // msg.value
                amount: this.amount.toString(),
                from: this.from,
                to: this.to,
                real_to: this.realTo, // contract transfer to address
                nonce: this.nonce,
                gas_price: this.gasPrice.toString(),
                gas_limit: this.gasLimit,
                gas_used: this.gasUsed,
                input_data: this.input,
                interact: this.interact ? 1 : 0,
                transfer_type: this.transferType,
                is_contract_call: this.isContractCall,
                contract_created: this.contractCreated,
            }
        })
    }

    // 是否是以太转账交易
    isEthTransfer() {
        return this.value.comparedTo(zero) > 0 && this.to !== ''
    }
}

async function getEthTx(provider: Web3, hash: string, timestamp: number) {
    let tx = await provider.eth.getTransaction(hash)

    let ethTx = new EthTx(tx, timestamp)
    if (tx.input !== '0x') {
        let receipt = await provider.eth.getTransactionReceipt(hash)
    // console.log(JSON.stringify(tx))
        ethTx.fillReceipt(receipt)
    }
    return ethTx
}

// batch 创建接口
function createFromTxReceipt(timestamp: number, tx: Transaction, receipt?: TransactionReceipt) {
    let ethTx = new EthTx(tx, timestamp)
    if (receipt) {
        ethTx.fillReceipt(receipt)
    }

    return ethTx
}

// 分析交易列表
async function doTransactionList(provider: Web3, block: EthBlock, txs: Array<string>): Promise<{
    txList: Array<EthTx>,
    events: Array<EthTxEvent>,
    contracts: Array<Contract>,
    balanceEvents: Array<BalanceEvent>
}> {
    // 1. 地址
    let timestamp = block.timestamp
    let batch = new provider.BatchRequest();
    // for (let i = 0; i < txs.length; i ++) {
    let txList: Array<EthTx> = []
    let events: Array<EthTxEvent> = []
    let balanceEvents: Array<BalanceEvent> = []
    let contracts: Array<Contract> = []
    
    // console.log('txList:', txs.length)
    if (txs.length === 0) {
        return { txList, events, balanceEvents, contracts }
    }
    await new Promise(function(resolve, reject) {
        let counter  = 0
        for (let i = txs.length - 1; i >= 0; i --) {
            let txHash = txs[i]
            // @ts-ignore
            batch.add(provider.eth.getTransaction.request(txHash, (err, data) => {
                // console.log(err, data)
                if (!err) {
                    let tx = new EthTx(data, timestamp)
                    txList.push(tx)
                    if (tx.isEthTransfer()) {
                        balanceEvents.push(...updaterETHTransfer(tx.from, tx.to))
                    }
                } else {
                    // todo 重新获取?
                    console.warn('getTransaction failed:', txHash)
                    reject(err)
                }
                counter ++
                // console.log('tx:', counter)
                if (counter === txs.length) {
                    // console.log('eth transfer events:', balanceEvents.length)
                    resolve(txList);
                }
            }))
            // let tx = await getEthTx(provider, txHash, block.timestamp)
            
            // totalFee = totalFee.plus(tx.fee)
        }

        batch.execute()
    });
    // console.log('get tx done')

    let totalFee = new BigNumber(0)
    batch = new provider.BatchRequest();
    // gasUsed
    await new Promise(function(resolve, reject) {
        let counter = 0, total = 0
        for (let i = 0; i < txList.length; i ++) {
            if (txList[i] && txList[i].input !== '0x') {
                total ++
                let txHash = txList[i].hash
                // @ts-ignore
                batch.add(provider.eth.getTransactionReceipt.request(txHash, (err, data) => {
                    // console.log(err, data)
                    if (!err) {
                        let contract = txList[i].fillReceipt(data)
                        if (contract) {
                            // @ts-ignore
                            contracts.push(contract)
                        }

                        if (data.logs.length > 0) {
                            // 提取日志
                            let evts = txList[i].doTxEvents(data.logs)
                            events.push(...evts)
                            // 是否触发 balance 更新
                            evts.forEach(evt => {
                                let be = evt.getBalanceEvent()
                                if (be) {
                                    balanceEvents.push(...be)
                                }
                            })
                        }
                    } else {
                        // todo 重新获取?
                        console.warn('getTransactionReceipt failed:', txHash)
                        reject(err)
                    }
                    counter ++
                    if (counter === total) {
                        resolve('');
                    }
                }))
            }
        }

        if (total > 0) {
            batch.execute()
        } else {
            resolve('')
        }
    })

    for (let i = 0; i < txList.length; i ++) {
        // console.log('tx fee', i, txList[i].fee.toString())
        totalFee = totalFee.plus(txList[i].fee)

    }

    block.fee = totalFee.div(e1_18)
    // console.log('get tx receipt done: fee', totalFee.toString())
    return {txList, events, balanceEvents, contracts}
}

// 批量入库 EthTx
async function batchCreateEthTx(txList: Array<EthTx>) {
    if (txList.length === 0) {
        return
    }
    
    let values = txList.map(
        tx => `('${tx.hash}', '${tx.block}', '${tx.pos}', '${tx.status}', '${tx.timestamp}', '${tx.fee.toString()}', '${tx.value.toString()}', '${tx.amount.toString()}', '${tx.from}', '${tx.to}', '${tx.realTo}', '${tx.nonce}', '${tx.gasPrice.toString()}', '${tx.gasLimit}', '${tx.gasUsed}', '${tx.input}', '${tx.interact ? 1 : 0}', '${tx.transferType}', '${tx.isContractCall}', '${tx.contractCreated}')`
      )
    let query = `insert into eth_tx (hash, block, pos, status, timestamp, fee, value, amount, \`from\`, \`to\`, real_to, nonce, gas_price, gas_limit, gas_used, input_data, interact, transfer_type, is_contract_call, contract_created) values ${values.join(',')}`

    await prisma.$executeRaw(query)
}

async function cleanEthTxByHeight(height: number) {
    await prisma.$executeRaw(`delete from eth_tx where block = ${height}`)
}

export {
    EthTx,
    getEthTx,
    batchCreateEthTx,
    doTransactionList,
    createFromTxReceipt,
    cleanEthTxByHeight,
}
