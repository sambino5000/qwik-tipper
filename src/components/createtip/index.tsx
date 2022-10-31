import {
    component$,
    useStore,
    useClientEffect$,
    Resource,
    useResource$,
    useSignal,
} from "@builder.io/qwik";
// import { Link } from '@builder.io/qwik-city';
import { getP2phkContract } from "../../contracts";
import { generate } from 'lean-qr';
import { toSvg } from 'lean-qr/extras/svg';
import type { Keys, SpendProps } from "../../interfaces";
import { ChronikClient } from "chronik-client";
export const log = console.log;

export const CreateP2PKHContract = component$(() => {
    const showWIF = useStore({ show: false })
    // const txStatus = useStore<SpendProps>({ apicalls: 0, spent: false, satoshis: 0, rawHex: '', canSpend: false })
    const store = useStore<Keys>({
        addr: "",
        addrScriptHash: '',
        signerPrivateKey: "",
        signerPublicKeyHash: "",
        signerPublicKey: "",
        // receiverPrivateKey: "",
        // receiverPublicKey: "",
        // receiverPublicKeyHash: "",
        // receiverWif: ''
    });

    //TODO usecleanup()
    const contractResource = useResource$<Keys>(async ({ cleanup }) => {
        // const controller = new AbortController();
        // cleanup(() => controller.abort());

        const contractResult = await getP2phkContract().then((value) => {
            store.addr = value.contract.address;
            store.addrScriptHash = value.contractScriptHash;
            // store.signerPrivateKey = Buffer.from(value.signer.privkey).toString(
            //     "hex"
            // );
            store.signerPrivateKey = value.signer.privkey
            store.signerPublicKeyHash = value.signer.pubkeyhashHex;
            // store.signerPublicKey = Buffer.from(value.signer.pubkey).toString("hex");
            store.signerPublicKey = value.signer.pubkey
            // store.receiverPrivateKey = value.receiver?.privkeyHex;
            // store.receiverPublicKey = Buffer.from(value.receiver.pubkey).toString("hex");
            // store.receiverPublicKey = value.receiver?.pubkey
            // store.receiverPublicKeyHash = value.receiver?.pubkeyhashHex;
            // store.receiverWif = value.receiver?.wif;

            log("store", store)

            return store

        });

        return contractResult;
    });


    return (
        <>
            <div class="qrcode-container">
            </div>
            <div class="section">
            </div>
            <Resource
                value={contractResource}
                onPending={() => <>Loading...</>}
                onRejected={(error) => <>Error: {error.message}</>}
                onResolved={(store) => {
                    return (
                        <div>
                            <TxStatus keys={store} />
                            <DisplayKeysContent keys={store} />
                        </div>

                    );
                }}
            />

        </>

    );
});

export const TxStatus = component$((props: { keys: Keys }) => {
    const txStatus = useStore<SpendProps>({ apicalls: 0, spent: false, satoshis: 0, rawHex: '', canSpend: false })
    useClientEffect$(async () => {

        const QRcode = generate(props.keys.addr);
        const mySvg = document.getElementById('my-svg');
        // @ts-ignore
        const svg = toSvg(QRcode, mySvg, {
            on: 'black',
            off: 'transparent',
            padX: 4,
            padY: 4,
            width: "200px",
            height: "200px",
            scale: 1,
        });
        const getSats = async () => {
            const chronikClient = new ChronikClient("https://chronik.be.cash/xec")
            const scriptHashAssert: string = props.keys.addrScriptHash!
            const chronikUtxoResult = await chronikClient.script('p2sh', scriptHashAssert).utxos()
            // log(store.signerPublicKeyHash)
            const getUtxos = async (): Promise<any[]> => {
                if (chronikUtxoResult[0] === undefined) {
                    const utxos = [null].map((utxo) => ({
                        txid: null,
                        vout: null,
                        satoshis: parseInt("0"),
                        //
                    }));
                    return utxos;
                }
                const utxos = chronikUtxoResult[0].utxos.map((utxo) => ({
                    txid: utxo.outpoint.txid,
                    vout: utxo.outpoint.outIdx,
                    satoshis: parseInt(utxo.value, 10),
                    //
                }));
                return utxos;
            }

            const utxos = getUtxos()
            log("chronikClient utxos ", await utxos)
            const satoshis = await utxos.then((sats => sats.reduce((acc, utxo) => acc + utxo.satoshis, 0)))
            log("satoshis", satoshis)
            const spendable = satoshis > 10000
            txStatus.canSpend = spendable
            txStatus.satoshis = satoshis
            satoshis > 10000 && (txStatus.canSpend = true, clearInterval(interval))
            return satoshis
        }

        const interval = setInterval(async () => (log("contract address balance:", txStatus.satoshis = await getSats())), 800);


    });
    return (<>
        <div>

            <h1>Send Tip</h1>
            <div class="qrcode" id="qrcode" >
                <svg //datatype={props.keys.addr}
                    id="my-svg"
                ></svg>
                <p>Satoshis: {txStatus.satoshis}</p>
                <p>{props.keys.addr}</p>
            </div>
            <BroadCastLink txStatus={txStatus} keys={props.keys} />

        </div></>)
})

export const DisplayKeysContent = component$((props: { keys: Keys }) => {
    const showWIF = useStore({ show: false })

    return (<>
        <div  >

            <button class="mind" onClick$={() => showWIF.show = !showWIF.show} >show address keys</button>

            <ul style={{ display: showWIF.show ? "show" : "none" }} >

                <li>addrScriptHash: {props.keys.addrScriptHash}</li>
                <li>signerPrivateKey: {props.keys.signerPrivateKey}</li>
                <li>signerPublicKeyHash: {props.keys.signerPublicKeyHash}</li>
                <li>signerPublicKey: {props.keys.signerPublicKey}</li>
            </ul>
        </div>
    </>)
})

export const BroadCastLink = component$((props: { txStatus: SpendProps, keys: Keys }) => {

    return (<>
        {/* LINK TOOL BREAKS APP <Link class="mindblow" href={`/test/${store.signerPublicKeyHash},${store.signerPrivateKey}`}> */}
        <div style={{ display: (props.txStatus.canSpend) ? "block" : "none" }} >
            <a class='mindblow' href={`/test/${props.keys.signerPublicKeyHash},${props.keys.signerPrivateKey}`}>
                Create Tip 🤯
            </a>
        </div>
    </>)
})

