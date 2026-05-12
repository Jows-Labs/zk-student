# zk-student-protocol

Anchor program that issues and manages on-chain student credentials backed by ZK proofs of Brazilian CACIE/DNE attribute certificates.

Official certificate specification and public keys available at [meiaentrada.org.br/chaves-publicas](https://www.meiaentrada.org.br/chaves-publicas)

## Roles

**Authority** — the deployer's keypair (or Squads multisig post-launch). Controls which issuers are trusted and can transfer authority to a new pubkey.

**Trusted Issuer** — an entity whose certificate-signing public key hash has been registered by the authority. Each issuer is tied to exactly one credential type (DNE or ISIC). Issuers can be deactivated but their account is never closed, preserving the audit trail.

**Student (wallet)** — the end user. Submits a ZK proof generated from their CACIE certificate. Holds one `StudentCredential` PDA per wallet address.

---

## Business rules

### Issuer registry

- Only the authority can add or remove issuers.
- An issuer is identified by a 32-byte hash of its RSA public key (`issuer_pubkey_hash`). The raw key never touches the chain.
- Removing an issuer sets `active = false`. Credentials previously issued under that issuer remain valid on-chain; the issuer account is preserved for historical reference.
- Issuer names are capped at 64 bytes.

### Issuing a credential

A student can hold exactly one `StudentCredential` per wallet. The `init` constraint on the credential PDA makes a second `issue_credential` call for the same wallet fail at account validation.

For a credential to be issued, all of the following must hold:

1. The ZK proof public values assert `is_valid_student`, `is_adult`, and `is_not_expired`.
2. The `issuer_pubkey_hash` in the public values matches a registered, active `TrustedIssuer`.
3. The `credential_type` in the public values matches the issuer's registered type.
4. The `cert_nullifier` in the public values has never been seen before — enforced by initializing a `CertNullifier` PDA keyed on the nullifier; a duplicate nullifier fails at account validation before any handler code runs.
5. The `cert_nullifier` and `issuer_pubkey_hash` passed as instruction arguments match the values inside the public values — prevents a client from mixing arguments and payload.

The credential records: wallet, issuer hash, credential type, `issued_at`, `expires_at` (taken from the certificate's validity period), and the nullifier of the certificate used.

### Renewing a credential

`renew_credential` updates an existing credential with a new certificate. Same validity checks as issuance apply. Additionally:

- The new `cert_nullifier` must differ from the one currently stored in the credential (you cannot renew with the same certificate).
- A new `CertNullifier` PDA is initialized for the new nullifier, making the new cert single-use going forward.
- `expires_at` and `cert_nullifier` are updated; `issued_at` and `wallet` are preserved.

### ZK proof verification

`proof_bytes` is accepted but currently unused — Groth16 verification via sp1-solana is wired in after the circuit is finalized. The public values payload is the binding contract between circuit and program; the proof enforces that those values were honestly computed.

---

## Deployments

| Network | Program | Address |
|---------|---------|---------|
| Devnet | `zk_student_protocol` | `8GzzGmVbwTZ982GF7kpbchEf2VVv6wWXHZrmtj8dJJ4z` |
| Devnet | `zk_meia` | `HoK1YHdbfTQppTnquqAcGQ4v3DZczz7e7CnmDSm9v9FX` |

Prover API: `https://56.126.143.134.nip.io` — see `circuits/prover/API.md` for endpoints.

---

## On-chain accounts

| Account | Seeds | Description |
|---------|-------|-------------|
| `ProtocolConfig` | `["config"]` | Singleton. Stores authority pubkey and SP1 verification key hash. |
| `TrustedIssuer` | `["trusted-issuer", issuer_pubkey_hash]` | One per registered issuer. |
| `StudentCredential` | `["student-credential", wallet]` | One per student wallet. |
| `CertNullifier` | `["cert-nullifier", cert_nullifier]` | Tombstone. Existence means the certificate was already used. |

---

## Reading a credential from another program

```rust
// Derive the PDA and read it — no CPI needed.
let (credential_pda, _bump) = Pubkey::find_program_address(
    &[b"student-credential", wallet.as_ref()],
    &ZK_STUDENT_PROTOCOL_ID,
);
// Then pass credential_pda as an account and assert:
//   credential.expires_at > Clock::get()?.unix_timestamp
```

Use `seeds::program = ZK_STUDENT_PROTOCOL_ID` in your Anchor `#[account(...)]` constraint so Anchor re-derives the PDA from the protocol's address, not your program's — this is the key guard against fake credentials.
