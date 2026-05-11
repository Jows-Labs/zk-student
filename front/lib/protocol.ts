import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import idl from "./zk_student_protocol.json";

const RPC = "https://api.devnet.solana.com";
const PROVER_URL = "http://56.126.143.134:3001";

// SP1 vkey hash from the prover API (circuits/prover/API.md)
const SP1_VKEY_HASH =
  "009fe44465dfc00ca79eb22d4cbf4639566df6aac40d861010f0961a9aef871b";

type PhantomWallet = {
  publicKey: { toString(): string };
  signTransaction<T extends Transaction | VersionedTransaction>(
    tx: T,
  ): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    txs: T[],
  ): Promise<T[]>;
};

export interface ProveResponse {
  proof_bytes: string;
  public_values_bytes: string;
  vkey_hash: string;
}

export interface PublicValues {
  is_valid_student: boolean;
  is_not_expired: boolean;
  issuer_pubkey_hash: number[];
  credential_type: number;
  cert_expires_at: bigint;
  cert_nullifier: number[];
  proof_timestamp: bigint;
}

function hexToBytes(hex: string): Uint8Array {
  const s = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (s.length === 0) return new Uint8Array(0);
  const bytes = new Uint8Array(s.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Borsh layout of PublicValues (matches zk-student-types):
//   is_valid_student: bool  (1)
//   is_not_expired:   bool  (1)
//   issuer_pubkey_hash: [u8;32]
//   credential_type:  u8    (1)
//   cert_expires_at:  i64   (8, little-endian)
//   cert_nullifier:   [u8;32]
//   proof_timestamp:  i64   (8, little-endian)
export function parsePublicValues(publicValuesHex: string): PublicValues {
  const b = hexToBytes(publicValuesHex);
  let offset = 0;
  const is_valid_student = b[offset++] === 1;
  const is_not_expired = b[offset++] === 1;
  const issuer_pubkey_hash = Array.from(b.slice(offset, offset + 32));
  offset += 32;
  const credential_type = b[offset++];
  const cert_expires_at = new DataView(b.buffer).getBigInt64(offset, true);
  offset += 8;
  const cert_nullifier = Array.from(b.slice(offset, offset + 32));
  offset += 32;
  const proof_timestamp = new DataView(b.buffer).getBigInt64(offset, true);
  return {
    is_valid_student,
    is_not_expired,
    issuer_pubkey_hash,
    credential_type,
    cert_expires_at,
    cert_nullifier,
    proof_timestamp,
  };
}

function makeProvider(
  connection: Connection,
  wallet: PhantomWallet,
): AnchorProvider {
  const walletPubkey = new PublicKey(wallet.publicKey.toString());
  return new AnchorProvider(
    connection,
    {
      publicKey: walletPubkey,
      signTransaction: (tx) => wallet.signTransaction(tx),
      signAllTransactions: (txs) => wallet.signAllTransactions(txs),
    },
    { commitment: "confirmed" },
  );
}

export async function callProver(
  certDerHex: string,
  issuerPubkeyHex: string,
  credentialType: number = 0,
): Promise<ProveResponse> {
  const res = await fetch(`${PROVER_URL}/prove`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cert_der_hex: certDerHex,
      issuer_pubkey_hex: issuerPubkeyHex,
      credential_type: credentialType,
    }),
  });
  if (!res.ok) throw new Error(`Prover error: ${await res.text()}`);
  return res.json();
}

// 1. Called once by the deployer to initialize the on-chain ProtocolConfig.
export async function initializeProtocol(wallet: PhantomWallet): Promise<string> {
  const connection = new Connection(RPC, "confirmed");
  const program = new Program(idl as Idl, makeProvider(connection, wallet));
  const vkeyHashBytes = Array.from(hexToBytes(SP1_VKEY_HASH));
  return (program.methods as any).initialize(vkeyHashBytes).rpc();
}

// 2. Called by the authority to register a trusted certificate issuer.
//    issuerPubkeyHex: hex-encoded PKCS#1 DER of the issuer RSA public key
//    credentialType: 0 = DNE, 1 = ISIC
//    name: human-readable name (max 64 bytes)
export async function addIssuer(
  wallet: PhantomWallet,
  issuerPubkeyHex: string,
  credentialType: 0 | 1,
  name: string,
): Promise<string> {
  const connection = new Connection(RPC, "confirmed");
  const program = new Program(idl as Idl, makeProvider(connection, wallet));
  const issuerPubkeyHash = Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", hexToBytes(issuerPubkeyHex))),
  );
  return (program.methods as any)
    .addIssuer(
      issuerPubkeyHash,
      credentialType === 0 ? { dne: {} } : { isic: {} },
      name,
    )
    .rpc();
}

// 3. Called by the student after /prove returns.
export async function issueCredential(
  wallet: PhantomWallet,
  proveResponse: ProveResponse,
): Promise<string> {
  const connection = new Connection(RPC, "confirmed");
  const walletPubkey = new PublicKey(wallet.publicKey.toString());
  const pv = parsePublicValues(proveResponse.public_values_bytes);
  const proofBytes = Array.from(hexToBytes(proveResponse.proof_bytes));
  const publicValuesBytes = Array.from(
    hexToBytes(proveResponse.public_values_bytes),
  );
  const program = new Program(idl as Idl, makeProvider(connection, wallet));
  return (program.methods as any)
    .issueCredential(
      proofBytes,
      publicValuesBytes,
      pv.cert_nullifier,
      pv.issuer_pubkey_hash,
    )
    .accounts({ wallet: walletPubkey })
    .rpc();
}
