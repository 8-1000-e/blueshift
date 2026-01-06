import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AccountsInfo } from "../target/types/accounts_info";

describe("accounts-info", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.accountsInfo as Program<AccountsInfo>;

  it("Print account infos!", async () => {
    // Add your test here.

    const provider = anchor.AnchorProvider.env();
    const wallet = provider.wallet;

    const tx = await program.methods.inspectAccount()
      .accounts({
        target: wallet.publicKey,
        signer: wallet.publicKey
      })
    .rpc();

  });
});
