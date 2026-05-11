import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "./zk_student_protocol.json";
import { PhantomWallet } from "@/interfaces/interfaces";

const RPC = "https://api.devnet.solana.com";
const PROVER_URL = "http://56.126.143.134:3001";

// SP1 vkey hash from the prover API (circuits/prover/API.md)
const SP1_VKEY_HASH =
  "009fe44465dfc00ca79eb22d4cbf4639566df6aac40d861010f0961a9aef871b";

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

export interface StudentCredential {
  wallet: PublicKey;
  issuerPubkeyHash: number[];
  credentialType:
    | { dne: Record<string, never> }
    | { isic: Record<string, never> };
  issuedAt: bigint;
  expiresAt: bigint;
  certNullifier: number[];
}

export interface CredentialFormatted {
  credential: StudentCredential;
  issuedAtDate: Date;
  expiresAtDate: Date;
  issuedAtFormatted: string;
  expiresAtFormatted: string;
  isExpired: boolean;
}

interface StudentCredentialClient {
  fetchNullable(address: PublicKey): Promise<StudentCredential | null>;
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

function isTransactionCancelled(error: unknown): boolean {
  if (!error) return false;

  const errorMessage = String(error);
  const errorObj = error as Record<string, unknown>;

  // Common cancellation indicators
  return (
    errorMessage.includes("User rejected") ||
    errorMessage.includes("User denied") ||
    errorMessage.includes("cancelled") ||
    errorMessage.includes("rejected") ||
    errorMessage.includes("4001") || // MetaMask rejection code
    errorObj.code === 4001 ||
    errorObj.code === "USER_REJECTION"
  );
}

// Helper to convert hex string to BigInt
export function hexToBigInt(hexString: string): bigint {
  const normalized = hexString.startsWith("0x") ? hexString : `0x${hexString}`;
  return BigInt(normalized);
}

// Helper to convert hex string to number
export function hexToNumber(hexString: string): number {
  return Number(hexToBigInt(hexString));
}

// Helper to format timestamp (Unix seconds) to readable date
export function formatTimestamp(timestamp: bigint | string | number): string {
  const ms =
    typeof timestamp === "bigint"
      ? Number(timestamp) * 1000
      : typeof timestamp === "string"
        ? hexToNumber(timestamp) * 1000
        : timestamp * 1000;

  return new Date(ms).toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Helper to get Date object from timestamp
export function getDateFromTimestamp(
  timestamp: bigint | string | number,
): Date {
  const ms =
    typeof timestamp === "bigint"
      ? Number(timestamp) * 1000
      : typeof timestamp === "string"
        ? hexToNumber(timestamp) * 1000
        : timestamp * 1000;

  return new Date(ms);
}

// Helper to check if credential is expired
export function isCredentialExpired(
  expiresAt: bigint | string | number,
): boolean {
  const expiryDate = getDateFromTimestamp(expiresAt);
  return expiryDate < new Date();
}

// Helper to format credential with dates
export function formatCredential(
  credential: StudentCredential,
): CredentialFormatted {
  const issuedAtDate = getDateFromTimestamp(credential.issuedAt);
  const expiresAtDate = getDateFromTimestamp(credential.expiresAt);

  return {
    credential,
    issuedAtDate,
    expiresAtDate,
    issuedAtFormatted: issuedAtDate.toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    expiresAtFormatted: expiresAtDate.toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    isExpired: expiresAtDate < new Date(),
  };
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
  const walletPubkey = getWalletPublicKey(wallet);
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

function getWalletPublicKey(wallet: PhantomWallet): PublicKey {
  if (!wallet.publicKey) {
    throw new Error("Wallet publicKey is not available");
  }
  return new PublicKey(wallet.publicKey.toString());
}

// Returns the StudentCredential for a wallet, or null if none exists.
export async function fetchCredential(
  walletAddress: string,
): Promise<StudentCredential | null> {
  try {
    const connection = new Connection(RPC, "confirmed");
    const wallet = new PublicKey(walletAddress);

    // Create a minimal provider for reading (no signing needed)
    const provider = new AnchorProvider(
      connection,
      {
        publicKey: wallet,
        signTransaction: async (tx: any) => tx,
        signAllTransactions: async (txs: any) => txs,
      } as any,
      { commitment: "confirmed" },
    );

    const program = new Program(idl as Idl, provider);

    const [credentialPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("student-credential"), wallet.toBuffer()],
      program.programId,
    );

    const client = (
      program.account as unknown as {
        studentCredential: StudentCredentialClient;
      }
    ).studentCredential;
    return await client.fetchNullable(credentialPda);
  } catch (error) {
    console.error("Error fetching credential:", error);
    return null;
  }
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
export async function initializeProtocol(
  wallet: PhantomWallet,
): Promise<string> {
  try {
    const connection = new Connection(RPC, "confirmed");
    const program = new Program(idl as Idl, makeProvider(connection, wallet));
    const vkeyHashBytes = Array.from(hexToBytes(SP1_VKEY_HASH));
    return await (program.methods as any).initialize(vkeyHashBytes).rpc();
  } catch (error) {
    if (isTransactionCancelled(error)) {
      throw new Error("Transaction cancelled by user");
    }
    throw error;
  }
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
  try {
    const connection = new Connection(RPC, "confirmed");
    const program = new Program(idl as Idl, makeProvider(connection, wallet));
    const issuerPubkeyBytes = hexToBytes(issuerPubkeyHex);
    const issuerPubkeyHash = Array.from(
      new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          issuerPubkeyBytes.buffer.slice(
            issuerPubkeyBytes.byteOffset,
            issuerPubkeyBytes.byteOffset + issuerPubkeyBytes.byteLength,
          ) as ArrayBuffer,
        ),
      ),
    );
    return await (program.methods as any)
      .addIssuer(
        issuerPubkeyHash,
        credentialType === 0 ? { dne: {} } : { isic: {} },
        name,
      )
      .rpc();
  } catch (error) {
    if (isTransactionCancelled(error)) {
      throw new Error("Transaction cancelled by user");
    }
    throw error;
  }
}

// 3. Called by the student after /prove returns.
export async function issueCredential(
  wallet: PhantomWallet,
  proveResponse: ProveResponse,
): Promise<string> {
  try {
    const connection = new Connection(RPC, "confirmed");
    const walletPubkey = getWalletPublicKey(wallet);

    // Validate response data
    if (!proveResponse.proof_bytes || proveResponse.proof_bytes.length === 0) {
      throw new Error("proof_bytes is empty or missing");
    }
    if (
      !proveResponse.public_values_bytes ||
      proveResponse.public_values_bytes.length === 0
    ) {
      throw new Error("public_values_bytes is empty or missing");
    }

    const pv = parsePublicValues(proveResponse.public_values_bytes);
    const proofBytes = Array.from(hexToBytes(proveResponse.proof_bytes));
    const publicValuesBytes = Array.from(
      hexToBytes(proveResponse.public_values_bytes),
    );

    if (pv.cert_nullifier.length !== 32) {
      throw new Error(
        `cert_nullifier must be 32 bytes, got ${pv.cert_nullifier.length}`,
      );
    }
    if (pv.issuer_pubkey_hash.length !== 32) {
      throw new Error(
        `issuer_pubkey_hash must be 32 bytes, got ${pv.issuer_pubkey_hash.length}`,
      );
    }

    const program = new Program(idl as Idl, makeProvider(connection, wallet));
    return await (program.methods as any)
      .issueCredential(
        Buffer.from(proofBytes),
        Buffer.from(publicValuesBytes),
        pv.cert_nullifier,
        pv.issuer_pubkey_hash,
      )
      .accounts({ wallet: walletPubkey })
      .rpc();
  } catch (error) {
    if (isTransactionCancelled(error)) {
      throw new Error("Transaction cancelled by user");
    }
    throw error;
  }
}
