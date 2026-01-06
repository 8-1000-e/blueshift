import { getKeypair, getDevnetConnection } from "./connection.js";
import { Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import {
    TOKEN_2022_PROGRAM_ID,
    ExtensionType,
    getMintLen,
    createInitializeMintInstruction,
    createInitializeGroupPointerInstruction,
    createInitializeGroupMemberPointerInstruction,
    getMint,
    getTokenGroupMemberState
} from "@solana/spl-token";
import {
    createInitializeGroupInstruction,
    createInitializeMemberInstruction
} from "@solana/spl-token-group";


async function main()
{
    const myKey = getKeypair();
    const connection = getDevnetConnection();

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 1: Créer le GROUP (la collection)
    // NOUVEAU: GroupPointer + createInitializeGroupInstruction
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("--- Création du GROUP (collection) ---");

    const groupMintKeypair = Keypair.generate();
    const decimals = 0;
    const maxSize = 10n;  // bigint! Maximum 10 membres

    const mintLen = getMintLen([ExtensionType.GroupPointer]);
    const exmptRent = await connection.getMinimumBalanceForRentExemption(mintLen + 116);


    // TODO: Crée une transaction avec:
    // 1. SystemProgram.createAccount (comme d'habitude)
    // 2. createInitializeGroupPointerInstruction(mint, authority, groupAddress, programId)
    //    - groupAddress = groupMintKeypair.publicKey (le groupe est sur le mint)
    // 3. createInitializeMintInstruction (comme d'habitude)
    // 4. createInitializeGroupInstruction({ programId, group, mint, mintAuthority, updateAuthority, maxSize })
    const transac = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: myKey.publicKey,
            newAccountPubkey: groupMintKeypair.publicKey,
            space: mintLen,
            lamports: exmptRent,
            programId: TOKEN_2022_PROGRAM_ID
        }),
        createInitializeGroupPointerInstruction(
            groupMintKeypair.publicKey,
            myKey.publicKey,
            groupMintKeypair.publicKey,
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(
            groupMintKeypair.publicKey,
            0,
            myKey.publicKey,
            null,
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeGroupInstruction(
            {
                programId: TOKEN_2022_PROGRAM_ID,
                group: groupMintKeypair.publicKey,
                mint: groupMintKeypair.publicKey,
                mintAuthority: myKey.publicKey,
                updateAuthority: myKey.publicKey,
                maxSize: 10n
            }
        )
    );


    const sendTX = await sendAndConfirmTransaction(connection,transac, [myKey, groupMintKeypair]);
    console.log("GROUP créé: "+groupMintKeypair.publicKey.toBase58());



    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 2: Créer un MEMBER (un élément de la collection)
    // NOUVEAU: GroupMemberPointer + createInitializeMemberInstruction
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Création du MEMBER 1 ---");

    const member1MintKeypair = Keypair.generate();

    const member1MintLen = getMintLen([ExtensionType.GroupMemberPointer]);
    const member1Rent = await connection.getMinimumBalanceForRentExemption(member1MintLen + 84);

    const member1Tx = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: myKey.publicKey,
            newAccountPubkey: member1MintKeypair.publicKey,
            space: member1MintLen,
            lamports: member1Rent,
            programId: TOKEN_2022_PROGRAM_ID
        }),
        createInitializeGroupMemberPointerInstruction(
            member1MintKeypair.publicKey,
            myKey.publicKey,
            member1MintKeypair.publicKey,
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(
            member1MintKeypair.publicKey,
            0,
            myKey.publicKey,
            null,
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMemberInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            member: member1MintKeypair.publicKey,
            memberMint: member1MintKeypair.publicKey,
            memberMintAuthority: myKey.publicKey,
            group: groupMintKeypair.publicKey,
            groupUpdateAuthority: myKey.publicKey
        })
    );

    await sendAndConfirmTransaction(connection, member1Tx, [myKey, member1MintKeypair]);
    console.log("MEMBER 1 créé: " + member1MintKeypair.publicKey.toBase58());



    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 3: Créer un deuxième MEMBER
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Création du MEMBER 2 ---");

    const member2MintKeypair = Keypair.generate();

    const member2MintLen = getMintLen([ExtensionType.GroupMemberPointer]);
    const member2Rent = await connection.getMinimumBalanceForRentExemption(member2MintLen + 84);

    const member2Tx = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: myKey.publicKey,
            newAccountPubkey: member2MintKeypair.publicKey,
            space: member2MintLen,
            lamports: member2Rent,
            programId: TOKEN_2022_PROGRAM_ID
        }),
        createInitializeGroupMemberPointerInstruction(
            member2MintKeypair.publicKey,
            myKey.publicKey,
            member2MintKeypair.publicKey,
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(
            member2MintKeypair.publicKey,
            0,
            myKey.publicKey,
            null,
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMemberInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            member: member2MintKeypair.publicKey,
            memberMint: member2MintKeypair.publicKey,
            memberMintAuthority: myKey.publicKey,
            group: groupMintKeypair.publicKey,
            groupUpdateAuthority: myKey.publicKey
        })
    );

    await sendAndConfirmTransaction(connection, member2Tx, [myKey, member2MintKeypair]);
    console.log("MEMBER 2 créé: " + member2MintKeypair.publicKey.toBase58());


    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 4: Lire les infos des membres
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Infos des membres ---");

    const member1Info = await getMint(connection, member1MintKeypair.publicKey, undefined, TOKEN_2022_PROGRAM_ID);
    const member1State = getTokenGroupMemberState(member1Info);
    console.log("MEMBER 1:");
    console.log("  Adresse:", member1MintKeypair.publicKey.toBase58());
    console.log("  Groupe:", member1State?.group?.toBase58());
    console.log("  Numéro:", member1State?.memberNumber?.toString());

    const member2Info = await getMint(connection, member2MintKeypair.publicKey, undefined, TOKEN_2022_PROGRAM_ID);
    const member2State = getTokenGroupMemberState(member2Info);
    console.log("MEMBER 2:");
    console.log("  Adresse:", member2MintKeypair.publicKey.toBase58());
    console.log("  Groupe:", member2State?.group?.toBase58());
    console.log("  Numéro:", member2State?.memberNumber?.toString());


    console.log("\n\n=== Cas d'usage ===");
    console.log("- Collections NFT (le group = la collection, les members = les NFTs)");
    console.log("- Sets de tokens liés");
}

main();
