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

    const mint = await createMint(
    connect,
    Key,
    Key.publicKey,
    Key.publicKey,  // freezeAuthority - nécessaire pour freeze/thaw!
    6
    );

    return mint;
}
