import React, { useState } from "react";

const PROVER_URL = "https://56.126.143.134.nip.io";

const MOCK_CERT_HEX =
  "308202b23082019a0201013000a020301e311c301a06035504030c13544553542053545544454e5420454e54495459300d06092a864886f70d01010505000204011065363022180f32303236303130313132303030305a180f32303237303333313233353935395a3081d530460605604c010a01313d133b303130313230303031323334353637383930313030303030303030303030303030303030303030303532333633383339352020202020202020202030760605604c010a02316d136b4665646572616c20556e6976657273697479206f662054657374696e6720202020202020202020205355504552494f5220202020202020436f6d707574657220536369656e6365202020202020202020202020202053616f205061756c6f2020202020202020202020535030130605604c010403310a13084a4f484e20444f453060301f0603551d2304183016801422986de4386ab8a4537c6dd5a548b3015e9ed585303d06082b060105050701010431302f302d06082b060105050730028621687474703a2f2f6c6f63616c686f73743a383038302f6d6f636b2d63612e637274300d06092a864886f70d01010505000382010100551dbc8fdb34fb8cd0bfa7d2f20fed75faa26ddbbaabfc8bed40e47194950558a74ec764998e6923caf5b96fdbdd329aa0dcb0d25223be86b474d8fb7d975ed9abe27ebf95c2cb7a0989cc4ffc688e3f023e2ed2cc147718a91ef85683cb9ad231156270aca6a7b9b712d621c0711d05e7ab3b1d45347d31f55c087c8545eac9152c1d0fec2ca658ad7b7e3f0a3865e5a570fd70035597968e7273080048434210e4da797c61795eed6412627e4b6a0d3ebe354e910f13e33324c72d3352f9be020d9e97a6689f4b6ce3ce316066d2fcc286320243cca5dcb17a6694eb67780097c17a2a7d061410a2c7045bdaf52ea12ad8ec7ec39a24492ee8b0fba02db07e";

const MOCK_ISSUER_HEX =
  "3082010a0282010100c618f33ee89581db62c65f314796bae7b7e24385995c90a1b28825119a8bf7aa2f3fe968ec58b1126c8d2d1dcb7cd03b99b09c16b61f8bd6ab239892855f6f480f31bef75ea965ef5034f508d0a83a46c7f30a5f353c2b3a28ca86cccfbe3d9fa8b7498e2d95ad125fed58a58fcc90e4ab70793016e3e05c2f2e5690e6bbde5c5b20fcb3865389e0bc1b975f2e5bbb65581690a27c923b81c30c52f748ef4d545bf179b0fd835de4a70e4cecf0a03d08ded3679b7204e2f3c64b94e84375860a93219b54a2b691431df514c4e249f8af7b2e5a66b1a02774fb5ef0258631ace7e567674bf964471bb08c6b8a582845b1a4b5e8e1b0ec8dcaf816b87e63bfff0d0203010001";

type Mode = "execute" | "prove";

export default function ProverPlayground() {
  const [certHex, setCertHex] = useState(MOCK_CERT_HEX);
  const [issuerHex, setIssuerHex] = useState(MOCK_ISSUER_HEX);
  const [credentialType, setCredentialType] = useState(0);
  const [mode, setMode] = useState<Mode>("execute");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (currentMode: Mode) => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const endpoint = currentMode === "execute" ? "/execute" : "/prove";
      const res = await fetch(`${PROVER_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cert_der_hex: certHex.trim(),
          issuer_pubkey_hex: issuerHex.trim(),
          credential_type: credentialType,
        }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      setResult(JSON.stringify(JSON.parse(text), null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: "1px solid var(--ifm-color-emphasis-300)", borderRadius: 8, padding: "1.5rem", marginTop: "1.5rem" }}>
      <h3 style={{ marginTop: 0 }}>Playground</h3>
      <p style={{ fontSize: "0.9rem", color: "var(--ifm-color-emphasis-600)" }}>
        Pre-filled with the mock certificate. Hit <strong>Execute</strong> for instant public values, or <strong>Prove</strong> for a full mock proof.
      </p>

      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>cert_der_hex</label>
      <textarea
        value={certHex}
        onChange={(e) => setCertHex(e.target.value)}
        rows={4}
        style={{ width: "100%", fontFamily: "monospace", fontSize: "0.75rem", padding: "0.5rem", borderRadius: 4, border: "1px solid var(--ifm-color-emphasis-300)", marginBottom: "1rem", boxSizing: "border-box" }}
      />

      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>issuer_pubkey_hex</label>
      <textarea
        value={issuerHex}
        onChange={(e) => setIssuerHex(e.target.value)}
        rows={3}
        style={{ width: "100%", fontFamily: "monospace", fontSize: "0.75rem", padding: "0.5rem", borderRadius: 4, border: "1px solid var(--ifm-color-emphasis-300)", marginBottom: "1rem", boxSizing: "border-box" }}
      />

      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>credential_type</label>
      <select
        value={credentialType}
        onChange={(e) => setCredentialType(Number(e.target.value))}
        style={{ marginBottom: "1.5rem", padding: "0.4rem 0.75rem", borderRadius: 4, border: "1px solid var(--ifm-color-emphasis-300)" }}
      >
        <option value={0}>0 — DNE</option>
        <option value={1}>1 — ISIC</option>
      </select>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <button
          onClick={() => { setMode("execute"); run("execute"); }}
          disabled={loading}
          style={{ padding: "0.5rem 1.25rem", borderRadius: 6, border: "none", background: "var(--ifm-color-primary)", color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontWeight: 600 }}
        >
          {loading && mode === "execute" ? "Running…" : "Execute"}
        </button>
        <button
          onClick={() => { setMode("prove"); run("prove"); }}
          disabled={loading}
          style={{ padding: "0.5rem 1.25rem", borderRadius: 6, border: "1px solid var(--ifm-color-primary)", background: "transparent", color: "var(--ifm-color-primary)", cursor: loading ? "not-allowed" : "pointer", fontWeight: 600 }}
        >
          {loading && mode === "prove" ? "Proving…" : "Prove"}
        </button>
      </div>

      {error && (
        <div style={{ background: "#fff1f0", border: "1px solid #ffa39e", borderRadius: 4, padding: "0.75rem 1rem", color: "#cf1322", fontFamily: "monospace", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {result && (
        <pre style={{ background: "var(--ifm-code-background)", borderRadius: 6, padding: "1rem", overflow: "auto", fontSize: "0.8rem", marginTop: "0.5rem" }}>
          {result}
        </pre>
      )}
    </div>
  );
}
