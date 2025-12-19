import { getKeypair, getDevnetConnection, getMint } from "./connection";
import { approve, revoke, mintTo, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { Keypair } from "@solana/web3.js";

async function main()
{
    const myKey = getKeypair();
    const mint = await getMint(myKey);
    const myATA = await getOrCreateAssociatedTokenAccount(getDevnetConnection(), myKey, mint, myKey.publicKey);

    await mintTo(getDevnetConnection(), myKey, mint, myATA.address, myKey.publicKey, 2e6);

    const delegate = Keypair.generate();
    let tx = await approve(
        getDevnetConnection(),
        myKey,
        myATA.address,
        delegate.publicKey,
        myKey.publicKey,
        1e6
    );
    console.log("Delegate: " + delegate.publicKey.toBase58());
    console.log(`Successfully Approved! Transaction Here: https://explorer.solana.com/tx/${tx}?cluster=devnet\n\n`);

    tx = await revoke(
        getDevnetConnection(),
        myKey,
        myATA.address,
        myKey.publicKey
    );
    console.log(`Successfully revoked! Transaction Here: https://explorer.solana.com/tx/${tx}?cluster=devnet\n\n`);

}

main();