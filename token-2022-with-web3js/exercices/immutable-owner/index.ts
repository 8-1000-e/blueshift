import { getKeypair, getDevnetConnection } from "./connection.js";
import { Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import {
    TOKEN_2022_PROGRAM_ID,
    ExtensionType,
    getMintLen,
    getAccountLen,
    createInitializeMintInstruction,
    createInitializeAccountInstruction,
    createInitializeImmutableOwnerInstruction,
    createSetAuthorityInstruction,
    AuthorityType
} from "@solana/spl-token";


async function main()
{
    const myKey = getKeypair();
    const connection = getDevnetConnection();

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 1: Créer un mint simple (sans extension particulière)
    //////////////////////////////////////////////////////////////////////////////////////////

    const mintKeypair = Keypair.generate();
    const decimals = 6;

    const mintLen = getMintLen([]);  // Mint simple sans extension
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
            null,  // Pas de freezeAuthority
            TOKEN_2022_PROGRAM_ID
        )
    );

    let tx = await sendAndConfirmTransaction(connection, mintTx, [myKey, mintKeypair]);
    console.log("Mint créé: " + mintKeypair.publicKey.toBase58());

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 2: Créer un Token Account avec ImmutableOwner
    // (au lieu d'utiliser un ATA, on crée manuellement pour montrer l'extension)
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Création d'un Token Account avec ImmutableOwner ---");

    const tokenAccountKeypair = Keypair.generate();

    // getAccountLen pour un TOKEN ACCOUNT (pas un mint!)
    const accountLen = getAccountLen([ExtensionType.ImmutableOwner]);
    const accountRent = await connection.getMinimumBalanceForRentExemption(accountLen);

    const accountTx = new Transaction().add(
        // 1. Créer le compte
        SystemProgram.createAccount({
            fromPubkey: myKey.publicKey,
            newAccountPubkey: tokenAccountKeypair.publicKey,
            space: accountLen,
            lamports: accountRent,
            programId: TOKEN_2022_PROGRAM_ID
        }),
        // 2. Initialiser l'extension ImmutableOwner (AVANT le compte token!)
        createInitializeImmutableOwnerInstruction(
            tokenAccountKeypair.publicKey,
            TOKEN_2022_PROGRAM_ID
        ),
        // 3. Initialiser le token account
        createInitializeAccountInstruction(
            tokenAccountKeypair.publicKey,  // compte à initialiser
            mintKeypair.publicKey,          // mint associé
            myKey.publicKey,                // owner du compte
            TOKEN_2022_PROGRAM_ID
        )
    );

    tx = await sendAndConfirmTransaction(connection, accountTx, [myKey, tokenAccountKeypair]);
    console.log("Token Account créé avec ImmutableOwner: " + tokenAccountKeypair.publicKey.toBase58());
    console.log("Tx: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 3: Tenter de changer le owner - DOIT ÉCHOUER
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Test: tenter de changer le owner ---");

    const newOwner = Keypair.generate();

    try {
        // setAuthority avec AuthorityType.AccountOwner devrait échouer
        const setAuthorityIx = createSetAuthorityInstruction(
            tokenAccountKeypair.publicKey,  // compte
            myKey.publicKey,                // current authority
            AuthorityType.AccountOwner,     // type: changer le owner
            newOwner.publicKey,             // nouveau owner
            [],
            TOKEN_2022_PROGRAM_ID
        );

        const setAuthorityTx = new Transaction().add(setAuthorityIx);
        await sendAndConfirmTransaction(connection, setAuthorityTx, [myKey]);
        console.log("Changement réussi (ne devrait pas arriver!)");
    } catch (e: any) {
        console.log("Changement de owner échoué comme prévu!");
        console.log("Erreur: " + e.message.slice(0, 80) + "...");
    }

    console.log("\n\nL'extension ImmutableOwner protège le compte contre les changements de propriétaire.");
}

main();
