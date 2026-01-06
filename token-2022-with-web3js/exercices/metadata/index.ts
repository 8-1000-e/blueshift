import { getKeypair, getDevnetConnection } from "./connection.js";
import { Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import {
    TOKEN_2022_PROGRAM_ID,
    ExtensionType,
    getMintLen,
    createInitializeMintInstruction,
    createInitializeMetadataPointerInstruction,
    getMetadataPointerState,
    getMint,
} from "@solana/spl-token";
import {
    createInitializeInstruction,
    createUpdateFieldInstruction,
    pack,
    TokenMetadata
} from "@solana/spl-token-metadata";


async function main()
{
    const myKey = getKeypair();
    const connection = getDevnetConnection();
    const mintKeypair = Keypair.generate();

    const decimals = 6;

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 1: Définir les metadata du token
    //////////////////////////////////////////////////////////////////////////////////////////
    const metadata: TokenMetadata = {
        mint: mintKeypair.publicKey,
        name: "Elina",
        symbol: "ELA",
        uri: "https://raw.githubusercontent.com/8-1000-e/Flortie-Token-Info/refs/heads/main/info.json",
        additionalMetadata: []
    };

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 2: Calculer l'espace nécessaire
    //////////////////////////////////////////////////////////////////////////////////////////

    // getMintLen calcule la taille du mint avec l'extension MetadataPointer
    const mintlen = getMintLen([ExtensionType.MetadataPointer]);
    // pack() sérialise les metadata, on ajoute un buffer pour les champs additionnels
    const metadataLen = pack(metadata).length + 100;  // +100 pour updateField plus tard
    const totalLen = mintlen + metadataLen;
    const lamport = await connection.getMinimumBalanceForRentExemption(totalLen);

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 3: Créer la transaction
    //////////////////////////////////////////////////////////////////////////////////////////
    const transac = new Transaction().add(
        // 1. Créer le compte sur la blockchain
        // On réserve l'espace pour le mint + les metadata
        SystemProgram.createAccount({
            fromPubkey: myKey.publicKey,          // qui paye
            newAccountPubkey: mintKeypair.publicKey,  // adresse du nouveau compte
            space: mintlen,                         // juste le mint (metadata ajoutées après)
            lamports: lamport,                     // rent exempt (mint + metadata)
            programId: TOKEN_2022_PROGRAM_ID       // propriétaire = Token-2022
        }),
        // 2. MetadataPointer - dire OÙ sont les metadata
        // Ici on dit : "les metadata sont SUR le mint lui-même"
        createInitializeMetadataPointerInstruction(
            mintKeypair.publicKey,    // le mint
            myKey.publicKey,          // updateAuthority (qui peut modifier le pointeur)
            mintKeypair.publicKey,    // metadataAddress = le mint lui-même!
            TOKEN_2022_PROGRAM_ID
        ),
        // 3. Initialiser le mint (comme d'habitude)
        createInitializeMintInstruction(
            mintKeypair.publicKey,
            decimals,
            myKey.publicKey,          // mintAuthority
            null,                     // freezeAuthority
            TOKEN_2022_PROGRAM_ID
        ),
        // 4. Initialiser les metadata APRÈS le mint
        // C'est ici qu'on écrit le nom, symbole, uri sur la blockchain
        createInitializeInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            mint: mintKeypair.publicKey,
            metadata: mintKeypair.publicKey,  // metadata = mint (car MetadataPointer pointe vers lui-même)
            mintAuthority: myKey.publicKey,
            updateAuthority: myKey.publicKey, // qui peut modifier les metadata
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri
        })
    );



    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 4: Envoyer la transaction
    //////////////////////////////////////////////////////////////////////////////////////////

    let tx = await sendAndConfirmTransaction(connection, transac, [myKey, mintKeypair]);
    console.log("Mint créé avec metadata: " + mintKeypair.publicKey.toBase58());


    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 5: Lire les metadata du mint
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Lecture des metadata ---");

    const mintInfo = await getMint(connection, mintKeypair.publicKey, undefined, TOKEN_2022_PROGRAM_ID);
    const metadataPointer = getMetadataPointerState(mintInfo);
    console.log("MetadataPointer:", metadataPointer);
    console.log("Metadata address:", metadataPointer?.metadataAddress?.toBase58());

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 6: Ajouter un champ additionnel
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Ajout d'un champ additionnel ---");
    const updateFieldTx = new Transaction().add(
        createUpdateFieldInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            metadata: mintKeypair.publicKey,
            updateAuthority: myKey.publicKey,
            field: "description",
            value: "Un super token créé pour apprendre Token-2022"
        })
    );

    tx = await sendAndConfirmTransaction(connection, updateFieldTx, [myKey]);
    console.log("Champ 'description' ajouté!");

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 7: Relire les metadata avec le nouveau champ
    //////////////////////////////////////////////////////////////////////////////////////////
    console.log("\n\n--- Metadata finale ---");
    
    const finalMintInfo = await getMint(connection, mintKeypair.publicKey, undefined, TOKEN_2022_PROGRAM_ID);
    console.log("Mint:", mintKeypair.publicKey.toBase58());
    console.log("Name:", metadata.name);
    console.log("Symbol:", metadata.symbol);
    console.log("URI:", metadata.uri);
    console.log("Description ajoutée via updateField!");
    console.log("\nVoir sur l'explorer: https://explorer.solana.com/address/" + mintKeypair.publicKey.toBase58() + "?cluster=devnet");
    

}

main();
