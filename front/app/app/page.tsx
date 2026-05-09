"use client";

import { NavBar } from "@/components/NavBar/NavBar";
import { motion } from "motion/react";
import { IoMdArrowForward } from "react-icons/io";
import { LuShieldCheck } from "react-icons/lu";
import Image from "next/image";
import Figure from "@/public/images/Figure.png";

export default function App() {
  return (
    <div className="flex flex-col w-full h-screen relative bg-white z-10 text-black">
      <NavBar />
      <div className="w-full px-36 py-12 flex flex-col justify-start items-start gap-16">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-bold">Welcome!</h1>
          <p className="text-[#4C4355] text-lg">
            Your cryptographic identity is active on Solana. Begin your
            zero-knowledge<br></br>academic verification to unlock
            protocol-gated benefits.
          </p>
        </div>
        <section className="w-full flex gap-8">
          <div className="flex gap-10 justify-center items-center py-12 px-10 bg-white/80 border rounded-3xl h-fit">
            <div className="flex flex-col gap-12 justify-between w-full min-h-full">
              <div className="flex flex-col gap-4 justify-start">
                <div className="flex gap-2 items-center text-[#7F20E4] bg-[#7F20E4]/10 rounded-full py-2 px-6 w-fit">
                  <LuShieldCheck className="text-xl" />
                  <p className="text-sm font-bold">PENDING VERIFICATION</p>
                </div>
                <h3 className="text-3xl font-bold">Verify Academic Standing</h3>
                <p className="text-[#4C4355] text-md">
                  Upload your university-issued digital certificate (.PEM or
                  <br></br>
                  .JSON-LD) to generate a secure ZK-proof of your student
                  <br></br>status without revealing sensitive metadata.
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="py-4 px-12 flex items-center gap-1 rounded-xl text-2xl bg-radial-[at_25%_25%] from-[#9945FF] to-[#14F195] to-75% cursor-pointer text-white w-fit"
              >
                <p className="text-nowrap">Begin Verification</p>
                <IoMdArrowForward className="h-7 w-auto" />
              </motion.div>
            </div>
            <Image
              src={Figure}
              alt="Neural Figure"
              className="w-auto h-70 rounded-2xl border-4 border-white shadow-2xl"
            />
          </div>
          <div className="flex flex-col gap-4 justify-start items-start p-6 border h-fit w-90 rounded-3xl">
            <p className="text-md font-bold text-[#4C4355]">NETWORK STATUS</p>
            <div className="flex gap-2 items-center">
              <span className="w-3 h-3 bg-[#006D40] shadow-lg shadow-[#006D40] rounded-full"></span>
              <p className="text-2xl">Mainnet Beta</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
