---
id: how-it-works
title: How it works
sidebar_position: 2
---

# How it works

## Credential issuance

1. Student connects their Solana wallet and uploads a `.pem` certificate
2. The prover server parses the certificate, verifies the RSA-2048 signature, and generates a Groth16 ZK proof
3. The student signs one transaction: `issue_credential`
4. The Anchor program verifies the proof, checks the issuer is trusted, and creates a `StudentCredential` PDA on-chain
5. The raw certificate and proof are discarded. Only the credential lives on-chain.

## Renewal

Renewal works the same way with a new certificate. The same PDA is updated in place via `renew_credential`. The new certificate's nullifier must differ from the one currently stored.

## What the credential contains

| Field | Description |
|-------|-------------|
| `wallet` | The student's public key |
| `issuer_pubkey_hash` | SHA-256 of the issuer's RSA public key |
| `credential_type` | DNE (0) or ISIC (1) |
| `issued_at` | Unix timestamp of issuance |
| `expires_at` | Taken from the certificate's notAfter field |
| `cert_nullifier` | Unique identifier for the certificate used |

## Anti-replay

Each certificate can only be used once. When a credential is issued, a `CertNullifier` PDA is initialized using the nullifier as a seed. A second attempt with the same certificate fails at account validation before any handler code runs.

## Proof freshness

The on-chain program checks `proof_timestamp` from the public values against `Clock::get()`. Proofs older than 1 hour are rejected, preventing a student from reusing an old proof for a future issuance.
