import {Connection, clusterApiUrl, Keypair} from "@solana/web3.js"
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
