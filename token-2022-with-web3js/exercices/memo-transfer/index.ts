import { getKeypair, getDevnetConnection } from "./connection.js";
import { Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import {
    TOKEN_2022_PROGRAM_ID,
    ExtensionType,
    getMintLen,
    getAccountLen,
    createInitializeMintInstruction,
    createInitializeAccountInstruction,
    createEnableRequiredMemoTransfersInstruction,
    createDisableRequiredMemoTransfersInstruction,
    mintTo,
    createTransferCheckedInstruction
} from "@solana/spl-token";
import { createMemoInstruction } from "@solana/spl-memo";


async function main()
{
    const myKey = getKeypair();
    const connection = getDevnetConnection();

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 1: Créer un mint simple
    //////////////////////////////////////////////////////////////////////////////////////////

    const mintKeypair = Keypair.generate();
    const decimals = 6;

    const mintLen = getMintLen([]);
    const mintRent = await connection.getMinimumBalanceForRentExemption(mintLen);

    const mintTx = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: myKey.publicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: mintLen,
            lamports: mintRent,
            programId: TOKEN_2022_PROGRAM_ID
        }),
        createInitializeMintInstruction(
            mintKeypair.publicKey,
            decimals,
            myKey.publicKey,
            null,
            TOKEN_2022_PROGRAM_ID
        )
    );

    let tx = await sendAndConfirmTransaction(connection, mintTx, [myKey, mintKeypair]);
    console.log("Mint créé: " + mintKeypair.publicKey.toBase58());

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 2: Créer un Token Account SOURCE (normal, pour envoyer)
    //////////////////////////////////////////////////////////////////////////////////////////

    const sourceAccountKeypair = Keypair.generate();
    const sourceLen = getAccountLen([]);  // Pas d'extension sur la source
    const sourceRent = await connection.getMinimumBalanceForRentExemption(sourceLen);

    const sourceTx = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: myKey.publicKey,
            newAccountPubkey: sourceAccountKeypair.publicKey,
            space: sourceLen,
            lamports: sourceRent,
            programId: TOKEN_2022_PROGRAM_ID
        }),
        createInitializeAccountInstruction(
            sourceAccountKeypair.publicKey,
            mintKeypair.publicKey,
            myKey.publicKey,
            TOKEN_2022_PROGRAM_ID
        )
    );

    await sendAndConfirmTransaction(connection, sourceTx, [myKey, sourceAccountKeypair]);
    console.log("Source Account créé: " + sourceAccountKeypair.publicKey.toBase58());

    // Mint des tokens sur la source
    tx = await mintTo(
        connection,
        myKey,
        mintKeypair.publicKey,
        sourceAccountKeypair.publicKey,
        myKey.publicKey,
        1e6,
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID
    );
    console.log("Minted 1 token sur source");

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 3: Créer un Token Account DESTINATION avec MemoTransfer
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Création du compte destination avec MemoTransfer ---");

    const destAccountKeypair = Keypair.generate();
    const destLen = getAccountLen([ExtensionType.MemoTransfer]);
    const destRent = await connection.getMinimumBalanceForRentExemption(destLen);

    const destTx = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: myKey.publicKey,
            newAccountPubkey: destAccountKeypair.publicKey,
            space: destLen,
            lamports: destRent,
            programId: TOKEN_2022_PROGRAM_ID
        }),
        // Initialiser le compte AVANT d'activer l'extension MemoTransfer
        createInitializeAccountInstruction(
            destAccountKeypair.publicKey,
            mintKeypair.publicKey,
            myKey.publicKey,
            TOKEN_2022_PROGRAM_ID
        ),
        // Activer l'exigence de mémo sur les transferts entrants
        createEnableRequiredMemoTransfersInstruction(
            destAccountKeypair.publicKey,
            myKey.publicKey,  // owner du compte
            [],
            TOKEN_2022_PROGRAM_ID
        )
    );

    tx = await sendAndConfirmTransaction(connection, destTx, [myKey, destAccountKeypair]);
    console.log("Destination Account créé avec MemoTransfer: " + destAccountKeypair.publicKey.toBase58());

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 4: Tenter un transfert SANS mémo - DOIT ÉCHOUER
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Test: transfert sans mémo ---");

    try {
        const transferIx = createTransferCheckedInstruction(
            sourceAccountKeypair.publicKey,
            mintKeypair.publicKey,
            destAccountKeypair.publicKey,
            myKey.publicKey,
            100000n,  // 0.1 token
            decimals,
            [],
            TOKEN_2022_PROGRAM_ID
        );

        const transferTx = new Transaction().add(transferIx);
        await sendAndConfirmTransaction(connection, transferTx, [myKey]);
        console.log("Transfert réussi (ne devrait pas arriver!)");
    } catch (e: any) {
        console.log("Transfert sans mémo échoué comme prévu!");
        console.log("Erreur: " + e.message.slice(0, 60) + "...");
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 5: Transfert AVEC mémo - DOIT RÉUSSIR
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Test: transfert avec mémo ---");

    // Créer l'instruction mémo (doit être AVANT le transfert dans la transaction!)
    const memoIx = createMemoInstruction("Paiement pour services - Facture #12345", [myKey.publicKey]);

    const transferWithMemoIx = createTransferCheckedInstruction(
        sourceAccountKeypair.publicKey,
        mintKeypair.publicKey,
        destAccountKeypair.publicKey,
        myKey.publicKey,
        100000n,
        decimals,
        [],
        TOKEN_2022_PROGRAM_ID
    );

    // Le mémo DOIT être avant le transfert dans la transaction
    const transferWithMemoTx = new Transaction().add(memoIx, transferWithMemoIx);
    tx = await sendAndConfirmTransaction(connection, transferWithMemoTx, [myKey]);
    console.log("Transfert avec mémo réussi!");
    console.log("Tx: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 6: Désactiver l'exigence de mémo
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Désactivation de l'exigence de mémo ---");

    const disableIx = createDisableRequiredMemoTransfersInstruction(
        destAccountKeypair.publicKey,
        myKey.publicKey,
        [],
        TOKEN_2022_PROGRAM_ID
    );

    const disableTx = new Transaction().add(disableIx);
    tx = await sendAndConfirmTransaction(connection, disableTx, [myKey]);
    console.log("Exigence de mémo désactivée!");

    // Maintenant un transfert sans mémo devrait fonctionner
    const transferNoMemoIx = createTransferCheckedInstruction(
        sourceAccountKeypair.publicKey,
        mintKeypair.publicKey,
        destAccountKeypair.publicKey,
        myKey.publicKey,
        100000n,
        decimals,
        [],
        TOKEN_2022_PROGRAM_ID
    );

    const transferNoMemoTx = new Transaction().add(transferNoMemoIx);
    tx = await sendAndConfirmTransaction(connection, transferNoMemoTx, [myKey]);
    console.log("Transfert sans mémo réussi après désactivation!");
    console.log("Tx: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");
}

main();
