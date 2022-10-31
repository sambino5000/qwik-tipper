import  { Contract } from '../../cashS/dist/module'


export interface ContractTypes {
    contract: Contract;
    signer: ContractArg;
    receiver?: ContractArg;
    contractScriptHash?:string
}

export interface ContractArg {
    pubkey: string;
    pubkeyhashHex: string;
    privkey: string;
    privkeyHex: string;
    wif?:string
}

export interface Keys {
    addr: string;
    addrScriptHash?:string;
    signerPrivateKey: string;
    signerPublicKeyHash: string;
    signerPublicKey: string;
    receiverPrivateKey?: string|undefined;
    receiverPublicKey?: string;
    receiverPublicKeyHash?: string|undefined;
    receiverWif?:string|undefined;
}

export interface SpendProps {
    apicalls: number, spent: boolean, satoshis: number, rawHex: string, canSpend: boolean
}