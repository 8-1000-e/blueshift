use anchor_lang::prelude::*;

declare_id!("7Ptp4bz2SDhZNKrP3mrivtbU5rmc4qgg1FQzsQDwpVdF");
use anchor_lang::system_program::{transfer, Transfer};

#[program]
pub mod remaining_accounts {
    use super::*;

    pub fn batch_transfer<'info>(ctx: Context<'_, '_, '_, 'info, BatchTransfer<'info>>, amounts: Vec<u64>) -> Result<()>
    {
        if amounts.len() == ctx.remaining_accounts.len()
        {
            for (i, account) in ctx.remaining_accounts.iter().enumerate()
            {
                transfer(
                    CpiContext::new(
                        ctx.accounts.system_program.to_account_info(),
                        Transfer{
                            from: ctx.accounts.signer.to_account_info(),
                            to: account.clone()
                        },
                    ),
                    amounts[i]
                )?;
            }
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct BatchTransfer<'info>
{   
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>
}