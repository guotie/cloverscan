import BigNumber from "bignumber.js"

import prisma from '../model/db'
import { pushKafka } from '../kafka/push'

class Account {
    id: number
    address: string
    balance: BigNumber
    tokenName?: string
    tokenSymbol?: string
    tokenAddress?: string
    precision?: number
    lastUpdate?: number     // 最后一次更新的区号

    constructor(address: string, balance: BigNumber, tokenName = 'ETH', tokenSymbol = 'ETH', precision = 18) {
        this.id = 0
        this.address = address
        this.balance = balance
        this.tokenName = tokenName
        this.tokenSymbol = tokenSymbol
        this.tokenAddress = ''
        this.precision = precision
        this.lastUpdate = 0
    }

    // 新建account
    async createAccount() {
        await prisma.eth_account.create({
            data: {
                address: this.address,
                balance: this.balance.toString(),
                token_address: this.tokenAddress,
                token_name: this.tokenName,
                token_symbol: this.tokenSymbol,
                precision: this.precision,
                last_update: this.lastUpdate
            }
        })
    }

    // 更新余额
    async updateAccountBalance(address: string, tokenAddr: string, balance: BigNumber | string, blockNumber?: number) {
        await prisma.eth_account.updateMany({
            where: {
                address: address,
                token_address: this.tokenAddress
            },
            data: {
                balance: balance.toString()
            }
        })
    }

    // 通知kafka, 账号余额更新
    pushEthAccountCreate() {
        pushKafka('account-create', this)
    }
}

// 通知余额更新事件
export function pushEthAccount(owner: string, token: string) {

}


export default Account
