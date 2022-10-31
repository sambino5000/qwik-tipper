"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BitboxNetworkProvider {
    network;
    bitbox;
    constructor(network, bitbox) {
        this.network = network;
        this.bitbox = bitbox;
    }
    async getUtxos(address) {
        const { utxos } = await this.bitbox.Address.utxo(address);
        return utxos;
    }
    async getBlockHeight() {
        return this.bitbox.Blockchain.getBlockCount();
    }
    async getRawTransaction(txid) {
        return this.bitbox.RawTransactions.getRawTransaction(txid);
    }
    async sendRawTransaction(txHex) {
        return this.bitbox.RawTransactions.sendRawTransaction(txHex);
    }
}
exports.default = BitboxNetworkProvider;
//# sourceMappingURL=BitboxNetworkProvider.js.map