import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorVault } from "../target/types/anchor_vault";

const provider = anchor.AnchorProvider.env();
const wallet = provider.wallet;  // le wallet du test
const amount = 1_000_000_000;    // 1 SOL en lamports
  
// Le vault = juste une adresse random pour stocker les SOL
const vault = anchor.web3.Keypair.generate();

describe("anchor-vault", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.anchorVault as Program<AnchorVault>;

  it("Should deposit!", async () => {
    // Add your test here.
      
    await program.methods
    .deposit(new anchor.BN(amount))
    .accounts({
      signer: wallet.publicKey,
      vault: vault.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .rpc();

    
    console.log("Vault Balance: "+await provider.connection.getBalance(vault.publicKey) / 1000000000+" SOL");
  });


  it("Should withdraw", async () => {
    await program.methods.withdraw()
    .accounts({
      signer: wallet.publicKey,
      vault: vault.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .signers([vault])
    .rpc();

    console.log("Vault Balance after withdrawal: "+await provider.connection.getBalance(vault.publicKey) / 1000000000+" SOL");

  });
});
