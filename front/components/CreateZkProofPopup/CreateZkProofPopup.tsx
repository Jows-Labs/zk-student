import { useState, useRef, type ChangeEvent } from "react";
import { UploadPemModal } from "./UploadPemModal/UploadPemModal";
import { GenProofModal } from "./GeneratingProofModal/GenProofModal";
import { useContentContext, type ProverResponse } from "@/lib/content-context";
import { ProofModal } from "./ProofModal/ProofModal";
import { motion } from "motion/react";
import { IoMdClose } from "react-icons/io";
import { parse_cert, verify_cert } from "zk-student-wasm";
import { ISSUER_PUBKEY_DER } from "@/lib/issuerPubkeyDer";
import {
  callProver,
  issueCredential,
  initializeProtocol,
  addIssuer,
  type ProveResponse,
} from "@/lib/protocol";
import { set } from "@coral-xyz/anchor/dist/cjs/utils/features";

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
      console.log("Certificate fields:", fields);

      setCreateCertificateStep?.(2);
      const proverData = await fetchProverApiZkProccess?.({
        cert_der_hex: Buffer.from(bytes).toString("hex"),
      });

      if (proverData?.is_valid_student && proverData?.is_not_expired) {
        setGenZkProofStep(2);
        try {
          const res = await callProver(
            Buffer.from(bytes).toString("hex"),
            Buffer.from(ISSUER_PUBKEY_DER).toString("hex"),
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
      console.log("Initializing protocol...");
      await initializeProtocol(wallet);

      console.log("Adding issuer...");
      const issuerPubkeyHex = Buffer.from(ISSUER_PUBKEY_DER).toString("hex");
      await addIssuer(wallet, issuerPubkeyHex, 0, certificateFields.issuer);

      console.log("Issuing credential...");
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

  const resetState = () => {
    setCertificateFields(null);
    setProverResponse(null);
    setGenZkProofStep(1);
    inputRef.current.value = "";
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
