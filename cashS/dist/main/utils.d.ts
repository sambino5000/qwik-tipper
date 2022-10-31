import { Transaction } from '@bitauth/libauth';
import { Script } from '@cashscript/utils';
import { Utxo, Output, Recipient } from './interfaces.js';
import { FailedTransactionError } from './Errors.js';
export declare function validateRecipient(recipient: Recipient): void;
export declare function getInputSize(inputScript: Uint8Array): number;
export declare function getPreimageSize(script: Uint8Array): number;
export declare function getTxSizeWithoutInputs(outputs: Output[]): number;
export declare function createInputScript(redeemScript: Script, encodedArgs: Uint8Array[], selector?: number, preimage?: Uint8Array): Uint8Array;
export declare function createOpReturnOutput(opReturnData: string[]): Output;
export declare function createSighashPreimage(transaction: Transaction, input: {
    satoshis: number;
}, inputIndex: number, coveredBytecode: Uint8Array, hashtype: number): Uint8Array;
export declare function buildError(reason: string, meepStr: string): FailedTransactionError;
export declare function meep(tx: any, utxos: Utxo[], script: Script): string;
export declare function scriptToAddress(script: Script, network: string): string;
export declare function scriptToLockingBytecode(script: Script): Uint8Array;
/**
* Helper function to convert an address to a locking script
*
* @param address   Address to convert to locking script
*
* @returns a locking script corresponding to the passed address
*/
export declare function addressToLockScript(address: string): Uint8Array;
export declare function getNetworkPrefix(network: string): 'ecash' | 'ectest' | 'ecreg';
