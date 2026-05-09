"use client";
import { NavBar } from "@/components/NavBar/NavBar";
import { motion } from "motion/react";
import { IoMdArrowForward } from "react-icons/io";

import Image from "next/image";
import SolanaIcon from "@/public/images/solana.png";
import { useRouter } from "next/navigation";
import { StepText } from "@/components/Step/StepText";
import { StepIcon } from "@/components/Step/StepIcon";
import { steps } from "@/lib/steps";
import { PoweredBySolSection } from "@/components/PoweredBySolanaSection/PoweredBySolSection";
import { Footer } from "@/components/Footer/Footer";

const step = 3;

const progress = ((step - 1) / (steps.length - 1)) * 100;

export default function Home() {
  const router = useRouter();
  return (
    <div className="flex flex-col w-full h-screen relative bg-white z-10 text-black">
      <NavBar />
      <div className="flex flex-col items-center justify-start overflow-y-auto relative">
        <div className="rounded-full w-180 aspect-square bg-[#0080A9] opacity-20 absolute left-1/2 -top-65 transform -translate-x-1/2 z-0 blur-3xl"></div>
        <section className="flex flex-col items-center justify-center p-14 gap-8 w-full z-1">
          <h4 className="text-md font-bold tracking-widest text-[#7F20E4]">
            IDENTITY ON SOLANA
          </h4>
          <h1 className="text-6xl font-bold text-black text-center">
            Your On-Chain academic<br></br>identity.
          </h1>
          <p className="text-xl text-gray-600 text-center">
            Verify your student credentials and receive your decentralized
            academic<br></br>identity powered by Solana. Fast, private, and
            permanent.
          </p>
          <div className="flex gap-5">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="py-4 px-12 flex items-center gap-1 rounded-xl text-xl bg-radial-[at_25%_25%] from-[#7F20E4] to-[#0080A9] to-75% cursor-pointer text-white"
              onClick={() => router.push("/app")}
            >
              <p className="text-nowrap">Launch App</p>
              <IoMdArrowForward className="h-7 w-auto" />
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="py-4 px-12 rounded-xl text-xl border border-[#CEC2D8] cursor-pointer"
            >
              View Docs
            </motion.button>
          </div>
        </section>
        <section className="flex flex-col p-14 items-center w-full drop-shadow-xl/2">
          <div className="flex flex-col items-center justify-center w-fit">
            <h2 className="text-4xl font-bold text-black text-center">
              How it works
            </h2>
            <span className="w-2/4 h-1 bg-[#7F20E4] rounded-full mt-4 mb-12"></span>
          </div>
          <div className="grid grid-cols-5 grid-rows-2 gap-x-10 gap-y-6 relative items-start justify-items-center w-full max-w-7xl">
            <div className="absolute inset-x-0 top-10 -translate-y-1/2 h-1 bg-[#CEC2D8]/30 overflow-hidden">
              <div
                className="h-full transition-[width] duration-500 ease-out bg-gradient-to-r from-[#7C3AED]/30 via-[#8B5CF6]/30 to-[#A78BFA]/30"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            {steps.map(({ Icon }, index) => (
              <StepIcon key={Icon.name} Icon={Icon} active={index < step} />
            ))}
            {steps.map(({ title, description }) => (
              <StepText key={title} title={title} description={description} />
            ))}
          </div>
        </section>
        <PoweredBySolSection />
        <Footer />
      </div>
    </div>
  );
}
