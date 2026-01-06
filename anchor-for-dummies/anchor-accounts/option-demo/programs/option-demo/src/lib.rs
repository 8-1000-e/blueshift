use anchor_lang::prelude::*;

declare_id!("4YJpT7UmWbd9qhp4MifLYzS8Angb5Qn9zn2MZVi8HkmP");

#[program]
pub mod option_demo {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> 
    {
        ctx.accounts.optional_data.value = 0;
        Ok(())
    }

    pub fn check_optional(ctx: Context<CheckOptional>) -> Result<()> 
    {
        if let Some(data) = &ctx.accounts.optional_data
        {
            msg!("Account initialized with value of: {}",data.value);
        }
        else
        {
            msg!("Account not initialized!");
        }
        Ok(())
    }
}

#[account]
pub struct OptionalData
{
    pub value: u64
}

#[derive(Accounts)]
pub struct CheckOptional<'info>
{
    signer : Signer<'info>,
    optional_data: Option<Account<'info, OptionalData>>
}

#[derive(Accounts)]
pub struct Initialize<'info>
{
    #[account(mut)]
    signer : Signer<'info>,
    #[account(
        init,
        payer = signer,
        space = 8 + 8,
    )]
    pub optional_data: Account<'info, OptionalData>,
    pub system_program: Program<'info, System>
}