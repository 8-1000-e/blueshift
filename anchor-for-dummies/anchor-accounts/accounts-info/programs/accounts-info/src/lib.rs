use anchor_lang::prelude::*;

declare_id!("9JAoCv2kMbbKH55wtseifaLUjX61mL8aJcny2Hh9Gk35");

#[program]
pub mod accounts_info {
    use super::*;

    pub fn inspect_account(ctx: Context<InspectAccount>) -> Result<()> 
    {
        let info = ctx.accounts.target.to_account_info();
        msg!("Account Owner: {}\n Account Lmaport: {} SOL\n Account executable: {}\n Account data len: {}",
        info.owner,
        info.lamports(), 
        info.executable,
        info.data_len());
        Ok(())
    }
}


#[derive(Accounts)]
pub struct InspectAccount<'info>
{
    /// CHECK: On veut juste lire les infos, pas de validation necessaire
    pub target: UncheckedAccount<'info>,
    pub signer: Signer<'info>,

}

#[derive(Accounts)]
pub struct Initialize {}
