import { useState } from "react";
import { UploadPemModal } from "./UploadPemModal/UploadPemModal";
import { GenProofModal } from "./GeneratingProofModal/GenProofModal";
import { useContentContext } from "@/lib/content-context";
import { ProofModal } from "./ProofModal/ProofModal";
import { motion } from "motion/react";
import { IoMdClose } from "react-icons/io";

export const CreateZkProofPopup = () => {
  const { createCertificateStep, setCreateCertificateStep } =
    useContentContext();
  const [step, setStep] = useState(1);

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
      <UploadPemModal isOpen={createCertificateStep === 1} />
      <GenProofModal isOpen={createCertificateStep === 2} />
      <ProofModal isOpen={createCertificateStep === 3} />
    </div>
  ) : (
    <></>
  );
};
