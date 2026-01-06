use anchor_lang::prelude::*;

declare_id!("BrVckoBjKywkjcZeqKPerk3ewgDzcTDtByrWXEZrTGZ2");

#[program]
pub mod unchecked_demo {
    use super::*;

    pub fn send_sol(ctx: Context<SendSol>, amount: u64) -> Result<()> 
    {
        ctx.accounts.from.sub_lamports(amount)?;
        ctx.accounts.recipient.add_lamports(amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct SendSol<'info>
{
    /// CHECK not to send at own program
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,
    #[account(mut)]
    pub from: Signer<'info>
}