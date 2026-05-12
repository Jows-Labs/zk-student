---
id: trust-model
title: Trust model
sidebar_position: 6
---

# Trust model

## What the protocol authority controls

The `ProtocolConfig` account holds an `authority` pubkey. Only that key can:

- Register or deactivate trusted issuers
- Transfer authority to a new key (e.g. a Squads multisig)

This means the trust surface for issuers is narrow and auditable: the full list of trusted issuers is on-chain, public, and immutable once set.

## What never touches the chain

- The raw certificate bytes
- The student's personal data (name, birth date, institution)
- The ZK proof itself (it is verified and discarded)

The on-chain credential only records: wallet, issuer hash, credential type, issuance date, expiry, and nullifier.

## What you trust when you read a credential

If `credential.expires_at > now`, you are trusting that:

1. The ZK proof was valid at issuance time — enforced by the on-chain verifier
2. The issuer was trusted and active at issuance time — enforced by the program
3. The certificate was not already used — enforced by the `CertNullifier` PDA
4. The proof was fresh — enforced by the 1-hour `proof_timestamp` check

You are not trusting the prover server. The proof is verified on-chain. A compromised or malicious prover server cannot forge a valid `StudentCredential` without a valid certificate signed by a registered issuer.

## Upgrade path

```
v1    authority = deployer keypair
v1.5  transfer_authority → Squads multisig
v2    on-chain governance for issuer management
```
