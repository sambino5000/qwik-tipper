import { ChronikClient } from "chronik-client";
import { Utxo, Network } from "../interfaces.js";
import NetworkProvider from "./NetworkProvider.js";
export default class ChronikNetworkProvider implements NetworkProvider {
    network: Network;
    private chronik;
    constructor(network: Network, chronik: ChronikClient);
    getUtxos(address: string): Promise<Utxo[]>;
    getBlockHeight(): Promise<number>;
    getRawTransaction(txid: string): Promise<string>;
    sendRawTransaction(txHex: string): Promise<string>;
}
