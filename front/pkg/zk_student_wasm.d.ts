/* tslint:disable */
/* eslint-disable */

/**
 * Parse a DER-encoded attribute certificate and return its fields.
 */
export function parse_cert(der: Uint8Array): any;

/**
 * Verify the RSA signature. Throws if the certificate or key is invalid,
 * or if the signature does not match.
 */
export function verify_cert(der: Uint8Array, issuer_pubkey_der: Uint8Array): void;
