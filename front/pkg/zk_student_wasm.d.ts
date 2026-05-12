/* tslint:disable */
/* eslint-disable */

/**
 * Generate a fresh mock DNE certificate with a random serial.
 * Returns { cert_der_hex, issuer_pubkey_hex } ready to pass to the prover.
 * Always uses the fixed mock issuer key (matches ISSUER_PUBKEY_DER on-chain).
 */
export function generate_mock_cert(): any;

/**
 * Parse a DER-encoded attribute certificate and return its fields.
 */
export function parse_cert(der: Uint8Array): any;

/**
 * Verify the RSA signature. Throws if the certificate or key is invalid,
 * or if the signature does not match.
 */
export function verify_cert(der: Uint8Array, issuer_pubkey_der: Uint8Array): void;
