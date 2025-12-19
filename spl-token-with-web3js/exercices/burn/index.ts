import { getKeypair, getDevnetConnection, getMint } from "./connection";
import { burn, mintTo, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

async function main()
{
    const myKey = getKeypair();
    const mint = await getMint(myKey);
    const myATA = await getOrCreateAssociatedTokenAccount(getDevnetConnection(), myKey, mint, myKey.publicKey);

    await mintTo(getDevnetConnection(), myKey, mint, myATA.address, myKey.publicKey, 2e6);
    const tx = await burn(
        getDevnetConnection(),
        myKey,
        myATA.address,
        mint,
        myKey.publicKey,
        1e6
    );

    console.log(`Succesfully Burned!. Transaction Here: https://explorer.solana.com/tx/${tx}?cluster=devnet`)
}

main();
