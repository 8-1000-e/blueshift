import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorVault } from "../target/types/anchor_vault";

describe("anchor-vault", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.anchorVault as Program<AnchorVault>;

  const provider = anchor.AnchorProvider.env();

  const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), provider.wallet.publicKey.toBuffer()],
    program.programId
  );

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize()
    .accounts({
      user : provider.wallet.publicKey,
      vault: vaultPda,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .rpc();
  });

    it("Deposit!", async () => {
    // Add your test here.
    const tx = await program.methods.deposite(new anchor.BN(1000000000))
    .accounts({
      user : provider.wallet.publicKey,
      vault: vaultPda,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .rpc();

    console.log("SOLd after deposit: "+await provider.connection.getBalance(vaultPda) / anchor.web3.LAMPORTS_PER_SOL);
  });

    it("Withdraw!", async () => {
    // Add your test here.
    const tx = await program.methods.withdraw()
    .accounts({
      user : provider.wallet.publicKey,
      vault: vaultPda,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .rpc();

    console.log("SOLd after withdraw: "+await provider.connection.getBalance(vaultPda) / anchor.web3.LAMPORTS_PER_SOL);

  });

});
