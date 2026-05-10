use anchor_lang::prelude::*;
use zk_student_protocol::state::StudentCredential;

declare_id!("HoK1YHdbfTQppTnquqAcGQ4v3DZczz7e7CnmDSm9v9FX");

const ZK_STUDENT_PROTOCOL_ID: Pubkey = pubkey!("8GzzGmVbwTZ982GF7kpbchEf2VVv6wWXHZrmtj8dJJ4z");

#[program]
pub mod zk_meia {
    use super::*;

    pub fn claim_discount(ctx: Context<ClaimDiscount>) -> Result<()> {
        emit!(DiscountClaimed {
            wallet:     ctx.accounts.wallet.key(),
            expires_at: ctx.accounts.credential.expires_at,
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ClaimDiscount<'info> {
    /// seeds::program enforces PDA derivation from the protocol, not this program —
    /// prevents a fake credential being passed in.
    #[account(
        seeds          = [b"student-credential", wallet.key().as_ref()],
        bump           = credential.bump,
        seeds::program = ZK_STUDENT_PROTOCOL_ID,
        constraint     = credential.expires_at > Clock::get()?.unix_timestamp
            @ ZkMeiaError::CredentialExpired,
    )]
    pub credential: Account<'info, StudentCredential>,
    pub wallet:     Signer<'info>,
}

#[event]
pub struct DiscountClaimed {
    pub wallet:     Pubkey,
    pub expires_at: i64,
}

#[error_code]
pub enum ZkMeiaError {
    #[msg("Student credential is expired")]
    CredentialExpired,
}
