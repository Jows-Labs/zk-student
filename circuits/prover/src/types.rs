use serde::{Deserialize, Serialize};
use zk_student_types::CertWitness;

/// JSON body for POST /prove and POST /execute.
#[derive(Deserialize)]
pub struct ProveRequest {
    /// Hex-encoded full attribute certificate DER bytes.
    pub cert_der_hex: String,
    /// Hex-encoded PKCS#1 DER of the issuer RSA-2048 public key.
    pub issuer_pubkey_hex: String,
    /// 0 = DNE, 1 = ISIC.
    pub credential_type: u8,
    /// Wall-clock override (optional; defaults to server SystemTime::now()).
    pub current_timestamp: Option<i64>,
}

impl ProveRequest {
    pub fn into_witness(self) -> anyhow::Result<CertWitness> {
        Ok(CertWitness {
            cert_der: decode_hex(&self.cert_der_hex)?,
            issuer_pubkey: decode_hex(&self.issuer_pubkey_hex)?,
            credential_type: self.credential_type,
            current_timestamp: self.current_timestamp.unwrap_or_else(unix_now),
        })
    }
}

/// JSON response from POST /prove.
#[derive(Serialize)]
pub struct ProveResponse {
    /// Groth16 proof bytes as hex.
    pub proof_bytes: String,
    /// Borsh-serialized PublicValues as hex (pass directly to issue_credential).
    pub public_values_bytes: String,
    /// Circuit vkey hash as hex (set as sp1_vkey_hash in ProtocolConfig).
    pub vkey_hash: String,
}

fn decode_hex(s: &str) -> anyhow::Result<Vec<u8>> {
    let s = s.trim_start_matches("0x");
    hex::decode(s).map_err(|e| anyhow::anyhow!("hex decode error: {e}"))
}

pub fn unix_now() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .expect("system time before epoch")
        .as_secs() as i64
}
