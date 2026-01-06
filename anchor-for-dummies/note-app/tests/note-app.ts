import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NoteApp } from "../target/types/note_app";

describe("note-app", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.noteApp as Program<NoteApp>;

  const provider = anchor.AnchorProvider.env();
  const [notePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("note"), provider.wallet.publicKey.toBuffer()],
    program.programId
  );

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize("sacha le tdc")
    .accounts({
      signer: provider.wallet.publicKey,
      note: notePda,
    })
    .rpc();

    const data = await program.account.note.fetch(notePda);
    console.log("Note init : ", data.content);
  });

  it("Is update!", async () => {
    // Add your test here.
    const tx = await program.methods.update("sacha le tdc de merde putain")
    .accounts({
      signer: provider.wallet.publicKey,
      note: notePda,
    })
    .rpc();

    const data = await program.account.note.fetch(notePda);
    console.log("Note update : ", data.content);
  });

});
