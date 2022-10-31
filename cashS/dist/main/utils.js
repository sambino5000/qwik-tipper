"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNetworkPrefix = exports.addressToLockScript = exports.scriptToLockingBytecode = exports.scriptToAddress = exports.meep = exports.buildError = exports.createSighashPreimage = exports.createOpReturnOutput = exports.createInputScript = exports.getTxSizeWithoutInputs = exports.getPreimageSize = exports.getInputSize = exports.validateRecipient = void 0;
const libauth_1 = require("@bitauth/libauth");
const utils_1 = require("@cashscript/utils");
const interfaces_js_1 = require("./interfaces.js");
const constants_js_1 = require("./constants.js");
const Errors_js_1 = require("./Errors.js");
// ////////// PARAMETER VALIDATION ////////////////////////////////////////////
function validateRecipient(recipient) {
    if (recipient.amount < constants_js_1.DUST_LIMIT) {
        throw new Errors_js_1.OutputSatoshisTooSmallError(recipient.amount);
    }
}
exports.validateRecipient = validateRecipient;
// ////////// SIZE CALCULATIONS ///////////////////////////////////////////////
function getInputSize(inputScript) {
    const scriptSize = inputScript.byteLength;
    const varIntSize = scriptSize > 252 ? 3 : 1;
    return 32 + 4 + varIntSize + scriptSize + 4;
}
exports.getInputSize = getInputSize;
function getPreimageSize(script) {
    const scriptSize = script.byteLength;
    const varIntSize = scriptSize > 252 ? 3 : 1;
    return 4 + 32 + 32 + 36 + varIntSize + scriptSize + 8 + 4 + 32 + 4 + 4;
}
exports.getPreimageSize = getPreimageSize;
function getTxSizeWithoutInputs(outputs) {
    // Transaction format:
    // Version (4 Bytes)
    // TxIn Count (1 ~ 9B)
    // For each TxIn:
    //   Outpoint (36B)
    //   Script Length (1 ~ 9B)
    //   ScriptSig(?)
    //   Sequence (4B)
    // TxOut Count (1 ~ 9B)
    // For each TxOut:
    //   Value (8B)
    //   Script Length(1 ~ 9B)*
    //   Script (?)*
    // LockTime (4B)
    let size = constants_js_1.VERSION_SIZE + constants_js_1.LOCKTIME_SIZE;
    size += outputs.reduce((acc, output) => {
        if (typeof output.to === 'string') {
            return acc + constants_js_1.P2PKH_OUTPUT_SIZE;
        }
        // Size of an OP_RETURN output = byteLength + 8 (amount) + 2 (scriptSize)
        return acc + output.to.byteLength + 8 + 2;
    }, 0);
    // Add tx-out count (accounting for a potential change output)
    size += (0, utils_1.encodeInt)(outputs.length + 1).byteLength;
    return size;
}
exports.getTxSizeWithoutInputs = getTxSizeWithoutInputs;
// ////////// BUILD OBJECTS ///////////////////////////////////////////////////
function createInputScript(redeemScript, encodedArgs, selector, preimage) {
    // Create unlock script / redeemScriptSig (add potential preimage and selector)
    const unlockScript = encodedArgs.reverse();
    if (preimage !== undefined)
        unlockScript.push(preimage);
    if (selector !== undefined)
        unlockScript.push((0, utils_1.encodeInt)(selector));
    // Create input script and compile it to bytecode
    const inputScript = [...unlockScript, (0, utils_1.scriptToBytecode)(redeemScript)];
    return (0, utils_1.scriptToBytecode)(inputScript);
}
exports.createInputScript = createInputScript;
function createOpReturnOutput(opReturnData) {
    const script = [
        utils_1.Op.OP_RETURN,
        ...opReturnData.map((output) => toBin(output)),
    ];
    return { to: encodeNullDataScript(script), amount: 0 };
}
exports.createOpReturnOutput = createOpReturnOutput;
function toBin(output) {
    const data = output.replace(/^0x/, '');
    const encode = data === output ? libauth_1.utf8ToBin : libauth_1.hexToBin;
    return encode(data);
}
function createSighashPreimage(transaction, input, inputIndex, coveredBytecode, hashtype) {
    const state = (0, libauth_1.createTransactionContextCommon)({
        inputIndex,
        sourceOutput: { satoshis: (0, libauth_1.bigIntToBinUint64LE)(BigInt(input.satoshis)) },
        spendingTransaction: transaction,
    });
    const sighashPreimage = (0, libauth_1.generateSigningSerializationBCH)({
        correspondingOutput: state.correspondingOutput,
        coveredBytecode,
        forkId: new Uint8Array([0, 0, 0]),
        locktime: state.locktime,
        outpointIndex: state.outpointIndex,
        outpointTransactionHash: state.outpointTransactionHash,
        outputValue: state.outputValue,
        sequenceNumber: state.sequenceNumber,
        sha256: { hash: utils_1.sha256 },
        signingSerializationType: new Uint8Array([hashtype]),
        transactionOutpoints: state.transactionOutpoints,
        transactionOutputs: state.transactionOutputs,
        transactionSequenceNumbers: state.transactionSequenceNumbers,
        version: 2,
    });
    return sighashPreimage;
}
exports.createSighashPreimage = createSighashPreimage;
function buildError(reason, meepStr) {
    const require = [
        Errors_js_1.Reason.EVAL_FALSE, Errors_js_1.Reason.VERIFY, Errors_js_1.Reason.EQUALVERIFY, Errors_js_1.Reason.CHECKMULTISIGVERIFY,
        Errors_js_1.Reason.CHECKSIGVERIFY, Errors_js_1.Reason.CHECKDATASIGVERIFY, Errors_js_1.Reason.NUMEQUALVERIFY,
    ];
    const timeCheck = [Errors_js_1.Reason.NEGATIVE_LOCKTIME, Errors_js_1.Reason.UNSATISFIED_LOCKTIME];
    const sigCheck = [
        Errors_js_1.Reason.SIG_COUNT, Errors_js_1.Reason.PUBKEY_COUNT, Errors_js_1.Reason.SIG_HASHTYPE, Errors_js_1.Reason.SIG_DER,
        Errors_js_1.Reason.SIG_HIGH_S, Errors_js_1.Reason.SIG_NULLFAIL, Errors_js_1.Reason.SIG_BADLENGTH, Errors_js_1.Reason.SIG_NONSCHNORR,
    ];
    if (toRegExp(require).test(reason)) {
        return new Errors_js_1.FailedRequireError(reason, meepStr);
    }
    if (toRegExp(timeCheck).test(reason)) {
        return new Errors_js_1.FailedTimeCheckError(reason, meepStr);
    }
    if (toRegExp(sigCheck).test(reason)) {
        return new Errors_js_1.FailedSigCheckError(reason, meepStr);
    }
    return new Errors_js_1.FailedTransactionError(reason, meepStr);
}
exports.buildError = buildError;
function toRegExp(reasons) {
    return new RegExp(reasons.join('|').replace(/\(/g, '\\(').replace(/\)/g, '\\)'));
}
// ////////// MISC ////////////////////////////////////////////////////////////
function meep(tx, utxos, script) {
    const scriptPubkey = (0, libauth_1.binToHex)(scriptToLockingBytecode(script));
    return `meep debug --tx=${tx} --idx=0 --amt=${utxos[0].satoshis} --pkscript=${scriptPubkey}`;
}
exports.meep = meep;
function scriptToAddress(script, network) {
    const lockingBytecode = scriptToLockingBytecode(script);
    const prefix = getNetworkPrefix(network);
    const address = (0, libauth_1.lockingBytecodeToCashAddress)(lockingBytecode, prefix);
    return address;
}
exports.scriptToAddress = scriptToAddress;
function scriptToLockingBytecode(script) {
    const scriptHash = (0, utils_1.hash160)((0, utils_1.scriptToBytecode)(script));
    const addressContents = { payload: scriptHash, type: libauth_1.AddressType.p2sh };
    const lockingBytecode = (0, libauth_1.addressContentsToLockingBytecode)(addressContents);
    return lockingBytecode;
}
exports.scriptToLockingBytecode = scriptToLockingBytecode;
/**
* Helper function to convert an address to a locking script
*
* @param address   Address to convert to locking script
*
* @returns a locking script corresponding to the passed address
*/
function addressToLockScript(address) {
    const result = (0, libauth_1.cashAddressToLockingBytecode)(address);
    if (typeof result === 'string')
        throw new Error(result);
    return result.bytecode;
}
exports.addressToLockScript = addressToLockScript;
function getNetworkPrefix(network) {
    switch (network) {
        case interfaces_js_1.Network.MAINNET:
            return 'ecash';
        case interfaces_js_1.Network.STAGING:
            return 'ectest';
        case interfaces_js_1.Network.TESTNET:
            return 'ectest';
        case interfaces_js_1.Network.REGTEST:
            return 'ecreg';
        default:
            return 'ecash';
    }
}
exports.getNetworkPrefix = getNetworkPrefix;
// ////////////////////////////////////////////////////////////////////////////
// For encoding OP_RETURN data (doesn't require BIP62.3 / MINIMALDATA)
function encodeNullDataScript(chunks) {
    return (0, libauth_1.flattenBinArray)(chunks.map((chunk) => {
        if (typeof chunk === 'number') {
            return new Uint8Array([chunk]);
        }
        const pushdataOpcode = getPushDataOpcode(chunk);
        return new Uint8Array([...pushdataOpcode, ...chunk]);
    }));
}
function getPushDataOpcode(data) {
    const { byteLength } = data;
    if (byteLength === 0)
        return Uint8Array.from([0x4c, 0x00]);
    if (byteLength < 76)
        return Uint8Array.from([byteLength]);
    if (byteLength < 256)
        return Uint8Array.from([0x4c, byteLength]);
    throw Error('Pushdata too large');
}
//# sourceMappingURL=utils.js.map