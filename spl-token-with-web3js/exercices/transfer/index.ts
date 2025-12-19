import { getKeypair, getDevnetConnection, getMint } from "./connection";
import { transfer, mintTo, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { Keypair } from "@solana/web3.js"

async function main()
{
    const key = getKeypair();
    const mint = await getMint(key);
    const ATA = await getOrCreateAssociatedTokenAccount(getDevnetConnection(), key, mint, key.publicKey);

    await mintTo(
        getDevnetConnection(),
        key,
        mint,
        ATA.address,
        key.publicKey,
        2e6
    );

    const receiver = Keypair.generate();
    const receiverATA = await getOrCreateAssociatedTokenAccount(getDevnetConnection(), key, mint, receiver.publicKey);

    const tx = await transfer(
        getDevnetConnection(),
        key,
        ATA.address,
        receiverATA.address,
        key.publicKey,
        1e6
    );

    console.log("Source ATA: " + ATA.address.toBase58());
    console.log("Receiver ATA: " + receiverATA.address.toBase58());
    console.log("check receiver at: https://explorer.solana.com/address/" + receiverATA.address.toBase58() + "?cluster=devnet");
    console.log(`Succesfully Transferred!. Transaction Here: https://explorer.solana.com/tx/${tx}?cluster=devnet`)
}

main();