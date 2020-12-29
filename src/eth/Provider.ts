// import { ethers } from 'ethers'
import Web3 from 'web3'

const network = 'mainnet'
// const provider = ethers.getDefaultProvider(network, {
//     infura: 'ec18eb33258d49b382aa0992f9a69da0'
// })
// const provider = new ethers.providers.InfuraProvider(network, 'ec18eb33258d49b382aa0992f9a69da0')
const endpoint = 'https://mainnet.infura.io/v3/ec18eb33258d49b382aa0992f9a69da0' // ('http://rosetta:rosetta@proxy.ankr.com:9545'
const provider = new Web3(endpoint)

export function batchRequest() {
    return new provider.BatchRequest();
}

export default provider
