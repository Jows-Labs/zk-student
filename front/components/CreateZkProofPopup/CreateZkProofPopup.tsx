import { useState, useRef, type ChangeEvent } from "react";
import { UploadPemModal } from "./UploadPemModal/UploadPemModal";
import { GenProofModal } from "./GeneratingProofModal/GenProofModal";
import { useContentContext, type ProverResponse } from "@/lib/content-context";
import { ProofModal } from "./ProofModal/ProofModal";
import { motion } from "motion/react";
import { IoMdClose } from "react-icons/io";
import { parse_cert, verify_cert } from "zk-student-wasm";
import { ISSUER_PUBKEY_DER } from "@/lib/issuerPubkeyDer";
import { callProver } from "@/lib/protocol";

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

export const CreateZkProofPopup = () => {
  const {
    createCertificateStep,
    setCreateCertificateStep,
    fetchProverApiZkProccess,
  } = useContentContext();
  const inputRef = useRef<HTMLInputElement>(null!);
  const [certificateFields, setCertificateFields] = useState<{
    birthDate: Date;
    notAfter: Date;
    notBefore: Date;
    issuer: string;
  } | null>(null);
  const [genZkProofStep, setGenZkProofStep] = useState(1);

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
      setCertificateFields(fields);
      console.log("Certificate fields:", fields);

      setCreateCertificateStep?.(2);
      const proverData = await fetchProverApiZkProccess?.({
        cert_der_hex: Buffer.from(bytes).toString("hex"),
      });

      if (proverData?.is_valid_student && proverData?.is_not_expired) {
        setGenZkProofStep(2);
        callProver(
          Buffer.from(bytes).toString("hex"),
          Buffer.from(ISSUER_PUBKEY_DER).toString("hex"),
        ).then((res) => {
          console.log("Prover response:", res);
          setGenZkProofStep(3);
        });
      }
    } catch (error) {
      e.target.value = "";
      console.error("Error parsing certificate:", error);
    }
  };

  const handleSelectClick = () => inputRef.current?.click();

  return (createCertificateStep ?? 0) >= 1 ? (
    <div className="fixed inset-0 bg-black bg-black/50 flex items-center justify-center z-500">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-10 right-10 text-2xl cursor-pointer w-8 h-auto bg-white rounded-lg"
        onClick={() => setCreateCertificateStep?.(0)}
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
      <ProofModal isOpen={createCertificateStep === 3} />
    </div>
  ) : (
    <></>
  );
};
