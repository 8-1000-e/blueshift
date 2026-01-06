import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OptionDemo } from "../target/types/option_demo";

describe("option-demo", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.optionDemo as Program<OptionDemo>;

  const provider = anchor.AnchorProvider.env();
  const optionalKey = anchor.web3.Keypair.generate();

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().accounts({
      signer: provider.publicKey,
      optionalData: optionalKey.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .signers([optionalKey])
    .rpc();
  });

  it("Check with account", async () => {
  await program.methods.checkOptional()
    .accounts({
      signer: provider.wallet.publicKey,
      optionalData: optionalKey.publicKey
    })
    .rpc();
});

  it("Check without account", async () => {
  await program.methods.checkOptional()
    .accounts({
      signer: provider.wallet.publicKey,
      optionalData: null
    })
    .rpc();
});

});
