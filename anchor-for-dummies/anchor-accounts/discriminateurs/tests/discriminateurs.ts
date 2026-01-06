import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Discriminateurs } from "../target/types/discriminateurs";

describe("discriminateurs", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.discriminateurs as Program<Discriminateurs>;

  it("Is CreateProfile!", async () => {
    // Add your test here.

    const provider = anchor.AnchorProvider.env();
    const profile = anchor.web3.Keypair.generate();
    const tx = await program.methods.createProfile("Alice", 42).accounts({
      signer: provider.wallet.publicKey,
      profile: profile.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .signers([profile])
    .rpc();
    console.log("Your transaction signature", tx);
  });
});
