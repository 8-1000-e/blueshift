import {Connection, clusterApiUrl, Keypair} from "@solana/web3.js"

export function getKeypair()
{
    return Keypair.generate();
}

export function getDevnetConnection()
{
    return new Connection(clusterApiUrl("devnet"), "confirmed");
}