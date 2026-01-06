use anchor_lang::prelude::*;

declare_id!("5c3oBQd7nzYikEtGKayBcLWDbqt175ooKs9RuTGg5f6p");

use anchor_lang::solana_program::pubkey;
pub const ADMIN_PUBKEY: Pubkey = pubkey!("69TwH2GJiBSA8Eo3DunPGsXGWjNFY267zRrpHptYWCuC"); 

#[program]
pub mod admin_only {
    use super::*;

    pub fn admin_action(_ctx: Context<AdminAction>) -> Result<()> 
    {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct AdminAction<'info>
{
    #[account(
        mut,
        constraint = signer.key() == ADMIN_PUBKEY @ ErrorCode::Unauthorized,
    )]
    pub signer: Signer<'info>
}

#[error_code]
pub enum ErrorCode
{
    #[msg("User is not authorized !")]
    Unauthorized
}
