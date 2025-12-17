// Exercice 1 : Générer une Keypair
// Objectif : Créer ta première adresse Solana

import  { Keypair } from "@solana/web3.js";

function generatePair() 
{
    const keypair = Keypair.generate();
    console.log("Clé publique :", keypair.publicKey.toBase58());
    console.log("Clé privée :", keypair.secretKey);
}

generatePair();