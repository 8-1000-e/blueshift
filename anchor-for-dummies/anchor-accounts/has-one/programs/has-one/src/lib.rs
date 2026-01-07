use anchor_lang::prelude::*;

declare_id!("4fKKXShoD18ieZQuW73rUZJY8unof6dmJMtJwzaeH1Lv");

#[program]
pub mod has_one {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()>
    {
        ctx.accounts.token_holder.owner = ctx.accounts.signer.key();
        Ok(())
    }

    pub fn check_owner(ctx: Context<CheckOwner>) -> Result<()>
    {
        msg!("Onwer validé: {:?}", ctx.accounts.owner.key());
        Ok(())
    }

}

#[derive(Accounts)]
pub struct Initialize<'info>
{
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(init,
    payer = signer,
    space = 8 + 32 + 8,
    )]
    pub token_holder: Account<'info, TokenHolder>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct CheckOwner<'info>
{
    #[account(has_one = owner)]
    pub token_holder: Account<'info, TokenHolder>,
    pub owner: Signer<'info>
}

#[account]
pub struct TokenHolder
{
    pub owner: Pubkey,
    pub balance: u64
}
