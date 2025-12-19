import { getKeypair, getDevnetConnection, getMint } from "./connection";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

async function main()
{
    const key = getKeypair();

    const ATA = await getOrCreateAssociatedTokenAccount(
        getDevnetConnection(),
        key,
        await getMint(key),
        key.publicKey
    );

    console.log("adress Associated Token Account: "+ATA.address);
    console.log("check at: https://explorer.solana.com/address/" + ATA.address.toBase58() + "?cluster=devnet");

}

main();