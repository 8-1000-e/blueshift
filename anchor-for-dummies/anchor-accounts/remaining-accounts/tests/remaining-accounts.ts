import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RemainingAccounts } from "../target/types/remaining_accounts";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

describe("remaining-accounts", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.remainingAccounts as Program<RemainingAccounts>;
  const provider = anchor.AnchorProvider.env();

  const recipient1 = anchor.web3.Keypair.generate();
  const recipient2 = anchor.web3.Keypair.generate();
  const recipient3 = anchor.web3.Keypair.generate();

  it("pay everyone!", async () => {
    // Add your test here.
    const tx = await program.methods.batchTransfer([new anchor.BN(LAMPORTS_PER_SOL), new anchor.BN(LAMPORTS_PER_SOL),new anchor.BN(LAMPORTS_PER_SOL)])
    .accounts({
      signer: provider.wallet.publicKey,
      systemProgram:  anchor.web3.SystemProgram.programId
    })
    .remainingAccounts([
      { pubkey: recipient1.publicKey, isSigner: false, isWritable: true },
      { pubkey: recipient2.publicKey, isSigner: false, isWritable: true },
      { pubkey: recipient3.publicKey, isSigner: false, isWritable: true },
    ])
    .rpc();

    const balance = await provider.connection.getBalance(recipient1.publicKey);
    console.log("Sold: "+balance / LAMPORTS_PER_SOL+" SOL");
  });
});


