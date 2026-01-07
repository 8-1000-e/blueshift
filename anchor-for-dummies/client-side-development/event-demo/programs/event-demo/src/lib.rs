use anchor_lang::prelude::*;

declare_id!("EgbZBGLaqpn1GEYSB2XF3BtgaiFAvHtSTQjCzyvHenNz");

#[program]
pub mod event_demo {
    use super::*;

    pub fn emit_event(_ctx: Context<EmitEvent>, msg: String) -> Result<()> 
    {
        emit!(CustomEvent {message: msg});
        Ok(())
    }
}

#[event]
pub struct CustomEvent
{
    pub message: String
}

#[derive(Accounts)]
pub struct EmitEvent {}
