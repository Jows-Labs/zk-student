use anchor_lang::prelude::*;

#[error_code]
pub enum ZkStudentError {
    #[msg("Unauthorized: caller is not the protocol authority")]
    Unauthorized,
    #[msg("Issuer is not active")]
    IssuerNotActive,
    #[msg("Issuer pubkey hash does not match public values")]
    IssuerMismatch,
    #[msg("Credential type mismatch between issuer and public values")]
    CredentialTypeMismatch,
    #[msg("Invalid public values: student check failed")]
    InvalidPublicValues,
    #[msg("Certificate nullifier does not match public values")]
    NullifierMismatch,
    #[msg("Certificate nullifier already used")]
    NullifierAlreadyUsed,
    #[msg("Cannot deserialize public values")]
    DeserializationError,
    #[msg("Issuer name exceeds 64 bytes")]
    NameTooLong,
    #[msg("Certificate has already expired")]
    CertificateExpired,
}
