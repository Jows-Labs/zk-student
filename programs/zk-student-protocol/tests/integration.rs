#![cfg(test)]
#![allow(deprecated, unused_imports)]

use anchor_lang::AccountDeserialize;
use borsh::BorshSerialize;
use solana_program_test::ProgramTest;
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    system_instruction, system_program,
    sysvar::clock::Clock,
    transaction::Transaction,
};
use std::path::Path;
use zk_student_protocol::{
    public_values::PublicValues,
    state::{CredentialType, ProtocolConfig, StudentCredential, TrustedIssuer},
};

const PROG: Pubkey = zk_student_protocol::ID;

// anchor-lang 0.32.1 uses solana-invoke which panics in native (non-SBF) mode.
// We run the compiled .so via SBF mode instead. Requires `anchor build` first.
fn program_test() -> ProgramTest {
    let deploy_dir = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../target/deploy")
        .canonicalize()
        .expect("target/deploy not found — run `anchor build` first");
    std::env::set_var("BPF_OUT_DIR", deploy_dir.to_str().unwrap());
    ProgramTest::new("zk_student_protocol", PROG, None)
}

fn disc(name: &str) -> [u8; 8] {
    let preimage = format!("global:{name}");
    let hash = solana_sdk::hash::hashv(&[preimage.as_bytes()]);
    let mut d = [0u8; 8];
    d.copy_from_slice(&hash.as_ref()[..8]);
    d
}

fn config_pda() -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"config"], &PROG)
}

fn issuer_pda(hash: &[u8; 32]) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"trusted-issuer", hash.as_ref()], &PROG)
}

fn credential_pda(wallet: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"student-credential", wallet.as_ref()], &PROG)
}

fn nullifier_pda(nullifier: &[u8; 32]) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"cert-nullifier", nullifier.as_ref()], &PROG)
}

fn ix_initialize(authority: Pubkey, sp1_vkey_hash: [u8; 32]) -> Instruction {
    let (config, _) = config_pda();
    let mut data = disc("initialize").to_vec();
    data.extend_from_slice(&sp1_vkey_hash);
    Instruction {
        program_id: PROG,
        accounts: vec![
            AccountMeta::new(config, false),
            AccountMeta::new(authority, true),
            AccountMeta::new_readonly(system_program::ID, false),
        ],
        data,
    }
}

fn ix_add_issuer(
    authority: Pubkey,
    issuer_hash: [u8; 32],
    credential_type: CredentialType,
    name: &str,
) -> Instruction {
    let (issuer, _) = issuer_pda(&issuer_hash);
    let (config, _) = config_pda();
    let name_bytes = name.as_bytes();
    let mut data = disc("add_issuer").to_vec();
    data.extend_from_slice(&issuer_hash);
    data.push(credential_type as u8);
    data.extend_from_slice(&(name_bytes.len() as u32).to_le_bytes());
    data.extend_from_slice(name_bytes);
    Instruction {
        program_id: PROG,
        accounts: vec![
            AccountMeta::new(issuer, false),
            AccountMeta::new_readonly(config, false),
            AccountMeta::new(authority, true),
            AccountMeta::new_readonly(system_program::ID, false),
        ],
        data,
    }
}

fn ix_remove_issuer(authority: Pubkey, issuer_hash: [u8; 32]) -> Instruction {
    let (issuer, _) = issuer_pda(&issuer_hash);
    let (config, _) = config_pda();
    let mut data = disc("remove_issuer").to_vec();
    data.extend_from_slice(&issuer_hash);
    Instruction {
        program_id: PROG,
        accounts: vec![
            AccountMeta::new(issuer, false),
            AccountMeta::new_readonly(config, false),
            AccountMeta::new_readonly(authority, true),
        ],
        data,
    }
}

fn ix_renew_credential(
    wallet: Pubkey,
    cert_nullifier: [u8; 32],
    issuer_hash: [u8; 32],
    pv_bytes: Vec<u8>,
) -> Instruction {
    let (credential, _) = credential_pda(&wallet);
    let (null_pda, _) = nullifier_pda(&cert_nullifier);
    let (issuer, _) = issuer_pda(&issuer_hash);
    let (config, _) = config_pda();
    let mut data = disc("renew_credential").to_vec();
    data.extend_from_slice(&0u32.to_le_bytes());
    data.extend_from_slice(&(pv_bytes.len() as u32).to_le_bytes());
    data.extend(&pv_bytes);
    data.extend_from_slice(&cert_nullifier);
    data.extend_from_slice(&issuer_hash);
    Instruction {
        program_id: PROG,
        accounts: vec![
            AccountMeta::new(credential, false),
            AccountMeta::new(null_pda, false),
            AccountMeta::new_readonly(issuer, false),
            AccountMeta::new_readonly(config, false),
            AccountMeta::new(wallet, true),
            AccountMeta::new_readonly(system_program::ID, false),
        ],
        data,
    }
}

fn ix_issue_credential(
    wallet: Pubkey,
    cert_nullifier: [u8; 32],
    issuer_hash: [u8; 32],
    pv_bytes: Vec<u8>,
) -> Instruction {
    let (credential, _) = credential_pda(&wallet);
    let (null_pda, _) = nullifier_pda(&cert_nullifier);
    let (issuer, _) = issuer_pda(&issuer_hash);
    let (config, _) = config_pda();
    let mut data = disc("issue_credential").to_vec();
    data.extend_from_slice(&0u32.to_le_bytes());
    data.extend_from_slice(&(pv_bytes.len() as u32).to_le_bytes());
    data.extend(&pv_bytes);
    data.extend_from_slice(&cert_nullifier);
    data.extend_from_slice(&issuer_hash);
    Instruction {
        program_id: PROG,
        accounts: vec![
            AccountMeta::new(credential, false),
            AccountMeta::new(null_pda, false),
            AccountMeta::new_readonly(issuer, false),
            AccountMeta::new_readonly(config, false),
            AccountMeta::new(wallet, true),
            AccountMeta::new_readonly(system_program::ID, false),
        ],
        data,
    }
}

fn make_pv(
    issuer_hash: [u8; 32],
    cert_nullifier: [u8; 32],
    expires_at: i64,
    proof_timestamp: i64,
) -> Vec<u8> {
    PublicValues {
        is_valid_student: true,
        is_not_expired: true,
        issuer_pubkey_hash: issuer_hash,
        credential_type: 0,
        cert_expires_at: expires_at,
        cert_nullifier,
        proof_timestamp,
    }
    .try_to_vec()
    .unwrap()
}

async fn setup() -> (solana_program_test::BanksClient, Keypair, [u8; 32]) {
    let (banks, payer, blockhash) = program_test().start().await;

    let tx = Transaction::new_signed_with_payer(
        &[ix_initialize(payer.pubkey(), [0u8; 32])],
        Some(&payer.pubkey()),
        &[&payer],
        blockhash,
    );
    banks.process_transaction(tx).await.unwrap();

    let issuer_hash = [1u8; 32];
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    let tx = Transaction::new_signed_with_payer(
        &[ix_add_issuer(
            payer.pubkey(),
            issuer_hash,
            CredentialType::Dne,
            "DNE",
        )],
        Some(&payer.pubkey()),
        &[&payer],
        blockhash,
    );
    banks.process_transaction(tx).await.unwrap();

    (banks, payer, issuer_hash)
}

#[tokio::test]
async fn test_initialize() {
    let (banks, payer, blockhash) = program_test().start().await;

    let tx = Transaction::new_signed_with_payer(
        &[ix_initialize(payer.pubkey(), [7u8; 32])],
        Some(&payer.pubkey()),
        &[&payer],
        blockhash,
    );
    banks.process_transaction(tx).await.unwrap();

    let (config_key, _) = config_pda();
    let raw = banks.get_account(config_key).await.unwrap().unwrap();
    let config = ProtocolConfig::try_deserialize(&mut raw.data.as_ref()).unwrap();
    assert_eq!(config.authority, payer.pubkey());
    assert_eq!(config.sp1_vkey_hash, [7u8; 32]);
}

#[tokio::test]
async fn test_add_issuer() {
    let (banks, _payer, issuer_hash) = setup().await;

    let (issuer_key, _) = issuer_pda(&issuer_hash);
    let raw = banks.get_account(issuer_key).await.unwrap().unwrap();
    let issuer = TrustedIssuer::try_deserialize(&mut raw.data.as_ref()).unwrap();
    assert_eq!(issuer.issuer_pubkey_hash, issuer_hash);
    assert!(issuer.active);
    assert_eq!(issuer.name, "DNE");
}

#[tokio::test]
async fn test_add_issuer_unauthorized() {
    let (banks, payer, _) = setup().await;

    let attacker = Keypair::new();
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    let tx = Transaction::new_signed_with_payer(
        &[system_instruction::transfer(
            &payer.pubkey(),
            &attacker.pubkey(),
            1_000_000_000,
        )],
        Some(&payer.pubkey()),
        &[&payer],
        blockhash,
    );
    banks.process_transaction(tx).await.unwrap();

    let fake_hash = [2u8; 32];
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    let tx = Transaction::new_signed_with_payer(
        &[ix_add_issuer(
            attacker.pubkey(),
            fake_hash,
            CredentialType::Dne,
            "Fake",
        )],
        Some(&attacker.pubkey()),
        &[&attacker],
        blockhash,
    );
    assert!(banks.process_transaction(tx).await.is_err());
}

#[tokio::test]
async fn test_issue_credential() {
    let (banks, payer, issuer_hash) = setup().await;

    let student = Keypair::new();
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    let tx = Transaction::new_signed_with_payer(
        &[system_instruction::transfer(
            &payer.pubkey(),
            &student.pubkey(),
            1_000_000_000,
        )],
        Some(&payer.pubkey()),
        &[&payer],
        blockhash,
    );
    banks.process_transaction(tx).await.unwrap();

    let cert_nullifier = [99u8; 32];
    let expires_at = 9_999_999_999i64;
    let now = banks.get_sysvar::<Clock>().await.unwrap().unix_timestamp;
    let pv_bytes = make_pv(issuer_hash, cert_nullifier, expires_at, now);

    let blockhash = banks.get_latest_blockhash().await.unwrap();
    let tx = Transaction::new_signed_with_payer(
        &[ix_issue_credential(
            student.pubkey(),
            cert_nullifier,
            issuer_hash,
            pv_bytes,
        )],
        Some(&student.pubkey()),
        &[&student],
        blockhash,
    );
    banks.process_transaction(tx).await.unwrap();

    let (cred_key, _) = credential_pda(&student.pubkey());
    let raw = banks.get_account(cred_key).await.unwrap().unwrap();
    let cred = StudentCredential::try_deserialize(&mut raw.data.as_ref()).unwrap();
    assert_eq!(cred.wallet, student.pubkey());
    assert_eq!(cred.cert_nullifier, cert_nullifier);
    assert_eq!(cred.expires_at, expires_at);
}

#[tokio::test]
async fn test_nullifier_anti_replay() {
    let (banks, payer, issuer_hash) = setup().await;

    let student = Keypair::new();
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    let tx = Transaction::new_signed_with_payer(
        &[system_instruction::transfer(
            &payer.pubkey(),
            &student.pubkey(),
            2_000_000_000,
        )],
        Some(&payer.pubkey()),
        &[&payer],
        blockhash,
    );
    banks.process_transaction(tx).await.unwrap();

    let cert_nullifier = [77u8; 32];
    let now = banks.get_sysvar::<Clock>().await.unwrap().unix_timestamp;
    let pv_bytes = make_pv(issuer_hash, cert_nullifier, 9_999_999_999, now);

    let blockhash = banks.get_latest_blockhash().await.unwrap();
    let tx = Transaction::new_signed_with_payer(
        &[ix_issue_credential(
            student.pubkey(),
            cert_nullifier,
            issuer_hash,
            pv_bytes,
        )],
        Some(&student.pubkey()),
        &[&student],
        blockhash,
    );
    banks.process_transaction(tx).await.unwrap();

    let student2 = Keypair::new();
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    let tx = Transaction::new_signed_with_payer(
        &[system_instruction::transfer(
            &payer.pubkey(),
            &student2.pubkey(),
            1_000_000_000,
        )],
        Some(&payer.pubkey()),
        &[&payer],
        blockhash,
    );
    banks.process_transaction(tx).await.unwrap();

    let now2 = banks.get_sysvar::<Clock>().await.unwrap().unix_timestamp;
    let pv_bytes2 = make_pv(issuer_hash, cert_nullifier, 9_999_999_999, now2);
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    let tx = Transaction::new_signed_with_payer(
        &[ix_issue_credential(
            student2.pubkey(),
            cert_nullifier,
            issuer_hash,
            pv_bytes2,
        )],
        Some(&student2.pubkey()),
        &[&student2],
        blockhash,
    );
    assert!(banks.process_transaction(tx).await.is_err());
}

#[tokio::test]
async fn test_remove_issuer() {
    let (banks, payer, issuer_hash) = setup().await;

    let blockhash = banks.get_latest_blockhash().await.unwrap();
    let tx = Transaction::new_signed_with_payer(
        &[ix_remove_issuer(payer.pubkey(), issuer_hash)],
        Some(&payer.pubkey()),
        &[&payer],
        blockhash,
    );
    banks.process_transaction(tx).await.unwrap();

    let (issuer_key, _) = issuer_pda(&issuer_hash);
    let raw = banks.get_account(issuer_key).await.unwrap().unwrap();
    let issuer = TrustedIssuer::try_deserialize(&mut raw.data.as_ref()).unwrap();
    assert!(!issuer.active);
}

#[tokio::test]
async fn test_issue_rejects_invalid_student() {
    let (banks, payer, issuer_hash) = setup().await;
    let student = Keypair::new();
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[system_instruction::transfer(
                &payer.pubkey(),
                &student.pubkey(),
                1_000_000_000,
            )],
            Some(&payer.pubkey()),
            &[&payer],
            blockhash,
        ))
        .await
        .unwrap();

    let cert_nullifier = [10u8; 32];
    let now = banks.get_sysvar::<Clock>().await.unwrap().unix_timestamp;
    let pv = PublicValues {
        is_valid_student: false,
        is_not_expired: true,
        issuer_pubkey_hash: issuer_hash,
        credential_type: 0,
        cert_expires_at: 9_999_999_999,
        cert_nullifier,
        proof_timestamp: now,
    }
    .try_to_vec()
    .unwrap();

    let blockhash = banks.get_latest_blockhash().await.unwrap();
    assert!(banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[ix_issue_credential(
                student.pubkey(),
                cert_nullifier,
                issuer_hash,
                pv
            )],
            Some(&student.pubkey()),
            &[&student],
            blockhash,
        ))
        .await
        .is_err());
}

#[tokio::test]
async fn test_issue_rejects_expired_cert() {
    let (banks, payer, issuer_hash) = setup().await;
    let student = Keypair::new();
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[system_instruction::transfer(
                &payer.pubkey(),
                &student.pubkey(),
                1_000_000_000,
            )],
            Some(&payer.pubkey()),
            &[&payer],
            blockhash,
        ))
        .await
        .unwrap();

    let cert_nullifier = [11u8; 32];
    let now = banks.get_sysvar::<Clock>().await.unwrap().unix_timestamp;
    let pv = PublicValues {
        is_valid_student: true,
        is_not_expired: true,
        issuer_pubkey_hash: issuer_hash,
        credential_type: 0,
        cert_expires_at: now - 1,
        cert_nullifier,
        proof_timestamp: now,
    }
    .try_to_vec()
    .unwrap();

    let blockhash = banks.get_latest_blockhash().await.unwrap();
    assert!(banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[ix_issue_credential(
                student.pubkey(),
                cert_nullifier,
                issuer_hash,
                pv
            )],
            Some(&student.pubkey()),
            &[&student],
            blockhash,
        ))
        .await
        .is_err());
}

#[tokio::test]
async fn test_issue_rejects_stale_proof() {
    let (banks, payer, issuer_hash) = setup().await;
    let student = Keypair::new();
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[system_instruction::transfer(
                &payer.pubkey(),
                &student.pubkey(),
                1_000_000_000,
            )],
            Some(&payer.pubkey()),
            &[&payer],
            blockhash,
        ))
        .await
        .unwrap();

    let cert_nullifier = [12u8; 32];
    let now = banks.get_sysvar::<Clock>().await.unwrap().unix_timestamp;
    let pv = PublicValues {
        is_valid_student: true,
        is_not_expired: true,
        issuer_pubkey_hash: issuer_hash,
        credential_type: 0,
        cert_expires_at: 9_999_999_999,
        cert_nullifier,
        proof_timestamp: now - 7201,
    }
    .try_to_vec()
    .unwrap();

    let blockhash = banks.get_latest_blockhash().await.unwrap();
    assert!(banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[ix_issue_credential(
                student.pubkey(),
                cert_nullifier,
                issuer_hash,
                pv
            )],
            Some(&student.pubkey()),
            &[&student],
            blockhash,
        ))
        .await
        .is_err());
}

#[tokio::test]
async fn test_issue_rejects_future_proof() {
    let (banks, payer, issuer_hash) = setup().await;
    let student = Keypair::new();
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[system_instruction::transfer(
                &payer.pubkey(),
                &student.pubkey(),
                1_000_000_000,
            )],
            Some(&payer.pubkey()),
            &[&payer],
            blockhash,
        ))
        .await
        .unwrap();

    let cert_nullifier = [13u8; 32];
    let now = banks.get_sysvar::<Clock>().await.unwrap().unix_timestamp;
    let pv = PublicValues {
        is_valid_student: true,
        is_not_expired: true,
        issuer_pubkey_hash: issuer_hash,
        credential_type: 0,
        cert_expires_at: 9_999_999_999,
        cert_nullifier,
        proof_timestamp: now + 100,
    }
    .try_to_vec()
    .unwrap();

    let blockhash = banks.get_latest_blockhash().await.unwrap();
    assert!(banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[ix_issue_credential(
                student.pubkey(),
                cert_nullifier,
                issuer_hash,
                pv
            )],
            Some(&student.pubkey()),
            &[&student],
            blockhash,
        ))
        .await
        .is_err());
}

#[tokio::test]
async fn test_issue_rejects_nullifier_mismatch() {
    let (banks, payer, issuer_hash) = setup().await;
    let student = Keypair::new();
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[system_instruction::transfer(
                &payer.pubkey(),
                &student.pubkey(),
                1_000_000_000,
            )],
            Some(&payer.pubkey()),
            &[&payer],
            blockhash,
        ))
        .await
        .unwrap();

    let cert_nullifier = [14u8; 32];
    let now = banks.get_sysvar::<Clock>().await.unwrap().unix_timestamp;
    let pv = PublicValues {
        is_valid_student: true,
        is_not_expired: true,
        issuer_pubkey_hash: issuer_hash,
        credential_type: 0,
        cert_expires_at: 9_999_999_999,
        cert_nullifier: [15u8; 32],
        proof_timestamp: now,
    }
    .try_to_vec()
    .unwrap();

    let blockhash = banks.get_latest_blockhash().await.unwrap();
    assert!(banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[ix_issue_credential(
                student.pubkey(),
                cert_nullifier,
                issuer_hash,
                pv
            )],
            Some(&student.pubkey()),
            &[&student],
            blockhash,
        ))
        .await
        .is_err());
}

#[tokio::test]
async fn test_issue_rejects_issuer_mismatch() {
    let (banks, payer, issuer_hash) = setup().await;
    let student = Keypair::new();
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[system_instruction::transfer(
                &payer.pubkey(),
                &student.pubkey(),
                1_000_000_000,
            )],
            Some(&payer.pubkey()),
            &[&payer],
            blockhash,
        ))
        .await
        .unwrap();

    let cert_nullifier = [16u8; 32];
    let now = banks.get_sysvar::<Clock>().await.unwrap().unix_timestamp;
    let pv = PublicValues {
        is_valid_student: true,
        is_not_expired: true,
        issuer_pubkey_hash: [0xFFu8; 32],
        credential_type: 0,
        cert_expires_at: 9_999_999_999,
        cert_nullifier,
        proof_timestamp: now,
    }
    .try_to_vec()
    .unwrap();

    let blockhash = banks.get_latest_blockhash().await.unwrap();
    assert!(banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[ix_issue_credential(
                student.pubkey(),
                cert_nullifier,
                issuer_hash,
                pv
            )],
            Some(&student.pubkey()),
            &[&student],
            blockhash,
        ))
        .await
        .is_err());
}

#[tokio::test]
async fn test_issue_rejects_inactive_issuer() {
    let (banks, payer, issuer_hash) = setup().await;

    let blockhash = banks.get_latest_blockhash().await.unwrap();
    banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[ix_remove_issuer(payer.pubkey(), issuer_hash)],
            Some(&payer.pubkey()),
            &[&payer],
            blockhash,
        ))
        .await
        .unwrap();

    let student = Keypair::new();
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[system_instruction::transfer(
                &payer.pubkey(),
                &student.pubkey(),
                1_000_000_000,
            )],
            Some(&payer.pubkey()),
            &[&payer],
            blockhash,
        ))
        .await
        .unwrap();

    let cert_nullifier = [17u8; 32];
    let now = banks.get_sysvar::<Clock>().await.unwrap().unix_timestamp;
    let pv_bytes = make_pv(issuer_hash, cert_nullifier, 9_999_999_999, now);

    let blockhash = banks.get_latest_blockhash().await.unwrap();
    assert!(banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[ix_issue_credential(
                student.pubkey(),
                cert_nullifier,
                issuer_hash,
                pv_bytes
            )],
            Some(&student.pubkey()),
            &[&student],
            blockhash,
        ))
        .await
        .is_err());
}

#[tokio::test]
async fn test_issue_rejects_credential_type_mismatch() {
    let (banks, payer, _) = setup().await;

    let isic_hash = [3u8; 32];
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[ix_add_issuer(
                payer.pubkey(),
                isic_hash,
                CredentialType::Isic,
                "ISIC",
            )],
            Some(&payer.pubkey()),
            &[&payer],
            blockhash,
        ))
        .await
        .unwrap();

    let student = Keypair::new();
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[system_instruction::transfer(
                &payer.pubkey(),
                &student.pubkey(),
                1_000_000_000,
            )],
            Some(&payer.pubkey()),
            &[&payer],
            blockhash,
        ))
        .await
        .unwrap();

    let cert_nullifier = [18u8; 32];
    let now = banks.get_sysvar::<Clock>().await.unwrap().unix_timestamp;
    let pv = PublicValues {
        is_valid_student: true,
        is_not_expired: true,
        issuer_pubkey_hash: isic_hash,
        credential_type: 0,
        cert_expires_at: 9_999_999_999,
        cert_nullifier,
        proof_timestamp: now,
    }
    .try_to_vec()
    .unwrap();

    let blockhash = banks.get_latest_blockhash().await.unwrap();
    assert!(banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[ix_issue_credential(
                student.pubkey(),
                cert_nullifier,
                isic_hash,
                pv
            )],
            Some(&student.pubkey()),
            &[&student],
            blockhash,
        ))
        .await
        .is_err());
}

async fn issue_for_student(
    banks: &solana_program_test::BanksClient,
    issuer_hash: [u8; 32],
    student: &Keypair,
    cert_nullifier: [u8; 32],
) {
    let now = banks.get_sysvar::<Clock>().await.unwrap().unix_timestamp;
    let pv_bytes = make_pv(issuer_hash, cert_nullifier, 9_999_999_999, now);
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[ix_issue_credential(
                student.pubkey(),
                cert_nullifier,
                issuer_hash,
                pv_bytes,
            )],
            Some(&student.pubkey()),
            &[student],
            blockhash,
        ))
        .await
        .unwrap();
}

#[tokio::test]
async fn test_renew_credential() {
    let (banks, payer, issuer_hash) = setup().await;
    let student = Keypair::new();
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[system_instruction::transfer(
                &payer.pubkey(),
                &student.pubkey(),
                2_000_000_000,
            )],
            Some(&payer.pubkey()),
            &[&payer],
            blockhash,
        ))
        .await
        .unwrap();

    let first_nullifier = [20u8; 32];
    issue_for_student(&banks, issuer_hash, &student, first_nullifier).await;

    let new_nullifier = [21u8; 32];
    let new_expires = 9_999_888_888i64;
    let now = banks.get_sysvar::<Clock>().await.unwrap().unix_timestamp;
    let pv_bytes = make_pv(issuer_hash, new_nullifier, new_expires, now);
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[ix_renew_credential(
                student.pubkey(),
                new_nullifier,
                issuer_hash,
                pv_bytes,
            )],
            Some(&student.pubkey()),
            &[&student],
            blockhash,
        ))
        .await
        .unwrap();

    let (cred_key, _) = credential_pda(&student.pubkey());
    let raw = banks.get_account(cred_key).await.unwrap().unwrap();
    let cred = StudentCredential::try_deserialize(&mut raw.data.as_ref()).unwrap();
    assert_eq!(cred.cert_nullifier, new_nullifier);
    assert_eq!(cred.expires_at, new_expires);
}

#[tokio::test]
async fn test_renew_rejects_same_nullifier() {
    let (banks, payer, issuer_hash) = setup().await;
    let student = Keypair::new();
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[system_instruction::transfer(
                &payer.pubkey(),
                &student.pubkey(),
                2_000_000_000,
            )],
            Some(&payer.pubkey()),
            &[&payer],
            blockhash,
        ))
        .await
        .unwrap();

    let cert_nullifier = [22u8; 32];
    issue_for_student(&banks, issuer_hash, &student, cert_nullifier).await;

    let now = banks.get_sysvar::<Clock>().await.unwrap().unix_timestamp;
    let pv_bytes = make_pv(issuer_hash, cert_nullifier, 9_999_999_999, now);
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    assert!(banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[ix_renew_credential(
                student.pubkey(),
                cert_nullifier,
                issuer_hash,
                pv_bytes
            )],
            Some(&student.pubkey()),
            &[&student],
            blockhash,
        ))
        .await
        .is_err());
}

#[tokio::test]
async fn test_renew_rejects_stale_proof() {
    let (banks, payer, issuer_hash) = setup().await;
    let student = Keypair::new();
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[system_instruction::transfer(
                &payer.pubkey(),
                &student.pubkey(),
                2_000_000_000,
            )],
            Some(&payer.pubkey()),
            &[&payer],
            blockhash,
        ))
        .await
        .unwrap();

    issue_for_student(&banks, issuer_hash, &student, [23u8; 32]).await;

    let new_nullifier = [24u8; 32];
    let now = banks.get_sysvar::<Clock>().await.unwrap().unix_timestamp;
    let pv = PublicValues {
        is_valid_student: true,
        is_not_expired: true,
        issuer_pubkey_hash: issuer_hash,
        credential_type: 0,
        cert_expires_at: 9_999_999_999,
        cert_nullifier: new_nullifier,
        proof_timestamp: now - 7201,
    }
    .try_to_vec()
    .unwrap();

    let blockhash = banks.get_latest_blockhash().await.unwrap();
    assert!(banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[ix_renew_credential(
                student.pubkey(),
                new_nullifier,
                issuer_hash,
                pv
            )],
            Some(&student.pubkey()),
            &[&student],
            blockhash,
        ))
        .await
        .is_err());
}

#[tokio::test]
async fn test_issue_credential_from_pem_cert() {
    use sha2::{Digest, Sha256};
    use zk_student::{
        cert::parse_der,
        mock::{mock_cert, mock_issuer_pubkey_der},
    };

    // Reproduce the exact computation the SP1 circuit performs.
    let mc = mock_cert();
    let issuer_der = mock_issuer_pubkey_der();

    let ac = parse_der(&mc.der).expect("parse mock cert DER");

    let issuer_pubkey_hash: [u8; 32] = Sha256::digest(&issuer_der).into();
    let tbs_hash: [u8; 32] = Sha256::digest(&ac.tbs_bytes).into();
    let cert_nullifier: [u8; 32] = {
        let mut h = Sha256::new();
        h.update(issuer_pubkey_hash);
        h.update(tbs_hash);
        h.finalize().into()
    };
    const UNIX_EPOCH_JD: i64 = 2_440_588;
    let cert_expires_at = (ac.fields.not_after.to_julian_day() as i64 - UNIX_EPOCH_JD) * 86400;

    let (banks, payer, blockhash) = program_test().start().await;

    banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[ix_initialize(payer.pubkey(), [0u8; 32])],
            Some(&payer.pubkey()),
            &[&payer],
            blockhash,
        ))
        .await
        .unwrap();

    let blockhash = banks.get_latest_blockhash().await.unwrap();
    banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[ix_add_issuer(
                payer.pubkey(),
                issuer_pubkey_hash,
                CredentialType::Dne,
                "TEST STUDENT ENTITY",
            )],
            Some(&payer.pubkey()),
            &[&payer],
            blockhash,
        ))
        .await
        .unwrap();

    let student = Keypair::new();
    let blockhash = banks.get_latest_blockhash().await.unwrap();
    banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[system_instruction::transfer(
                &payer.pubkey(),
                &student.pubkey(),
                1_000_000_000,
            )],
            Some(&payer.pubkey()),
            &[&payer],
            blockhash,
        ))
        .await
        .unwrap();

    let now = banks.get_sysvar::<Clock>().await.unwrap().unix_timestamp;
    let pv_bytes = PublicValues {
        is_valid_student: true,
        is_not_expired: true,
        issuer_pubkey_hash,
        credential_type: 0,
        cert_expires_at,
        cert_nullifier,
        proof_timestamp: now,
    }
    .try_to_vec()
    .unwrap();

    let blockhash = banks.get_latest_blockhash().await.unwrap();
    banks
        .process_transaction(Transaction::new_signed_with_payer(
            &[ix_issue_credential(
                student.pubkey(),
                cert_nullifier,
                issuer_pubkey_hash,
                pv_bytes,
            )],
            Some(&student.pubkey()),
            &[&student],
            blockhash,
        ))
        .await
        .unwrap();

    let (cred_key, _) = credential_pda(&student.pubkey());
    let raw = banks.get_account(cred_key).await.unwrap().unwrap();
    let cred = StudentCredential::try_deserialize(&mut raw.data.as_ref()).unwrap();
    assert_eq!(cred.wallet, student.pubkey());
    assert_eq!(cred.cert_nullifier, cert_nullifier);
    assert_eq!(cred.expires_at, cert_expires_at);
    assert_eq!(cred.issuer_pubkey_hash, issuer_pubkey_hash);
    assert_eq!(cred.credential_type, CredentialType::Dne);
}
