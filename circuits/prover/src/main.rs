use anyhow::Context;
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use tower_http::cors::CorsLayer;

mod mock;
mod prove;
mod types;

use types::{unix_now, ProveRequest, ProveResponse};

struct AppError(anyhow::Error);

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        (StatusCode::INTERNAL_SERVER_ERROR, self.0.to_string()).into_response()
    }
}

impl<E: Into<anyhow::Error>> From<E> for AppError {
    fn from(e: E) -> Self {
        AppError(e.into())
    }
}

async fn handle_prove(Json(req): Json<ProveRequest>) -> Result<Json<ProveResponse>, AppError> {
    let witness = req.into_witness()?;
    let response = prove::prove(witness).await?;
    Ok(Json(response))
}

async fn handle_execute(
    Json(req): Json<ProveRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let witness = req.into_witness()?;
    let pv = prove::execute(witness).await?;
    Ok(Json(serde_json::to_value(&pv)?))
}

/// Simplified request for /mock-execute.
/// The server generates a real CACIE attribute cert via zk-student-lib's mock
/// builder (signed with MOCK_ISSUER_SK_DER or the seeded deterministic key).
#[derive(Deserialize)]
struct MockExecuteRequest {
    /// Student date-of-birth in Brazilian format "DDMMYYYY" (e.g. "15062000").
    /// Defaults to "01012000" (year 2000, gives is_adult=true at current time).
    birth_date: Option<String>,
    /// Certificate not-after in GeneralizedTime format "YYYYMMDDHHMMSSZ".
    /// Defaults to "20270331235959Z".
    not_after: Option<String>,
    /// 0 = DNE, 1 = ISIC.
    credential_type: u8,
    /// Wall-clock override (optional; defaults to SystemTime::now()).
    current_timestamp: Option<i64>,
}

async fn handle_mock_execute(
    Json(req): Json<MockExecuteRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let birth_date = req.birth_date.as_deref().unwrap_or("01012000");
    let not_after = req.not_after.as_deref().unwrap_or("20270331235959Z");
    let current_timestamp = req.current_timestamp.unwrap_or_else(unix_now);

    let witness = mock::make_mock_witness(birth_date, not_after, req.credential_type, current_timestamp)?;
    let pv = prove::execute(witness).await?;
    Ok(Json(serde_json::to_value(&pv)?))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("zk_student_prover=info".parse()?)
                .add_directive("info".parse()?),
        )
        .init();

    let app = Router::new()
        // Full Groth16 proof — set SP1_PROVER=network+SP1_PRIVATE_KEY for Succinct Network,
        // or SP1_PROVER=mock for instant mock proofs during development.
        .route("/prove", post(handle_prove))
        // Circuit execution without proof — instant, for testing public values.
        .route("/execute", post(handle_execute))
        // Mock CACIE cert + execute — uses zk-student-lib mock builder.
        .route("/mock-execute", post(handle_mock_execute))
        .route("/health", get(|| async { "ok" }))
        .layer(CorsLayer::permissive());

    let port = std::env::var("PORT").unwrap_or_else(|_| "3001".to_string());
    let addr = format!("0.0.0.0:{port}");
    tracing::info!("zk-student prover listening on {addr}");
    tracing::info!(
        "SP1_PROVER={:?}",
        std::env::var("SP1_PROVER").as_deref().unwrap_or("cpu")
    );

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .with_context(|| format!("failed to bind {addr}"))?;

    axum::serve(listener, app).await?;
    Ok(())
}
