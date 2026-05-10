use anchor_lang::prelude::*;
use borsh::BorshDeserialize;

pub mod errors;
pub mod public_values;
pub mod state;

use errors::ZkStudentError;
use public_values::PublicValues;
use state::{CertNullifier, CredentialType, ProtocolConfig, StudentCredential, TrustedIssuer};

declare_id!("8GzzGmVbwTZ982GF7kpbchEf2VVv6wWXHZrmtj8dJJ4z");

#[program]
pub mod zk_student_protocol {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, sp1_vkey_hash: [u8; 32]) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.sp1_vkey_hash = sp1_vkey_hash;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn add_issuer(
        ctx: Context<AddIssuer>,
        issuer_pubkey_hash: [u8; 32],
        credential_type: CredentialType,
        name: String,
    ) -> Result<()> {
        require!(name.len() <= 64, ZkStudentError::NameTooLong);
        let issuer = &mut ctx.accounts.issuer;
        issuer.issuer_pubkey_hash = issuer_pubkey_hash;
        issuer.credential_type = credential_type;
        issuer.name = name;
        issuer.active = true;
        issuer.added_at = Clock::get()?.unix_timestamp;
        issuer.bump = ctx.bumps.issuer;
        Ok(())
    }

    pub fn remove_issuer(ctx: Context<RemoveIssuer>, _issuer_pubkey_hash: [u8; 32]) -> Result<()> {
        ctx.accounts.issuer.active = false;
        Ok(())
    }

    pub fn transfer_authority(
        ctx: Context<TransferAuthority>,
        new_authority: Pubkey,
    ) -> Result<()> {
        ctx.accounts.config.authority = new_authority;
        Ok(())
    }

    pub fn issue_credential(
        ctx: Context<IssueCredential>,
        // Groth16 proof bytes from the prover server (`proof.bytes()`).
        // Wire sp1-solana verification here once it ships SP1 v6 VK bytes:
        //
        //   sp1_solana::verify_proof(
        //       &proof_bytes,
        //       &public_values_bytes,
        //       &hex::encode(ctx.accounts.config.sp1_vkey_hash),
        //       sp1_solana::GROTH16_VK_6_0_0_BYTES,
        //   ).map_err(|_| ZkStudentError::InvalidProof)?;
        proof_bytes: Vec<u8>,
        public_values_bytes: Vec<u8>,
        cert_nullifier: [u8; 32],
        issuer_pubkey_hash: [u8; 32],
    ) -> Result<()> {
        let _ = proof_bytes; // stubbed until sp1-solana v6 is available
        let pv = PublicValues::try_from_slice(&public_values_bytes)
            .map_err(|_| ZkStudentError::DeserializationError)?;

        // Proof must have been generated within the last hour.
        const MAX_PROOF_AGE_SECS: i64 = 3600;
        let now = Clock::get()?.unix_timestamp;
        require!(
            pv.proof_timestamp <= now && pv.proof_timestamp > now - MAX_PROOF_AGE_SECS,
            ZkStudentError::ProofTooOld
        );

        require!(
            pv.cert_nullifier == cert_nullifier,
            ZkStudentError::NullifierMismatch
        );
        require!(
            pv.issuer_pubkey_hash == issuer_pubkey_hash,
            ZkStudentError::IssuerMismatch
        );
        require!(
            pv.is_valid_student && pv.is_not_expired,
            ZkStudentError::InvalidPublicValues
        );
        require!(
            pv.cert_expires_at > Clock::get()?.unix_timestamp,
            ZkStudentError::CertificateExpired
        );

        let issuer = &ctx.accounts.issuer;
        require!(issuer.active, ZkStudentError::IssuerNotActive);
        require!(
            issuer.credential_type as u8 == pv.credential_type,
            ZkStudentError::CredentialTypeMismatch
        );

        // CertNullifier init in Accounts struct provides anti-replay for free:
        // a second call with the same cert_nullifier fails at account validation.
        ctx.accounts.cert_nullifier_pda.bump = ctx.bumps.cert_nullifier_pda;

        let credential = &mut ctx.accounts.credential;
        credential.wallet = ctx.accounts.wallet.key();
        credential.issuer_pubkey_hash = issuer_pubkey_hash;
        credential.credential_type = CredentialType::from_u8(pv.credential_type)
            .ok_or(ZkStudentError::DeserializationError)?;
        credential.issued_at = Clock::get()?.unix_timestamp;
        credential.expires_at = pv.cert_expires_at;
        credential.cert_nullifier = cert_nullifier;
        credential.bump = ctx.bumps.credential;
        Ok(())
    }

    pub fn renew_credential(
        ctx: Context<RenewCredential>,
        proof_bytes: Vec<u8>,
        public_values_bytes: Vec<u8>,
        cert_nullifier: [u8; 32],
        issuer_pubkey_hash: [u8; 32],
    ) -> Result<()> {
        let _ = proof_bytes; // same stub as issue_credential
        let pv = PublicValues::try_from_slice(&public_values_bytes)
            .map_err(|_| ZkStudentError::DeserializationError)?;

        const MAX_PROOF_AGE_SECS: i64 = 3600;
        let now = Clock::get()?.unix_timestamp;
        require!(
            pv.proof_timestamp <= now && pv.proof_timestamp > now - MAX_PROOF_AGE_SECS,
            ZkStudentError::ProofTooOld
        );

        require!(
            pv.cert_nullifier == cert_nullifier,
            ZkStudentError::NullifierMismatch
        );
        require!(
            pv.issuer_pubkey_hash == issuer_pubkey_hash,
            ZkStudentError::IssuerMismatch
        );
        require!(
            pv.is_valid_student && pv.is_not_expired,
            ZkStudentError::InvalidPublicValues
        );
        require!(
            pv.cert_expires_at > Clock::get()?.unix_timestamp,
            ZkStudentError::CertificateExpired
        );

        let issuer = &ctx.accounts.issuer;
        require!(issuer.active, ZkStudentError::IssuerNotActive);
        require!(
            issuer.credential_type as u8 == pv.credential_type,
            ZkStudentError::CredentialTypeMismatch
        );

        require!(
            ctx.accounts.credential.cert_nullifier != cert_nullifier,
            ZkStudentError::NullifierAlreadyUsed
        );

        ctx.accounts.cert_nullifier_pda.bump = ctx.bumps.cert_nullifier_pda;

        let credential = &mut ctx.accounts.credential;
        credential.expires_at = pv.cert_expires_at;
        credential.cert_nullifier = cert_nullifier;
        credential.credential_type = CredentialType::from_u8(pv.credential_type)
            .ok_or(ZkStudentError::DeserializationError)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = ProtocolConfig::SPACE,
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, ProtocolConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(issuer_pubkey_hash: [u8; 32])]
pub struct AddIssuer<'info> {
    #[account(
        init,
        payer = authority,
        space = TrustedIssuer::SPACE,
        seeds = [b"trusted-issuer", issuer_pubkey_hash.as_ref()],
        bump,
    )]
    pub issuer: Account<'info, TrustedIssuer>,
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.authority == authority.key() @ ZkStudentError::Unauthorized,
    )]
    pub config: Account<'info, ProtocolConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(issuer_pubkey_hash: [u8; 32])]
pub struct RemoveIssuer<'info> {
    #[account(
        mut,
        seeds = [b"trusted-issuer", issuer_pubkey_hash.as_ref()],
        bump = issuer.bump,
    )]
    pub issuer: Account<'info, TrustedIssuer>,
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.authority == authority.key() @ ZkStudentError::Unauthorized,
    )]
    pub config: Account<'info, ProtocolConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.authority == authority.key() @ ZkStudentError::Unauthorized,
    )]
    pub config: Account<'info, ProtocolConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(
    _proof_bytes: Vec<u8>,
    _public_values_bytes: Vec<u8>,
    cert_nullifier: [u8; 32],
    issuer_pubkey_hash: [u8; 32],
)]
pub struct IssueCredential<'info> {
    #[account(
        init,
        payer = wallet,
        space = StudentCredential::SPACE,
        seeds = [b"student-credential", wallet.key().as_ref()],
        bump,
    )]
    pub credential: Account<'info, StudentCredential>,

    #[account(
        init,
        payer = wallet,
        space = CertNullifier::SPACE,
        seeds = [b"cert-nullifier", cert_nullifier.as_ref()],
        bump,
    )]
    pub cert_nullifier_pda: Account<'info, CertNullifier>,

    #[account(
        seeds = [b"trusted-issuer", issuer_pubkey_hash.as_ref()],
        bump = issuer.bump,
    )]
    pub issuer: Account<'info, TrustedIssuer>,

    /// Needed for sp1_vkey_hash once sp1-solana v6 verification is wired in.
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, ProtocolConfig>,

    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(
    _proof_bytes: Vec<u8>,
    _public_values_bytes: Vec<u8>,
    cert_nullifier: [u8; 32],
    issuer_pubkey_hash: [u8; 32],
)]
pub struct RenewCredential<'info> {
    #[account(
        mut,
        seeds = [b"student-credential", wallet.key().as_ref()],
        bump = credential.bump,
    )]
    pub credential: Account<'info, StudentCredential>,

    #[account(
        init,
        payer = wallet,
        space = CertNullifier::SPACE,
        seeds = [b"cert-nullifier", cert_nullifier.as_ref()],
        bump,
    )]
    pub cert_nullifier_pda: Account<'info, CertNullifier>,

    #[account(
        seeds = [b"trusted-issuer", issuer_pubkey_hash.as_ref()],
        bump = issuer.bump,
    )]
    pub issuer: Account<'info, TrustedIssuer>,

    /// Needed for sp1_vkey_hash once sp1-solana v6 verification is wired in.
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, ProtocolConfig>,

    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}
