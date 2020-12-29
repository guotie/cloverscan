import { Transaction, TransactionReceipt } from 'web3-eth'
import Web3 from 'web3'
import BigNumber from 'bignumber.js'

import { EthBlock } from './Block'
import Tx from '../model/tx'
import { e1_18 } from './utils'
import prisma from '../model/db'
import EthTxEvent from './Event'


// 非合约调用
const TxTypePeer = 0
const TxTypeToken = 1
const TxTypeContract = 2

const TxStatusConfirmed = 0
const TxStatusConfirming = 1
const TxStatusPending = 2

const famousEvents: {[index: string]: string} = {
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef': 'Transfer (index_topic_1 address src, index_topic_2 address dst, uint256 wad)',
    '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c': 'Deposit (index_topic_1 address dst, uint256 wad)',
}

function getEventName(evt: EthTxEvent) {
    let name = famousEvents[evt.topic0]
    if (name) {
        evt.name = name
    }
}

// event 是否是 transfer
function isTransfer(topics: string[]): boolean {
    if (topics.length !== 3) {
        return false
    }
    return topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
}

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
        this.transferType = timestamp
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
        }
        this.txLogs = []
    }

    static calcTxFee(price: BigNumber, gas: string | number) {
        let gasPrice = new BigNumber(price)
            , gasUsed = new BigNumber(gas)     // tx.gas 是 gasLimit
        let gasReal = gasPrice.multipliedBy(gasUsed)

        // console.log('price:', price, 'gas:', gas, 'used:', gasReal.toString(), gasReal.div(10**18).toString())
        return gasReal
    }

    // 获取gasUsed?
    fillReceipt(receipt: TransactionReceipt)  {
        this.gasUsed = receipt.gasUsed
        this.fee = EthTx.calcTxFee(this.gasPrice, this.gasUsed)
        this.txLogs = receipt.logs

        if (receipt.contractAddress) {
            this.contractCreated = receipt.contractAddress
        }
    }

    // 处理log
    doTxEvents(logs: Array<any>): Array<EthTxEvent> {
        // todo 很多工作需要进一步细化
        let events = []
        for (let i = 0; i < logs.length; i ++) {
            let evt = new EthTxEvent(logs[i])
            // name
            getEventName(evt)

            events.push(evt)
        }

        if (logs.length === 1 && isTransfer(logs[0].topics)) {
            // todo 疑似 erc20, 生成 token
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
async function doTransactionList(provider: Web3, block: EthBlock, txs: Array<string>): Promise<{txList: Array<EthTx>, events: Array<EthTxEvent>}> {
    // 1. 地址
    let timestamp = block.timestamp
    let batch = new provider.BatchRequest();
    // for (let i = 0; i < txs.length; i ++) {
    let txList: Array<EthTx> = []
    let events: Array<EthTxEvent> = []
    
    await new Promise(function(resolve, reject) {
        let counter  = 0
        for (let i = txs.length - 1; i >= 0; i --) {
            let txHash = txs[i]
            // @ts-ignore
            batch.add(provider.eth.getTransaction.request(txHash, (err, data) => {
                // console.log(err, data)
                if (!err) {
                    txList.push(new EthTx(data, timestamp))
                }
                counter ++
                // console.log('tx:', counter)
                if (counter === txs.length) {
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
    await new Promise(function(resolve) {
        let counter = 0, total = 0
        for (let i = 0; i < txList.length; i ++) {
            if (txList[i] && txList[i].input === '0x') {
                total ++
                // @ts-ignore
                batch.add(provider.eth.getTransactionReceipt.request(txList[i].hash, (err, data) => {
                    // console.log(err, data)
                    if (!err) {
                        txList[i].fillReceipt(data)
                        totalFee.plus(txList[i].fee)

                        if (data.logs.length > 0) {
                            // 提取日志
                            let evt = txList[i].doTxEvents(data.logs)
                            events.push(...evt)
                        }
                    }
                    counter ++
                    if (counter === total) {
                        resolve(txList);
                    }
                }))
            } else {
                totalFee.plus(txList[i].fee)
            }
        }

        batch.execute()
    })

    // console.log('get tx receipt done')
    return {txList, events}
}

export {
    EthTx,
    getEthTx,
    doTransactionList,
    createFromTxReceipt,
}