use borsh::{BorshDeserialize, BorshSerialize};
use serde::{Deserialize, Serialize};

/// Private witness consumed by the SP1 circuit.
/// Serialized via bincode for the zkVM stdin channel.
#[derive(Serialize, Deserialize, Clone)]
pub struct CertWitness {
    /// Full attribute certificate DER bytes (outer SEQUENCE).
    /// The circuit parses TBS, verifies the signature, and extracts
    /// birth_date / not_after directly from the signed structure.
    pub cert_der: Vec<u8>,
    /// PKCS#1 DER bytes of the issuer RSA-2048 public key.
    /// Hashed (SHA-256) to produce issuer_pubkey_hash in PublicValues.
    pub issuer_pubkey: Vec<u8>,
    /// Credential type: 0 = DNE, 1 = ISIC.
    pub credential_type: u8,
    /// Wall-clock at proof time. Committed as proof_timestamp so the
    /// on-chain program can enforce freshness (proof must be submitted
    /// within MAX_PROOF_AGE of Clock::get()).
    pub current_timestamp: i64,
}

/// Public outputs committed by the circuit.
///
/// Borsh field order and types must remain identical to
/// `programs/zk-student-protocol/src/public_values.rs` — the on-chain
/// program deserializes this byte-for-byte.
#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone, Debug)]
pub struct PublicValues {
    pub is_valid_student: bool,
    pub is_not_expired: bool,
    pub issuer_pubkey_hash: [u8; 32],
    pub credential_type: u8,
    pub cert_expires_at: i64,
    pub cert_nullifier: [u8; 32],
    /// Unix timestamp at which the proof was generated.
    pub proof_timestamp: i64,
}
