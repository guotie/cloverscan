"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var Token = /** @class */ (function () {
    function Token(address, creater, txHash, name, symbol, height, precision) {
        if (precision === void 0) { precision = 18; }
        this.id = 0;
        this.address = address;
        this.txHash = txHash;
        this.name = name;
        this.symbol = symbol;
        this.height = height;
        this.site = '';
        this.precision = precision;
        this.source = 0;
        this.logo = '';
        this.profiles = '{}';
        this.prices = null;
        this.creater = creater;
        this.contractType = '';
        this.content = '';
        this.tag = '';
        this.balance = new bignumber_js_1.default(0);
        this.maxSupply = new bignumber_js_1.default(0);
        this.holders = 0;
        this.transfers = 0;
        this.tabs = [];
    }
    return Token;
}());
exports.default = Token;
