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
exports.createFromTxReceipt = exports.doTransactionList = exports.getEthTx = exports.EthTx = void 0;
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var db_1 = __importDefault(require("../model/db"));
var Event_1 = __importDefault(require("./Event"));
// 非合约调用
var TxTypePeer = 0;
var TxTypeToken = 1;
var TxTypeContract = 2;
var TxStatusConfirmed = 0;
var TxStatusConfirming = 1;
var TxStatusPending = 2;
var famousEvents = {
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef': 'Transfer (index_topic_1 address src, index_topic_2 address dst, uint256 wad)',
    '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c': 'Deposit (index_topic_1 address dst, uint256 wad)',
};
function getEventName(evt) {
    var name = famousEvents[evt.topic0];
    if (name) {
        evt.name = name;
    }
}
// event 是否是 transfer
function isTransfer(topics) {
    if (topics.length !== 3) {
        return false;
    }
    return topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
}
var EthTx = /** @class */ (function () {
    function EthTx(tx, timestamp) {
        var _a, _b, _c;
        this.hash = tx.hash;
        this.block = (_a = tx.blockNumber) !== null && _a !== void 0 ? _a : 0;
        this.from = tx.from;
        this.to = (_b = tx.to) !== null && _b !== void 0 ? _b : '';
        this.nonce = tx.nonce;
        this.gasPrice = new bignumber_js_1.default(tx.gasPrice);
        this.gasLimit = tx.gas;
        this.gasUsed = tx.gas;
        this.value = new bignumber_js_1.default(tx.value);
        this.amount = new bignumber_js_1.default(0);
        this.pos = (_c = tx.transactionIndex) !== null && _c !== void 0 ? _c : 0;
        this.input = tx.input;
        this.interact = false;
        this.transferType = TxTypePeer;
        this.transferType = timestamp;
        this.status = TxStatusConfirmed;
        this.fee = new bignumber_js_1.default(0);
        this.timestamp = timestamp;
        this.isContractCall = 0;
        this.realTo = '';
        // 当to为null时, 创建合约
        this.contractCreated = '';
        if (this.input === '0x') {
            this.gasUsed = 21000;
            this.fee = EthTx.calcTxFee(this.gasPrice, this.gasUsed);
        }
        this.txLogs = [];
    }
    EthTx.calcTxFee = function (price, gas) {
        var gasPrice = new bignumber_js_1.default(price), gasUsed = new bignumber_js_1.default(gas); // tx.gas 是 gasLimit
        var gasReal = gasPrice.multipliedBy(gasUsed);
        // console.log('price:', price, 'gas:', gas, 'used:', gasReal.toString(), gasReal.div(10**18).toString())
        return gasReal;
    };
    // 获取gasUsed?
    EthTx.prototype.fillReceipt = function (receipt) {
        this.gasUsed = receipt.gasUsed;
        this.fee = EthTx.calcTxFee(this.gasPrice, this.gasUsed);
        this.txLogs = receipt.logs;
        if (receipt.contractAddress) {
            this.contractCreated = receipt.contractAddress;
        }
    };
    // 处理log
    EthTx.prototype.doTxEvents = function (logs) {
        // todo 很多工作需要进一步细化
        var events = [];
        for (var i = 0; i < logs.length; i++) {
            var evt = new Event_1.default(logs[i]);
            // name
            getEventName(evt);
            events.push(evt);
        }
        if (logs.length === 1 && isTransfer(logs[0].topics)) {
            // todo 疑似 erc20, 生成 token
        }
        return events;
    };
    // insert to db
    EthTx.prototype.create = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.default.eth_tx.create({
                            data: {
                                hash: this.hash,
                                block: this.block,
                                pos: this.pos,
                                status: this.status,
                                timestamp: this.timestamp,
                                fee: this.fee.toString(),
                                value: this.value.toString(),
                                amount: this.amount.toString(),
                                from: this.from,
                                to: this.to,
                                real_to: this.realTo,
                                nonce: this.nonce,
                                gas_price: this.gasPrice.toString(),
                                gas_limit: this.gasLimit,
                                gas_used: this.gasUsed,
                                input_data: this.input,
                                interact: this.interact ? 1 : 0,
                                transfer_type: this.transferType,
                                is_contract_call: this.isContractCall,
                                contract_created: this.contractCreated,
                            }
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return EthTx;
}());
exports.EthTx = EthTx;
function getEthTx(provider, hash, timestamp) {
    return __awaiter(this, void 0, void 0, function () {
        var tx, ethTx, receipt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, provider.eth.getTransaction(hash)];
                case 1:
                    tx = _a.sent();
                    ethTx = new EthTx(tx, timestamp);
                    if (!(tx.input !== '0x')) return [3 /*break*/, 3];
                    return [4 /*yield*/, provider.eth.getTransactionReceipt(hash)
                        // console.log(JSON.stringify(tx))
                    ];
                case 2:
                    receipt = _a.sent();
                    // console.log(JSON.stringify(tx))
                    ethTx.fillReceipt(receipt);
                    _a.label = 3;
                case 3: return [2 /*return*/, ethTx];
            }
        });
    });
}
exports.getEthTx = getEthTx;
// batch 创建接口
function createFromTxReceipt(timestamp, tx, receipt) {
    var ethTx = new EthTx(tx, timestamp);
    if (receipt) {
        ethTx.fillReceipt(receipt);
    }
    return ethTx;
}
exports.createFromTxReceipt = createFromTxReceipt;
// 分析交易列表
function doTransactionList(provider, block, txs) {
    return __awaiter(this, void 0, void 0, function () {
        var timestamp, batch, txList, events, totalFee;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    timestamp = block.timestamp;
                    batch = new provider.BatchRequest();
                    txList = [];
                    events = [];
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var counter = 0;
                            for (var i = txs.length - 1; i >= 0; i--) {
                                var txHash = txs[i];
                                // @ts-ignore
                                batch.add(provider.eth.getTransaction.request(txHash, function (err, data) {
                                    // console.log(err, data)
                                    if (!err) {
                                        txList.push(new EthTx(data, timestamp));
                                    }
                                    counter++;
                                    // console.log('tx:', counter)
                                    if (counter === txs.length) {
                                        resolve(txList);
                                    }
                                }));
                                // let tx = await getEthTx(provider, txHash, block.timestamp)
                                // totalFee = totalFee.plus(tx.fee)
                            }
                            batch.execute();
                        })];
                case 1:
                    _a.sent();
                    totalFee = new bignumber_js_1.default(0);
                    batch = new provider.BatchRequest();
                    // gasUsed
                    return [4 /*yield*/, new Promise(function (resolve) {
                            var counter = 0, total = 0;
                            var _loop_1 = function (i) {
                                if (txList[i] && txList[i].input === '0x') {
                                    total++;
                                    // @ts-ignore
                                    batch.add(provider.eth.getTransactionReceipt.request(txList[i].hash, function (err, data) {
                                        // console.log(err, data)
                                        if (!err) {
                                            txList[i].fillReceipt(data);
                                            totalFee.plus(txList[i].fee);
                                            if (data.logs.length > 0) {
                                                // 提取日志
                                                var evt = txList[i].doTxEvents(data.logs);
                                                events.push.apply(events, evt);
                                            }
                                        }
                                        counter++;
                                        if (counter === total) {
                                            resolve(txList);
                                        }
                                    }));
                                }
                                else {
                                    totalFee.plus(txList[i].fee);
                                }
                            };
                            for (var i = 0; i < txList.length; i++) {
                                _loop_1(i);
                            }
                            batch.execute();
                        })
                        // console.log('get tx receipt done')
                    ];
                case 2:
                    // gasUsed
                    _a.sent();
                    // console.log('get tx receipt done')
                    return [2 /*return*/, { txList: txList, events: events }];
            }
        });
    });
}
exports.doTransactionList = doTransactionList;
