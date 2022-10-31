import { Artifact } from '@cashscript/utils';
import { Transaction } from './Transaction.js';
import { Argument } from './Argument.js';
import { Utxo } from './interfaces.js';
import NetworkProvider from './network/NetworkProvider.js';
export declare class Contract {
    private artifact;
    private provider;
    name: string;
    address: string;
    bytesize: number;
    opcount: number;
    functions: {
        [name: string]: ContractFunction;
    };
    private redeemScript;
    constructor(artifact: Artifact, constructorArgs: Argument[], provider?: NetworkProvider);
    getBalance(): Promise<number>;
    getUtxos(): Promise<Utxo[]>;
    getRedeemScriptHex(): string;
    private createFunction;
}
export declare type ContractFunction = (...args: Argument[]) => Transaction;
