import { getKeypair, getDevnetConnection } from "./connection.js";
import { Keypair, SystemProgram, Transaction, sendAndConfirmTransaction, PublicKey } from "@solana/web3.js";
import { getAccount, getTransferFeeAmount, harvestWithheldTokensToMint, withdrawWithheldTokensFromMint, mintTo, transferChecked, transferCheckedWithFee, createSetTransferFeeInstruction, TOKEN_2022_PROGRAM_ID, ExtensionType, getMintLen, createInitializeMintInstruction, createInitializeTransferFeeConfigInstruction, createAssociatedTokenAccountIdempotent, unpackAccount, createWithdrawWithheldTokensFromAccountsInstruction } from "@solana/spl-token"


async function main()
{
    const myKey = getKeypair();
    const connection = getDevnetConnection();
    const mintKeypair = Keypair.generate();

    const feePoints = 500;
    const maxFee = BigInt(1000000000000);
    const decimals = 6;

    //account size
    const mintLen = getMintLen([ExtensionType.TransferFeeConfig]);

    //minim tarif pour ne plus payer le loyer de compte
    const rentExempt = await connection.getMinimumBalanceForRentExemption(mintLen);


    // Construction de la transaction avec 3 instructions (ordre important!)
    const transaction = new Transaction().add(
        // 1. Créer le compte sur la blockchain
        SystemProgram.createAccount({
            fromPubkey: myKey.publicKey,       // qui paie
            newAccountPubkey: mintKeypair.publicKey, // adresse du nouveau compte
            space: mintLen,                     // taille en bytes
            lamports: rentExempt,               // SOL pour rent-exempt
            programId: TOKEN_2022_PROGRAM_ID    // programme propriétaire
        }),
        // 2. Configurer l'extension Transfer Fee (AVANT le mint!)
        createInitializeTransferFeeConfigInstruction(
            mintKeypair.publicKey,    // mint
            myKey.publicKey,          // transferFeeConfigAuthority (peut changer les frais)
            myKey.publicKey,          // withdrawWithheldAuthority (peut récupérer les frais)
            feePoints,                // 500 = 5%
            maxFee,                   // plafond de frais
            TOKEN_2022_PROGRAM_ID
        ),
        // 3. Initialiser le mint
        createInitializeMintInstruction(
            mintKeypair.publicKey,    // mint
            decimals,                 // 6 décimales
            myKey.publicKey,          // mintAuthority
            myKey.publicKey,          // freezeAuthority
            TOKEN_2022_PROGRAM_ID
        )
    );

    let tx = await sendAndConfirmTransaction(
        connection,
        transaction,
        [myKey, mintKeypair]
    );

    console.log("Mint créé: " + mintKeypair.publicKey.toBase58());
    console.log("Tx: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");


    ///////////////////////////////////////////////////////////////////////////////////////


    const myATA = await createAssociatedTokenAccountIdempotent(
            connection,
            myKey,
            mintKeypair.publicKey,
            myKey.publicKey,
            {},
            TOKEN_2022_PROGRAM_ID
    );

    const receiver = Keypair.generate();
    const receiverATA = await createAssociatedTokenAccountIdempotent(
        connection,
        myKey,
        mintKeypair.publicKey,
        receiver.publicKey,
        {},
        TOKEN_2022_PROGRAM_ID
    );

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
    console.log("\n\n\n\Minted 1 token to: " + myATA.toBase58());
    console.log("Tx: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");

    // Transfert avec frais automatiques (Token-2022)
    // Sur 500_000 tokens envoyés avec 5% de frais:
    // - Le receiver reçoit: 500_000 - 25_000 = 475_000 tokens utilisables
    // - Les 25_000 sont "withheld" (retenus) sur son ATA
    await transferCheckedWithFee(
        connection,
        myKey,                              // payer (paie les frais de tx en SOL)
        myATA,                              // source (d'où partent les tokens)
        mintKeypair.publicKey,              // mint (quel token)
        receiverATA,                        // destination
        myKey,                              // owner de la source (signe le transfert)
        BigInt(500000),                     // amount: 0.5 token (500_000 avec 6 decimals)
        decimals,                           // decimals du mint
        BigInt(500000 * feePoints / 10000), // fee calculé: 500_000 * 500 / 10_000 = 25_000
        [],                                 // multiSigners
        undefined,                          // confirmOptions
        TOKEN_2022_PROGRAM_ID               // programme Token-2022
    );

    const myInfo = await getAccount(
        connection,
        myATA,
        undefined,
        TOKEN_2022_PROGRAM_ID
    ); 

    const receiverInfo = await getAccount(
        connection,
        receiverATA,
        undefined,
        TOKEN_2022_PROGRAM_ID
    ); 


    console.log("\n--- Balances après transfert ---");
    console.log("myATA balance: " + myInfo.amount);
    console.log("receiverATA balance: " + receiverInfo.amount);
    
    const withheld = getTransferFeeAmount(receiverInfo);
    console.log("Frais retenus sur receiver: " + withheld?.withheldAmount);
    
    // Harvest : collecte les frais des ATAs vers le mint
    await harvestWithheldTokensToMint(
        connection,
        myKey,
        mintKeypair.publicKey,
        [receiverATA]
    );

    // Withdraw : retire les frais du mint vers ton ATA
    await withdrawWithheldTokensFromMint(
        connection,
        myKey,
        mintKeypair.publicKey,
        myATA,
        myKey
    );

    // Vérifier la nouvelle balance
    const finalInfo = await getAccount(connection, myATA, undefined, TOKEN_2022_PROGRAM_ID);
    console.log("\n\n\n--- Balance finale après récupération des frais ---");
    console.log("myATA balance: " + finalInfo.amount);


    ///////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 2: transferChecked - calcul automatique des frais par le programme
    ///////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Test transferChecked (frais calculés automatiquement) ---");

    // Avec transferChecked, pas besoin de calculer le fee manuellement
    // Le programme le calcule tout seul selon la config du mint
    await transferChecked(
        connection,
        myKey,
        myATA,
        mintKeypair.publicKey,
        receiverATA,
        myKey,
        BigInt(100000),   // 0.1 token
        decimals,
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID
    );

    const afterTransferChecked = await getAccount(connection, receiverATA, undefined, TOKEN_2022_PROGRAM_ID);
    const withheld2 = getTransferFeeAmount(afterTransferChecked);
    console.log("Nouveau withheld après transferChecked: " + withheld2?.withheldAmount);


    ///////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 3: Modifier les frais avec createSetTransferFeeInstruction
    ///////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Modification des frais: 5% -> 10% ---");

    // Créer l'instruction pour changer les frais
    const setFeeIx = createSetTransferFeeInstruction(
        mintKeypair.publicKey,    // mint
        myKey.publicKey,          // transferFeeConfigAuthority
        [],                       // multiSigners
        1000,                     // nouveau feeBasisPoints: 1000 = 10%
        maxFee,                   // maxFee reste le même
        TOKEN_2022_PROGRAM_ID
    );

    // Envoyer la transaction
    const setFeeTx = new Transaction().add(setFeeIx);
    tx = await sendAndConfirmTransaction(connection, setFeeTx, [myKey]);
    console.log("Frais modifiés! Tx: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");
    console.log("Note: Les nouveaux frais s'activeront après 2 époques (~4 jours sur devnet)");

    //////////////////////////////////////////////////////////////////////////////////////////
    // PARTIE 4: Nouveau transfert pour avoir des frais à retirer avec withdrawFromAccounts
    //////////////////////////////////////////////////////////////////////////////////////////

    console.log("\n\n--- Nouveau transfert pour tester withdrawWithheldTokensFromAccounts ---");

    // Faire un nouveau transfert pour générer des frais
    await transferChecked(
        connection,
        myKey,
        myATA,
        mintKeypair.publicKey,
        receiverATA,
        myKey,
        BigInt(50000),   // 0.05 token
        decimals,
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID
    );
    console.log("Transfert effectué! Des frais ont été retenus sur receiverATA");

    // getProgramAccounts : scanne TOUS les comptes appartenant à un programme
    // Sans filtres, ça retournerait des millions de comptes !
    const accounts = await connection.getProgramAccounts(
        TOKEN_2022_PROGRAM_ID,  // On cherche les comptes du programme Token-2022
        {
            filters: [
                // Filtre 1: dataSize = taille en bytes d'un token account Token-2022
                // 182 bytes = token account avec extension TransferFee
                // Ça exclut les mints (taille différente)
                { dataSize: 182 },

                // offset: 0 = on compare à partir du byte 0 du compte
                // Dans un token account, le mint est stocké aux premiers bytes
                // Donc on ne garde que les token accounts de NOTRE mint
                { memcmp: { offset: 0, bytes: mintKeypair.publicKey.toBase58() } }
            ]
        }
    );
    // Résultat: accounts = tableau de { pubkey, account }
    // où account contient les données brutes du token account

    const accountToWithdraw: PublicKey[] = [];

    for (const accountInfo of accounts)
    {
        const account = unpackAccount(accountInfo.pubkey,
            accountInfo.account,
            TOKEN_2022_PROGRAM_ID
            );

        const feeAmount = getTransferFeeAmount(account);
        if (feeAmount !== null && feeAmount.withheldAmount > 0)
            accountToWithdraw.push(accountInfo.pubkey);
    }

    // createWithdrawWithheldTokensFromAccountsInstruction :
    // Retire les frais DIRECTEMENT depuis les token accounts (sans passer par le mint)
    // Alternative à harvest + withdraw en 2 étapes
    const withdrawIx = createWithdrawWithheldTokensFromAccountsInstruction(
        mintKeypair.publicKey,    // mint concerné
        myATA,                    // destination : où envoyer les frais récupérés
        myKey.publicKey,          // withdrawWithheldAuthority : qui a le droit de retirer
        [],                       // multiSigners (vide si authority = simple keypair)
        accountToWithdraw,        // sources : liste des comptes avec frais à retirer
        TOKEN_2022_PROGRAM_ID     // programme Token-2022
    );
    // Créer et envoyer la transaction
    const withdrawTx = new Transaction().add(withdrawIx);
    tx = await sendAndConfirmTransaction(connection, withdrawTx, [myKey]);
    console.log("Frais retirés directement des ATAs! Tx: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");

    // Afficher les balances finales
    const finalMyInfo = await getAccount(connection, myATA, undefined, TOKEN_2022_PROGRAM_ID);
    const finalReceiverInfo = await getAccount(connection, receiverATA, undefined, TOKEN_2022_PROGRAM_ID);
    const finalWithheld = getTransferFeeAmount(finalReceiverInfo);

    console.log("\n--- Balances finales après withdrawWithheldTokensFromAccounts ---");
    console.log("myATA balance: " + finalMyInfo.amount);
    console.log("receiverATA balance: " + finalReceiverInfo.amount);
    console.log("Frais retenus sur receiver: " + finalWithheld?.withheldAmount);

}

main();