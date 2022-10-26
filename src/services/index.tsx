
import { $ } from '@builder.io/qwik';
import {
    Contract,
    ChronikNetworkProvider,
    SignatureTemplate,
} from "@samrock5000/cashscript";
// import { randomBytes } from "crypto";
import { ChronikClient } from "chronik-client";
import { Keys, ContractArg } from '../interfaces'
import {
    binToHex,
    hexToBin,
    generatePrivateKey,
    instantiateSecp256k1,
    instantiateRipemd160,
    instantiateSha256,
    Base58AddressFormatVersion,
    encodeCashAddress,
    CashAddressType,
    cashAddressToLockingBytecode,
    lockingBytecodeToAddressContents,
    encodePrivateKeyWif
} from "@bitauth/libauth";

export const log = console.log;

export const chronik = new ChronikClient("https://chronik.be.cash/xec")
export const chronikNet = new ChronikNetworkProvider("mainnet", chronik)

export const addrToScriptHash = async (address: string) => {
    const addr: any = cashAddressToLockingBytecode(address);
    const addressBytecode: any = addr.bytecode;
    const addrContent = lockingBytecodeToAddressContents(addressBytecode);
    return binToHex(addrContent.payload)
}

export const hash160ToCash = (hex: string|undefined, network: number = 0x00) => {
    let type: string = Base58AddressFormatVersion[network] || "p2pkh";
    let prefix = "ecash";
    if (type.endsWith("Testnet")) prefix = "ectest";
    let cashType: CashAddressType = 0;
    const hexStr:string = hex!
    return encodeCashAddress(prefix, cashType, hexToBin(hexStr));
};

export const chronikBroadcastTx = $((rawTx: string) => {
    return chronik.broadcastTx(rawTx)
})


export const sendRawTx = async (rawTx: string): Promise<string> => {
    try {
        const txResults: string = await chronikNet.sendRawTransaction(rawTx)
        log("txResults ", txResults)
        return txResults

    } catch (error) {

        log("sendRawTx failed")
        console.error(error);
        return "error in sendRawTx";
    }
}

export const createWallet = async (): Promise<ContractArg> => {

    const secp256k1 = await instantiateSecp256k1();
    const ripemd160 = await instantiateRipemd160();
    const sha256 = await instantiateSha256();

    const secureRandom = generatePrivateKey( () =>
  window.crypto.getRandomValues(new Uint8Array(32))
);
    // const secureRandom = generatePrivateKey(() => randomBytes(32));
    const privateKey = sha256.hash(secureRandom)

    const privKeyHex: string = binToHex(privateKey);
    const pubKey: Uint8Array = secp256k1.derivePublicKeyCompressed(
        privateKey
    );

    const pubKeyHash: Uint8Array = ripemd160.hash(sha256.hash(pubKey));
    const pubKeyHashHex: string = binToHex(pubKeyHash);
    const wif = encodePrivateKeyWif(sha256, privateKey, 'mainnet')
    const res: ContractArg = {
        pubkey: binToHex(pubKey),
        pubkeyhashHex: pubKeyHashHex,
        privkey: binToHex(privateKey),
        privkeyHex: privKeyHex,
        wif: wif,
    };

    return res;
};

export const checkBalance = async (addr: string,) => {

    if (addr === undefined) {
        log("address is undefined", addr)
        return 0
    }


    let txValue: number | BigInt;
    let res;

    const address = addr
    log("checkBalance addr", address)
    const utxos = chronikNet.getUtxos(address)
    res = await utxos
    if (res[0].txid == null) {
        log("no utxos available", res[0])
        return res[0].satoshis
    }
    const satoshis = await utxos.then((sats => sats.reduce((acc, utxo) => acc + utxo.satoshis, 0)))
    log("checkBalance Sats ", satoshis)
    txValue = satoshis
    res = txValue === undefined ? 0 : txValue

    return res
}

export const createTransactionHex = async (
    contract: Contract,
    txInfo: Keys,
    // amount?: number | BigInt
): Promise<string> => {

    const secp256k1 = await instantiateSecp256k1();
    const privKeyAssert:string = txInfo.signerPrivateKey!
    const privKey = hexToBin(privKeyAssert);

    log("valid privateKey: ", secp256k1.validatePrivateKey(privKey));
    // const pubKey = hexToBin(txInfo.signerPublicKey)
    const pubKey = txInfo.signerPublicKey
    const receiverToString:string = txInfo.receiverPublicKeyHash!
    const receipient = hash160ToCash(receiverToString);
    const serviceProviderAddr = "ecash:qr4jd3qejeym00u6u4lrzk3p6p3fmc545yjgvknzxr"
    const utxos = contract.getUtxos()
    const satoshis = await utxos.then((sats => sats.reduce((acc, utxo) => acc + utxo.satoshis, 0)))
    const utxoLen = (await utxos).length
    const serviceFee = 2000
    const fee = 211 + (utxoLen * 200)
    const amount = satoshis - (fee + serviceFee)

    // log("amount ",amt)
    log("txinfo", txInfo)
    // log("Contract Addr", contract.address)
    // log("receipient", receipient)

    try {
        const tx = await contract.functions
            .spend(pubKey, new SignatureTemplate(privKey))
            .to(receipient, amount)
            .to(serviceProviderAddr, serviceFee)
            .build()
        // .send();
        // console.log("TX ", tx)
        // const txRes = await chronikNet.sendRawTransaction(tx)
        // log(txRes)
        return tx
    } catch (error) {
        console.error(error);
        return "createTransactionHex error"
    }
}
