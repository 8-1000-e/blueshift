import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AdminOnly } from "../target/types/admin_only";

describe("admin-only", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.adminOnly as Program<AdminOnly>;

  const provider = anchor.AnchorProvider.env();

  it("Is should work!", async () => {
    // Add your test here.
    const tx = await program.methods.adminAction()
    .accounts({
      signer: provider.wallet.publicKey
    }).rpc();
  });

    it("Is should not work!", async () => {
    // Add your test here.
    const keypair = anchor.web3.Keypair.generate();

    const tx = await program.methods.adminAction()
    .accounts({
      signer: keypair.publicKey
    })
    .signers([keypair])
    .rpc();
  });
});
