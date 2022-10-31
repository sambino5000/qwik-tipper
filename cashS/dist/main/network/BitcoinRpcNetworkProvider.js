"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RpcClientRetry = require('bitcoin-rpc-promise-retry');
class BitcoinRpcNetworkProvider {
    network;
    rpcClient;
    constructor(network, url, opts) {
        this.network = network;
        this.rpcClient = new RpcClientRetry(url, opts);
    }
    async getUtxos(address) {
        const result = await this.rpcClient.listUnspent(0, 9999999, [address]);
        const utxos = result.map((utxo) => ({
            txid: utxo.txid,
            vout: utxo.vout,
            satoshis: utxo.amount * 1e8,
        }));
        return utxos;
    }
    async getBlockHeight() {
        return this.rpcClient.getBlockCount();
    }
    async getRawTransaction(txid) {
        return this.rpcClient.getRawTransaction(txid);
    }
    async sendRawTransaction(txHex) {
        return this.rpcClient.sendRawTransaction(txHex);
    }
    getClient() {
        return this.rpcClient;
    }
}
exports.default = BitcoinRpcNetworkProvider;
//# sourceMappingURL=BitcoinRpcNetworkProvider.js.map