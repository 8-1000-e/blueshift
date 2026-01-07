import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { HasOne } from "../target/types/has_one";

describe("has-one", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.hasOne as Program<HasOne>;
  const provider = anchor.AnchorProvider.env();
  const tokenHolderKeypair = anchor.web3.Keypair.generate();


  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize()
    .accounts({
      signer: provider.wallet.publicKey,
      tokenHolder: tokenHolderKeypair.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .signers([tokenHolderKeypair])
    .rpc();
  });

    it("Is has-one = true!", async () => {
    // Add your test here.
    const tx = await program.methods.checkOwner()
    .accounts({
      tokenHolder: tokenHolderKeypair.publicKey,
      owner: provider.wallet.publicKey
    })
    .rpc();
  });

it("Is has-one = false!", async () => {
  const fakeOwner = anchor.web3.Keypair.generate();
  
  try {
    await program.methods.checkOwner()
    .accounts({
      tokenHolder: tokenHolderKeypair.publicKey,
      owner: fakeOwner.publicKey
    })
    .signers([fakeOwner])
    .rpc();
    
    throw new Error("Should have failed");
  } catch (e) {
    console.log("Expected error:", e.message);
  }
});


});
