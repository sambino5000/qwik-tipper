"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const libauth_1 = require("@bitauth/libauth");
class ChronikNetworkProvider {
    network;
    chronik;
    constructor(network, chronik) {
        this.network = network;
        this.chronik = chronik;
    }
    async getUtxos(address) {
        const addr = (0, libauth_1.cashAddressToLockingBytecode)(address);
        const addressBytecode = addr.bytecode;
        const addrContent = (0, libauth_1.lockingBytecodeToAddressContents)(addressBytecode);
        const addrType = addrContent.type;
        // const addrScriptType = addrType//addrContent.type === 'P2SH' ? "p2sh" : "p2pkh"
        // const payload = binToHex(addrContent.payload)
        const chronikUtxoResult = await this.chronik
            .script(addrType.toLowerCase().toString(), (0, libauth_1.binToHex)(addrContent.payload))
            .utxos();
        if (chronikUtxoResult[0] === undefined) {
            const utxos = [null].map((utxo) => ({
                txid: '',
                vout: 0,
                satoshis: parseInt("0"),
                //
            }));
            return utxos;
        }
        const utxos = chronikUtxoResult[0].utxos.map((utxo) => ({
            txid: utxo.outpoint.txid,
            vout: utxo.outpoint.outIdx,
            satoshis: parseInt(utxo.value, 10),
            //
        }));
        return utxos;
    }
    async getBlockHeight() {
        const height = this.chronik.blockchainInfo();
        return (await height).tipHeight;
    }
    async getRawTransaction(txid) {
        const tx = this.chronik.tx(txid);
        return JSON.stringify(tx);
    }
    async sendRawTransaction(txHex) {
        const rawTx = this.chronik.broadcastTx(txHex, true);
        return (await rawTx).txid;
    }
}
exports.default = ChronikNetworkProvider;
//# sourceMappingURL=ChronikNetworkProvider.js.map