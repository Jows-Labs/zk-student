import { useContentContext } from "@/lib/content-context";
import { motion } from "motion/react";
import { useState } from "react";
import { FaCheckCircle, FaShieldAlt } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";

export const GenProofModal = ({ isOpen }: { isOpen: boolean }) => {
  const [currentStep, setCurrentStep] = useState(2);
  const dotVariants = {
    pulse: {
      scale: [1, 1.4, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop" as const,
      },
    },
    pulseDelayed: {
      scale: [1, 1.4, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop" as const,
        delay: 1,
      },
    },
  };
  const ListItem = ({ item, index }: { item: string; index: number }) => {
    return (
      <div
        className={`flex gap-4 items-center justify-start py-4 pl-5 pr-20 rounded-xl ${index === currentStep ? "border border-[#7F20E4]/10 border-2 bg-white text-[#7F20E4]" : "border border-transparent bg-[#F8F9FA]/50"}`}
      >
        {index === currentStep ? (
          <div className="w-6 h-6 flex items-center justify-center">
            <motion.div
              className="bg-[#7F20E4] w-3 h-3 rounded-full"
              variants={dotVariants}
              animate="pulse"
            />
          </div>
        ) : index > currentStep ? (
          <div className="w-6 h-6" />
        ) : (
          <FaCheckCircle className="w-6 h-auto text-[#006D40]" />
        )}
        <p className="font-bold text-sm">{item}</p>
      </div>
    );
  };

  const List = [
    "AUTHENTICATING WALLET",
    "CREATING ZERO-KNOWLEDGE PROOF",
    "ANCHORING TO SOLANA MAINNET",
  ];

  return isOpen ? (
    <div className="bg-white/90 border border-white/20 rounded-3xl pt-20 pb-10 px-10 flex flex-col items-center justify-center relative gap-12">
      <motion.div className="p-6 z-10 relative">
        <div className="border border-[#7F20E4] border-dashed p-10 rounded-full relative opacity-50">
          <div className="bg-[#7F20E4] w-3 h-3 rounded-full absolute -top-1.5 left-1/2 transform -translate-x-1/2" />
          <div className="bg-[#7F20E4] w-3 h-3 rounded-full absolute -bottom-1.5 right-1/2 transform translate-x-1/2" />
          <div className="bg-[#7F20E4] w-3 h-3 rounded-full absolute top-1/2 -left-1.5" />
          <div className="bg-[#7F20E4] w-3 h-3 rounded-full absolute top-1/2 -right-1.5" />

          <FaShieldAlt className="w-24 h-auto p-4 bg-white border border-2 border-[#7F20E4]/20 text-[#7F20E4] rounded-2xl" />
        </div>
        <motion.div
          variants={dotVariants}
          animate="pulse"
          className="bg-[#006687] w-4 h-4 rounded-full absolute bottom-0 left-0 drop-shadow-lg"
          style={{
            filter: "drop-shadow(0 0 5px rgba(127, 32, 228, 0.5))",
          }}
        />
        <motion.div
          variants={dotVariants}
          animate="pulseDelayed"
          className="bg-[#7F20E4] w-4 h-4 rounded-full absolute top-0 right-0 drop-shadow-lg"
          style={{
            filter: "drop-shadow(0 0 5px rgba(127, 32, 228, 0.5))",
          }}
        />
      </motion.div>
      <div className="flex flex-col gap-4 items-center text-center">
        <h1 className="text-3xl font-bold">Generating ZK-Proof...</h1>
        <p className="text-[#4C4355] text-md">
          We are cryptographically validating<br></br>your academic credentials
          on<br></br>Solana. Your privacy is preserved.
        </p>
      </div>
      <div className="flex flex-col w-full gap-2">
        {List.map((item, index) => (
          <ListItem item={item} index={index} key={index} />
        ))}
      </div>
    </div>
  ) : null;
};
