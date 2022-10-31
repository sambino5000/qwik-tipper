import { Utxo, Network } from '../interfaces.js';
import NetworkProvider from './NetworkProvider.js';
export default class BitboxNetworkProvider implements NetworkProvider {
    network: Network;
    private bitbox;
    constructor(network: Network, bitbox: BITBOX);
    getUtxos(address: string): Promise<Utxo[]>;
    getBlockHeight(): Promise<number>;
    getRawTransaction(txid: string): Promise<string>;
    sendRawTransaction(txHex: string): Promise<string>;
}
interface BITBOX {
    Address: {
        utxo(address: string): Promise<{
            utxos: Utxo[];
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
