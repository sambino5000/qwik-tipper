import { AbiFunction, Script } from '@cashscript/utils';
import { Utxo, Recipient, TransactionDetails } from './interfaces.js';
import NetworkProvider from './network/NetworkProvider.js';
import SignatureTemplate from './SignatureTemplate.js';
export declare class Transaction {
    private address;
    private provider;
    private redeemScript;
    private abiFunction;
    private args;
    private selector?;
    private inputs;
    private outputs;
    private sequence;
    private locktime;
    private hardcodedFee;
    private feePerByte;
    private minChange;
    constructor(address: string, provider: NetworkProvider, redeemScript: Script, abiFunction: AbiFunction, args: (Uint8Array | SignatureTemplate)[], selector?: number | undefined);
    from(input: Utxo): this;
    from(inputs: Utxo[]): this;
    experimentalFromP2PKH(input: Utxo, template: SignatureTemplate): this;
    experimentalFromP2PKH(inputs: Utxo[], template: SignatureTemplate): this;
    to(to: string, amount: number): this;
    to(outputs: Recipient[]): this;
    withOpReturn(chunks: string[]): this;
    withAge(age: number): this;
    withTime(time: number): this;
    withHardcodedFee(hardcodedFee: number): this;
    withFeePerByte(feePerByte: number): this;
    withMinChange(minChange: number): this;
    withoutChange(): this;
    build(): Promise<string>;
    send(): Promise<TransactionDetails>;
    send(raw: true): Promise<string>;
    private getTxDetails;
    meep(): Promise<string>;
    private setInputsAndOutputs;
}
