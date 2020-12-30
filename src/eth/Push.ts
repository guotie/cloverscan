import { pushKafka, pushBatch } from '../kafka/push'

// 
// 3. 可以触发余额变动的包括:
//    a. 产块地址eth更新
//    b. eth转账交易(from, to)
//    c. 合约transfer(from, to), burn(from), mint(from), send(from, to), transferFrom()事件
//    d. 其他事件
//    e. todo: uncle reward
//
export const BalanceEventMine               = 'mine'
export const BalanceEventETHTx              = 'eth-tx'
export const BalanceEventTokenTransfer      = 'token-transfer'
export const BalanceEventTokenBurn          = 'token-burn'
export const BalanceEventTokenMint          = 'token-mint'
export const BalanceEventTokenSend          = 'token-send'
export const BalanceEventTokenTransferFrom  = 'token-transferfrom'

class BalanceEvent {
    address: string
    token: string
    action: string

    constructor(address: string, action: string, token = 'ETH') {
        this.address = address
        this.token = token
        this.action = action
    }

    // 推送一条数据
    async push() {
        await pushKafka('account-balance', this)
    }
}

// 批量推送
async function pushEvents(events: Array<BalanceEvent>) {
    await pushBatch('eth-account', events)
}

// 产块地址eth更新
function updaterMinerBalance(miner: string) {
    return new BalanceEvent(miner, BalanceEventMine)
}

// eth转账交易(from, to)
function updaterETHTransfer(from: string, to: string): Array<BalanceEvent> {
    return [new BalanceEvent(from, BalanceEventETHTx), new BalanceEvent(to, BalanceEventETHTx)]
}

// 合约事件
function updateContractEvent(from: string, to: string, token: string, action: string): Array<BalanceEvent> {
    return [new BalanceEvent(from, action, token), new BalanceEvent(to, action, token)]
}

export {
    pushEvents,
    BalanceEvent,
    updaterMinerBalance,
    updaterETHTransfer,
    updateContractEvent,
}
