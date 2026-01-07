use anchor_lang::prelude::*;

declare_id!("FZty5PCjvydKggc42Wz9rkNov6bqXB5nsM1WWEpnmNPS");

#[program]
pub mod anchor_escrow {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
