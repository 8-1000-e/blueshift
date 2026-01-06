import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { UncheckedDemo } from "../target/types/unchecked_demo";

describe("unchecked-demo", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.uncheckedDemo as Program<UncheckedDemo>;
  const provider = anchor.AnchorProvider.env();
  const recipient = anchor.web3.Keypair.generate();

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.sendSol(new anchor.BN(anchor.LAMPORTS_PER_SOL))
    .accounts({
      recipient: recipient.publicKey,
      from: provider.wallet.publicKey
    })
    .rpc();
    console.log("Your transaction signature", tx);
  });
});
