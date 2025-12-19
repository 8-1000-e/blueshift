import { getDevnetConnection, getKeypair } from "./connection";
import {createMint} from "@solana/spl-token";

async function main()
{
    const connect = getDevnetConnection();
    const Key = getKeypair();

    const airdropsignature = await connect.requestAirdrop(Key.publicKey, 1000000000);
    await connect.confirmTransaction(airdropsignature);

    const mint = await createMint(
    connect,
    Key,
    Key.publicKey,
    null,
    6
    );

    console.log(`mint adress: `+mint.toBase58());
    console.log("check on: https://explorer.solana.com/address/"+mint.toBase58()+"?cluster=devnet");
}

main();