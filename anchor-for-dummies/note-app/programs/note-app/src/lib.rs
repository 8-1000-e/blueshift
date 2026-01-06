use anchor_lang::prelude::*;

declare_id!("CR7JN8ufSUbWGVD1Nrbo81FKsqJmx3gLzVbrBRMnprcZ");

#[program]
pub mod note_app {
    use super::*;

    pub fn initialize(ctx: Context<CreateNote>, content: String) -> Result<()> 
    {
        ctx.accounts.note.owner = ctx.accounts.signer.key();
        ctx.accounts.note.content = content;
        ctx.accounts.note.bump = ctx.bumps.note;
        Ok(())
    }

    pub fn update(ctx: Context<UpdateNote>, new: String) -> Result<()> 
    {
        ctx.accounts.note.content = new;
        Ok(())
    }
}

#[account]
pub struct Note
{
    pub owner: Pubkey,
    pub content: String,
    pub bump: u8
}

#[derive(Accounts)]
pub struct CreateNote<'info>
{
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer =  signer,
        space = 8 + 32 + 4 + 200 + 1,
        seeds = [b"note", signer.key().as_ref()],
        bump
    )]
    pub note: Account<'info, Note>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
#[instruction(new: String)]
pub struct UpdateNote<'info>
{
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"note", signer.key().as_ref()],
        bump,
        realloc = 8 + 32 + 4 + new.len() + 1,
        realloc::payer = signer,
        realloc::zero = false
    )]
    pub note: Account<'info, Note>,
    pub system_program: Program<'info, System>
}