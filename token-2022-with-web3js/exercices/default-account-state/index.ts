import { getKeypair, getDevnetConnection } from "./connection.js";
import { Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import {
    TOKEN_2022_PROGRAM_ID,
    ExtensionType,
    getMintLen,
    createInitializeMintInstruction,
    createInitializeDefaultAccountStateInstruction,
    createAssociatedTokenAccountIdempotent,
    mintTo,
    createThawAccountInstruction,
    createUpdateDefaultAccountStateInstruction,
    AccountState
} from "@solana/spl-token";


async function main()
{
    const myKey = getKeypair();
    const connection = getDevnetConnection();
    const mintKeypair = Keypair.generate();

    const decimals = 6;

    // Taille du compte mint avec l'extension DefaultAccountState
    const mintLen = getMintLen([ExtensionType.DefaultAccountState]);
    const rentExempt = await connection.getMinimumBalanceForRentExemption(mintLen);

    // Construction de la transaction avec 3 instructions (ordre important!)
    const transaction = new Transaction().add(
        // 1. Créer le compte sur la blockchain
        SystemProgram.createAccount({
            fromPubkey: myKey.publicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: mintLen,
            lamports: rentExempt,
            programId: TOKEN_2022_PROGRAM_ID
        }),
        // 2. Configurer l'extension DefaultAccountState avec état FROZEN par défaut
        // Tous les nouveaux token accounts seront gelés automatiquement!
        createInitializeDefaultAccountStateInstruction(
            mintKeypair.publicKey,
            AccountState.Frozen,      // État par défaut: gelé
            TOKEN_2022_PROGRAM_ID
        ),
        // 3. Initialiser le mint (freezeAuthority OBLIGATOIRE pour pouvoir dégeler!)
        createInitializeMintInstruction(
            mintKeypair.publicKey,
            decimals,
            myKey.publicKey,          // mintAuthority
            myKey.publicKey,          // freezeAuthority (obligatoire ici!)
            TOKEN_2022_PROGRAM_ID
        )
    );

    let tx = await sendAndConfirmTransaction(
        connection,
        transaction,
        [myKey, mintKeypair]
    );

    console.log("Mint créé avec DefaultAccountState.Frozen: " + mintKeypair.publicKey.toBase58());
    console.log("Tx: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 2: Créer un ATA (sera gelé par défaut) et tester
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Test: créer un ATA et tenter un mint ---");

    // Créer un ATA - il sera automatiquement GELÉ grâce à DefaultAccountState
    const myATA = await createAssociatedTokenAccountIdempotent(
        connection,
        myKey,
        mintKeypair.publicKey,
        myKey.publicKey,
        {},
        TOKEN_2022_PROGRAM_ID
    );
    console.log("ATA créé (gelé par défaut): " + myATA.toBase58());

    // Tenter un mintTo sur un compte gelé - DOIT ÉCHOUER
    try {
        await mintTo(
            connection,
            myKey,
            mintKeypair.publicKey,
            myATA,
            myKey.publicKey,
            1e6,
            [],
            undefined,
            TOKEN_2022_PROGRAM_ID
        );
        console.log("Mint réussi (ne devrait pas arriver!)");
    } catch (e: any) {
        console.log("Mint échoué comme prévu (compte gelé): " + e.message.slice(0, 50) + "...");
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 3: Dégeler le compte et refaire le mint
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Dégeler le compte et refaire le mint ---");

    // createThawAccountInstruction dégèle un compte token
    const thawIx = createThawAccountInstruction(
        myATA,                    // compte à dégeler
        mintKeypair.publicKey,    // mint
        myKey.publicKey,          // freezeAuthority
        [],                       // multiSigners
        TOKEN_2022_PROGRAM_ID
    );

    const thawTx = new Transaction().add(thawIx);
    tx = await sendAndConfirmTransaction(connection, thawTx, [myKey]);
    console.log("Compte dégelé! Tx: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");

    // Maintenant le mint devrait fonctionner
    tx = await mintTo(
        connection,
        myKey,
        mintKeypair.publicKey,
        myATA,
        myKey.publicKey,
        1e6,
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID
    );
    console.log("Mint réussi après dégel! Tx: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 4: Modifier l'état par défaut (Frozen -> Initialized)
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Modifier l'état par défaut: Frozen -> Initialized ---");

    // Après la distribution initiale, on peut changer l'état par défaut
    // pour que les nouveaux comptes ne soient plus gelés automatiquement
    const updateIx = createUpdateDefaultAccountStateInstruction(
        mintKeypair.publicKey,    // mint
        AccountState.Initialized, // nouvel état par défaut: normal (pas gelé)
        myKey.publicKey,          // freezeAuthority (seul autorisé à modifier)
        [],                       // multiSigners
        TOKEN_2022_PROGRAM_ID
    );

    const updateTx = new Transaction().add(updateIx);
    tx = await sendAndConfirmTransaction(connection, updateTx, [myKey]);
    console.log("État par défaut modifié! Tx: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");
    console.log("Les nouveaux comptes ne seront plus gelés automatiquement.");
}

main();
