use anchor_lang::prelude::*;

declare_id!("7xAURQchZDRPKvt7jBvqfkhi7qZG7s3rChVNzzatbN8r");

#[program]
pub mod anchor_vault 
{
    use super::*;

    pub fn deposit (ctx:Context<VaultAction>, amount: u64) -> Result<()>
    {
        if amount == 0{
            return Err(VaultError::InvalidAmount.into());
        }

        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer{
                from: ctx.accounts.signer.to_account_info(),
                to: ctx.accounts.vault.to_account_info()
            },
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;
        Ok(())
    }

    pub fn withdraw(ctx: Context<WithdrawAction>) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let amount = vault.lamports();
    
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.vault.to_account_info(),   // ← inverse de deposit
                to: ctx.accounts.signer.to_account_info()     // ← inverse de deposit
            },
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;
        Ok(())
    }
    


}

#[derive(Accounts)]
pub struct VaultAction <'info>
{
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct WithdrawAction <'info>
{
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub vault: Signer<'info>,
    pub system_program: Program<'info, System>
}

#[error_code]
pub enum VaultError
{
    #[msg("Vault already exists")]
    VaultAlreadyExist,
    #[msg("Invalid amount")]
    InvalidAmount
}