"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeArgument = void 0;
const libauth_1 = require("@bitauth/libauth");
const utils_1 = require("@cashscript/utils");
const Errors_js_1 = require("./Errors.js");
const SignatureTemplate_js_1 = __importDefault(require("./SignatureTemplate.js"));
function encodeArgument(argument, typeStr) {
    let type = (0, utils_1.parseType)(typeStr);
    if (type === utils_1.PrimitiveType.BOOL) {
        if (typeof argument !== 'boolean') {
            throw new Errors_js_1.TypeError(typeof argument, type);
        }
        return (0, utils_1.encodeBool)(argument);
    }
    if (type === utils_1.PrimitiveType.INT) {
        if (typeof argument !== 'number' && typeof argument !== 'bigint') {
            throw new Errors_js_1.TypeError(typeof argument, type);
        }
        const arg = argument;
        return (0, utils_1.encodeInt)(arg);
    }
    if (type === utils_1.PrimitiveType.STRING) {
        if (typeof argument !== 'string') {
            throw new Errors_js_1.TypeError(typeof argument, type);
        }
        return (0, utils_1.encodeString)(argument);
    }
    if (type === utils_1.PrimitiveType.SIG && argument instanceof SignatureTemplate_js_1.default)
        return argument;
    // Convert hex string to Uint8Array
    if (typeof argument === 'string') {
        if (argument.startsWith('0x')) {
            argument = argument.slice(2);
        }
        argument = (0, libauth_1.hexToBin)(argument);
    }
    if (!(argument instanceof Uint8Array)) {
        throw Error(`Value for type ${type} should be a Uint8Array or hex string`);
    }
    // Redefine SIG as a bytes65 so it is included in the size checks below
    // Note that ONLY Schnorr signatures are accepted
    if (type === utils_1.PrimitiveType.SIG && argument.byteLength !== 0) {
        type = new utils_1.BytesType(65);
    }
    // Redefine SIG as a bytes64 so it is included in the size checks below
    // Note that ONLY Schnorr signatures are accepted
    if (type === utils_1.PrimitiveType.DATASIG && argument.byteLength !== 0) {
        type = new utils_1.BytesType(64);
    }
    // Bounded bytes types require a correctly sized argument
    if (type instanceof utils_1.BytesType && type.bound && argument.byteLength !== type.bound) {
        throw new Errors_js_1.TypeError(`bytes${argument.byteLength}`, type);
    }
    return argument;
}
exports.encodeArgument = encodeArgument;
//# sourceMappingURL=Argument.js.map