import { useState, useRef, type ChangeEvent } from "react";
import { UploadPemModal } from "./UploadPemModal/UploadPemModal";
import { GenProofModal } from "./GeneratingProofModal/GenProofModal";
import { useContentContext, type ProverResponse } from "@/lib/content-context";
import { ProofModal } from "./ProofModal/ProofModal";
import { motion } from "motion/react";
import { IoMdClose } from "react-icons/io";
import { parse_cert, verify_cert, generate_mock_cert } from "zk-student-wasm";
import { ISSUER_PUBKEY_DER } from "@/lib/issuerPubkeyDer";
import {
  callProver,
  issueCredential,
  bytesToHex,
  type ProveResponse,
} from "@/lib/protocol";

const pemToDer = (pem: string) => {
  const base64 = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const parseDate = (dateValue: unknown): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === "string") {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof dateValue === "number") {
    return new Date(dateValue);
  }
  return null;
};

export const CreateZkProofPopup = () => {
  const {
    createCertificateStep,
    setCreateCertificateStep,
    fetchProverApiZkProccess,
    wallet,
  } = useContentContext();

  const inputRef = useRef<HTMLInputElement>(null!);
  const [certificateFields, setCertificateFields] = useState<{
    birthDate: Date;
    notAfter: Date;
    notBefore: Date;
    issuer: string;
  } | null>(null);
  const [genZkProofStep, setGenZkProofStep] = useState(1);
  const [proverResponse, setProverResponse] = useState<ProveResponse | null>(
    null,
  );

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pem")) {
      alert("Please select a .pem file");
      e.target.value = "";
      return;
    }

    try {
      const pem = await file.text();
      const bytes = pemToDer(pem);
      const fields = parse_cert(bytes);

      verify_cert(bytes, ISSUER_PUBKEY_DER);
      const parsedBirthDate = parseDate(fields.birth_date);
      const parsedNotBefore = parseDate(fields.not_before);
      const parsedNotAfter = parseDate(fields.not_after);

      if (!parsedBirthDate || !parsedNotBefore || !parsedNotAfter) {
        throw new Error("Failed to parse certificate dates");
      }

      setCertificateFields({
        birthDate: parsedBirthDate,
        notAfter: parsedNotAfter,
        notBefore: parsedNotBefore,
        issuer: fields.issuer_cn || "N/A",
      });

      setCreateCertificateStep?.(2);
      const proverData = await fetchProverApiZkProccess?.({
        cert_der_hex: bytesToHex(bytes),
      });

      if (!proverData) {
        alert("Failed to reach the prover server. Please try again.");
        resetState();
        setCreateCertificateStep?.(1);
        return;
      }
      if (!proverData.is_valid_student) {
        alert("Certificate is not valid. Make sure you are using a valid DNE certificate.");
        resetState();
        setCreateCertificateStep?.(1);
        return;
      }
      if (!proverData.is_not_expired) {
        alert("Certificate has expired.");
        resetState();
        setCreateCertificateStep?.(1);
        return;
      }

      setGenZkProofStep(2);
      try {
        const res = await callProver(
          bytesToHex(bytes),
          bytesToHex(ISSUER_PUBKEY_DER),
        );
        setProverResponse(res);
        setGenZkProofStep(3);
        setCreateCertificateStep?.(3);
      } catch (error) {
        console.error("Error calling prover:", error);
        const errorMessage = String(error);
        if (errorMessage.includes("Transaction cancelled")) {
          alert("Transaction was cancelled. Please try again.");
        } else {
          alert(`Error generating proof: ${errorMessage}`);
        }
        resetState();
        setCreateCertificateStep?.(1);
      }
    } catch (error) {
      e.target.value = "";
      console.error("Error parsing certificate:", error);
      resetState();
    }
  };

  const handleTransaction = async () => {
    if (!wallet) {
      console.error("Wallet is not available.");
      return;
    }
    if (!proverResponse) {
      console.error("Prover response is not available.");
      return;
    }
    if (!certificateFields) {
      console.error("Certificate fields are not available.");
      return;
    }
    try {
      await issueCredential(wallet, proverResponse);
      setGenZkProofStep(3);
      setTimeout(() => {
        resetState();
      }, 2000);
    } catch (credentialError) {
      console.error("Error in transaction process:", credentialError);
      const errorMessage = String(credentialError);
      if (errorMessage.includes("Transaction cancelled")) {
        alert("Transaction was cancelled. Please try again.");
        setGenZkProofStep(2);
      } else {
        alert(`Error: ${errorMessage}`);
        resetState();
        setCreateCertificateStep?.(1);
      }
    }
  };

  const handleSelectClick = () => inputRef.current?.click();

  const handleMockCert = async () => {
    try {
      const mock = generate_mock_cert() as { cert_der_hex: string; issuer_pubkey_hex: string };
      const bytes = Uint8Array.from(
        mock.cert_der_hex.match(/.{2}/g)!.map((b) => parseInt(b, 16)),
      );
      const fields = parse_cert(bytes);
      const parsedBirthDate = parseDate(fields.birth_date);
      const parsedNotBefore = parseDate(fields.not_before);
      const parsedNotAfter = parseDate(fields.not_after);
      if (!parsedBirthDate || !parsedNotBefore || !parsedNotAfter) {
        throw new Error("Failed to parse mock certificate dates");
      }
      setCertificateFields({
        birthDate: parsedBirthDate,
        notAfter: parsedNotAfter,
        notBefore: parsedNotBefore,
        issuer: fields.issuer_cn || "TEST STUDENT ENTITY",
      });
      setCreateCertificateStep?.(2);
      const proverData = await fetchProverApiZkProccess?.({
        cert_der_hex: mock.cert_der_hex,
        issuer_pubkey_hex: mock.issuer_pubkey_hex,
      });
      if (!proverData) {
        alert("Failed to reach the prover server. Please try again.");
        resetState();
        setCreateCertificateStep?.(1);
        return;
      }
      if (!proverData.is_valid_student) {
        alert("Demo certificate is not valid. Please try again.");
        resetState();
        setCreateCertificateStep?.(1);
        return;
      }
      if (!proverData.is_not_expired) {
        alert("Demo certificate has expired.");
        resetState();
        setCreateCertificateStep?.(1);
        return;
      }
      setGenZkProofStep(2);
      try {
        const res = await callProver(mock.cert_der_hex, mock.issuer_pubkey_hex);
        setProverResponse(res);
        setGenZkProofStep(3);
        setCreateCertificateStep?.(3);
      } catch (error) {
        console.error("Error calling prover:", error);
        const errorMessage = String(error);
        if (errorMessage.includes("Transaction cancelled")) {
          alert("Transaction was cancelled. Please try again.");
        } else {
          alert(`Error generating proof: ${errorMessage}`);
        }
        resetState();
        setCreateCertificateStep?.(1);
      }
    } catch (error) {
      console.error("Error generating mock certificate:", error);
      resetState();
    }
  };

  const resetState = () => {
    setCertificateFields(null);
    setProverResponse(null);
    setGenZkProofStep(1);
    if (inputRef.current) inputRef.current.value = "";
    setCreateCertificateStep?.(0);
  };

  const handleCloseModal = () => {
    resetState();
    setCreateCertificateStep?.(0);
  };

  return (createCertificateStep ?? 0) >= 1 ? (
    <div className="fixed inset-0 bg-black bg-black/70 flex items-center justify-center z-500">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-10 right-10 text-2xl cursor-pointer w-8 h-auto bg-white rounded-lg"
        onClick={handleCloseModal}
      >
        <IoMdClose className="w-full h-full" />
      </motion.div>
      <UploadPemModal
        isOpen={createCertificateStep === 1}
        onFileSelect={handleSelectClick}
        onFileChange={handleFileChange}
        onMockCert={handleMockCert}
        inputRef={inputRef}
      />
      <GenProofModal
        isOpen={createCertificateStep === 2}
        currentStep={genZkProofStep}
      />
      <ProofModal
        isOpen={createCertificateStep === 3}
        handleTransaction={handleTransaction}
        fields={certificateFields}
      />
    </div>
  ) : (
    <></>
  );
};
