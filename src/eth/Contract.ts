import BigNumber from "bignumber.js"
import prisma from "../model/db"

export const ContractTypeERC20 = 'ERC20'
export const ContractTypeERC721 = 'ERC721'
export const ContractTypeERC1155 = 'ERC1155'

class Contract {
    id: number
    address: string
    creater: string
    txHash: string
    logo: string
    precision: number | null
    source: number              // 是否已经验证
    profiles: string
    prices: BigNumber | null
    site: string
    name: string
    symbol: string
    height: number             // 创建区块
    contractType: string
    content: string
    tags: string[]
    balance: BigNumber
    maxSupply: BigNumber
    // 统计数据
    holders: number
    transfers: number
    tabs: string[]           // 合约可以展现的二级列表

    constructor(address: string, creater: string, txHash: string, name: string, symbol: string, height: number, precision?: number) {
        this.id = 0
        this.address = address
        this.txHash = txHash
        this.name = name
        this.symbol = symbol
        this.height = height
        this.site = ''
        this.precision = precision ? precision : null
        this.source = 0
        this.logo = ''
        this.profiles = '{}'
        this.prices = null
        this.creater = creater
        this.contractType = ''
        this.content = ''
        this.tags = []
        this.balance = new BigNumber(0)
        this.maxSupply = new BigNumber(0)
        this.holders = 0
        this.transfers = 0
        this.tabs = []
    }

    async create() {
        prisma.eth_contract.create({
            data: {
                address: this.address,
                creater: this.creater,
                tx_hash: this.txHash,
                logo: this.logo,
                precision: this.precision,
                source: this.source,    // 是否已经验证
                profiles: this.profiles,
                price: this.prices? this.prices.toString() : '',
                site: this.site,
                name: this.name,
                symbol: this.symbol,
                height: this.height,  // 创建区块
                contract_type: this.contractType,
                content: this.content,
                tags: JSON.stringify(this.tags),
                balance: this.balance.toString(),
                max_supply: this.maxSupply.toString(),
                // 统计数据
                holders: this.holders,
                transfers: this.transfers,
                tabs: JSON.stringify(this.tabs) // 合约可以展现的二级列表
            }
        })
    }
}

export default Contract
