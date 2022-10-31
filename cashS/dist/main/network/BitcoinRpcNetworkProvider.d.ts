import { Utxo, Network } from '../interfaces.js';
import NetworkProvider from './NetworkProvider.js';
declare const RpcClientRetry: any;
export default class BitcoinRpcNetworkProvider implements NetworkProvider {
    network: Network;
    private rpcClient;
    constructor(network: Network, url: string, opts?: object);
    getUtxos(address: string): Promise<Utxo[]>;
    getBlockHeight(): Promise<number>;
    getRawTransaction(txid: string): Promise<string>;
    sendRawTransaction(txHex: string): Promise<string>;
    getClient(): RpcClientRetry;
}
interface ListUnspentItem {
    txid: string;
    vout: number;
    address: string;
    label: string;
    scriptPubKey: string;
    amount: number;
    confirmations: number;
    redeemScript: string;
    spendable: boolean;
    solvable: boolean;
    safe: boolean;
}
interface RpcClientRetry {
    constructor(url: string, opts?: object): void;
    listUnspent(minConf?: number, maxConf?: number, addresses?: string[], includeUnsafe?: boolean, queryOptions?: object): Promise<ListUnspentItem[]>;
    getBlockCount(): Promise<number>;
    getRawTransaction(txid: string, verbose?: boolean, blockHash?: string): Promise<string>;
    sendRawTransaction(hexString: string, allowHighFees?: boolean): Promise<string>;
    generate(nBlocks: number, maxTries?: number): Promise<string[]>;
    generateToAddress(nBlocks: number, address: string, maxTries?: number): Promise<string[]>;
    getNewAddress(label?: string): Promise<string>;
    dumpPrivKey(address: string): Promise<string>;
    getBalance(dummy?: string, minConf?: number, includeWatchOnly?: boolean): Promise<number>;
    getBlock(blockHash: string, verbosity?: number): Promise<string>;
    importAddress(address: string, label?: string, rescan?: boolean, p2sh?: boolean): Promise<void>;
}
export {};
