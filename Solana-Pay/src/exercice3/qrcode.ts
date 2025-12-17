// Exercice 3 : Générer un QR Code
// Objectif : Transformer ton URL en QR code scannable

import { encodeURL } from "@solana/pay";
import  { Keypair } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { createQR } from "@solana/pay";

function getPair()
{
    return Keypair.generate();
}

function generateQR(url: URL, taille: number, color: string)
{
    const QR = createQR(url, taille, color);
    console.log(QR);
}

function generateURL()
{
    const URL = encodeURL({
        recipient: getPair().publicKey,
        amount: new BigNumber(100),
        label: "solana",
        message: "test"
        });

    generateQR(URL, 500, "white");
    console.log(URL);
}

generateURL()
