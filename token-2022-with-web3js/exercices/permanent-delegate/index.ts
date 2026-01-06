import { getKeypair, getDevnetConnection } from "./connection.js";
import { Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import {
    TOKEN_2022_PROGRAM_ID,
    ExtensionType,
    getMintLen,
    createInitializeMintInstruction,
    createInitializePermanentDelegateInstruction,
    createAssociatedTokenAccountIdempotent,
    mintTo,
    getAccount,
    transferChecked,
    burnChecked
} from "@solana/spl-token";


async function main()
{
    const myKey = getKeypair();
    const connection = getDevnetConnection();
    const mintKeypair = Keypair.generate();

    const decimals = 6;

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 1: Créer un mint avec PermanentDelegate
    // Le delegate permanent peut transférer/brûler TOUS les tokens de ce mint
    // depuis N'IMPORTE QUEL compte, sans l'autorisation du owner!
    //////////////////////////////////////////////////////////////////////////////////////////

    const mintLen = getMintLen([ExtensionType.PermanentDelegate]);
    const rentExempt = await connection.getMinimumBalanceForRentExemption(mintLen);

    const transaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: myKey.publicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: mintLen,
            lamports: rentExempt,
            programId: TOKEN_2022_PROGRAM_ID
        }),
        // Initialiser le PermanentDelegate AVANT le mint
        // myKey sera le delegate permanent - il peut tout contrôler
        createInitializePermanentDelegateInstruction(
            mintKeypair.publicKey,
            myKey.publicKey,  // delegate permanent
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
    console.log("Mint créé avec PermanentDelegate: " + mintKeypair.publicKey.toBase58());
    console.log("Delegate permanent: " + myKey.publicKey.toBase58());

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 2: Créer un compte pour un "autre utilisateur" et lui mint des tokens
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Création d'un compte 'victime' ---");

    // Simuler un autre utilisateur
    const otherUser = Keypair.generate();

    // Créer un ATA pour cet utilisateur
    const otherUserATA = await createAssociatedTokenAccountIdempotent(
        connection,
        myKey,  // payer
        mintKeypair.publicKey,
        otherUser.publicKey,  // owner du compte
        {},
        TOKEN_2022_PROGRAM_ID
    );
    console.log("Compte de l'autre utilisateur: " + otherUserATA.toBase58());

    // Mint des tokens pour l'autre utilisateur
    await mintTo(
        connection,
        myKey,
        mintKeypair.publicKey,
        otherUserATA,
        myKey.publicKey,
        1000000,  // 1 token
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID
    );
    console.log("Minted 1 token pour l'autre utilisateur");

    let accountInfo = await getAccount(connection, otherUserATA, undefined, TOKEN_2022_PROGRAM_ID);
    console.log("Balance de l'autre utilisateur: " + accountInfo.amount);

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 3: Le delegate permanent peut TRANSFÉRER les tokens sans permission
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Le delegate permanent transfère les tokens (sans permission!) ---");

    // Créer un ATA pour nous (le delegate)
    const myATA = await createAssociatedTokenAccountIdempotent(
        connection,
        myKey,
        mintKeypair.publicKey,
        myKey.publicKey,
        {},
        TOKEN_2022_PROGRAM_ID
    );

    // Le delegate peut transférer DEPUIS le compte de l'autre utilisateur
    // SANS sa signature!
    tx = await transferChecked(
        connection,
        myKey,  // payer et signer (le delegate)
        otherUserATA,  // source (compte de l'autre!)
        mintKeypair.publicKey,
        myATA,  // destination (notre compte)
        myKey.publicKey,  // owner/delegate - ici c'est le permanent delegate
        500000,  // 0.5 token
        decimals,
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID
    );
    console.log("Transféré 0.5 token DEPUIS le compte de l'autre utilisateur!");

    accountInfo = await getAccount(connection, otherUserATA, undefined, TOKEN_2022_PROGRAM_ID);
    console.log("Balance autre utilisateur après transfert: " + accountInfo.amount);

    accountInfo = await getAccount(connection, myATA, undefined, TOKEN_2022_PROGRAM_ID);
    console.log("Ma balance après transfert: " + accountInfo.amount);

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 4: Le delegate permanent peut aussi BRÛLER les tokens
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Le delegate permanent brûle des tokens (sans permission!) ---");

    // Brûler les tokens restants de l'autre utilisateur
    tx = await burnChecked(
        connection,
        myKey,
        otherUserATA,  // compte de l'autre utilisateur
        mintKeypair.publicKey,
        myKey.publicKey,  // permanent delegate
        500000,  // brûler les 0.5 restants
        decimals,
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID
    );
    console.log("Brûlé 0.5 token du compte de l'autre utilisateur!");

    accountInfo = await getAccount(connection, otherUserATA, undefined, TOKEN_2022_PROGRAM_ID);
    console.log("Balance autre utilisateur après burn: " + accountInfo.amount);

    console.log("\n\n=== ATTENTION ===");
    console.log("Le PermanentDelegate est TRÈS puissant et potentiellement dangereux!");
    console.log("Le delegate peut voler/brûler TOUS les tokens de TOUS les holders.");
    console.log("\nCas d'usage légitimes:");
    console.log("- Tokens de conformité réglementaire (gel/saisie légale)");
    console.log("- Stablecoins avec obligations légales");
    console.log("- Tokens d'entreprise avec contrôle centralisé voulu");
    console.log("\n⚠️  N'achetez JAMAIS un token avec PermanentDelegate sans comprendre les risques!");
}

main();
