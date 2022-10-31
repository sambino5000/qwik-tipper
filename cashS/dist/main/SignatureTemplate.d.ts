import { Secp256k1 } from '@bitauth/libauth';
import { HashType, SignatureAlgorithm } from './interfaces.js';
export default class SignatureTemplate {
    private hashtype;
    private signatureAlgorithm;
    private privateKey;
    constructor(signer: Keypair | Uint8Array | string, hashtype?: HashType, signatureAlgorithm?: SignatureAlgorithm);
    generateSignature(payload: Uint8Array, secp256k1: Secp256k1, bchForkId?: boolean): Uint8Array;
    getHashType(bchForkId?: boolean): number;
    getPublicKey(secp256k1: Secp256k1): Uint8Array;
}
interface Keypair {
    toWIF(): string;
}
export {};
