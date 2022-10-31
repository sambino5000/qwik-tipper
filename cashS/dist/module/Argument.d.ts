import SignatureTemplate from './SignatureTemplate.js';
export declare type Argument = number | bigint | boolean | string | Uint8Array | SignatureTemplate;
export declare function encodeArgument(argument: Argument, typeStr: string): Uint8Array | SignatureTemplate;
