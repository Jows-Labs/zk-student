---
id: integration
title: Integration
sidebar_position: 5
---

# Integration

Integrating ZK-Student into your Solana program requires no CPI. You just read the `StudentCredential` PDA and let Anchor verify it.

## Add the account constraint

```rust
use zk_student_protocol::StudentCredential;

const ZK_STUDENT_PROTOCOL_ID: Pubkey = pubkey!("8GzzGmVbwTZ982GF7kpbchEf2VVv6wWXHZrmtj8dJJ4z");

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

The `seeds::program = ZK_STUDENT_PROTOCOL_ID` constraint is the key guard. It tells Anchor to re-derive the PDA from the protocol's program ID, not yours. Without it, a malicious account at the same address under a different program would pass validation.

## What to check

At minimum check `expires_at > Clock::get()?.unix_timestamp`. Optionally also check:

- `credential.credential_type` — if your program only accepts DNE or only ISIC
- `credential.issuer_pubkey_hash` — if you want to restrict to a specific issuer

## Example

`zk-meia` at `HoK1YHdbfTQppTnquqAcGQ4v3DZczz7e7CnmDSm9v9FX` is a minimal working example. It has a single `claim_discount` instruction that reads the `StudentCredential` PDA and checks expiry.

## StudentCredential struct

```rust
pub struct StudentCredential {
    pub wallet: Pubkey,
    pub issuer_pubkey_hash: [u8; 32],
    pub credential_type: CredentialType, // Dne = 0, Isic = 1
    pub issued_at: i64,
    pub expires_at: i64,
    pub cert_nullifier: [u8; 32],
    pub bump: u8,
}
```
