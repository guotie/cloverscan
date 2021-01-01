import BigNumber from 'bignumber.js'

require('dotenv').config()
import { getTokenInfo, getBalance, getCachedLatestBlockNumber } from './Updater'
import { sleep } from './utils'


async function testBalace() {
    // usdt
    let usdc = await getTokenInfo('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
    let usdt = await getTokenInfo('0xdac17f958d2ee523a2206206994597c13d831ec7')
    console.log('usdc:', usdc)
    console.log('usdt:', usdt)

    let address: string[] = ['0x4DEBbd1B723E6b71C4410FFc71465Ba3C09C5F33', '0x338d60b61b638c5e0cec787c3bbf504a8657a054', '0xA910f92ACdAf488fa6eF02174fb86208Ad7722ba']
    let tokens: string[] = ['', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', '0xdac17f958d2ee523a2206206994597c13d831ec7']
    address.forEach(addr => {
        tokens.forEach(async token => {
            let balance = await getBalance(addr, token, 100)
            console.log('address %s token %s balance: %s', addr, token, balance?.toString())
        })
    })
    await sleep(3000)
    // cached balance
    address.forEach(addr => {
        tokens.forEach(async token => {
            let balance = await getBalance(addr, token, 100)
            console.log('cached address %s token %s balance: %s', addr, token, balance?.toString())
        })
    })
}

async function testCacheHeight() {
    let height = getCachedLatestBlockNumber()
    let i = 0
    console.info('height:', i, height)
    
    setInterval(() => {
        height = getCachedLatestBlockNumber()
        i ++
        console.log('height:', i, height)
    }, 20000)
}

;(async () => {
    // getTokenInfo('')
    testCacheHeight()
    testBalace()
})()
