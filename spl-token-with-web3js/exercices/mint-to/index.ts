import { getKeypair, getDevnetConnection, getMint } from "./connection";
import { mintTo, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

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
        1000000
    );

    console.log("ATA: " + ATA.address.toBase58());
    console.log("check at: https://explorer.solana.com/address/" + ATA.address.toBase58() + "?cluster=devnet");
}

main();