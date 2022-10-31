export default class FullStackNetworkProvider {
    network;
    bchjs;
    /**
     * @example
     * const BCHJS = require("@psf/bch-js")
     * let bchjs = new BCHJS({
     *   restURL: 'https://api.fullstack.cash/v3/',
     *   apiToken: 'eyJhbGciO...' // Your JWT token here.
     * })
     */
    constructor(network, bchjs) {
        this.network = network;
        this.bchjs = bchjs;
    }
    async getUtxos(address) {
        const result = await this.bchjs.Electrumx.utxo(address);
        const utxos = (result.utxos ?? []).map((utxo) => ({
            txid: utxo.tx_hash,
            vout: utxo.tx_pos,
            satoshis: utxo.value,
            height: utxo.height,
        }));
        return utxos;
    }
    async getBlockHeight() {
        return this.bchjs.Blockchain.getBlockCount();
    }
    async getRawTransaction(txid) {
        return this.bchjs.RawTransactions.getRawTransaction(txid);
    }
    async sendRawTransaction(txHex) {
        return this.bchjs.RawTransactions.sendRawTransaction(txHex);
    }
}
//# sourceMappingURL=FullStackNetworkProvider.js.map