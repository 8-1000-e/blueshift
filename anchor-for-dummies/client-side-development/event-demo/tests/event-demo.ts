import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { EventDemo } from "../target/types/event_demo";

describe("event-demo", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.eventDemo as Program<EventDemo>;
  const provider = anchor.AnchorProvider.env();
  const testKeypair = anchor.web3.Keypair.generate();


  it("Is emit!", async () => {
    
    const listenerId = program.addEventListener("customEvent", (event) => {
      console.log("Event recu: ",event);
    });

    await program.methods
    .emitEvent("Hello Solana!")
    .accounts({})
    .rpc();
    
    program.removeEventListener(listenerId);
  });

});
