# ZK-Student Prover API

Base URL: `http://56.126.143.134:3001` (EC2) or `http://localhost:3001` (local)

Start server: `SP1_PROVER=mock ./server` (mock, instant) or `SP1_PROVER=cpu ./server` (real, slow)

---

## GET /health

```
curl http://localhost:3001/health
# → ok
```

---

## POST /execute

Circuit execution without proof — instant. Use to validate a cert and get public values before committing to a full proof.

**Request**
```json
{
  "cert_der_hex": "3082...",        // hex-encoded attribute certificate DER bytes
  "issuer_pubkey_hex": "3082...",   // hex-encoded PKCS#1 DER of issuer RSA-2048 public key
  "credential_type": 0,             // 0 = DNE, 1 = ISIC
  "current_timestamp": 1778453284  // optional unix timestamp override
}
```

**Response**
```json
{
  "is_valid_student": true,
  "is_not_expired": true,
  "credential_type": 0,
  "cert_nullifier": [237, 248, ...],      // 32-byte unique identifier for this cert
  "issuer_pubkey_hash": [248, 137, ...],  // SHA-256 of issuer_pubkey_der (register this on-chain)
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
  "proof_bytes": "0x...",          // Groth16 proof (empty 0x in mock mode)
  "public_values_bytes": "0x...",  // borsh-serialized PublicValues — pass to issue_credential
  "vkey_hash": "0x009fe444..."     // circuit vkey — set as sp1_vkey_hash in ProtocolConfig
}
```

---

## POST /mock-execute

Convenience endpoint — generates a mock CACIE cert internally and runs execute. No cert needed.

**Request**
```json
{
  "birth_date": "01012000",              // DDMMYYYY Brazilian format (default: "01012000")
  "not_after": "20270331235959Z",        // cert expiry in GeneralizedTime (default: "20270331235959Z")
  "credential_type": 0,
  "current_timestamp": 1778453284       // optional
}
```

**Response** — same as `/execute`

---

## Mock cert example (circuits/program/../../../zk-student-lib/mock_cert.pem)

```bash
CERT_HEX=308202b23082019a...   # see below for full value
ISSUER_HEX=3082010a0282...

curl -X POST http://localhost:3001/prove \
  -H 'Content-Type: application/json' \
  -d "{\"cert_der_hex\":\"$CERT_HEX\",\"issuer_pubkey_hex\":\"$ISSUER_HEX\",\"credential_type\":0}"
```

**cert_der_hex** (mock_cert.pem decoded):
```
308202b23082019a0201013000a020301e311c301a06035504030c13544553542053545544454e5420454e54495459300d06092a864886f70d01010505000204011065363022180f32303236303130313132303030305a180f32303237303333313233353935395a3081d530460605604c010a01313d133b303130313230303031323334353637383930313030303030303030303030303030303030303030303532333633383339352020202020202020202030760605604c010a02316d136b4665646572616c20556e6976657273697479206f662054657374696e6720202020202020202020205355504552494f5220202020202020436f6d707574657220536369656e6365202020202020202020202020202053616f205061756c6f2020202020202020202020535030130605604c010403310a13084a4f484e20444f453060301f0603551d2304183016801422986de4386ab8a4537c6dd5a548b3015e9ed585303d06082b060105050701010431302f302d06082b060105050730028621687474703a2f2f6c6f63616c686f73743a383038302f6d6f636b2d63612e637274300d06092a864886f70d01010505000382010100551dbc8fdb34fb8cd0bfa7d2f20fed75faa26ddbbaabfc8bed40e47194950558a74ec764998e6923caf5b96fdbdd329aa0dcb0d25223be86b474d8fb7d975ed9abe27ebf95c2cb7a0989cc4ffc688e3f023e2ed2cc147718a91ef85683cb9ad231156270aca6a7b9b712d621c0711d05e7ab3b1d45347d31f55c087c8545eac9152c1d0fec2ca658ad7b7e3f0a3865e5a570fd70035597968e7273080048434210e4da797c61795eed6412627e4b6a0d3ebe354e910f13e33324c72d3352f9be020d9e97a6689f4b6ce3ce316066d2fcc286320243cca5dcb17a6694eb67780097c17a2a7d061410a2c7045bdaf52ea12ad8ec7ec39a24492ee8b0fba02db07e
```

**issuer_pubkey_hex** (mock_issuer_pubkey.pem PKCS#1 DER):
```
3082010a0282010100c618f33ee89581db62c65f314796bae7b7e24385995c90a1b28825119a8bf7aa2f3fe968ec58b1126c8d2d1dcb7cd03b99b09c16b61f8bd6ab239892855f6f480f31bef75ea965ef5034f508d0a83a46c7f30a5f353c2b3a28ca86cccfbe3d9fa8b7498e2d95ad125fed58a58fcc90e4ab70793016e3e05c2f2e5690e6bbde5c5b20fcb3865389e0bc1b975f2e5bbb65581690a27c923b81c30c52f748ef4d545bf179b0fd835de4a70e4cecf0a03d08ded3679b7204e2f3c64b94e84375860a93219b54a2b691431df514c4e249f8af7b2e5a66b1a02774fb5ef0258631ace7e567674bf964471bb08c6b8a582845b1a4b5e8e1b0ec8dcaf816b87e63bfff0d0203010001
```

**vkey_hash** (set as `sp1_vkey_hash` in ProtocolConfig):
```
0x009fe44465dfc00ca79eb22d4cbf4639566df6aac40d861010f0961a9aef871b
```
