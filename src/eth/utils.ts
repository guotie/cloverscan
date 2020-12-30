import BigNumber from 'bignumber.js'
import { getMaxListeners } from 'process'

const e1_18 = new BigNumber(10 ** 18)
const zero = new BigNumber(0)

// 0x0000000000000000000000009c0f32795af5eb071bae6fcbc6f4a10c2d3cc7e6 => 0x9c0f32795af5eb071bae6fcbc6f4a10c2d3cc7e6
function convertAddressFromHex64(hex: string) {
    if (hex.startsWith('0x')) {
        hex = hex.slice(2)
    }
    return '0x' + hex.slice(24)
}

// ;(async () => {
//     let addr = convertAddressFromHex64('0x0000000000000000000000009c0f32795af5eb071bae6fcbc6f4a10c2d3cc7e6')
//     console.log(addr)
//     let addr2 = convertAddressFromHex64('0000000000000000000000009c0f32795af5eb071bae6fcbc6f4a10c2d3cc7e6')
//     console.log(addr2)
// })()

export {
    zero,
    e1_18,
    convertAddressFromHex64,
}
