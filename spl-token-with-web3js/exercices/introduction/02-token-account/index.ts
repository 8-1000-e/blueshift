import { getDevnetConnection, getKeypair, getMint } from "./connection";
import {createAccount} from "@solana/spl-token";

async function main()
{

    const connect = getDevnetConnection();
    const key = getKeypair();
    // const airdropsignature = await connect.requestAirdrop(key.publicKey, 1000000000);
    // await connect.confirmTransaction(airdropsignature);

    const mint = await getMint(key);
    const account = await createAccount(
        connect,
        key,
        mint,
        key.publicKey
    );

    console.log("account adress: "+account.toBase58());
    console.log("check at: https://explorer.solana.com/address/"+account.toBase58()+"?cluster=devnet");
}

main();