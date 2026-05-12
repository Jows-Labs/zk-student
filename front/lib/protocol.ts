import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import idl from "./zk_student_protocol.json";
import { PhantomWallet } from "@/interfaces/interfaces";

const RPC = "https://api.devnet.solana.com";
const PROVER_URL =
  process.env.NEXT_PUBLIC_PROVER_API_URL ?? "https://56.126.143.134.nip.io";

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

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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

export function hexToBigInt(hexString: string): bigint {
  const normalized = hexString.startsWith("0x") ? hexString : `0x${hexString}`;
  return BigInt(normalized);
}

export function hexToNumber(hexString: string): number {
  return Number(hexToBigInt(hexString));
}

export function formatTimestamp(timestamp: bigint | string | number): string {
  const ms =
    typeof timestamp === "bigint"
      ? Number(timestamp) * 1000
      : typeof timestamp === "string"
        ? hexToNumber(timestamp) * 1000
        : timestamp * 1000;

  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

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

export function isCredentialExpired(
  expiresAt: bigint | string | number,
): boolean {
  const expiryDate = getDateFromTimestamp(expiresAt);
  return expiryDate < new Date();
}

export function formatCredential(
  credential: StudentCredential,
): CredentialFormatted {
  const issuedAtDate = getDateFromTimestamp(credential.issuedAt);
  const expiresAtDate = getDateFromTimestamp(credential.expiresAt);

  return {
    credential,
    issuedAtDate,
    expiresAtDate,
    issuedAtFormatted: issuedAtDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    expiresAtFormatted: expiresAtDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    isExpired: expiresAtDate < new Date(),
  };
}

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

interface RpcBuilder {
  rpc(): Promise<string>;
}

interface ProgramMethods {
  initialize(vkeyHash: number[]): RpcBuilder;
  addIssuer(
    issuerPubkeyHash: number[],
    credentialType:
      | { dne: Record<string, never> }
      | { isic: Record<string, never> },
    name: string,
  ): RpcBuilder;
  issueCredential(
    proofBytes: Buffer,
    publicValuesBytes: Buffer,
    certNullifier: number[],
    issuerPubkeyHash: number[],
  ): { accounts(a: { wallet: PublicKey }): RpcBuilder };
  renewCredential(
    proofBytes: Buffer,
    publicValuesBytes: Buffer,
    certNullifier: number[],
    issuerPubkeyHash: number[],
  ): { accounts(a: { wallet: PublicKey }): RpcBuilder };
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

export async function fetchCredential(
  walletAddress: string,
): Promise<StudentCredential | null> {
  try {
    const connection = new Connection(RPC, "confirmed");
    const wallet = new PublicKey(walletAddress);

    const provider = new AnchorProvider(
      connection,
      {
        publicKey: wallet,
        signTransaction: async <T>(tx: T) => tx,
        signAllTransactions: async <T>(txs: T[]) => txs,
      },
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

export async function initializeProtocol(
  wallet: PhantomWallet,
): Promise<string> {
  try {
    const connection = new Connection(RPC, "confirmed");
    const program = new Program(idl as Idl, makeProvider(connection, wallet));
    const vkeyHashBytes = Array.from(hexToBytes(SP1_VKEY_HASH));
    return await (program.methods as unknown as ProgramMethods)
      .initialize(vkeyHashBytes)
      .rpc();
  } catch (error) {
    if (isTransactionCancelled(error)) {
      throw new Error("Transaction cancelled by user");
    }
    throw error;
  }
}

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
    return await (program.methods as unknown as ProgramMethods)
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

export async function renewCredential(
  wallet: PhantomWallet,
  proveResponse: ProveResponse,
): Promise<string> {
  try {
    const connection = new Connection(RPC, "confirmed");
    const walletPubkey = getWalletPublicKey(wallet);
    const pv = parsePublicValues(proveResponse.public_values_bytes);
    const proofBytes = Buffer.from(hexToBytes(proveResponse.proof_bytes));
    const publicValuesBytes = Buffer.from(hexToBytes(proveResponse.public_values_bytes));
    const program = new Program(idl as Idl, makeProvider(connection, wallet));
    return await (program.methods as unknown as ProgramMethods)
      .renewCredential(
        proofBytes,
        publicValuesBytes,
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

export async function issueCredential(
  wallet: PhantomWallet,
  proveResponse: ProveResponse,
): Promise<string> {
  try {
    const connection = new Connection(RPC, "confirmed");
    const walletPubkey = getWalletPublicKey(wallet);

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
    const proofBytes = Buffer.from(hexToBytes(proveResponse.proof_bytes));
    const publicValuesBytes = Buffer.from(hexToBytes(proveResponse.public_values_bytes));

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
    return await (program.methods as unknown as ProgramMethods)
      .issueCredential(
        proofBytes,
        publicValuesBytes,
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
