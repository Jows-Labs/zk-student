"use client";

import { NavBar } from "@/components/NavBar/NavBar";
import { motion } from "motion/react";
import { IoMdArrowForward } from "react-icons/io";
import { LuGraduationCap, LuShieldCheck } from "react-icons/lu";
import Image from "next/image";
import Figure from "@/public/images/Figure.png";
import { MdLockOutline } from "react-icons/md";
import { StepIcon } from "@/components/Step/StepIcon";
import { StepText } from "@/components/Step/StepText";
import { steps } from "@/lib/steps";
import { Footer } from "@/components/Footer/Footer";
import { PoweredBySolSection } from "@/components/PoweredBySolanaSection/PoweredBySolSection";
import { FaRegClipboard } from "react-icons/fa";
import { PiHandCoinsBold } from "react-icons/pi";
import { IoTicketOutline } from "react-icons/io5";
import { ProtocolRewards } from "@/components/ProtocolRewards/ProtocolRewards";

const step = 3;

const progress = ((step - 1) / (steps.length - 1)) * 100;

export default function App() {
  const rewards = [
    {
      icon: <PiHandCoinsBold className="w-full h-full" />,
      bgColor: "bg-[#C2E8FF]",
      iconColor: "text-[#004D67]",
      title: "Students Grants",
      description: "Access student-only grants on Solana.",
    },
    {
      icon: <FaRegClipboard className="w-full h-full" />,
      bgColor: "bg-[#EDEEEF]",
      iconColor: "text-[#4C4355]",
      title: "Job Board",
      description: "Direct hire pipeline for ZK scholars.",
    },
    {
      icon: <IoTicketOutline className="w-full h-full" />,
      bgColor: "bg-[#C2E8FF]",
      iconColor: "text-[#004D67]",
      title: "Exclusive Tickets",
      description: "Students only discount access to Solana events",
    },
  ];
  return (
    <div className="flex flex-col items-center w-full h-screen relative bg-[#F8F9FA] z-10 text-black">
      <NavBar />
      <div className="w-full flex flex-col justify-start items-center overflow-y-auto">
        <section className="w-fit grid flex-col items-center gap-16 px-10 py-12 relative">
          <div className="flex flex-col justify-start gap-4 w-full">
            <h1 className="text-5xl font-bold">Welcome!</h1>
            <p className="text-[#4C4355] text-lg">
              Your cryptographic identity is active on Solana. Begin your
              zero-knowledge<br></br>academic verification to unlock
              protocol-gated benefits.
            </p>
          </div>
          <div className="flex w-fit gap-8 relative">
            <div className="rounded-4xl w-160 h-120 bg-[#7F20E4] opacity-20 absolute -left-20 top-1/2 transform -translate-y-1/2 blur-3xl z-0"></div>
            <div className="rounded-4xl w-120 h-120 bg-[#0080A9] opacity-20 absolute -right-20 top-3/5 transform -translate-y-1/2 blur-3xl z-0"></div>
            <div className="flex flex-col gap-6 w-full z-1">
              <div className="flex gap-10 justify-center items-center py-12 px-10 bg-white/80 border-white/30 backdrop-blur-sm rounded-3xl h-fit z-1">
                <div className="flex flex-col gap-12 justify-between w-full min-h-full">
                  <div className="flex flex-col gap-4 justify-start">
                    <div className="flex gap-2 items-center text-[#7F20E4] bg-[#7F20E4]/10 rounded-full py-2 px-6 w-fit">
                      <LuShieldCheck className="text-xl" />
                      <p className="text-sm font-bold">PENDING VERIFICATION</p>
                    </div>
                    <h3 className="text-3xl font-bold">
                      Verify Academic Standing
                    </h3>
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
              <div className="flex flex-col gap-10 justify-center items-center py-10 px-10 bg-white/60 border border-white/20 backdrop-blur-sm rounded-3xl h-fit z-1">
                <div className="w-full flex justify-between items-center gap-8">
                  <p className="text-2xl">Identity Vault</p>
                  <MdLockOutline className="text-2xl text-[#4C4355]" />
                </div>
                <div className="w-full border border-2 border-[#CEC2D8]/50 border-dashed px-10 py-14 flex flex-col gap-4 justify-center items-center rounded-lg">
                  <LuGraduationCap className="bg-[#EDEEEF] text-[#4C4355] w-18 aspect-square h-auto p-2 rounded-2xl" />
                  <p className="text-center text-[#4C4355]">
                    No academic data found.<br></br>Complete verification to
                    populate your profile.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4 justify-start items-start p-6 border h-fit w-100 rounded-3xl bg-white/60 backdrop-blur-sm border-white/20">
                <p className="text-md font-bold text-[#4C4355]">
                  NETWORK STATUS
                </p>
                <div className="flex gap-2 items-center">
                  <span className="w-3 h-3 bg-[#006D40] shadow-lg shadow-[#006D40] rounded-full"></span>
                  <p className="text-2xl">Mainnet Beta</p>
                </div>
              </div>
              <ProtocolRewards rewards={rewards} />
            </div>
          </div>
        </section>
        <section className="py-14 px-36">
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
