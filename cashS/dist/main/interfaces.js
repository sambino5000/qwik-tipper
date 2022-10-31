"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Network = exports.HashType = exports.SignatureAlgorithm = exports.isSignableUtxo = void 0;
function isSignableUtxo(utxo) {
    return 'template' in utxo;
}
exports.isSignableUtxo = isSignableUtxo;
var SignatureAlgorithm;
(function (SignatureAlgorithm) {
    SignatureAlgorithm[SignatureAlgorithm["ECDSA"] = 0] = "ECDSA";
    SignatureAlgorithm[SignatureAlgorithm["SCHNORR"] = 1] = "SCHNORR";
})(SignatureAlgorithm = exports.SignatureAlgorithm || (exports.SignatureAlgorithm = {}));
var HashType;
(function (HashType) {
    HashType[HashType["SIGHASH_ALL"] = 1] = "SIGHASH_ALL";
    HashType[HashType["SIGHASH_NONE"] = 2] = "SIGHASH_NONE";
    HashType[HashType["SIGHASH_SINGLE"] = 3] = "SIGHASH_SINGLE";
    HashType[HashType["SIGHASH_ANYONECANPAY"] = 128] = "SIGHASH_ANYONECANPAY";
})(HashType = exports.HashType || (exports.HashType = {}));
// Weird setup to allow both Enum parameters, as well as literal strings
// https://stackoverflow.com/questions/51433319/typescript-constructor-accept-string-for-enum
const literal = (l) => l;
exports.Network = {
    MAINNET: literal('mainnet'),
    TESTNET: literal('testnet'),
    STAGING: literal('staging'),
    REGTEST: literal('regtest'),
};
//# sourceMappingURL=interfaces.js.map