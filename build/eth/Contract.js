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
exports.ContractTypeERC1155 = exports.ContractTypeERC721 = exports.ContractTypeERC20 = void 0;
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var db_1 = __importDefault(require("../model/db"));
exports.ContractTypeERC20 = 'ERC20';
exports.ContractTypeERC721 = 'ERC721';
exports.ContractTypeERC1155 = 'ERC1155';
var Contract = /** @class */ (function () {
    function Contract(address, creater, txHash, name, symbol, height, precision) {
        this.id = 0;
        this.address = address;
        this.txHash = txHash;
        this.name = name;
        this.symbol = symbol;
        this.height = height;
        this.site = '';
        this.precision = precision ? precision : null;
        this.source = 0;
        this.logo = '';
        this.profiles = '{}';
        this.prices = null;
        this.creater = creater;
        this.contractType = '';
        this.content = '';
        this.tags = [];
        this.balance = new bignumber_js_1.default(0);
        this.maxSupply = new bignumber_js_1.default(0);
        this.holders = 0;
        this.transfers = 0;
        this.tabs = [];
    }
    Contract.prototype.create = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                db_1.default.eth_contract.create({
                    data: {
                        address: this.address,
                        creater: this.creater,
                        tx_hash: this.txHash,
                        logo: this.logo,
                        precision: this.precision,
                        source: this.source,
                        profiles: this.profiles,
                        price: this.prices ? this.prices.toString() : '',
                        site: this.site,
                        name: this.name,
                        symbol: this.symbol,
                        height: this.height,
                        contract_type: this.contractType,
                        content: this.content,
                        tags: JSON.stringify(this.tags),
                        balance: this.balance.toString(),
                        max_supply: this.maxSupply.toString(),
                        // 统计数据
                        holders: this.holders,
                        transfers: this.transfers,
                        tabs: JSON.stringify(this.tabs) // 合约可以展现的二级列表
                    }
                });
                return [2 /*return*/];
            });
        });
    };
    return Contract;
}());
exports.default = Contract;
