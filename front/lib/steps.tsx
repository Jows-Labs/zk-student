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
    description: "Submit your student ID.",
  },
  {
    Icon: LuShieldCheck,
    title: "Validate",
    description: "ZK-Proof protocol confirms your status.",
  },
  {
    Icon: FaRegIdCard,
    title: "Generate",
    description: "Generate your on-chain student Id.",
  },
  {
    Icon: MdOutlineRocketLaunch,
    title: "Use",
    description: "Access exclusive student benefits.",
  },
];
