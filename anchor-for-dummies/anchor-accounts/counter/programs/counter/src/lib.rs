use anchor_lang::prelude::*;

declare_id!("8ac9CcfS2XwWvpFR8p5sF9KFEtUobavSWRwxqbzmCXhk");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.counter.count = 0;
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        ctx.accounts.counter.count += 1;
        Ok(())
    }

    pub fn decrement(ctx: Context<Decrement>) -> Result<()> {
        ctx.accounts.counter.count -= 1;
        Ok(())
    } 

    pub fn close(ctx: Context<Close>) -> Result<()> {
        Ok(())
    } 

}

#[account]
pub struct Counter
{
    pub count: u64
}

#[derive(Accounts)]
pub struct Initialize<'info>
{
  #[account(mut)]
  pub signer: Signer<'info>,
  #[account(
    init, 
    payer = signer,
    space = 8 + 8
  )]
  pub counter: Account<'info, Counter>,
  pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct Increment<'info>
{
    #[account(mut)]
    pub counter: Account<'info, Counter>,
}

#[derive(Accounts)]
pub struct Decrement<'info>
{
    #[account(mut)]
    pub counter: Account<'info, Counter>,
}

#[derive(Accounts)]
pub struct Close<'info>
{
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        close = signer,
    )]
    pub counter: Account<'info, Counter>,
}