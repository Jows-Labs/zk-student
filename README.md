# ZK-Student

A student identity protocol on Solana. Students upload their Brazilian DNE or ISIC certificate once, a ZK proof is generated server-side, and a reusable credential is stored on-chain. Any Solana program can verify student status with a single account read, no personal data involved.

**DNE and ISIC:** The DNE (Documento Nacional do Estudante) is Brazil's national student identity, issued by UNE (União Nacional dos Estudantes). It is the Brazilian-local version of the ISIC (International Student Identity Card) and the two are mutually compliant.

The DNE is backed by a digitally signed certificate from a government RSA-2048 key, which makes it a natural fit for ZK proving: the circuit receives the raw certificate as private input, verifies the RSA signature against the known issuer public key, and commits to the result. No certificate data leaves the prover.

The international ISIC does not carry a signed certificate. Proving ISIC membership requires a different approach: zkTLS, where the student makes an authenticated API call to the ISIC backend and proves the response is genuine by verifying the TLS session against the known ISIC server certificate.

## How it works

1. Student connects their Solana wallet and uploads a `.pem` certificate
2. The prover server parses the certificate, verifies the RSA-2048 signature, and generates a Groth16 ZK proof
3. The student signs one transaction: `issue_credential`
4. The Anchor program verifies the proof, checks the issuer is trusted, and creates a `StudentCredential` PDA on-chain
5. The raw certificate and proof are discarded. Only the credential lives on-chain.

Renewal works the same way with a new certificate. The same PDA is updated in place.

## Components

### ZK Circuit (`circuits/`)

Written in Rust, compiled to RISC-V via SP1. Takes a raw certificate DER as private input and outputs:

- `is_valid_student` — RSA-SHA1 signature is valid
- `is_not_expired` — certificate validity period covers the proof timestamp
- `issuer_pubkey_hash` — SHA-256 of the issuer RSA-2048 public key
- `credential_type` — 0 for DNE, 1 for ISIC
- `cert_expires_at` — notAfter from the certificate
- `cert_nullifier` — unique per certificate, used for replay prevention
- `proof_timestamp` — wall-clock at proof time (enforced fresh, max 1 hour old on-chain)

### Prover API (`circuits/prover/`)

Rust HTTP server deployed on AWS EC2 (`http://56.126.143.134:3001`).

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `POST /execute` | Run circuit without proof, returns PublicValues (instant) |
| `POST /prove` | Full Groth16 proof, returns `proof_bytes` + `public_values_bytes` + `vkey_hash` (hex) |

Set `SP1_PROVER=mock` for development (instant fake proofs). Set `SP1_PROVER=cpu` for real local proving.

See `circuits/prover/API.md` for full request format and example values.

> **Note:** The deployed server runs with `SP1_PROVER=mock`. Full Groth16 proof generation requires at least 64 GB RAM (DDR5 recommended) and takes several minutes per proof, which is not practical for a demo environment. Mock mode produces valid-looking proof bytes that go through the full on-chain flow but skip the actual cryptographic proof.

### Anchor Program (`programs/zk-student-protocol/`)

Deployed on Solana devnet at `8GzzGmVbwTZ982GF7kpbchEf2VVv6wWXHZrmtj8dJJ4z`.

**Accounts**

| Account | Seeds | Description |
|---------|-------|-------------|
| `ProtocolConfig` | `["config"]` | Authority pubkey and SP1 vkey hash |
| `TrustedIssuer` | `["trusted-issuer", issuer_pubkey_hash]` | One per registered certificate issuer |
| `StudentCredential` | `["student-credential", wallet]` | One per student wallet |
| `CertNullifier` | `["cert-nullifier", cert_nullifier]` | Tombstone, prevents reusing a certificate |

**Instructions**

| Instruction | Who calls it |
|-------------|-------------|
| `initialize(sp1_vkey_hash)` | Deployer, once |
| `add_issuer(hash, type, name)` | Authority |
| `remove_issuer(hash)` | Authority |
| `transfer_authority(new_authority)` | Authority |
| `issue_credential(proof, public_values, nullifier, issuer_hash)` | Student |
| `renew_credential(proof, public_values, nullifier, issuer_hash)` | Student |

One credential per wallet. A second `issue_credential` call for the same wallet fails at account validation. Use `renew_credential` to update with a new certificate.

### Integration example (`programs/zk-meia/`)

Deployed at `HoK1YHdbfTQppTnquqAcGQ4v3DZczz7e7CnmDSm9v9FX`. Shows how to gate an instruction behind a valid student credential. The `claim_discount` instruction reads the `StudentCredential` PDA and checks `expires_at > now`.

### Frontend (`front/`)

Next.js app with two pages:

- `/` — Landing, how it works
- `/app` — Upload cert, generate proof, issue or renew credential, view credential status

Uses Phantom wallet. The protocol client is at `front/lib/protocol.ts`. SNS is integrated: when a wallet connects, the app resolves its primary `.sol` domain and displays it alongside the raw address in the navbar.

## Integrating as a third party

Derive the student's `StudentCredential` PDA and check it:

```rust
#[derive(Accounts)]
pub struct GatedInstruction<'info> {
    #[account(
        seeds = [b"student-credential", user.key().as_ref()],
        bump = credential.bump,
        seeds::program = ZK_STUDENT_PROTOCOL_ID,
        constraint = credential.expires_at > Clock::get()?.unix_timestamp,
    )]
    pub credential: Account<'info, StudentCredential>,
    pub user: Signer<'info>,
}
```

No CPI needed. Just pass the PDA as an account and let Anchor re-derive it from the protocol's program ID, not yours.

## Deployments

| Network | Program | Address |
|---------|---------|---------|
| Devnet | `zk_student_protocol` | `8GzzGmVbwTZ982GF7kpbchEf2VVv6wWXHZrmtj8dJJ4z` |
| Devnet | `zk_meia` | `HoK1YHdbfTQppTnquqAcGQ4v3DZczz7e7CnmDSm9v9FX` |

Prover API: `http://56.126.143.134:3001`

## Tech stack

- ZK: SP1 (Succinct), Groth16
- Smart contracts: Anchor 0.32.1, Solana devnet
- Certificates: Brazilian DNE / ISIC, RSA-2048 + SHA-1
- Frontend: Next.js, TypeScript, Phantom wallet

## Future direction

The current flow requires a centralized server to generate proofs, which is heavy and not scalable. The production path is client-side proving via zkTLS for both ISIC and DNE, moving proof generation directly to the student's device.

Beyond student cards, ISIC also issues the [ITIC (International Teacher Identity Card) and the IYTC (International Youth Travel Card)](https://www.isic.org/cards/). Supporting all three would extend the protocol to teachers and young travelers, not just students.

We also plan to sponsor transaction fees for users with a `.sol` domain, strengthening the Solana Name Service ecosystem and lowering the barrier for students getting their first on-chain credential.
