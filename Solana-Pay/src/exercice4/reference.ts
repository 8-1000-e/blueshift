// Exercice 4 : Utiliser une Reference
// Objectif : Tracker les paiements avec une reference unique

import { encodeURL } from "@solana/pay";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { findReference } from "@solana/pay";
import QRCode from "qrcode";

function getPair()
{
    return Keypair.generate();
}

async function generateQR(url: string)
{
    await QRCode.toFile("output/qrcode-exo4.png", url);
    console.log("QR code sauvegardé dans output/qrcode-exo4.png");
}

async function checkPayement(connection: Connection, reference: PublicKey)
{
    try
    {
        const result = await findReference(connection, reference)
        return true;
    }
    catch (e)
    {
        console.log(e.message);
    }
    return false;
}

function generateURL(price: number)
{
    const recipient = getPair().publicKey;    // adresse qui reçoit le paiement
    const reference = getPair().publicKey;    // clé unique pour tracker

    const URL = encodeURL({
        recipient: recipient,
        amount: new BigNumber(price),
        reference: reference,
        label: "solana",
        message: "test"
        });

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    generateQR(URL.href);
    console.log(URL.href);

    let time = 0;
    setInterval(async () =>
    {
        console.log(`checkin... ${time}`);
        const paid = await checkPayement(connection, reference);
        if (paid)
        {
            console.log(`Payed after ${time} secondes`);
            process.exit(0);
        }
        time++;
    }, 1000);
}

generateURL(0.001);
