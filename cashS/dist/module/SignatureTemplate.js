import { decodePrivateKeyWif, SigningSerializationFlag } from '@bitauth/libauth';
import { sha256 } from '@cashscript/utils';
import { HashType, SignatureAlgorithm } from './interfaces.js';
export default class SignatureTemplate {
    hashtype;
    signatureAlgorithm;
    privateKey;
    constructor(signer, hashtype = HashType.SIGHASH_ALL, signatureAlgorithm = SignatureAlgorithm.SCHNORR) {
        this.hashtype = hashtype;
        this.signatureAlgorithm = signatureAlgorithm;
        if (isKeypair(signer)) {
            const wif = signer.toWIF();
            this.privateKey = decodeWif(wif);
        }
        else if (typeof signer === 'string') {
            this.privateKey = decodeWif(signer);
        }
        else {
            this.privateKey = signer;
        }
    }
    generateSignature(payload, secp256k1, bchForkId) {
        const signature = this.signatureAlgorithm === SignatureAlgorithm.SCHNORR
            ? secp256k1.signMessageHashSchnorr(this.privateKey, payload)
            : secp256k1.signMessageHashDER(this.privateKey, payload);
        return Uint8Array.from([...signature, this.getHashType(bchForkId)]);
    }
    getHashType(bchForkId = true) {
        return bchForkId ? (this.hashtype | SigningSerializationFlag.forkId) : this.hashtype;
    }
    getPublicKey(secp256k1) {
        return secp256k1.derivePublicKeyCompressed(this.privateKey);
    }
}
function isKeypair(obj) {
    return typeof obj.toWIF === 'function';
}
function decodeWif(wif) {
    const result = decodePrivateKeyWif({ hash: sha256 }, wif);
    if (typeof result === 'string') {
        throw new Error(result);
    }
    return result.privateKey;
}
//# sourceMappingURL=SignatureTemplate.js.map