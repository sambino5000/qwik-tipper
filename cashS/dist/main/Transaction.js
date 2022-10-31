"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const libauth_1 = require("@bitauth/libauth");
const delay_1 = __importDefault(require("delay"));
const utils_1 = require("@cashscript/utils");
const interfaces_js_1 = require("./interfaces.js");
const utils_js_1 = require("./utils.js");
const constants_js_1 = require("./constants.js");
const SignatureTemplate_js_1 = __importDefault(require("./SignatureTemplate.js"));
const dist_1 = require("../bip68/dist");
// const bip68 = require('bip68');
class Transaction {
    address;
    provider;
    redeemScript;
    abiFunction;
    args;
    selector;
    inputs = [];
    outputs = [];
    sequence = 0xfffffffe;
    locktime;
    hardcodedFee;
    feePerByte = 1.0;
    minChange = constants_js_1.DUST_LIMIT;
    constructor(address, provider, redeemScript, abiFunction, args, selector) {
        this.address = address;
        this.provider = provider;
        this.redeemScript = redeemScript;
        this.abiFunction = abiFunction;
        this.args = args;
        this.selector = selector;
    }
    from(inputOrInputs) {
        if (!Array.isArray(inputOrInputs)) {
            inputOrInputs = [inputOrInputs];
        }
        this.inputs = this.inputs.concat(inputOrInputs);
        return this;
    }
    experimentalFromP2PKH(inputOrInputs, template) {
        if (!Array.isArray(inputOrInputs)) {
            inputOrInputs = [inputOrInputs];
        }
        inputOrInputs = inputOrInputs.map((input) => ({ ...input, template }));
        this.inputs = this.inputs.concat(inputOrInputs);
        return this;
    }
    to(toOrOutputs, amount) {
        if (typeof toOrOutputs === 'string' && typeof amount === 'number') {
            return this.to([{ to: toOrOutputs, amount }]);
        }
        if (Array.isArray(toOrOutputs) && amount === undefined) {
            toOrOutputs.forEach(utils_js_1.validateRecipient);
            this.outputs = this.outputs.concat(toOrOutputs);
            return this;
        }
        throw new Error('Incorrect arguments passed to function \'to\'');
    }
    withOpReturn(chunks) {
        this.outputs.push((0, utils_js_1.createOpReturnOutput)(chunks));
        return this;
    }
    withAge(age) {
        const res = age;
        this.sequence = (0, dist_1.encode)(res);
        return this;
    }
    withTime(time) {
        this.locktime = time;
        return this;
    }
    withHardcodedFee(hardcodedFee) {
        this.hardcodedFee = hardcodedFee;
        return this;
    }
    withFeePerByte(feePerByte) {
        this.feePerByte = feePerByte;
        return this;
    }
    withMinChange(minChange) {
        this.minChange = minChange;
        return this;
    }
    withoutChange() {
        return this.withMinChange(Number.MAX_VALUE);
    }
    async build() {
        this.locktime = this.locktime ?? await this.provider.getBlockHeight();
        await this.setInputsAndOutputs();
        const secp256k1 = await (0, libauth_1.instantiateSecp256k1)();
        const bytecode = (0, utils_1.scriptToBytecode)(this.redeemScript);
        const inputs = this.inputs.map((utxo) => ({
            outpointIndex: utxo.vout,
            outpointTransactionHash: (0, libauth_1.hexToBin)(utxo.txid),
            sequenceNumber: this.sequence,
            unlockingBytecode: new Uint8Array(),
        }));
        const outputs = this.outputs.map((output) => {
            const lockingBytecode = typeof output.to === 'string'
                ? (0, utils_js_1.addressToLockScript)(output.to)
                : output.to;
            const satoshis = (0, libauth_1.bigIntToBinUint64LE)(BigInt(output.amount));
            return { lockingBytecode, satoshis };
        });
        const transaction = {
            inputs,
            locktime: this.locktime,
            outputs,
            version: 2,
        };
        const inputScripts = [];
        this.inputs.forEach((utxo, i) => {
            // UTXO's with signature templates are signed using P2PKH
            if ((0, interfaces_js_1.isSignableUtxo)(utxo)) {
                const pubkey = utxo.template.getPublicKey(secp256k1);
                const pubkeyHash = (0, utils_1.hash160)(pubkey);
                const addressContents = { payload: pubkeyHash, type: libauth_1.AddressType.p2pkh };
                const prevOutScript = (0, libauth_1.addressContentsToLockingBytecode)(addressContents);
                const hashtype = utxo.template.getHashType();
                const preimage = (0, utils_js_1.createSighashPreimage)(transaction, utxo, i, prevOutScript, hashtype);
                const sighash = (0, utils_1.hash256)(preimage);
                const signature = utxo.template.generateSignature(sighash, secp256k1);
                const inputScript = (0, utils_1.scriptToBytecode)([signature, pubkey]);
                inputScripts.push(inputScript);
                return;
            }
            let covenantHashType = -1;
            const completeArgs = this.args.map((arg) => {
                if (!(arg instanceof SignatureTemplate_js_1.default))
                    return arg;
                // First signature is used for sighash preimage (maybe not the best way)
                if (covenantHashType < 0)
                    covenantHashType = arg.getHashType();
                const preimage = (0, utils_js_1.createSighashPreimage)(transaction, utxo, i, bytecode, arg.getHashType());
                const sighash = (0, utils_1.hash256)(preimage);
                return arg.generateSignature(sighash, secp256k1);
            });
            const preimage = this.abiFunction.covenant
                ? (0, utils_js_1.createSighashPreimage)(transaction, utxo, i, bytecode, covenantHashType)
                : undefined;
            const inputScript = (0, utils_js_1.createInputScript)(this.redeemScript, completeArgs, this.selector, preimage);
            inputScripts.push(inputScript);
        });
        inputScripts.forEach((script, i) => {
            transaction.inputs[i].unlockingBytecode = script;
        });
        return (0, libauth_1.binToHex)((0, libauth_1.encodeTransaction)(transaction));
    }
    async send(raw) {
        const tx = await this.build();
        try {
            const txid = await this.provider.sendRawTransaction(tx);
            return raw ? await this.getTxDetails(txid, raw) : await this.getTxDetails(txid);
        }
        catch (e) {
            const reason = e.error ?? e.message;
            throw (0, utils_js_1.buildError)(reason, (0, utils_js_1.meep)(tx, this.inputs, this.redeemScript));
        }
    }
    async getTxDetails(txid, raw) {
        for (let retries = 0; retries < 1200; retries += 1) {
            await (0, delay_1.default)(500);
            try {
                const hex = await this.provider.getRawTransaction(txid);
                if (raw)
                    return hex;
                const libauthTransaction = (0, libauth_1.decodeTransaction)((0, libauth_1.hexToBin)(hex));
                return { ...libauthTransaction, txid, hex };
            }
            catch (ignored) {
                // ignored
            }
        }
        // Should not happen
        throw new Error('Could not retrieve transaction details for over 10 minutes');
    }
    async meep() {
        const tx = await this.build();
        return (0, utils_js_1.meep)(tx, this.inputs, this.redeemScript);
    }
    async setInputsAndOutputs() {
        if (this.outputs.length === 0) {
            throw Error('Attempted to build a transaction without outputs');
        }
        // Replace all SignatureTemplate with 65-length placeholder Uint8Arrays
        const placeholderArgs = this.args.map((arg) => (arg instanceof SignatureTemplate_js_1.default ? (0, utils_1.placeholder)(65) : arg));
        // Create a placeholder preimage of the correct size
        const placeholderPreimage = this.abiFunction.covenant
            ? (0, utils_1.placeholder)((0, utils_js_1.getPreimageSize)((0, utils_1.scriptToBytecode)(this.redeemScript)))
            : undefined;
        // Create a placeholder input script for size calculation using the placeholder
        // arguments and correctly sized placeholder preimage
        const placeholderScript = (0, utils_js_1.createInputScript)(this.redeemScript, placeholderArgs, this.selector, placeholderPreimage);
        // Add one extra byte per input to over-estimate tx-in count
        const inputSize = (0, utils_js_1.getInputSize)(placeholderScript) + 1;
        // Calculate amount to send and base fee (excluding additional fees per UTXO)
        const amount = this.outputs.reduce((acc, output) => acc + output.amount, 0);
        let fee = this.hardcodedFee ?? (0, utils_js_1.getTxSizeWithoutInputs)(this.outputs) * this.feePerByte;
        // Select and gather UTXOs and calculate fees and available funds
        let satsAvailable = 0;
        if (this.inputs.length > 0) {
            // If inputs are already defined, the user provided the UTXOs
            // and we perform no further UTXO selection
            if (!this.hardcodedFee)
                fee += this.inputs.length * inputSize * this.feePerByte;
            satsAvailable = this.inputs.reduce((acc, input) => acc + input.satoshis, 0);
        }
        else {
            // If inputs are not defined yet, we retrieve the contract's UTXOs and perform selection
            const utxos = await this.provider.getUtxos(this.address);
            // We sort the UTXOs mainly so there is consistent behaviour between network providers
            // even if they report UTXOs in a different order
            utxos.sort((a, b) => b.satoshis - a.satoshis);
            for (const utxo of utxos) {
                this.inputs.push(utxo);
                satsAvailable += utxo.satoshis;
                if (!this.hardcodedFee)
                    fee += inputSize * this.feePerByte;
                if (satsAvailable > amount + fee)
                    break;
            }
        }
        // Fee per byte can be a decimal number, but we need the total fee to be an integer
        fee = Math.ceil(fee);
        // Calculate change and check available funds
        let change = satsAvailable - amount - fee;
        if (change < 0) {
            throw new Error(`Insufficient funds: available (${satsAvailable}) < needed (${amount + fee}).`);
        }
        // Account for the fee of a change output
        if (!this.hardcodedFee) {
            change -= constants_js_1.P2SH_OUTPUT_SIZE;
        }
        // Add a change output if applicable
        if (change >= constants_js_1.DUST_LIMIT && change >= this.minChange) {
            this.outputs.push({ to: this.address, amount: change });
        }
    }
}
exports.Transaction = Transaction;
//# sourceMappingURL=Transaction.js.map