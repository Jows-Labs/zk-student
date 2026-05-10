"use client";

import { useContentContext } from "@/lib/content-context";
import { motion } from "motion/react";
import ZKSLogo from "@/public/images/logo.png";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SnsIcon from "@/public/images/sns.png";
import { FiLogOut } from "react-icons/fi";

export const NavBar = () => {
  const router = useRouter();
  const { primaryDomain, walletAddress, connectWallet, disconnectWallet } =
    useContentContext();

  const addressText = walletAddress || "";
  const maxCharacters = 12;
  const truncatedAddress =
    addressText.length > maxCharacters
      ? addressText.slice(0, maxCharacters) + "..."
      : addressText;

  const [logoutHover, setLogoutHover] = useState(false);

  return (
    <nav className="w-full flex items-center justify-between px-8 bg-gradient-to-r from-white via-white/60 to-white drop-shadow-xl/2">
      <div
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => router.push("/")}
      >
        <Image
          src={ZKSLogo}
          alt="ZK Student Logo"
          className="h-12 w-auto border-r-2 border-[#E3E0F1] p-2 pr-4"
        />
        <h1 className="text-4xl font-bold text-[#7F20E4] inline-block align-baseline py-4">
          ZK Student
        </h1>
      </div>
      <div className="flex items-center gap-6 py-4">
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
          <div className="flex items-center gap-2 text-sm bg-black py-2 px-4 h-10 rounded-2xl border border-[#CEC2D8]/30 text-white">
            <Image src={SnsIcon} alt="SNS Icon" className="h-2 h-full w-fit" />
            {primaryDomain}
          </div>
        )}
        {truncatedAddress && (
          <div
            className={`flex items-center gap-2 text-sm py-2 px-4 h-10 rounded-2xl border border-[#CEC2D8]/30 relative overflow-hidden cursor-pointer w-33 overflow-hidden ${logoutHover ? "bg-red-500/90 text-white" : "bg-[#F3F4F5]"} transition-colors duration-300`}
            onMouseEnter={() => setLogoutHover(true)}
            onMouseLeave={() => setLogoutHover(false)}
            onClick={disconnectWallet}
          >
            {logoutHover ? (
              <>
                <FiLogOut className="h-full w-fit" />
                <p>Disconnect</p>
              </>
            ) : (
              <>
                <span className="rounded-full bg-[#34FEA0] h-2/4 aspect-square"></span>
                <p className="truncate">{truncatedAddress}</p>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
