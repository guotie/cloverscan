import provider from './Provider'
import { EthBlock, handleBlock, cleanBlockDataByHeight, getLatestBlockNumber } from './Block'
import { getEthTx } from './Tx'
import { deleteBlockScanStatus } from './Status'
import { sleep } from './utils'

async function testTx() {
    // token transfer
    let ttx = await getEthTx(provider, '0x8ecfe5b96ca53f2c4316f4f3a35e9a7d149f58d785da603f24d1dd7a5bb064e6', 0)
    console.log('token transfer:', ttx)
    console.log(ttx.txLogs)

    // internal call
    let ctx = await getEthTx(provider, '0xdca039999cd960538c08bd74e0072f43b4b8d3b8b3104fd33f2b56495eb88ee6', 0)
    console.log('contract call tx:', ctx)
    console.log(ctx.txLogs)

    // 合约创建 4634748
    let ccx = await getEthTx(provider, '0x2f1c5c2b44f771e942a8506148e256f94f1a464babc938ae0690c6e34cd79190', 0)
    console.log('contract created:', ccx)
}

async function doScanBlock(height: number, clean = true) {
    if (clean) {
        await cleanBlockDataByHeight(height)
    }
    await deleteBlockScanStatus(height)

    return handleBlock(provider, height)
}

// 
// start: 开始块
// end: 结束块
// token: 桶的大小, 最多多少个块并发扫描
// todo: 未知问题 有些块扫描成功但没有入库, 也没有报错, 怀疑与prisma有关
async function startScanBlock(start: number, end: number, token: number, clean = true) {
    let idles = token
        , failed: Array<number> = []
        , working: { [index: string]: number } = {}

    let scanner = (blockToScan: number) => {
        working[blockToScan + ''] = new Date().getTime()
        idles --
        doScanBlock(blockToScan, clean)
            .then(blockNumber => {
                idles ++
                delete working[blockNumber + '']
                console.info('scan block %d done', blockNumber)
            })
            .catch(resp => {
                idles ++
                delete working[resp.height + '']
                console.warn('scan block %d failed:', resp.height, resp.err)
                failed.push(resp.height)
            })
    }

    if (!end) {
        end = await getLatestBlockNumber(provider)
        console.info('set end block to', end)
        // get latest height
        setInterval(async () => {
            try {
                let height = await getLatestBlockNumber(provider)
                if (height > end) {
                    end = height
                }
            } catch {
                // nothing
            }
        }, 15000)
    }

    // todo fix
    // 有可能出现一些块不断的失败, 导致无法继续扫块（增加失败计数）
    for (let height = start; height <= end;) {
        if (idles > 0) {
            let blockToScan: number
            if (failed.length > 0) {
                // @ts-ignore
                blockToScan = failed.pop()
                console.log('re scan block', blockToScan)
            } else {
                blockToScan = height
                height ++
                console.log('do scan block', blockToScan)
            }

            scanner(blockToScan)
        } else {
            // wait for
            await sleep(100)
        }
    }

    // todo fix!!!
    // 有可能出现failed队列中已经清空, 但正在执行的任务失败, 此时循环退出, 导致失败的任务无法继续执行
    // 
    if (failed.length > 0) {
        if (idles > 0) {
            let blockToScan: number
            // @ts-ignore
            blockToScan = failed.pop()
            console.log('re scan block', blockToScan)

            scanner(blockToScan)
        } else {
            // wait for
            await sleep(100)
        }
    }

    console.log('working queue:', working)
}

;(async () => {
    // let height = await getLatestBlockNumber()
    // console.log('height: ', height)
    let start = 10000000, max = 10000
    // doScanBlock(46147)
    await startScanBlock(start, start + max, 20, false)
    return
    // testTx()
    /*
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

    // make node do not exit to debug console args
    setInterval(() => {}, 1000)
    */
})()

export {
    getLatestBlockNumber,
    startScanBlock
}

