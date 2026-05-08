"use client";
import { NavBar } from "@/components/NavBar/NavBar";
import { motion } from "motion/react";
import { FaRegIdCard } from "react-icons/fa";
import { IoMdArrowForward } from "react-icons/io";
import type { IconType } from "react-icons";
import { LuShieldCheck } from "react-icons/lu";
import {
  MdOutlineRocketLaunch,
  MdOutlineUploadFile,
  MdWallet,
} from "react-icons/md";
import Image from "next/image";
import SolanaIcon from "@/public/images/solana.png";

const step = 3;

const steps: {
  Icon: IconType;
  title: string;
  description: string;
}[] = [
  {
    Icon: MdWallet,
    title: "Connect",
    description: "Link your Phantom Wallet to begin.",
  },
  {
    Icon: MdOutlineUploadFile,
    title: "Upload",
    description: "Submit your student ID or email.",
  },
  {
    Icon: LuShieldCheck,
    title: "Validate",
    description: "ZK-Proof protocol confirms your status.",
  },
  {
    Icon: FaRegIdCard,
    title: "Mint",
    description: "Receive your soulbound academic ID.",
  },
  {
    Icon: MdOutlineRocketLaunch,
    title: "Use",
    description: "Access exclusive student benefits.",
  },
];

const progress = ((step - 1) / (steps.length - 1)) * 100;

const StepIcon = ({ Icon, active }: { Icon: IconType; active: boolean }) => {
  return (
    <div
      className={`p-6 shadow-md rounded-xl w-fit h-fit bg-white z-1 border-2 transition-colors ${
        active ? "border-[#7F20E4]" : "border-transparent"
      }`}
    >
      <Icon className="w-8 h-auto" />
    </div>
  );
};

const StepText = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="text-center gap-1 flex flex-col max-w-48">
      <p className="font-bold text-lg">{title}</p>
      <p className="text-[#4C4355]">{description}</p>
    </div>
  );
};

export default function Home() {
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
        <section className="flex flex-col p-14 items-center w-full relative gap-8 overflow-hidden min-h-fit">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-4 z-20 bg-gradient-to-b from-[#343440]/20 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 z-20 bg-gradient-to-t from-[#343440]/20 to-transparent" />
          <div className="rounded-full w-240 aspect-3/2 bg-[#7F20E4]/60 opacity-15 absolute left-1/2 top-1/2 -translate-y-1/2 transform -translate-x-1/2 z-0 blur-2xl"></div>

          <div className="bg-[#343440]/5 h-32 aspect-square p-5 rounded-2xl border border-[#343440]/10 flex items-center justify-center">
            <Image
              src={SolanaIcon}
              alt="Solana Logo"
              className="h-auto w-full"
            />
          </div>
          <h1 className="text-5xl font-bold">Powered by Solana.</h1>
          <p className="text-center text-[#343440]/60 text-lg">
            Leveraging the world&apos;s most performant blockchain to provide
            student credentials that<br></br>are as fast as the internet and as
            secure as vault.
          </p>
          <div className="flex gap-12 items-center justify-center">
            <p className="text-2xl text-[#343440]/40 font-bold">
              DECENTRALIZED
            </p>
            <p className="text-2xl text-[#343440]/40 font-bold">SECURE</p>
            <p className="text-2xl text-[#343440]/40 font-bold">EFFICIENT</p>
          </div>
        </section>
        <section className="w-full p-10 text-center">
          <p className="text-[#4C4355] text-lg justify-self-center">
            © 2026 ZK Student Protocol. Built on Solana.
          </p>
        </section>
      </div>
    </div>
  );
}
