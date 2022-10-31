import { Transaction } from '@bitauth/libauth';
import type SignatureTemplate from './SignatureTemplate.js';
export interface Utxo {
    txid: string;
    vout: number;
    satoshis: number;
}
export interface SignableUtxo extends Utxo {
    template: SignatureTemplate;
}
export declare function isSignableUtxo(utxo: Utxo): utxo is SignableUtxo;
export interface Recipient {
    to: string;
    amount: number;
}
export interface Output {
    to: string | Uint8Array;
    amount: number;
}
export declare enum SignatureAlgorithm {
    ECDSA = 0,
    SCHNORR = 1
}
export declare enum HashType {
    SIGHASH_ALL = 1,
    SIGHASH_NONE = 2,
    SIGHASH_SINGLE = 3,
    SIGHASH_ANYONECANPAY = 128
}
export declare const Network: {
    MAINNET: "mainnet";
    TESTNET: "testnet";
    STAGING: "staging";
    REGTEST: "regtest";
};
export declare type Network = (typeof Network)[keyof typeof Network];
export interface TransactionDetails extends Transaction {
    txid: string;
    hex: string;
}
export interface EncodeProps {
    blocks?: number;
    seconds?: number;
}
