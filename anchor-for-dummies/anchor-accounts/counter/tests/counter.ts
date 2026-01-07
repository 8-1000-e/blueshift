import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Counter } from "../target/types/counter";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

describe("counter", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.counter as Program<Counter>;

  const provider = anchor.AnchorProvider.env();

  const counter = anchor.web3.Keypair.generate();
  const counter1 = anchor.web3.Keypair.generate();
  const counter2 = anchor.web3.Keypair.generate();
  const counter3 = anchor.web3.Keypair.generate();


  
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

    await program.methods.initialize()
    .accounts({
      signer: provider.wallet.publicKey,
      counter: counter1.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .signers([counter1])
    .rpc();

        await program.methods.initialize()
    .accounts({
      signer: provider.wallet.publicKey,
      counter: counter2.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .signers([counter2])
    .rpc();

    await program.methods.initialize()
    .accounts({
      signer: provider.wallet.publicKey,
      counter: counter3.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .signers([counter3])
    .rpc();

    const data = await program.account.counter.fetch(counter.publicKey);
    console.log("Value after init: "+data.count.toString());
  });
  
  it("Should increment", async () =>
    {
      const tx1 = await program.methods.increment()
      .accounts({
        counter: counter.publicKey
      })
      .instruction();
     
      const tx2 = await program.methods.increment()
      .accounts({
        counter: counter.publicKey
      })
      .instruction();

      const tx = new anchor.web3.Transaction().add(tx1, tx2);
      await provider.sendAndConfirm(tx);
      const data = await program.account.counter.fetch(counter.publicKey);
      console.log("Value after increment: "+data.count.toString());
      
    });
    
    
  //   it("Should decrement", async () =>
  //     {
  //       const tx = await program.methods.decrement()
  //       .accounts({
  //         counter: counter.publicKey
  //       })
  //       .rpc();
        
  //       let data = await program.account.counter.fetch(counter.publicKey);
  //       console.log("Value after decrement: "+data.count.toString());
  //       console.log("sold before: "+await provider.connection.getBalance(provider.wallet.publicKey) / anchor.web3.LAMPORTS_PER_SOL);
  //     });
      
      it("Filter counters with count = 0", async () => {
        const result = await program.account.counter.all([
          {
            memcmp: {
              offset: 8,
              bytes: bs58.encode(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]))
            }
          }
        ]);
        console.log("Counters avec count=0:", result.length);
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