use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::TokenAccount;

declare_id!("3WW9yRoKnyNF484EnrZxde51HZH2Bz3TKCxGhWFDU6UJ");

#[program]
pub mod token_demo {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
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
        mint::decimals = 9,
        mint::authority = signer
    )]
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    #[account(
        init,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = signer
    )]
    pub token_account: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>
}
