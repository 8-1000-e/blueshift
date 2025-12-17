// Exercice 2 : Créer une URL de Transfer Request
// Objectif : Créer un lien de paiement Solana Pay

import { encodeURL } from "@solana/pay";
import  { Keypair } from "@solana/web3.js";
import BigNumber from "bignumber.js";

function getPair() 
{
    return Keypair.generate();
}

function generateURL()
{
    const URL = encodeURL({
        recipient: getPair().publicKey,
        amount: new BigNumber(100),
        label: "solana",
        message: "test"
        });

    console.log(URL.href);
}

generateURL()