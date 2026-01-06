import { getKeypair, getDevnetConnection } from "./connection.js";
import { Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import {
    TOKEN_2022_PROGRAM_ID,
    ExtensionType,
    getMintLen,
    getAccountLen,
    createInitializeMintInstruction,
    createInitializeAccountInstruction,
    createEnableCpiGuardInstruction,
    createDisableCpiGuardInstruction,
    mintTo,
    getAccount,
    getCpiGuard
} from "@solana/spl-token";


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
    // PARTIE 2: Créer un Token Account avec CpiGuard
    // CPI = Cross-Program Invocation (un programme qui en appelle un autre)
    // CpiGuard protège contre les programmes malveillants qui manipulent ton compte
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Création d'un Token Account avec CpiGuard ---");

    const tokenAccountKeypair = Keypair.generate();

    // L'extension CpiGuard est sur le TOKEN ACCOUNT (pas le mint)
    const accountLen = getAccountLen([ExtensionType.CpiGuard]);
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
        // 2. Initialiser le token account (CpiGuard s'active après)
        createInitializeAccountInstruction(
            tokenAccountKeypair.publicKey,
            mintKeypair.publicKey,
            myKey.publicKey,
            TOKEN_2022_PROGRAM_ID
        ),
        // 3. Activer le CpiGuard
        // Seul le owner peut activer/désactiver le guard
        createEnableCpiGuardInstruction(
            tokenAccountKeypair.publicKey,
            myKey.publicKey,  // owner du compte
            [],
            TOKEN_2022_PROGRAM_ID
        )
    );

    tx = await sendAndConfirmTransaction(connection, accountTx, [myKey, tokenAccountKeypair]);
    console.log("Token Account créé avec CpiGuard: " + tokenAccountKeypair.publicKey.toBase58());
    console.log("Tx: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 3: Mint des tokens et vérifier le CpiGuard
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Mint de tokens et vérification ---");

    tx = await mintTo(
        connection,
        myKey,
        mintKeypair.publicKey,
        tokenAccountKeypair.publicKey,
        myKey.publicKey,
        1e6,  // 1 token
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID
    );
    console.log("Minted 1 token sur le compte protégé");

    // Vérifier l'état du compte et du CpiGuard
    let accountInfo = await getAccount(
        connection,
        tokenAccountKeypair.publicKey,
        undefined,
        TOKEN_2022_PROGRAM_ID
    );
    console.log("Balance: " + accountInfo.amount);

    // Vérifier si le CpiGuard est activé
    let cpiGuard = getCpiGuard(accountInfo);
    console.log("CpiGuard activé: " + cpiGuard?.lockCpi);

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 4: Désactiver le CpiGuard
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Désactivation du CpiGuard ---");

    const disableTx = new Transaction().add(
        createDisableCpiGuardInstruction(
            tokenAccountKeypair.publicKey,
            myKey.publicKey,  // owner
            [],
            TOKEN_2022_PROGRAM_ID
        )
    );

    tx = await sendAndConfirmTransaction(connection, disableTx, [myKey]);
    console.log("CpiGuard désactivé!");

    // Vérifier que le guard est bien désactivé
    accountInfo = await getAccount(connection, tokenAccountKeypair.publicKey, undefined, TOKEN_2022_PROGRAM_ID);
    cpiGuard = getCpiGuard(accountInfo);
    console.log("CpiGuard activé: " + cpiGuard?.lockCpi);

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 5: Réactiver le CpiGuard
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Réactivation du CpiGuard ---");

    const enableTx = new Transaction().add(
        createEnableCpiGuardInstruction(
            tokenAccountKeypair.publicKey,
            myKey.publicKey,
            [],
            TOKEN_2022_PROGRAM_ID
        )
    );

    tx = await sendAndConfirmTransaction(connection, enableTx, [myKey]);
    console.log("CpiGuard réactivé!");

    // Vérifier que le guard est bien réactivé
    accountInfo = await getAccount(connection, tokenAccountKeypair.publicKey, undefined, TOKEN_2022_PROGRAM_ID);
    cpiGuard = getCpiGuard(accountInfo);
    console.log("CpiGuard activé: " + cpiGuard?.lockCpi);

    console.log("\n\n=== Qu'est-ce que le CpiGuard protège? ===");
    console.log("Quand CpiGuard est activé, ces actions sont BLOQUÉES si appelées via CPI:");
    console.log("- Transferts de tokens");
    console.log("- Approvals (autoriser un delegate)");
    console.log("- Fermeture du compte");
    console.log("- SetAuthority (changer le owner/delegate)");
    console.log("\nCes actions ne peuvent être faites que par une transaction signée directement.");
    console.log("Ça protège contre les smart contracts malveillants qui essaient de voler tes tokens!");
}

main();
