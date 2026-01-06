use anchor_lang::prelude::*;

declare_id!("ACZZ6fhbaoYChTMXDEGagee7pu2LzxMu37pee2XBhdns");

#[program]
pub mod discriminateurs {
    use super::*;

    pub fn create_profile(ctx: Context<CreateProfile>, name: String, level: u8) -> Result<()> {
        ctx.accounts.profile.name = name;
        ctx.accounts.profile.level = level;
        Ok(())
    }
}


#[account]
pub struct UserProfile
{
    pub name: String,
    pub level: u8
}

#[derive(Accounts)]
pub struct CreateProfile<'info>
{
    #[account(mut)]
    pub signer :Signer<'info>,
    #[account(
        init,
        payer = signer,
        space = 8 + 4 + 32 + 1,
    )]
    pub profile: Account<'info, UserProfile>,
    pub system_program: Program<'info, System>
}
