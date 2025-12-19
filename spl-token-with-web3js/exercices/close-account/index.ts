import { getKeypair, getDevnetConnection, getMint } from "./connection";
import { closeAccount, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { Keypair } from "@solana/web3.js";

async function main()
{
    const myKey = getKeypair();
    const mint = await getMint(myKey);

    const ATA = await getOrCreateAssociatedTokenAccount(getDevnetConnection(), myKey, mint, myKey.publicKey);

    const tx = await closeAccount(
        getDevnetConnection(),
        myKey,
        ATA.address,
        myKey.publicKey,
        myKey.publicKey
    );

    console.log(`Successfully Closed! Transaction Here: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
}

main();
