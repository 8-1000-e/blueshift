import { getKeypair, getDevnetConnection } from "./connection.js";
import { Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import {
    TOKEN_2022_PROGRAM_ID,
    ExtensionType,
    getMintLen,
    createInitializeMintInstruction,
    createInitializeMintCloseAuthorityInstruction,
    createCloseAccountInstruction
} from "@solana/spl-token";


async function main()
{
    const myKey = getKeypair();
    const connection = getDevnetConnection();
    const mintKeypair = Keypair.generate();

    const decimals = 6;
    const mintLen = getMintLen([ExtensionType.MintCloseAuthority]);
    const rentExempt = await connection.getMinimumBalanceForRentExemption(mintLen);

    const transac = new Transaction().add(
        SystemProgram.createAccount({
                fromPubkey: myKey.publicKey,
                newAccountPubkey: mintKeypair.publicKey,
                space: mintLen,
                lamports: rentExempt,
                programId: TOKEN_2022_PROGRAM_ID
            }),
        createInitializeMintCloseAuthorityInstruction(
            mintKeypair.publicKey,
            myKey.publicKey,
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(
            mintKeypair.publicKey,
            decimals,
            myKey.publicKey,
            myKey.publicKey,
            TOKEN_2022_PROGRAM_ID
        )
    );


    let balance = await connection.getBalance(myKey.publicKey);
    console.log("Before openning mint: "+ balance / 1e9 + " SOL");

    let tx = await sendAndConfirmTransaction(
        connection,
        transac,
        [myKey, mintKeypair]
    );

    balance = await connection.getBalance(myKey.publicKey);
    console.log("After openning mint: "+ balance / 1e9 + " SOL");

    // console.log("\n\nMint créé avec MintCloseAuthority: " + mintKeypair.publicKey.toBase58());
    // console.log("Tx: https://explorer.solana.com/tx/" + tx + "?cluster=devnet");


    const closing = await createCloseAccountInstruction(
        mintKeypair.publicKey,
        myKey.publicKey,
        myKey.publicKey,
        [],
        TOKEN_2022_PROGRAM_ID
    );

    const ntx = new Transaction().add(closing);
    await sendAndConfirmTransaction(connection, ntx, [myKey]);
    balance = await connection.getBalance(myKey.publicKey);
    console.log("After closing mint: "+ balance / 1e9 + " SOL");

}

main();
