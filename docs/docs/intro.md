---
id: intro
title: Introduction
sidebar_position: 1
slug: /
---

# ZK-Student

ZK-Student is a student identity protocol on Solana. Students prove they hold a valid DNE or ISIC credential using a ZK proof, and a reusable `StudentCredential` is stored on-chain. Any Solana program can verify student status with a single account read — no personal data, no ZK knowledge required.

## DNE and ISIC

The **DNE** (Documento Nacional do Estudante) is Brazil's national student identity, issued by UNE. It is the Brazilian-local version of the **ISIC** (International Student Identity Card) and the two are mutually compliant.

The DNE is backed by a digitally signed certificate from a government RSA-2048 key, which makes it a natural fit for ZK proving: the circuit receives the raw certificate as private input, verifies the RSA signature against the known issuer public key, and commits to the result. No certificate data leaves the prover.

The international ISIC does not carry a signed certificate. Proving ISIC membership requires zkTLS, where the student makes an authenticated API call to the ISIC backend and proves the response is genuine by verifying the TLS session against the known ISIC server certificate. This path is on the roadmap.

## Deployments

| Network | Program | Address |
|---------|---------|---------|
| Devnet | `zk_student_protocol` | `8GzzGmVbwTZ982GF7kpbchEf2VVv6wWXHZrmtj8dJJ4z` |
| Devnet | `zk_meia` (example) | `HoK1YHdbfTQppTnquqAcGQ4v3DZczz7e7CnmDSm9v9FX` |

Prover API: `http://56.126.143.134:3001`
