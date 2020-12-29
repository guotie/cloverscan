import provider from './Provider'
import { EthBlock, handleBlock } from './Block'
import { doTransactionList, getEthTx } from './Tx'

import Eth from 'web3-eth'


async function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

function toBlock(block: Eth.BlockTransactionString): EthBlock {
    return new EthBlock(block)
}

async function getBlock(height: number) {
    let block = await provider.eth.getBlock(height)
    return block
}

async function getLatestBlockNumber(): Promise<number> {
    return await provider.eth.getBlockNumber()
}

;(async () => {
    let height = await getLatestBlockNumber()
    console.log('height: ', height)

    handleBlock(provider, 11546811)
    return
    await sleep(1000)

    let block = await getBlock(11546811)
    let txs = block.transactions

    // // console.log(txs)
    // await getTx(txs[0])
    // await getTx(txs[1])
    console.log('web3 block:', block)
    let eb = toBlock(block)
    // await doTransactionList(provider, eb, txs)
    console.log('block:', eb)

    setInterval(() => {}, 1000)
    // token transfer
    let ttx = await getEthTx(provider, '0x8ecfe5b96ca53f2c4316f4f3a35e9a7d149f58d785da603f24d1dd7a5bb064e6', 0)
    console.log('token transfer:', ttx)
    console.log(ttx.txLogs)

    // internal call
    let ctx = await getEthTx(provider, '0xdca039999cd960538c08bd74e0072f43b4b8d3b8b3104fd33f2b56495eb88ee6', 0)
    console.log('contract call tx:', ctx)
    console.log(ctx.txLogs)

    // 合约创建
    let ccx = await getEthTx(provider, '0x2f1c5c2b44f771e942a8506148e256f94f1a464babc938ae0690c6e34cd79190', 0)
    console.log('contract created:', ccx)
})()

export {
    getBlock
}

