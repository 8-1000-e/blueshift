import {Connection, clusterApiUrl, Keypair} from "@solana/web3.js"
import {createMint} from "@solana/spl-token";
import { readFileSync } from "fs";

export function getKeypair()
{
    const secret = JSON.parse(readFileSync("/Users/emile/.config/solana/id.json", "utf-8"));
    return Keypair.fromSecretKey(new Uint8Array(secret));
}


export function getDevnetConnection()
{
    return new Connection(clusterApiUrl("devnet"), "confirmed");
}

export async function getMint(Key: Keypair)
{
    const connect = getDevnetConnection();

    // const airdropsignature = await connect.requestAirdrop(Key.publicKey, 1000000000);
    // await connect.confirmTransaction(airdropsignature);

    const mint = await createMint(
    connect,
    Key,
    Key.publicKey,
    null,
    6
    );

    // console.log(`mint adress: `+mint.toBase58());
    // console.log("check on: https://explorer.solana.com/address/"+mint.toBase58()+"?cluster=devnet");
    return mint;
}
