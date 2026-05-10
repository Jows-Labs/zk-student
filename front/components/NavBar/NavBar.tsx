"use client";

import { useContentContext } from "@/lib/content-context";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import SnsIcon from "@/public/images/sns.png";

export const NavBar = () => {
  const router = useRouter();
  const { primaryDomain, walletAddress, connectWallet, disconnectWallet } =
    useContentContext();

  const addressText = walletAddress || "";
  const maxCharacters = 8;
  const truncatedAddress =
    addressText.length > maxCharacters
      ? addressText.slice(0, maxCharacters) + "..."
      : addressText;

  return (
    <nav
      className="w-full py-4 flex items-center justify-between px-8 bg-gradient-to-r from-white via-white/60 to-white drop-shadow-xl/2 cursor-pointer"
      onClick={() => router.push("/")}
    >
      <h1 className="text-4xl font-bold text-[#7F20E4]">ZK Student</h1>
      <div className="flex items-center gap-6">
        {!walletAddress && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="py-2 px-10 rounded-xl text-md bg-radial-[at_25%_25%] from-[#7F20E4] to-[#0080A9] to-75% cursor-pointer text-white font-bold"
            onClick={walletAddress ? disconnectWallet : connectWallet}
          >
            Connect Wallet
          </motion.button>
        )}
        {primaryDomain && (
          <div className="flex items-center gap-2 text-sm bg-black py-2 px-4 rounded-2xl border border-[#CEC2D8]/30 text-white">
            <Image src={SnsIcon} alt="SNS Icon" width={20} height={20} />
            {primaryDomain}
          </div>
        )}
        {truncatedAddress && (
          <div className="flex items-center gap-2 text-sm bg-[#F3F4F5] py-2 px-4 rounded-2xl border border-[#CEC2D8]/30">
            <span className="rounded-full bg-[#34FEA0] w-2 h-2"></span>
            {truncatedAddress}
          </div>
        )}
      </div>
    </nav>
  );
};
