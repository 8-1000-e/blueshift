import {Connection, Keypair} from "@solana/web3.js"
import { readFileSync } from "fs";

export function getKeypair()
{
    const secret = JSON.parse(readFileSync("/Users/emile/.config/solana/id.json", "utf-8"));
    return Keypair.fromSecretKey(new Uint8Array(secret));
}

export function getDevnetConnection()
{
    // Helius RPC pour supporter getProgramAccounts avec les index secondaires
    return new Connection("https://devnet.helius-rpc.com/?api-key=0f803376-0189-4d72-95f6-a5f41cef157d", "confirmed");
}
