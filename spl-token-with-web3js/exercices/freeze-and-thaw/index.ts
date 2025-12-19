import { getKeypair, getDevnetConnection, getMint } from "./connection";
import { freezeAccount, thawAccount, mintTo, transfer, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { Keypair } from "@solana/web3.js";

async function main()
{
    const myKey = getKeypair();
    const mint = await getMint(myKey);
    const myATA = await getOrCreateAssociatedTokenAccount(getDevnetConnection(), myKey, mint, myKey.publicKey);

    await mintTo(getDevnetConnection(), myKey, mint, myATA.address, myKey.publicKey, 2e6);

    const receiver = Keypair.generate();
    const receiverATA = await getOrCreateAssociatedTokenAccount(getDevnetConnection(), myKey, mint, receiver.publicKey);

    let tx = await freezeAccount(
        getDevnetConnection(),
        myKey,
        myATA.address,
        mint,
        myKey.publicKey
    );

    console.log("Successful freeze: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");
    console.log("Try to transfer: \n");
    try
    {
        await transfer(getDevnetConnection(), myKey, myATA.address, receiverATA.address, myKey.publicKey, 1e6)
    }
    catch (e)
    {
        console.log(e.message)
    }

    tx = await thawAccount(
        getDevnetConnection(),
        myKey,
        myATA.address,
        mint,
        myKey.publicKey
    );

    console.log("\nSuccessful thaw: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");

    tx = await transfer(getDevnetConnection(), myKey, myATA.address, receiverATA.address, myKey.publicKey, 1e6);
    console.log("Transfer after thaw: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");
}

main();
