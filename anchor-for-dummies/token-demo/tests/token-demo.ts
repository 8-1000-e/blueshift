import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TokenDemo } from "../target/types/token_demo";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID} from "@solana/spl-token"


describe("token-demo", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.tokenDemo as Program<TokenDemo>;
  const provider = anchor.AnchorProvider.env();

  const mintKeypair = anchor.web3.Keypair.generate();
  const mintATA = getAssociatedTokenAddressSync(mintKeypair.publicKey, provider.wallet.publicKey);

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize()
    .accounts({
      signer: provider.wallet.publicKey,
      mint: mintKeypair.publicKey,
      tokenAccount: mintATA,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
    })
    .signers([mintKeypair])
    .rpc();
    console.log("Your transaction signature", tx);
  });
});
