"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var gs = function (a) {
    JSON.stringify(Object.keys(a).reduce(function (o, i) {
        var _a;
        return __assign(__assign({}, o), (_a = {}, _a[i.replace(/([A-Z])/g, "_$1").toLowerCase()] = a[i], _a));
    }, {}));
};
var Client = /** @class */ (function () {
    function Client(endpoint) {
        this.endpoint = endpoint;
        this.blockchain = '';
        this.network = '';
    }
    Client.prototype.getNetworkList = function (metadata) {
    };
    Client.prototype.getBlock = function (height) {
    };
    Client.prototype.getAccountBalance = function () {
    };
    Client.prototype.getAccountCoins = function () {
    };
    return Client;
}());
