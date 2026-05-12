---
id: prover-api
title: Prover API
sidebar_position: 4
---

import ProverPlayground from "@site/src/components/ProverPlayground";

# Prover API

The prover server is a Rust HTTP server deployed on AWS EC2.

**Base URL:** `https://56.126.143.134.nip.io`

For local development: `http://localhost:3001`

Start locally with:
```bash
SP1_PROVER=mock ./server      # instant mock proofs
SP1_PROVER=cpu ./server       # real Groth16 (requires 64 GB RAM)
```

:::note
The deployed server runs in mock mode. Full Groth16 proof generation requires at least 64 GB RAM (DDR5 recommended) and takes several minutes per proof. Mock mode produces valid-looking proof bytes that go through the full on-chain flow but skip the actual cryptographic proof.
:::

---

## GET /health

```bash
curl https://56.126.143.134.nip.io/health
# → ok
```

---

## POST /execute

Runs the circuit without generating a proof. Returns `PublicValues` instantly. Use this to validate a certificate before committing to a full proof.

**Request**
```json
{
  "cert_der_hex": "3082...",
  "issuer_pubkey_hex": "3082...",
  "credential_type": 0,
  "current_timestamp": 1778453284
}
```

`current_timestamp` is optional. Defaults to the server's current time.

**Response**
```json
{
  "is_valid_student": true,
  "is_not_expired": true,
  "credential_type": 0,
  "cert_nullifier": [237, 248, ...],
  "issuer_pubkey_hash": [248, 137, ...],
  "cert_expires_at": 1806451200,
  "proof_timestamp": 1778453284
}
```

---

## POST /prove

Full Groth16 proof generation. Returns bytes to pass directly to `issue_credential` on-chain.

**Request** — same as `/execute`

**Response**
```json
{
  "proof_bytes": "0x...",
  "public_values_bytes": "0x...",
  "vkey_hash": "0x009fe44465dfc00ca79eb22d4cbf4639566df6aac40d861010f0961a9aef871b"
}
```

Pass `proof_bytes` and `public_values_bytes` directly to `issue_credential`. The `vkey_hash` is set once in `ProtocolConfig` during initialization.

---

## POST /mock-execute

Generates a mock certificate internally and runs execute. No certificate file needed.

**Request**
```json
{
  "birth_date": "01012000",
  "not_after": "20270331235959Z",
  "credential_type": 0,
  "current_timestamp": 1778453284
}
```

**Response** — same as `/execute`

---

## Try it

<ProverPlayground />
