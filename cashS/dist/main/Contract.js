"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contract = void 0;
const libauth_1 = require("@bitauth/libauth");
const utils_1 = require("@cashscript/utils");
const chronik_client_1 = require("chronik-client");
const Transaction_js_1 = require("./Transaction.js");
const Argument_js_1 = require("./Argument.js");
const utils_js_1 = require("./utils.js");
const SignatureTemplate_js_1 = __importDefault(require("./SignatureTemplate.js"));
const index_js_1 = require("./network/index.js");
const chronik = new chronik_client_1.ChronikClient("https://chronik.be.cash/xec");
class Contract {
    artifact;
    provider;
    name;
    address;
    bytesize;
    opcount;
    functions;
    redeemScript;
    constructor(artifact, constructorArgs, provider = new index_js_1.ChronikNetworkProvider("mainnet", chronik)) {
        this.artifact = artifact;
        this.provider = provider;
        const expectedProperties = ['abi', 'bytecode', 'constructorInputs', 'contractName'];
        if (!expectedProperties.every((property) => property in artifact)) {
            throw new Error('Invalid or incomplete artifact provided');
        }
        if (artifact.constructorInputs.length !== constructorArgs.length) {
            throw new Error(`Incorrect number of arguments passed to ${artifact.contractName} constructor`);
        }
        // Encode arguments (this also performs type checking)
        const encodedArgs = constructorArgs
            .map((arg, i) => (0, Argument_js_1.encodeArgument)(arg, artifact.constructorInputs[i].type))
            .reverse();
        // Check there's no signature templates in the constructor
        if (encodedArgs.some((arg) => arg instanceof SignatureTemplate_js_1.default)) {
            throw new Error('Cannot use signatures in constructor');
        }
        this.redeemScript = (0, utils_1.generateRedeemScript)((0, utils_1.asmToScript)(this.artifact.bytecode), encodedArgs);
        // Populate the functions object with the contract's functions
        // (with a special case for single function, which has no "function selector")
        this.functions = {};
        if (artifact.abi.length === 1) {
            const f = artifact.abi[0];
            this.functions[f.name] = this.createFunction(f);
        }
        else {
            artifact.abi.forEach((f, i) => {
                this.functions[f.name] = this.createFunction(f, i);
            });
        }
        this.name = artifact.contractName;
        this.address = (0, utils_js_1.scriptToAddress)(this.redeemScript, this.provider.network);
        this.bytesize = (0, utils_1.calculateBytesize)(this.redeemScript);
        this.opcount = (0, utils_1.countOpcodes)(this.redeemScript);
    }
    async getBalance() {
        const utxos = await this.getUtxos();
        return utxos.reduce((acc, utxo) => acc + utxo.satoshis, 0);
    }
    async getUtxos() {
        return this.provider.getUtxos(this.address);
    }
    getRedeemScriptHex() {
        return (0, libauth_1.binToHex)((0, utils_1.scriptToBytecode)(this.redeemScript));
    }
    createFunction(abiFunction, selector) {
        return (...args) => {
            if (abiFunction.inputs.length !== args.length) {
                throw new Error(`Incorrect number of arguments passed to function ${abiFunction.name}`);
            }
            // Encode passed args (this also performs type checking)
            const encodedArgs = args
                .map((arg, i) => (0, Argument_js_1.encodeArgument)(arg, abiFunction.inputs[i].type));
            return new Transaction_js_1.Transaction(this.address, this.provider, this.redeemScript, abiFunction, encodedArgs, selector);
        };
    }
}
exports.Contract = Contract;
//# sourceMappingURL=Contract.js.map