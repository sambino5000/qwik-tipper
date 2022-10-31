import {
    component$,
    useStore,
    useStylesScoped$,
    Resource,
    useResource$,

} from "@builder.io/qwik";
import {
    hexToBin,
    instantiateSecp256k1,
    Base58AddressFormatVersion,
    encodeCashAddress,
    CashAddressType,

} from "@bitauth/libauth";
import { DocumentHead, useLocation } from '@builder.io/qwik-city';
// import { Keys } from '../../../interfaces'
import { Contract, SignatureTemplate } from '../../../../cashS/dist/module' 
import { getNewContract } from '../../../contracts'
import { createWallet } from '../../../services'
import { Spend } from '../../../components/spend'
import scoped from './confetti.css?inline';
export const log = console.log;

export const hash160ToCash = (hex: string, network: number = 0x00) => {
    let type: string = Base58AddressFormatVersion[network] || "p2pkh";
    let prefix = "ecash";
    if (type.endsWith("Testnet")) prefix = "ectest";
    let cashType: CashAddressType = 0;
    return encodeCashAddress(prefix, cashType, hexToBin(hex));
};

export interface TxParams {
    pubkeyHash: string;
    signature: string;
    recipient: string
}



export default component$(() => {
    const pubkeyhash = useLocation()
    const paramsArr = pubkeyhash.params.args.split(',')
    useStylesScoped$(scoped)
    // store.pubkeyHash = paramsArr[0]
    // store.signature = paramsArr[1]
    const store = useStore<TxParams>({ pubkeyHash: paramsArr[0], signature: paramsArr[1], recipient: '' });
 
 
    
    const txHexResource = useResource$(async () => {

       
        const newContract = await getNewContract(store.pubkeyHash)

        const createTransactionHex = async (
            contract: Contract,
            store: TxParams,
            // amount?: number | BigInt
        ): Promise<string> => {
            const reciverWallet = await createWallet()
            const secp256k1 = await instantiateSecp256k1();
            const privKey = hexToBin(store.signature);

            log("valid privateKey: ", secp256k1.validatePrivateKey(privKey));
            const pubKey = secp256k1.derivePublicKeyCompressed(
                privKey
            );
            const receipient = hash160ToCash(reciverWallet.pubkeyhashHex);
            const serviceProviderAddr = "ecash:qr4jd3qejeym00u6u4lrzk3p6p3fmc545yjgvknzxr"
            const utxos = contract.getUtxos()
            const satoshis = await utxos.then((sats => sats.reduce((acc, utxo) => acc + utxo.satoshis, 0)))
            const utxoLen = (await utxos).length
            const serviceFee = 2000
            const fee = 211 + (utxoLen * 200)
            const amount = satoshis - (fee + serviceFee)

            // log("amount ",amt)
            log("txinfo", store)
            log("recipient", reciverWallet)
            // log("Contract Addr", contract.address)
            // log("receipient", receipient)
            const wif: string = reciverWallet.wif!
            store.recipient = wif
            try {
                const tx = await contract.functions
                    .spend(pubKey, new SignatureTemplate(privKey))
                    .to(receipient, amount)
                    .to(serviceProviderAddr, serviceFee)
                    .build()
                // .send();
                console.log("TX ", tx)

                return tx
            } catch (error) {
                console.error(error);
                return "createTransactionHex error"
            }
        }
        // (async()=>{
        // log('newContract', await newContract.address)
        return createTransactionHex(newContract, store)//,500) 
        // })()

    })
    return (<>
      {confetti}
        {<Resource
            value={txHexResource}
            onPending={() => <>Loading...</>}
            onRejected={(error) => <>Error: {error.message}</>}
            onResolved={(txHex) => {
                return (
                    <div>
                        <span style="width:100px; word-wrap:break-word; display:inline;">
                            <p> thank 🫵🏼</p>
                        </span>
                        <p>TransactionID </p>
                        <Spend rawTx={txHex} />
                        <h6>New Wallet Keys <br></br> <i>wallet import format</i> :</h6>
                        <p>{store.recipient}</p>
                    </div>

                )
            }} />}

    </>)
})

export const head: DocumentHead = {
    title: 'xec tip created',
};

export let confetti =   <div id="confettis">
<div class="confetti"></div>
<div class="confetti"></div>
<div class="confetti"></div>
<div class="confetti"></div>
<div class="confetti"></div>
<div class="confetti"></div>
<div class="confetti"></div>
<div class="confetti"></div>
<div class="confetti"></div>
</div>
