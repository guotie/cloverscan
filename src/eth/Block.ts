import BigNumber from 'bignumber.js'
import { BlockTransactionString } from 'web3-eth'
import Web3 from 'web3'

import {Block as BaseBlock } from '../model/block'
import prisma from '../model/db'
import UncleBlock, { batchCreateUncleBlock, cleanUncleBlockByHeight } from './UncleBlock'
import { batchCreateEthTx, cleanEthTxByHeight, doTransactionList } from './Tx'
import { batchCreateEthTxEvent, cleanEthTxEventsByHeight } from './Event'
import { BalanceEvent, updaterMinerBalance, pushEvents } from './Push'
import { batchCreateContract, cleanEthContractByHeight } from './Contract'

const BlockchainEthereum = 'Ethereum'
const BlockchainNetwork = 'Mainnet'
const BlockchainSymbol = 'ETH'

// 挖矿奖励, 不包括叔块
// todo: fix it!!!
function blockReward(height: number) {
    if (height < 87493855) {
        return '5'
    }
    if (height < 104142773) {
        return '3'
    }
    return '2'
    // todo
    // https://zhuanlan.zhihu.com/p/28928827
    // 叔块奖励 = ( 叔块高度 + 8 - 包含叔块的区块的高度 ) * 普通区块奖励 / 8
}

class EthBlock implements BaseBlock {
    id: number
    // block chain
    blockchain: string
    network: string
    symbol: string
    // common field
    hash: string
    timestamp: number
    height: number
    minerBy: string
    totalTx: number
    blockSize: number
    parentHash?: string
    nextHash?: string
    merkleHash: string
    difficulty: number
    interval?: number
    fee: BigNumber
    // for ETH
    blockReward: string
    totalDiff: number
    uncleReward: string
    uncles: number
    gasUsed: number
    gasLimit: number
    shaUncles: string
    extraData: string
    txRootHash: string
    txInternals: number
    nonce: string
    // totalEvents: number

    constructor(b: BlockTransactionString) {
        this.id = 0
        this.blockchain = BlockchainEthereum
        this.network = BlockchainNetwork
        this.symbol = BlockchainSymbol

        this.hash = b.hash
        this.timestamp = +b.timestamp
        this.minerBy = b.miner
        this.height = b.number
        this.totalTx = b.transactions.length
        this.blockSize = b.size
        this.parentHash = b.parentHash
        this.nextHash = ''
        this.merkleHash = b.stateRoot // state hash
        this.difficulty = b.difficulty
        this.fee = new BigNumber(0)
        this.blockReward = blockReward(b.number)
        this.totalDiff = b.totalDifficulty
        this.uncleReward = '0'
        this.uncles = b.uncles.length
        this.gasUsed = b.gasUsed ?? 0
        this.gasLimit = b.gasLimit ?? 0
        this.shaUncles = b.sha3Uncles ?? ''
        this.extraData = b.extraData ?? ''
        this.txRootHash = b.transactionRoot ?? ''
        // this.totalEvents = b.totalEvents ?? 0
        this.txInternals = 0
        this.nonce = b.nonce
    }

    async createBlock() {
        let block = this
        let res = await prisma.eth_block.create({
            data: {
                // id: block.id,
                hash: block.hash,
                ts: block.timestamp,
                height: block.height,
                miner_by: block.minerBy,
                total_tx: block.totalTx,
                block_size: block.blockSize,
                parent_hash: block.parentHash,
                next_hash: block.nextHash,
                merkle_hash: block.merkleHash,
                difficulty: block.difficulty + '',
                interval: 0,
                fee: block.fee.toString(),
                // for ETH
                block_reward: block.blockReward,
                total_diff: block.totalDiff + '',
                uncle_reward: block.uncleReward,
                gas_used: block.gasUsed,
                gas_limit: block.gasLimit,
                sha_uncles: block.shaUncles,
                extra_data: block.extraData,
                tx_root_hash: block.txRootHash,
                // total_events: block.totalEvents,
                tx_internals: block.txInternals ?? 0,
                nonce: block.nonce,
            }
        })

        return res
    }

    // 处理叔块
    doUncleBlocks(uncles: Array<string>): Array<UncleBlock> {
        let unclesBlock: Array<UncleBlock> = []
        for (let i = 0; i < uncles.length; i ++) {
            let uncle = new UncleBlock(this.height, this.hash, this.timestamp, uncles[i])

            unclesBlock.push(uncle)
        }

        return unclesBlock
    }

    // // get block
    // static async getBlockBy({height, hash}: {height: number, hash: string}): Promise<any> {
    //     let block = await prisma.eth_block.findOne({
    //         where: {
    //             height: height
    //         }
    //     })
    //     return block
    // }
}

async function getBlock(provider: Web3, height: number) {
    let block = await provider.eth.getBlock(height)
    return block
}

// 处理 block
// 1. 余额的变动通知kafka, 由kafka的consumer程序处理
// 2. 这里入库的是block, tx, contract create, events
// 3. 可以触发余额变动的包括:
//    a. 产块地址eth更新
//    b. eth转账交易(from, to)
//    c. 合约transfer(from, to), burn(from), mint(from), send(from, to), transferFrom()事件
//    d. 其他事件
async function handleBlock(provider: Web3, height: number) {
    let block = await getBlock(provider, height)
    let kafkaEvents: Array<BalanceEvent> = []
    let eb = new EthBlock(block)
    let uncles: Array<UncleBlock> = []

    let { txList, events, contracts, balanceEvents } = await doTransactionList(provider, eb, block.transactions)

    if (block.uncles.length > 0) {
        uncles = eb.doUncleBlocks(block.uncles)
        // todo 叔块奖励 balance 更新事件
    }

    kafkaEvents.push(updaterMinerBalance(block.miner))
    kafkaEvents.push(...balanceEvents)
    // await pushEvents(balanceEvents)

    Promise.all([
        batchCreateEthTx(txList),       // 交易
        batchCreateEthTxEvent(events),  // tx logs
        batchCreateUncleBlock(uncles),  // 叔块
        batchCreateContract(contracts), // 合约创建
        eb.createBlock(),               // 块
    ]).then(() => {
        // 推送需要新建或更新的账号资产信息
        pushEvents(kafkaEvents)
        // todo 保存扫块状态 zookeeper
        console.info('scan block %d done', height)
    }).catch(err => {
        console.warn('scan block %d failed:', height, err)
        // todo 异常处理流程
        // 删除叔块
    })
}

// 删除块, 用于重新扫块的准备
async function cleanBlock(height: number) {
    Promise.all([
        cleanBlockByHeight(height),
        cleanEthContractByHeight(height),
        cleanUncleBlockByHeight(height),
        cleanEthTxEventsByHeight(height),
        cleanEthTxByHeight(height)
    ])
}

// delete all block db: 
async function cleanBlockByHeight(height: number) {
    await prisma.$executeRaw(`delete from eth_block where block = ${height}`)
}

export {
    EthBlock,
    getBlock,
    handleBlock,
    cleanBlockByHeight,
}
