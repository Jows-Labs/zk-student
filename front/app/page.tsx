"use client";
import { NavBar } from "@/components/NavBar/NavBar";
import { motion } from "motion/react";
import { IoMdArrowForward } from "react-icons/io";

import { useRouter } from "next/navigation";
import { StepText } from "@/components/Step/StepText";
import { StepIcon } from "@/components/Step/StepIcon";
import { PoweredBySolSection } from "@/components/PoweredBySolanaSection/PoweredBySolSection";
import { Footer } from "@/components/Footer/Footer";
import { ZKStudentsSteps } from "@/components/ZKStudentsSteps/ZKStudentsSteps";

export default function Home() {
  const router = useRouter();
  return (
    <div className="flex flex-col w-full h-screen relative bg-white z-10 text-black">
      <NavBar />
      <div className="flex flex-col items-center justify-start overflow-y-auto relative">
        <div className="rounded-full w-180 aspect-square bg-[#0080A9] opacity-20 absolute left-1/2 -top-65 transform -translate-x-1/2 z-0 blur-3xl"></div>
        <section className="flex flex-col items-center justify-center p-14 gap-8 w-full z-1">
          <h4 className="text-md font-semibold tracking-widest text-[#7F20E4]">
            IDENTITY ON SOLANA
          </h4>
          <h1 className="text-6xl font-semibold text-black text-center">
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
            <h2 className="text-4xl font-medium text-black text-center">
              How it works
            </h2>
            <span className="w-2/4 h-1 bg-[#7F20E4] rounded-full mt-4 mb-12"></span>
          </div>
          <ZKStudentsSteps />
        </section>
        <PoweredBySolSection />
        <Footer />
      </div>
    </div>
  );
}
