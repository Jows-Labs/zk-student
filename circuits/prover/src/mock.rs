use anyhow::{Context, Result};
use rsa::pkcs1::EncodeRsaPublicKey;
use zk_student::mock::{mock_cert_from, CertInput};
use zk_student_types::CertWitness;

/// Build a signed CertWitness from the zk-student-lib mock builder.
/// Generates a real CACIE v3.0 attribute certificate (Portaria ITI nº 68/2019)
/// signed with RSA-SHA1, ready to feed directly into the SP1 circuit.
///
/// If MOCK_ISSUER_SK_DER is set in the environment, that key is used for signing
/// (consistent with the registered issuer on-chain). Otherwise falls back to the
/// seeded deterministic key.
pub fn make_mock_witness(
    birth_date: &str, // "DDMMYYYY" Brazilian format (e.g. "15062000")
    not_after: &str,  // GeneralizedTime "YYYYMMDDHHMMSSZ" (e.g. "20270331235959Z")
    credential_type: u8,
    current_timestamp: i64,
) -> Result<CertWitness> {
    let input = CertInput {
        birth_date: birth_date.to_string(),
        not_after: not_after.to_string(),
        ..CertInput::default()
    };

    let mock = mock_cert_from(&input);

    let issuer_pubkey = mock
        .issuer_pubkey
        .to_pkcs1_der()
        .context("failed to encode mock issuer public key")?
        .to_vec();

    Ok(CertWitness {
        cert_der: mock.der,
        issuer_pubkey,
        credential_type,
        current_timestamp,
    })
}
