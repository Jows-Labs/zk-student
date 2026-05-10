use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PublicValues {
    pub is_valid_student: bool,
    pub is_not_expired: bool,
    pub issuer_pubkey_hash: [u8; 32],
    pub credential_type: u8,
    pub cert_expires_at: i64,
    pub cert_nullifier: [u8; 32],
    pub proof_timestamp: i64,
}
