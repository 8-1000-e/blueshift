use anchor_lang::prelude::*;

declare_id!("BvBuLQkoFHae5sWq6Pv3pjZXWo9qho2nV1EyA8jn4c6B");

#[program]
pub mod anchor_vault {
    use super::*;

    pub fn initialize(ctx: Context<InitializeVault>) -> Result<()> 
    {
        ctx.accounts.vault.bump = ctx.bumps.vault;
        Ok(())
    }

    pub fn deposite(ctx: Context<Deposit>, amount: u64) -> Result<()> 
    {
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to : ctx.accounts.vault.to_account_info()
                }
            ),
            amount
        )?;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> 
    {
        let amount = ctx.accounts.vault.to_account_info().lamports();
        ctx.accounts.vault.sub_lamports(amount)?;
        ctx.accounts.user.add_lamports(amount)?;
        Ok(())
    }

}

#[account]
pub struct Vault
{
    pub bump: u8,
}

#[derive(Accounts)]
pub struct InitializeVault<'info>
{
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = 8 + 1,
        seeds= [b"vault", user.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct Deposit<'info>
{
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds= [b"vault", user.key().as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct Withdraw<'info>
{
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds= [b"vault", user.key().as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,
    pub system_program: Program<'info, System>
}