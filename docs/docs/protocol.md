---
id: protocol
title: Protocol
sidebar_position: 3
---

# Protocol

The Anchor program is deployed on Solana devnet at `8GzzGmVbwTZ982GF7kpbchEf2VVv6wWXHZrmtj8dJJ4z`.

## Accounts

| Account | Seeds | Description |
|---------|-------|-------------|
| `ProtocolConfig` | `["config"]` | Authority pubkey and SP1 vkey hash. Singleton. |
| `TrustedIssuer` | `["trusted-issuer", issuer_pubkey_hash]` | One per registered certificate issuer. |
| `StudentCredential` | `["student-credential", wallet]` | One per student wallet. |
| `CertNullifier` | `["cert-nullifier", cert_nullifier]` | Tombstone. Existence means the cert was already used. |

## Instructions

| Instruction | Who calls it | Description |
|-------------|-------------|-------------|
| `initialize(sp1_vkey_hash)` | Deployer, once | Creates `ProtocolConfig`, sets authority |
| `add_issuer(hash, type, name)` | Authority | Registers a trusted issuer |
| `remove_issuer(hash)` | Authority | Sets `active = false` on an issuer |
| `transfer_authority(new_authority)` | Authority | Transfers protocol control |
| `issue_credential(proof, public_values, nullifier, issuer_hash)` | Student | Issues a new `StudentCredential` |
| `renew_credential(proof, public_values, nullifier, issuer_hash)` | Student | Updates an existing credential with a new cert |

## Rules

**One credential per wallet.** A second `issue_credential` call for the same wallet fails at account validation because Anchor tries to `init` a PDA that already exists. Use `renew_credential` to update.

**Issuers are never deleted.** `remove_issuer` sets `active = false` but preserves the account for audit purposes. Credentials previously issued under a removed issuer remain valid on-chain.

**Credential type must match issuer.** The `credential_type` in the proof's public values must match the type registered for that issuer. A DNE issuer cannot issue ISIC credentials.

## ZK Circuit output

The circuit outputs a `PublicValues` struct that the program deserializes and validates:

```rust
pub struct PublicValues {
    pub is_valid_student: bool,
    pub is_not_expired: bool,
    pub issuer_pubkey_hash: [u8; 32],
    pub credential_type: u8,
    pub cert_expires_at: i64,
    pub cert_nullifier: [u8; 32],
    pub proof_timestamp: i64,
}
```

All fields in `PublicValues` are committed inside the proof — the program trusts them only because the proof verifies.
