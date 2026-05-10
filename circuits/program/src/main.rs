#![no_main]
sp1_zkvm::entrypoint!(main);

use rsa::{pkcs1::DecodeRsaPublicKey, RsaPublicKey};
use sha2::{Digest, Sha256};
use zk_student::cert::{parse_der, verify_signature};
use zk_student_types::{CertWitness, PublicValues};

// Julian day of the Unix epoch (1970-01-01)
const UNIX_EPOCH_JULIAN_DAY: i64 = 2_440_588;

fn date_to_unix(d: time::Date) -> i64 {
    (d.to_julian_day() as i64 - UNIX_EPOCH_JULIAN_DAY) * 86400
}

pub fn main() {
    let witness = sp1_zkvm::io::read::<CertWitness>();

    // birth_date, not_after, tbs_bytes all come from the signed TBS structure —
    // none are free witness fields, so they cannot be forged without a valid issuer signature.
    let ac = parse_der(&witness.cert_der).expect("invalid cert DER");

    let issuer_pubkey =
        RsaPublicKey::from_pkcs1_der(&witness.issuer_pubkey).expect("invalid RSA public key DER");
    let issuer_pubkey_hash: [u8; 32] = Sha256::digest(&witness.issuer_pubkey).into();

    // SHA256(issuer_pubkey_hash || SHA256(tbs_bytes)) — unique per cert, prevents replay across issuers.
    let tbs_hash: [u8; 32] = Sha256::digest(&ac.tbs_bytes).into();
    let cert_nullifier: [u8; 32] = {
        let mut h = Sha256::new();
        h.update(issuer_pubkey_hash);
        h.update(tbs_hash);
        h.finalize().into()
    };

    // RSA-SHA1 over tbs_bytes — Portaria ITI nº 68/2019, CACIE v3.0.
    let is_valid_student = verify_signature(&ac, &issuer_pubkey).is_ok();

    let cert_expires_at = date_to_unix(ac.fields.not_after);
    let is_not_expired = cert_expires_at > witness.current_timestamp;

    let pv = PublicValues {
        is_valid_student,
        is_not_expired,
        issuer_pubkey_hash,
        credential_type: witness.credential_type,
        cert_expires_at,
        cert_nullifier,
        proof_timestamp: witness.current_timestamp,
    };

    sp1_zkvm::io::commit_slice(&borsh::to_vec(&pv).expect("borsh serialization failed"));
}
