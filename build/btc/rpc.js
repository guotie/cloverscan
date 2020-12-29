"use strict";
// async function getBlock(params:type) {
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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// }
// async function getTx(params:type) {
// }
// @ts-ignore
var bitcoind_rpc_1 = __importDefault(require("bitcoind-rpc"));
// curl  -d '{"jsonrpc": "1.0", "id":"curltest", "method": "getblockcount", "params": [] }' 
// http://rosetta:rosetta@proxy.ankr.com:8332
var client = new bitcoind_rpc_1.default({
    protocol: 'http',
    user: 'rosetta',
    pass: 'rosetta',
    host: 'proxy.ankr.com',
    port: '8332',
});
var fns = ['getBlockHash', 'getBlock', 'getBlockHeader', 'getBlockHeader', 'getMemoryPool',];
var _loop_1 = function (i) {
    var fn = fns[i];
    client[fn + 'Async'] = function (args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    client[fn].apply(client, __spreadArrays(args, [function (err, resp) {
                            if (err) {
                                console.warn(fn, args, err);
                                resolve(err);
                                return;
                            }
                            resolve(resp);
                        }]));
                })];
        });
    }); };
};
for (var i = 0; i < fns.length; i++) {
    _loop_1(i);
}
client.getBlockByHeight = function (height) { return __awaiter(void 0, void 0, void 0, function () {
    var resp1, hash, resp2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, client.getBlockHashAsync([height])];
            case 1:
                resp1 = _a.sent();
                if (resp1.code === -1) {
                    return [2 /*return*/, resp1];
                }
                hash = resp1.result;
                return [4 /*yield*/, client.getBlockAsync([hash, 1])];
            case 2:
                resp2 = _a.sent();
                console.log(resp2);
                return [2 /*return*/, resp2
                    // @ts-ignore
                    // client.getBlock(hash, 1, (err, resp) => {
                    //     console.log('block:', err, resp)
                    // })
                ];
        }
    });
}); };
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var hash;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, client.getBlockByHeight(1)];
            case 1:
                hash = _a.sent();
                console.log(hash);
                return [2 /*return*/];
        }
    });
}); })();
exports.default = client;
