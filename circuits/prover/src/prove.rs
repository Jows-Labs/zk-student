use anyhow::{Context, Result};
use borsh::BorshDeserialize;
use sp1_sdk::prelude::*;
use sp1_sdk::{include_elf, HashableKey, ProverClient, SP1Stdin};
use zk_student_types::{CertWitness, PublicValues};

use crate::types::ProveResponse;

/// SP1 guest ELF compiled from circuits/program.
/// Requires `cargo prove build` to have been run (handled by build.rs).
const ELF: sp1_sdk::Elf = include_elf!("zk-student-circuit");

fn borsh_decode(bytes: &[u8]) -> Result<PublicValues> {
    PublicValues::try_from_slice(bytes)
        .map_err(|e| anyhow::anyhow!("Borsh deserialization failed: {e}"))
}

pub async fn prove(witness: CertWitness) -> Result<ProveResponse> {
    // SP1_PROVER env var controls the backend:
    //   "mock"    → instant, no real proof (dev/testing)
    //   "network" → Succinct Network (~10-30 s, requires SP1_PRIVATE_KEY)
    let client = ProverClient::from_env().await;

    let mut stdin = SP1Stdin::new();
    stdin.write(&witness);

    let pk = client.setup(ELF).await.context("prover setup failed")?;
    let vkey_hash = pk.verifying_key().bytes32();

    tracing::info!("starting Groth16 proof generation (vkey={})", vkey_hash);

    let proof = client
        .prove(&pk, stdin)
        .groth16()
        .await
        .context("Groth16 proof generation failed")?;

    let proof_bytes = proof.bytes();
    let public_values_bytes = proof.public_values.as_slice().to_vec();

    borsh_decode(&public_values_bytes)?; // sanity check

    tracing::info!("proof generated ({} bytes)", proof_bytes.len());

    Ok(ProveResponse {
        proof_bytes: format!("0x{}", hex::encode(&proof_bytes)),
        public_values_bytes: format!("0x{}", hex::encode(&public_values_bytes)),
        vkey_hash,
    })
}

/// Execute the circuit without generating a proof (cheap, for testing).
pub async fn execute(witness: CertWitness) -> Result<PublicValues> {
    let client = ProverClient::from_env().await;

    let mut stdin = SP1Stdin::new();
    stdin.write(&witness);

    let (output, report) = client
        .execute(ELF, stdin)
        .await
        .context("circuit execution failed")?;

    tracing::info!(
        "circuit executed: {} cycles",
        report.total_instruction_count()
    );

    borsh_decode(output.as_slice())
}
