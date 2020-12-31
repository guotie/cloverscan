import provider from './Provider'
import LRU from 'lru-cache'
import BigNumber from 'bignumber.js'
import { getLatestBlockNumber } from './Block'
import { sleep } from './utils'
import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'

// 如果用 import Erc20ABI from './abi/erc20.abi.json', 会有warning: https://github.com/ethereum/web3.js/issues/3310
const Erc20ABI = require('./abi/erc20.abi.json')
// 接收kafka消息，更新用户余额

// @ts-ignore
Contract.setProvider(provider)
// console.log(Erc20ABI)
// @ts-ignore
// const erc20Contract = new provider.eth.Contract(Erc20ABI)

// 已经更新了的 token 或者数据库中已经更新了的token
const tokenCache = new LRU(10000)

interface CacheBalance {
    balance: BigNumber
    height: number
}
// 已经更新了的地址余额 {balance: , height: }
const balanceCache: LRU<string, CacheBalance> = new LRU(10000000)

// token ABI
const tokenABICache = new LRU(100000)

function keyBalance(address: string, token: string) {
    return address + "-" + token
}

let latestHeight = 11559149  // 
setInterval(async () => {
    try {
        let latest = await getLatestBlockNumber(provider)
        latestHeight = latest
    } catch {}
}, 15000)

// 缓存 latest block number
function getCachedLatestBlockNumber() {
    return latestHeight
}

// token为空时 获取地址的eth余额, 否则查询token的余额
async function getBalance(address: string, token = '', height: number) {
    if (token === '' || token === 'ETH' || token === 'Eth') {
        token = ''
        return await provider.eth.getBalance(address)
    }
    let key = keyBalance(address, token)

    let bal: CacheBalance | undefined = balanceCache.get(key)
    if (bal && bal.height > height) {
        return bal.balance
    }

    let latest = getCachedLatestBlockNumber()
    if (!token) {
        let bal = await provider.eth.getBalance(address)
        balanceCache.set(key, { balance: new BigNumber(bal), height: latest })
        return
    }

    // token abi
    return await getTokenBlance(address, token, height, latest)
}

// 获取地址的token balance
async function getTokenBlance(address: string, token: string, height: number, latest: number, loadCache = false) {
    let key = keyBalance(address, token)
    let bal: CacheBalance | undefined

    if (loadCache) {
        bal = balanceCache.get(key)
        if (bal && bal.height > height) {
            return bal.balance
        }
    }

    // 1. 是否缓存了token abi
    // 2. 创建token contract
    // 3. 调用contract 方法获取余额
}

function getErc20ContractInst(address: string) {
    let token = new Contract(Erc20ABI, address)
    return token
}

// name symbol precision totalsupply
async function getTokenInfo(address: string) {
    
}

;(async () => {
    let testBalace = async () => {
        // usdt
        let usdc = await getTokenInfo('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
        let usdt = await getTokenInfo('0xdac17f958d2ee523a2206206994597c13d831ec7')
        console.log('usdc:', usdc)
        console.log('usdt:', usdt)

        let address: string[] = []
        let tokens: string[] = ['', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', '0xdac17f958d2ee523a2206206994597c13d831ec7']
        address.forEach(addr => {
            tokens.forEach(async token => {
                let balance = await getBalance(addr, token, 100)
                console.log('address %s token %s balance: %s', addr, token, balance)
            })
        })
    }

    let testCacheHeight = async () => {
        let height = getCachedLatestBlockNumber()
        let i = 0
        console.info('height:', i, height)
        
        setInterval(() => {
            height = getCachedLatestBlockNumber()
            i ++
            console.log('height:', i, height)
        }, 20000)
    }

    let testCache = async () => {
        let addr = '0x4DEBbd1B723E6b71C4410FFc71465Ba3C09C5F33'
        let bal = { balance: new BigNumber(1.2), height: 11548888 }
        balanceCache.set(addr, bal)
        let c = balanceCache.get(addr)
        console.log('cache:', c)
        let c1 = balanceCache.get('123')
        console.log('cache 123:', c1)
    }

    testCache()
    testCacheHeight()
    // testBalace()
})()

export {
    getBalance,
    getTokenInfo
}
