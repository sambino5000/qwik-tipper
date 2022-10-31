import { DUST_LIMIT } from './constants.js';
export class TypeError extends Error {
    constructor(actual, expected) {
        super(`Found type '${actual}' where type '${expected.toString()}' was expected`);
    }
}
export class OutputSatoshisTooSmallError extends Error {
    constructor(satoshis) {
        super(`Tried to add an output with ${satoshis} satoshis, which is less than the DUST limit (${DUST_LIMIT})`);
    }
}
export class FailedTransactionError extends Error {
    reason;
    meep;
    constructor(reason, meep) {
        super(`Transaction failed with reason: ${reason}\n${meep}`);
        this.reason = reason;
        this.meep = meep;
    }
}
export class FailedRequireError extends FailedTransactionError {
}
export class FailedTimeCheckError extends FailedTransactionError {
}
export class FailedSigCheckError extends FailedTransactionError {
}
// TODO: Expand these reasons with non-script failures (like tx-mempool-conflict)
export var Reason;
(function (Reason) {
    Reason["EVAL_FALSE"] = "Script evaluated without error but finished with a false/empty top stack element";
    Reason["VERIFY"] = "Script failed an OP_VERIFY operation";
    Reason["EQUALVERIFY"] = "Script failed an OP_EQUALVERIFY operation";
    Reason["CHECKMULTISIGVERIFY"] = "Script failed an OP_CHECKMULTISIGVERIFY operation";
    Reason["CHECKSIGVERIFY"] = "Script failed an OP_CHECKSIGVERIFY operation";
    Reason["CHECKDATASIGVERIFY"] = "Script failed an OP_CHECKDATASIGVERIFY operation";
    Reason["NUMEQUALVERIFY"] = "Script failed an OP_NUMEQUALVERIFY operation";
    Reason["SCRIPT_SIZE"] = "Script is too big";
    Reason["PUSH_SIZE"] = "Push value size limit exceeded";
    Reason["OP_COUNT"] = "Operation limit exceeded";
    Reason["STACK_SIZE"] = "Stack size limit exceeded";
    Reason["SIG_COUNT"] = "Signature count negative or greater than pubkey count";
    Reason["PUBKEY_COUNT"] = "Pubkey count negative or limit exceeded";
    Reason["INVALID_OPERAND_SIZE"] = "Invalid operand size";
    Reason["INVALID_NUMBER_RANGE"] = "Given operand is not a number within the valid range";
    Reason["IMPOSSIBLE_ENCODING"] = "The requested encoding is impossible to satisfy";
    Reason["INVALID_SPLIT_RANGE"] = "Invalid OP_SPLIT range";
    Reason["INVALID_BIT_COUNT"] = "Invalid number of bit set in OP_CHECKMULTISIG";
    Reason["BAD_OPCODE"] = "Opcode missing or not understood";
    Reason["DISABLED_OPCODE"] = "Attempted to use a disabled opcode";
    Reason["INVALID_STACK_OPERATION"] = "Operation not valid with the current stack size";
    Reason["INVALID_ALTSTACK_OPERATION"] = "Operation not valid with the current altstack size";
    Reason["OP_RETURN"] = "OP_RETURN was encountered";
    Reason["UNBALANCED_CONDITIONAL"] = "Invalid OP_IF construction";
    Reason["DIV_BY_ZERO"] = "Division by zero error";
    Reason["MOD_BY_ZERO"] = "Modulo by zero error";
    Reason["INVALID_BITFIELD_SIZE"] = "Bitfield of unexpected size error";
    Reason["INVALID_BIT_RANGE"] = "Bitfield's bit out of the expected range";
    Reason["NEGATIVE_LOCKTIME"] = "Negative locktime";
    Reason["UNSATISFIED_LOCKTIME"] = "Locktime requirement not satisfied";
    Reason["SIG_HASHTYPE"] = "Signature hash type missing or not understood";
    Reason["SIG_DER"] = "Non-canonical DER signature";
    Reason["MINIMALDATA"] = "Data push larger than necessary";
    Reason["SIG_PUSHONLY"] = "Only push operators allowed in signature scripts";
    Reason["SIG_HIGH_S"] = "Non-canonical signature: S value is unnecessarily high";
    Reason["MINIMALIF"] = "OP_IF/NOTIF argument must be minimal";
    Reason["SIG_NULLFAIL"] = "Signature must be zero for failed CHECK(MULTI)SIG operation";
    Reason["SIG_BADLENGTH"] = "Signature cannot be 65 bytes in CHECKMULTISIG";
    Reason["SIG_NONSCHNORR"] = "Only Schnorr signatures allowed in this operation";
    Reason["DISCOURAGE_UPGRADABLE_NOPS"] = "NOPx reserved for soft-fork upgrades";
    Reason["PUBKEYTYPE"] = "Public key is neither compressed or uncompressed";
    Reason["CLEANSTACK"] = "Script did not clean its stack";
    Reason["NONCOMPRESSED_PUBKEY"] = "Using non-compressed public key";
    Reason["ILLEGAL_FORKID"] = "Illegal use of SIGHASH_FORKID";
    Reason["MUST_USE_FORKID"] = "Signature must use SIGHASH_FORKID";
    Reason["UNKNOWN"] = "unknown error";
})(Reason || (Reason = {}));
//# sourceMappingURL=Errors.js.map