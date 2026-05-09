import { IconType } from "react-icons";
import { FaRegIdCard } from "react-icons/fa";
import { LuShieldCheck } from "react-icons/lu";
import {
  MdOutlineRocketLaunch,
  MdOutlineUploadFile,
  MdWallet,
} from "react-icons/md";

export const steps: {
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
