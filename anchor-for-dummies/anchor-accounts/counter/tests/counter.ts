import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Counter } from "../target/types/counter";

describe("counter", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.counter as Program<Counter>;

  const provider = anchor.AnchorProvider.env();

  const counter = anchor.web3.Keypair.generate();

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize()
    .accounts({
      signer: provider.wallet.publicKey,
      counter: counter.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .signers([counter])
    .rpc();

    const data = await program.account.counter.fetch(counter.publicKey);
    console.log("Value after init: "+data.count.toString());
  });

  it("Should increment", async () =>
  {
    const tx = await program.methods.increment()
    .accounts({
      counter: counter.publicKey
    })
    .rpc();

    const data = await program.account.counter.fetch(counter.publicKey);
    console.log("Value after increment: "+data.count.toString());

  });


  it("Should decrement", async () =>
  {
    const tx = await program.methods.decrement()
    .accounts({
      counter: counter.publicKey
    })
    .rpc();

    let data = await program.account.counter.fetch(counter.publicKey);
    console.log("Value after decrement: "+data.count.toString());
    console.log("sold before: "+await provider.connection.getBalance(provider.wallet.publicKey) / anchor.web3.LAMPORTS_PER_SOL);
  });


  it("Should close", async () =>
  {
    const tx = await program.methods.close()
    .accounts({
      signer: provider.wallet.publicKey,
      counter: counter.publicKey
    })
    .rpc();
    console.log("sold before: "+await provider.connection.getBalance(provider.wallet.publicKey) / anchor.web3.LAMPORTS_PER_SOL);

  });
  });
