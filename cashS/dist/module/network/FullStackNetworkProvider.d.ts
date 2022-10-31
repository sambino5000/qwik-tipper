import { Utxo, Network } from '../interfaces.js';
import NetworkProvider from './NetworkProvider.js';
export default class FullStackNetworkProvider implements NetworkProvider {
    network: Network;
    private bchjs;
    /**
     * @example
     * const BCHJS = require("@psf/bch-js")
     * let bchjs = new BCHJS({
     *   restURL: 'https://api.fullstack.cash/v3/',
     *   apiToken: 'eyJhbGciO...' // Your JWT token here.
     * })
     */
    constructor(network: Network, bchjs: BCHJS);
    getUtxos(address: string): Promise<Utxo[]>;
    getBlockHeight(): Promise<number>;
    getRawTransaction(txid: string): Promise<string>;
    sendRawTransaction(txHex: string): Promise<string>;
}
interface ElectrumUtxo {
    tx_pos: number;
    value: number;
    tx_hash: string;
    height: number;
}
interface BCHJS {
    Electrumx: {
        utxo(address: string): Promise<{
            utxos: ElectrumUtxo[];
        }>;
    };
    Blockchain: {
        getBlockCount(): Promise<number>;
    };
    RawTransactions: {
        getRawTransaction(txid: string): Promise<string>;
        sendRawTransaction(txHex: string): Promise<string>;
    };
}
export {};
