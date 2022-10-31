import { bigIntToBinUint64LE, hexToBin, binToHex, encodeTransaction, addressContentsToLockingBytecode, AddressType, decodeTransaction, instantiateSecp256k1, } from '@bitauth/libauth';
import delay from 'delay';
import { hash160, hash256, placeholder, scriptToBytecode, } from '@cashscript/utils';
import { isSignableUtxo, } from './interfaces.js';
import { meep, createInputScript, getInputSize, createOpReturnOutput, getTxSizeWithoutInputs, getPreimageSize, buildError, addressToLockScript, createSighashPreimage, validateRecipient, } from './utils.js';
import { P2SH_OUTPUT_SIZE, DUST_LIMIT } from './constants.js';
import SignatureTemplate from './SignatureTemplate.js';
import { encode } from './bip68';
// const bip68 = require('bip68');
export class Transaction {
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
    minChange = DUST_LIMIT;
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
            toOrOutputs.forEach(validateRecipient);
            this.outputs = this.outputs.concat(toOrOutputs);
            return this;
        }
        throw new Error('Incorrect arguments passed to function \'to\'');
    }
    withOpReturn(chunks) {
        this.outputs.push(createOpReturnOutput(chunks));
        return this;
    }
    withAge(age) {
        const res = age;
        this.sequence = encode(res);
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
        const secp256k1 = await instantiateSecp256k1();
        const bytecode = scriptToBytecode(this.redeemScript);
        const inputs = this.inputs.map((utxo) => ({
            outpointIndex: utxo.vout,
            outpointTransactionHash: hexToBin(utxo.txid),
            sequenceNumber: this.sequence,
            unlockingBytecode: new Uint8Array(),
        }));
        const outputs = this.outputs.map((output) => {
            const lockingBytecode = typeof output.to === 'string'
                ? addressToLockScript(output.to)
                : output.to;
            const satoshis = bigIntToBinUint64LE(BigInt(output.amount));
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
            if (isSignableUtxo(utxo)) {
                const pubkey = utxo.template.getPublicKey(secp256k1);
                const pubkeyHash = hash160(pubkey);
                const addressContents = { payload: pubkeyHash, type: AddressType.p2pkh };
                const prevOutScript = addressContentsToLockingBytecode(addressContents);
                const hashtype = utxo.template.getHashType();
                const preimage = createSighashPreimage(transaction, utxo, i, prevOutScript, hashtype);
                const sighash = hash256(preimage);
                const signature = utxo.template.generateSignature(sighash, secp256k1);
                const inputScript = scriptToBytecode([signature, pubkey]);
                inputScripts.push(inputScript);
                return;
            }
            let covenantHashType = -1;
            const completeArgs = this.args.map((arg) => {
                if (!(arg instanceof SignatureTemplate))
                    return arg;
                // First signature is used for sighash preimage (maybe not the best way)
                if (covenantHashType < 0)
                    covenantHashType = arg.getHashType();
                const preimage = createSighashPreimage(transaction, utxo, i, bytecode, arg.getHashType());
                const sighash = hash256(preimage);
                return arg.generateSignature(sighash, secp256k1);
            });
            const preimage = this.abiFunction.covenant
                ? createSighashPreimage(transaction, utxo, i, bytecode, covenantHashType)
                : undefined;
            const inputScript = createInputScript(this.redeemScript, completeArgs, this.selector, preimage);
            inputScripts.push(inputScript);
        });
        inputScripts.forEach((script, i) => {
            transaction.inputs[i].unlockingBytecode = script;
        });
        return binToHex(encodeTransaction(transaction));
    }
    async send(raw) {
        const tx = await this.build();
        try {
            const txid = await this.provider.sendRawTransaction(tx);
            return raw ? await this.getTxDetails(txid, raw) : await this.getTxDetails(txid);
        }
        catch (e) {
            const reason = e.error ?? e.message;
            throw buildError(reason, meep(tx, this.inputs, this.redeemScript));
        }
    }
    async getTxDetails(txid, raw) {
        for (let retries = 0; retries < 1200; retries += 1) {
            await delay(500);
            try {
                const hex = await this.provider.getRawTransaction(txid);
                if (raw)
                    return hex;
                const libauthTransaction = decodeTransaction(hexToBin(hex));
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
        return meep(tx, this.inputs, this.redeemScript);
    }
    async setInputsAndOutputs() {
        if (this.outputs.length === 0) {
            throw Error('Attempted to build a transaction without outputs');
        }
        // Replace all SignatureTemplate with 65-length placeholder Uint8Arrays
        const placeholderArgs = this.args.map((arg) => (arg instanceof SignatureTemplate ? placeholder(65) : arg));
        // Create a placeholder preimage of the correct size
        const placeholderPreimage = this.abiFunction.covenant
            ? placeholder(getPreimageSize(scriptToBytecode(this.redeemScript)))
            : undefined;
        // Create a placeholder input script for size calculation using the placeholder
        // arguments and correctly sized placeholder preimage
        const placeholderScript = createInputScript(this.redeemScript, placeholderArgs, this.selector, placeholderPreimage);
        // Add one extra byte per input to over-estimate tx-in count
        const inputSize = getInputSize(placeholderScript) + 1;
        // Calculate amount to send and base fee (excluding additional fees per UTXO)
        const amount = this.outputs.reduce((acc, output) => acc + output.amount, 0);
        let fee = this.hardcodedFee ?? getTxSizeWithoutInputs(this.outputs) * this.feePerByte;
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
            change -= P2SH_OUTPUT_SIZE;
        }
        // Add a change output if applicable
        if (change >= DUST_LIMIT && change >= this.minChange) {
            this.outputs.push({ to: this.address, amount: change });
        }
    }
}
//# sourceMappingURL=Transaction.js.map