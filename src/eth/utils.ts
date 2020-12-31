import BigNumber from 'bignumber.js'

// 防止出现极大的数字, 转换为string时太长 无法入库
BigNumber.config({EXPONENTIAL_AT: 30})

const e1_18 = new BigNumber(10 ** 18)
const zero = new BigNumber(0)

// 0x0000000000000000000000009c0f32795af5eb071bae6fcbc6f4a10c2d3cc7e6 => 0x9c0f32795af5eb071bae6fcbc6f4a10c2d3cc7e6
function convertAddressFromHex64(hex: string) {
    if (hex.startsWith('0x')) {
        hex = hex.slice(2)
    }
    return '0x' + hex.slice(24)
}

async function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}
;(async () => {
//     let addr = convertAddressFromHex64('0x0000000000000000000000009c0f32795af5eb071bae6fcbc6f4a10c2d3cc7e6')
//     console.log(addr)
//     let addr2 = convertAddressFromHex64('0000000000000000000000009c0f32795af5eb071bae6fcbc6f4a10c2d3cc7e6')
//     console.log(addr2)
    let a = new BigNumber('12345678901234567890')
    console.log(a.toString())
    console.log(a.toString())
})()

export {
    zero,
    e1_18,
    sleep,
    convertAddressFromHex64,
}
