import { getKeypair, getDevnetConnection } from "./connection.js";
import { Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import {
    TOKEN_2022_PROGRAM_ID,
    ExtensionType,
    getMintLen,
    createInitializeMintInstruction,
    createInitializeInterestBearingMintInstruction,
    createAssociatedTokenAccountIdempotent,
    mintTo,
    getAccount,
    amountToUiAmount,
    createUpdateRateInterestBearingMintInstruction
} from "@solana/spl-token";


async function main()
{
    const myKey = getKeypair();
    const connection = getDevnetConnection();
    const mintKeypair = Keypair.generate();

    const decimals = 6;
    // Taux d'intérêt en basis points (500 = 5% par an)
    const rate = 500;

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 1: Créer un mint avec InterestBearingConfig
    //////////////////////////////////////////////////////////////////////////////////////////

    const mintLen = getMintLen([ExtensionType.InterestBearingConfig]);
    const rentExempt = await connection.getMinimumBalanceForRentExemption(mintLen);

    const transaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: myKey.publicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: mintLen,
            lamports: rentExempt,
            programId: TOKEN_2022_PROGRAM_ID
        }),
        // Initialiser l'extension InterestBearing
        // rate = 500 = 5% par an (en basis points, 10000 = 100%)
        createInitializeInterestBearingMintInstruction(
            mintKeypair.publicKey,
            myKey.publicKey,  // rateAuthority: qui peut changer le taux
            rate,             // taux initial: 500 = 5%
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(
            mintKeypair.publicKey,
            decimals,
            myKey.publicKey,
            null,
            TOKEN_2022_PROGRAM_ID
        )
    );

    let tx = await sendAndConfirmTransaction(connection, transaction, [myKey, mintKeypair]);
    console.log("Mint InterestBearing créé (taux: " + rate/100 + "% par an)");
    console.log("Mint: " + mintKeypair.publicKey.toBase58());

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 2: Créer un ATA et mint des tokens
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Création ATA et mint ---");

    const myATA = await createAssociatedTokenAccountIdempotent(
        connection,
        myKey,
        mintKeypair.publicKey,
        myKey.publicKey,
        {},
        TOKEN_2022_PROGRAM_ID
    );

    tx = await mintTo(
        connection,
        myKey,
        mintKeypair.publicKey,
        myATA,
        myKey.publicKey,
        1000000,  // 1 token (avec 6 decimals)
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID
    );
    console.log("Minted 1 token sur ATA: " + myATA.toBase58());

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 3: Voir les intérêts avec amountToUiAmount
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Calcul des intérêts ---");

    // Récupérer les infos du compte
    const tokenInfo = await getAccount(connection, myATA, undefined, TOKEN_2022_PROGRAM_ID);
    console.log("Balance brute (amount): " + tokenInfo.amount);

    // amountToUiAmount calcule le montant AVEC les intérêts accumulés
    // C'est purement cosmétique - le vrai amount ne change pas
    const uiAmount = await amountToUiAmount(
        connection,
        myKey,
        mintKeypair.publicKey,
        tokenInfo.amount,
        TOKEN_2022_PROGRAM_ID
    );
    console.log("Balance avec intérêts (uiAmount): " + uiAmount);

    console.log("\nNote: Les intérêts s'accumulent avec le temps.");
    console.log("Si tu relances ce script dans quelques secondes, uiAmount sera plus grand!");
    console.log("Mais 'amount' restera toujours 1000000 - c'est juste l'affichage qui change.");

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 4: Modifier le taux d'intérêt
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Modification du taux: 5% -> 10% ---");

    const newRate = 1000;  // 1000 = 10% par an

    const updateIx = createUpdateRateInterestBearingMintInstruction(
        mintKeypair.publicKey,
        myKey.publicKey,  // rateAuthority
        newRate,
        [],
        TOKEN_2022_PROGRAM_ID
    );

    const updateTx = new Transaction().add(updateIx);
    tx = await sendAndConfirmTransaction(connection, updateTx, [myKey]);
    console.log("Taux modifié à " + newRate/100 + "% par an!");
    console.log("Tx: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");

    // Vérifier le nouveau uiAmount
    const newUiAmount = await amountToUiAmount(
        connection,
        myKey,
        mintKeypair.publicKey,
        tokenInfo.amount,
        TOKEN_2022_PROGRAM_ID
    );
    console.log("\nNouveau uiAmount après changement de taux: " + newUiAmount);
}

main();
