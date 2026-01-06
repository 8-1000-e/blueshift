import { getKeypair, getDevnetConnection } from "./connection.js";
import { Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import {
    TOKEN_2022_PROGRAM_ID,
    ExtensionType,
    getMintLen,
    createInitializeMintInstruction,
    createInitializeNonTransferableMintInstruction,
    createAssociatedTokenAccountIdempotent,
    mintTo,
    createTransferCheckedInstruction
} from "@solana/spl-token";


async function main()
{
    const myKey = getKeypair();
    const connection = getDevnetConnection();
    const mintKeypair = Keypair.generate();

    const decimals = 6;

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 1: Créer un mint avec NonTransferable
    //////////////////////////////////////////////////////////////////////////////////////////

    const mintLen = getMintLen([ExtensionType.NonTransferable]);
    const rentExempt = await connection.getMinimumBalanceForRentExemption(mintLen);

    const transaction = new Transaction().add(
        // 1. Créer le compte
        SystemProgram.createAccount({
            fromPubkey: myKey.publicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: mintLen,
            lamports: rentExempt,
            programId: TOKEN_2022_PROGRAM_ID
        }),
        // 2. Initialiser l'extension NonTransferable (AVANT le mint!)
        // Les tokens de ce mint ne pourront JAMAIS être transférés
        createInitializeNonTransferableMintInstruction(
            mintKeypair.publicKey,
            TOKEN_2022_PROGRAM_ID
        ),
        // 3. Initialiser le mint
        createInitializeMintInstruction(
            mintKeypair.publicKey,
            decimals,
            myKey.publicKey,
            null,  // Pas de freezeAuthority nécessaire
            TOKEN_2022_PROGRAM_ID
        )
    );

    let tx = await sendAndConfirmTransaction(connection, transaction, [myKey, mintKeypair]);
    console.log("Mint NonTransferable créé: " + mintKeypair.publicKey.toBase58());
    console.log("Tx: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 2: Créer des ATAs et mint des tokens
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Création des comptes et mint ---");

    const myATA = await createAssociatedTokenAccountIdempotent(
        connection,
        myKey,
        mintKeypair.publicKey,
        myKey.publicKey,
        {},
        TOKEN_2022_PROGRAM_ID
    );
    console.log("Mon ATA: " + myATA.toBase58());

    // Mint des tokens
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
    console.log("Minted 1 token sur mon ATA");

    // Créer un destinataire
    const receiver = Keypair.generate();
    const receiverATA = await createAssociatedTokenAccountIdempotent(
        connection,
        myKey,
        mintKeypair.publicKey,
        receiver.publicKey,
        {},
        TOKEN_2022_PROGRAM_ID
    );
    console.log("Receiver ATA: " + receiverATA.toBase58());

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 3: Tenter un transfert - DOIT ÉCHOUER
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Test: tenter un transfert ---");

    try {
        const transferIx = createTransferCheckedInstruction(
            myATA,
            mintKeypair.publicKey,
            receiverATA,
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
        console.log("Transfert échoué comme prévu!");
        console.log("Erreur: " + e.message.slice(0, 80) + "...");
    }

    console.log("\n\nCes tokens sont liés de façon permanente à leur détenteur.");
    console.log("Cas d'usage: badges, certifications, achievements, soulbound tokens (SBT)");
}

main();
