import prisma from '../model/db'

// UncleBlock 叔块信息
class UncleBlock {
    id: number
    height: number
    hash: string
    uncle: string
    timestamp: number

    constructor(height: number, hash: string, timestamp: number, uncle: string) {
        this.id = 0
        this.height = height
        this.hash = hash
        this.timestamp = timestamp
        this.uncle = uncle
    }

    async create() {
        let res = await prisma.eth_block_uncle.create({
            data: {
                height: this.height,
                hash: this.hash,
                uncle: this.uncle,
                timestamp: this.timestamp
            }
        })
    }
}

export default UncleBlock
