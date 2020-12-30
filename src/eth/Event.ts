import prisma from "../model/db"

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

export default EthTxEvent
