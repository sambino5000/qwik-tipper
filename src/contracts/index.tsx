// import { useWatch$, useStore } from '@builder.io/qwik';
import { ChronikClient } from 'chronik-client'
import { ChronikNetworkProvider, NetworkProvider, Argument, Contract, Artifact } from '../../cashS/dist/module'
import { createWallet, addrToScriptHash } from '../services'
// import { Artifact, Network } from '../../mod/cashtest/dist/module';

import { compileString } from 'cashc';
import type { ContractTypes } from '../interfaces'
export const log = console.log


export const codeEscrow: string = (
    `pragma cashscript 0.6.5;
contract Escrow(bytes20 serviceProvider, bytes20 signer, bytes20 receiver) {
  function spend(pubkey pk, sig s) {
      require(hash160(pk) == signer);
      require(checkSig(s, pk));
      // Check that the correct amount is sent
      int minerFee = 1000; // hardcoded fee
      int serviceFee = 4000;
      bytes8 amount = bytes8(int(bytes(tx.value)) - (minerFee + serviceFee));
      //bytes8 amount2 = bytes8(serviceFee);
      bytes34 serviceProviderOutput = new OutputP2PKH(amount, serviceProvider);
      //bytes34 signerOutput = new OutputP2PKH(amount, signer);
      bytes34 receiverOutput = new OutputP2PKH(amount, receiver);
      require(tx.hashOutputs == hash256(serviceProviderOutput) || tx.hashOutputs == hash256(receiverOutput));
    
  }
}
`);

export const codep2pkh: string = (
    `pragma cashscript ^0.6.5;

contract P2PKH(bytes20 pkh) {
    // Require pk to match stored pkh and signature to match
    function spend(pubkey pk, sig s) {
        require(hash160(pk) == pkh);
        require(checkSig(s, pk));
    }
}`
);
export const p2pkhArtifact = (() => {
    const artifact: Artifact = compileString(codep2pkh)
    return artifact
});


export const escrowArtifact = (() => {
    const artifact: Artifact = compileString(codeEscrow)
    return artifact//store.artifact
});



export const getEscowContract = async (): Promise<ContractTypes> => {
    const chronik = new ChronikClient("https://chronik.be.cash/xec")
    const artifact = escrowArtifact();

    const signer = await createWallet();
    const receipient = await createWallet();

    const servProv = "901761961cdcb1642ada8e3dff0451957ef081dc";
    const args: Argument[] = [servProv, signer.pubkeyhashHex, receipient.pubkeyhashHex];
    const provider: NetworkProvider = new ChronikNetworkProvider(
        "mainnet",
        chronik
    );
    // const provider: NetworkProvider = new ChronikNetworkProvider("mainnet",chronik)

    const newContract = new Contract(artifact, args, provider);
    // console.log("getContract ", newContract.address)
    const res: ContractTypes = {
        contract: newContract,
        signer: signer,
        receiver: receipient,
    };

    return res;
};

export const getP2phkContract = async (): Promise<ContractTypes> => {
    const chronik = new ChronikClient("https://chronik.be.cash/xec");
    const provider: NetworkProvider = new ChronikNetworkProvider(
        "mainnet",
        chronik
    );


    const artifact = p2pkhArtifact();
    const signer = await createWallet();
    // const receipient = await createWallet()

    const args: Argument[] = [signer.pubkeyhashHex];



    const newContract = new Contract(artifact, args, provider);
    // console.log("getContract ", newContract.address)
    const contractScriptHash: string = await addrToScriptHash(newContract.address)
    const res: ContractTypes = { contract: newContract, signer: signer, /*receiver: receipient,*/ contractScriptHash: contractScriptHash };

    return res;
};


export const getNewContract = async (pkh: string): Promise<Contract> => {
    const chronik = new ChronikClient("https://chronik.be.cash/xec");
    const provider: NetworkProvider = new ChronikNetworkProvider(
        "mainnet",
        chronik
    );

    const artifact = p2pkhArtifact();

    const args: Argument[] = [pkh];

    const newContract = new Contract(artifact, args, provider);
    // console.log("getContract ", newContract.address)
    const res: Contract = newContract;

    return res;
}




