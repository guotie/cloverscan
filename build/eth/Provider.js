"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchRequest = void 0;
// import { ethers } from 'ethers'
var web3_1 = __importDefault(require("web3"));
var network = 'mainnet';
// const provider = ethers.getDefaultProvider(network, {
//     infura: 'ec18eb33258d49b382aa0992f9a69da0'
// })
// const provider = new ethers.providers.InfuraProvider(network, 'ec18eb33258d49b382aa0992f9a69da0')
var endpoint = 'https://mainnet.infura.io/v3/ec18eb33258d49b382aa0992f9a69da0'; // ('http://rosetta:rosetta@proxy.ankr.com:9545'
var provider = new web3_1.default(endpoint);
function batchRequest() {
    return new provider.BatchRequest();
}
exports.batchRequest = batchRequest;
exports.default = provider;
