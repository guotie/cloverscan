"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlock = exports.EthBlock = void 0;
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var db_1 = __importDefault(require("../model/db"));
var UncleBlock_1 = __importDefault(require("./UncleBlock"));
var Tx_1 = require("./Tx");
var BlockchainEthereum = 'Ethereum';
var BlockchainNetwork = 'Mainnet';
var BlockchainSymbol = 'ETH';
// 挖矿奖励, 不包括叔块
function blockReward(height) {
    if (height < 87493855) {
        return '5';
    }
    if (height < 104142773) {
        return '3';
    }
    return '2';
    // todo
    // https://zhuanlan.zhihu.com/p/28928827
    // 叔块奖励 = ( 叔块高度 + 8 - 包含叔块的区块的高度 ) * 普通区块奖励 / 8
}
var EthBlock = /** @class */ (function () {
    // totalEvents: number
    function EthBlock(b) {
        var _a, _b, _c, _d, _e;
        this.id = 0;
        this.blockchain = BlockchainEthereum;
        this.network = BlockchainNetwork;
        this.symbol = BlockchainSymbol;
        this.hash = b.hash;
        this.timestamp = +b.timestamp;
        this.minerBy = b.miner;
        this.height = b.number;
        this.totalTx = b.transactions.length;
        this.blockSize = b.size;
        this.parentHash = b.parentHash;
        this.nextHash = '';
        this.merkleHash = b.stateRoot; // state hash
        this.difficulty = b.difficulty;
        this.fee = new bignumber_js_1.default(0);
        this.blockReward = blockReward(b.number);
        this.totalDiff = b.totalDifficulty;
        this.uncleReward = '0';
        this.uncles = b.uncles.length;
        this.gasUsed = (_a = b.gasUsed) !== null && _a !== void 0 ? _a : 0;
        this.gasLimit = (_b = b.gasLimit) !== null && _b !== void 0 ? _b : 0;
        this.shaUncles = (_c = b.sha3Uncles) !== null && _c !== void 0 ? _c : '';
        this.extraData = (_d = b.extraData) !== null && _d !== void 0 ? _d : '';
        this.txRootHash = (_e = b.transactionRoot) !== null && _e !== void 0 ? _e : '';
        // this.totalEvents = b.totalEvents ?? 0
        this.txInternals = 0;
    }
    EthBlock.prototype.createBlock = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var block, res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        block = this;
                        return [4 /*yield*/, db_1.default.eth_block.create({
                                data: {
                                    // id: block.id,
                                    hash: block.hash,
                                    ts: block.timestamp,
                                    height: block.height,
                                    miner_by: block.minerBy,
                                    total_tx: block.totalTx,
                                    block_size: block.blockSize,
                                    parent_hash: block.parentHash,
                                    next_hash: block.nextHash,
                                    merkle_hash: block.merkleHash,
                                    difficulty: block.difficulty,
                                    interval: 0,
                                    fee: block.fee.toString(),
                                    // for ETH
                                    block_reward: block.blockReward,
                                    total_diff: block.totalDiff + '',
                                    uncle_reward: block.uncleReward,
                                    gas_used: block.gasUsed,
                                    gas_limit: block.gasLimit,
                                    sha_uncles: block.shaUncles,
                                    extra_data: block.extraData,
                                    tx_root_hash: block.txRootHash,
                                    // total_events: block.totalEvents,
                                    tx_internals: (_a = block.txInternals) !== null && _a !== void 0 ? _a : 0,
                                }
                            })];
                    case 1:
                        res = _b.sent();
                        return [2 /*return*/, res];
                }
            });
        });
    };
    // 处理叔块
    EthBlock.prototype.doUncleBlocks = function (uncles) {
        if (uncles.length === 0) {
            return;
        }
        var unclesBlock = [];
        for (var i = 0; i < uncles.length; i++) {
            var uncle = new UncleBlock_1.default(this.height, this.hash, this.timestamp, uncles[i]);
            unclesBlock.push(uncle);
        }
        return unclesBlock;
    };
    return EthBlock;
}());
exports.EthBlock = EthBlock;
function getBlock(provider, height) {
    return __awaiter(this, void 0, void 0, function () {
        var block;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, provider.eth.getBlock(height)];
                case 1:
                    block = _a.sent();
                    return [2 /*return*/, block];
            }
        });
    });
}
exports.getBlock = getBlock;
// 处理 block
function handleBlock(provider, height) {
    return __awaiter(this, void 0, void 0, function () {
        var block, eb, uncles, _a, txList, events;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, getBlock(provider, height)];
                case 1:
                    block = _b.sent();
                    eb = new EthBlock(block);
                    if (block.uncles.length > 0) {
                        uncles = eb.doUncleBlocks(block.uncles);
                    }
                    return [4 /*yield*/, Tx_1.doTransactionList(provider, eb, block.transactions)];
                case 2:
                    _a = _b.sent(), txList = _a.txList, events = _a.events;
                    return [2 /*return*/];
            }
        });
    });
}
