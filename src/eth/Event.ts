import prisma from "../model/db"

class EthTxEvent {
    id: number
    name: string      // 后期填入
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

    constructor(log: any) {
        this.id = 0
        this.name = ''
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
    }

    // save to db
    async create() {
        await prisma.eth_tx_logs.create({
            data: {
                name: this.name,      // 后期填入
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
}

export default EthTxEvent
