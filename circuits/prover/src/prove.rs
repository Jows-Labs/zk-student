use anyhow::{Context, Result};
use borsh::BorshDeserialize;
use sp1_sdk::{include_elf, HashableKey, ProverClient, SP1Stdin};
use sp1_verifier::Groth16Verifier;
use zk_student_types::{CertWitness, PublicValues};

use crate::types::ProveResponse;

const ELF: &[u8] = include_elf!("zk-student-circuit");

fn borsh_decode(bytes: &[u8]) -> Result<PublicValues> {
    PublicValues::try_from_slice(bytes)
        .map_err(|e| anyhow::anyhow!("Borsh deserialization failed: {e}"))
}

pub async fn prove(witness: CertWitness) -> Result<ProveResponse> {
    let client = ProverClient::from_env();

    let mut stdin = SP1Stdin::new();
    stdin.write(&witness);

    let (pk, vk) = client.setup(ELF);
    let vkey_hash = vk.bytes32();

    tracing::info!("starting Groth16 proof generation (vkey={})", vkey_hash);

    let proof = client
        .prove(&pk, &stdin)
        .groth16()
        .run()
        .context("Groth16 proof generation failed")?;

    let proof_bytes = proof.bytes();
    let public_values_bytes = proof.public_values.as_slice().to_vec();

    borsh_decode(&public_values_bytes)?;

    let is_mock = std::env::var("SP1_PROVER").as_deref() == Ok("mock");
    if !is_mock {
        Groth16Verifier::verify(
            &proof_bytes,
            &public_values_bytes,
            &vkey_hash,
            &sp1_verifier::GROTH16_VK_BYTES,
        )
        .context("off-chain Groth16 verification failed")?;
    }

    tracing::info!("proof generated and verified ({} bytes)", proof_bytes.len());

    Ok(ProveResponse {
        proof_bytes: format!("0x{}", hex::encode(&proof_bytes)),
        public_values_bytes: format!("0x{}", hex::encode(&public_values_bytes)),
        vkey_hash,
    })
}

pub async fn execute(witness: CertWitness) -> Result<PublicValues> {
    let client = ProverClient::from_env();

    let mut stdin = SP1Stdin::new();
    stdin.write(&witness);

    let (output, report) = client
        .execute(ELF, &stdin)
        .run()
        .context("circuit execution failed")?;

    tracing::info!(
        "circuit executed: {} cycles",
        report.total_instruction_count()
    );

    borsh_decode(output.as_slice())
}

#[cfg(test)]
mod tests {
    use super::execute;
    use crate::mock::make_mock_witness;

    #[tokio::test]
    async fn execute_with_mock_cert() {
        let witness = make_mock_witness("01012000", "20270331235959Z", 0, 1_746_000_000)
            .expect("make_mock_witness");
        let pv = execute(witness).await.expect("execute");
        assert!(pv.is_valid_student, "RSA-SHA1 signature must verify");
        assert!(
            pv.is_not_expired,
            "cert must not be expired at test timestamp"
        );
        assert_eq!(pv.credential_type, 0);
        assert_ne!(pv.cert_nullifier, [0u8; 32]);
    }
}
