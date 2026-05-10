use anchor_lang::prelude::*;

#[account]
pub struct ProtocolConfig {
    pub authority: Pubkey,
    pub sp1_vkey_hash: [u8; 32],
    pub bump: u8,
}

impl ProtocolConfig {
    pub const SPACE: usize = 8 + 32 + 32 + 1;
}

#[account]
pub struct TrustedIssuer {
    pub issuer_pubkey_hash: [u8; 32],
    pub credential_type: CredentialType,
    pub name: String,
    pub active: bool,
    pub added_at: i64,
    pub bump: u8,
}

impl TrustedIssuer {
    // name capped at 64 bytes
    pub const SPACE: usize = 8 + 32 + 1 + (4 + 64) + 1 + 8 + 1;
}

#[account]
pub struct StudentCredential {
    pub wallet: Pubkey,
    pub issuer_pubkey_hash: [u8; 32],
    pub credential_type: CredentialType,
    pub issued_at: i64,
    pub expires_at: i64,
    pub cert_nullifier: [u8; 32],
    pub bump: u8,
}

impl StudentCredential {
    pub const SPACE: usize = 8 + 32 + 32 + 1 + 8 + 8 + 32 + 1;
}

#[account]
pub struct CertNullifier {
    pub bump: u8,
}

impl CertNullifier {
    pub const SPACE: usize = 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum CredentialType {
    Dne = 0,
    Isic = 1,
}

impl CredentialType {
    pub fn from_u8(v: u8) -> Option<Self> {
        match v {
            0 => Some(Self::Dne),
            1 => Some(Self::Isic),
            _ => None,
        }
    }
}
