import prisma from "../model/db"
import { BalanceEvent, BalanceEventTokenDeposit, BalanceEventTokenTransfer, BalanceEventTokenWithdraw } from "./Push"

export const EventKecekTransfer = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
export const EventKecekDeposit  = '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c'  // weth deposit
export const EventKecekWithdraw = '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65'  // weth deposit

// ERC20中transferFrom, mint, burn 全部都是transfer事件
// todo: withdraw deposit ....
const famousEvents: {[index: string]: string} = {
    // transfer
    EventKecekTransfer: 'Transfer (index_topic_1 address src, index_topic_2 address dst, uint256 wad)',
    // deposit
    EventKecekDeposit: 'Deposit (index_topic_1 address dst, uint256 wad)',
    // withdraw
    EventKecekWithdraw: 'Withdrawal (index_topic_1 address src, uint256 wad)'
}

class EthTxEvent {
    id: number
    name: string              // 后期填入
    from: string              // tx from
    to: string                // tx to
    address: string
    data: string
    topic0: string
    topic1: string
    topic2: string
    topic3: string
    logIndex: number
    blockHash: string
    blockNumber: number
    txIndex: number
    transactionHash: string
    logId: string

    constructor(from: string, to: string, log: any) {
        this.id = 0
        this.name = ''
        this.from = from
        this.to = to
        this.address = log.address
        this.data = log.data
        this.topic0 = log.topics[0]
        this.topic1 = log.topics[1] ?? ''
        this.topic2 = log.topics[2] ?? ''
        this.topic3 = log.topics[3] ?? ''
        this.logIndex = log.logIndex
        this.blockHash = log.blockHash
        this.blockNumber = log.blockNumber
        this.transactionHash = log.transactionHash
        this.txIndex = log.transactionIndex
        this.logId = log.logId

        this.setEventName()
    }

    // save to db
    async create() {
        await prisma.eth_tx_logs.create({
            data: {
                name: this.name,      // 后期填入
                from: this.from,
                to: this.to,
                address: this.address,
                data: this.data,
                topic0: this.topic0,
                topic1: this.topic1,
                topic2: this.topic2,
                topic3: this.topic3,
                log_index: this.logIndex,
                block_hash: this.blockHash,
                block_number: this.blockNumber,
                tx_index: this.txIndex,
                tx_hash: this.transactionHash,
                log_id: this.logId,
            }
        })
    }

    // 分析事件, 是否触发资产变更, 如果触发了资产变更, 推送给kafka
    getBalanceEvent(): Array<BalanceEvent> | null {
        switch (this.topic0) {
        case EventKecekTransfer:
            // Transfer (index_topic_1 address src, index_topic_2 address dst, uint256 wad)
            return [
                new BalanceEvent(this.topic1, BalanceEventTokenTransfer, this.address),
                new BalanceEvent(this.topic2, BalanceEventTokenTransfer, this.address),
            ]
        
        case EventKecekDeposit:
            // address: 充币合约的token, 通常是erc20
            return [new BalanceEvent(this.topic1, BalanceEventTokenDeposit, this.address)]

        case EventKecekWithdraw:
            // address: 充币合约的token, 通常是erc20
            return [new BalanceEvent(this.topic1, BalanceEventTokenWithdraw, this.address)]
        } 

        return null
    }
    
    setEventName() {
        let name = famousEvents[this.topic0]
        if (name) {
            this.name = name
        }
    }
}

// 批量入库 EthTxEvent
export async function batchCreateEthTxEvent(txList: Array<EthTxEvent>) {
    if (txList.length === 0) {
        return
    }

    let values = txList.map(
        tx => `('${tx.name}', '${tx.from}', '${tx.to}', '${tx.address}', '${tx.data}', '${tx.topic0}', '${tx.topic1}', '${tx.topic2}', '${tx.topic3}', '${tx.logIndex}', '${tx.blockHash}', '${tx.blockNumber}', '${tx.txIndex}', '${tx.transactionHash}', '${tx.logId}')`
      )
    let query = `insert into "eth_tx_logs" ("name", "from", "to", "address", "data", "topic0", "topic1", "topic2", "topic3", "log_index", "block_hash", "block_number", "tx_index", "tx_hash", "log_id") values ${values.join(',')}`

    await prisma.$executeRaw(query)
}

export async function cleanEthTxEventsByHeight(height: number) {
    await prisma.$executeRaw(`delete from eth_tx_logs where block_number = ${height}`)
}

export default EthTxEvent
