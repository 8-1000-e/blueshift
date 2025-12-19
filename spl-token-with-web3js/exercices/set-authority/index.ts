import { getKeypair, getDevnetConnection, getMint } from "./connection";
import { setAuthority, AuthorityType, mintTo, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { Keypair } from "@solana/web3.js";

async function main()
{
    const myKey = getKeypair();
    const mint = await getMint(myKey);
    const myATA = await getOrCreateAssociatedTokenAccount(getDevnetConnection(), myKey, mint, myKey.publicKey);

    await mintTo(getDevnetConnection(), myKey, mint, myATA.address, myKey.publicKey, 2e6);
    console.log("Minted 2 tokens to: " + myATA.address.toBase58());

    const newAuthority = Keypair.generate();

    let tx = await setAuthority(
        getDevnetConnection(),
        myKey,
        mint,
        myKey,
        AuthorityType.MintTokens,
        newAuthority.publicKey
    );

    console.log("Authority changed! Tx: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");
    console.log("New authority: " + newAuthority.publicKey.toBase58());

    try {
        await mintTo(getDevnetConnection(), myKey, mint, myATA.address, myKey.publicKey, 1e6);
        console.log("Mint réussi (ne devrait pas arriver!)");
    } catch (e) {
        console.log("Mint échoué comme prévu: " + e.message);
    }

}

main();