import { useContentContext } from "@/lib/content-context";
import { motion } from "motion/react";
import { useRef, type ChangeEvent } from "react";
import { FaFileInvoice } from "react-icons/fa";
import { IoFingerPrint } from "react-icons/io5";
import { MdOutlineShield } from "react-icons/md";
import { parse_cert, verify_cert } from "zk-student-wasm";

const ISSUER_PUBKEY_DER = Uint8Array.from(
  atob(
    "MIIBCgKCAQEAxhjzPuiVgdtixl8xR5a657fiQ4WZXJChsoglEZqL96ovP+lo7Fix" +
      "EmyNLR3LfNA7mbCcFrYfi9arI5iShV9vSA8xvvdeqWXvUDT1CNCoOkbH8wpfNTwr" +
      "OijKhszPvj2fqLdJji2VrRJf7Vilj8yQ5KtweTAW4+BcLy5WkOa73lxbIPyzhlOJ" +
      "4Lwbl18uW7tlWBaQonySO4HDDFL3SO9NVFvxebD9g13kpw5M7PCgPQje02ebcgTi" +
      "88ZLlOhDdYYKkyGbVKK2kUMd9RTE4kn4r3suWmaxoCd0+17wJYYxrOflZ2dL+WRH" +
      "G7CMa4pYKEWxpLXo4bDsjcr4Frh+Y7//DQIDAQAB",
  ),
  (character) => character.charCodeAt(0),
);

const pemToDer = (pem: string) => {
  const base64 = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

export const UploadPemModal = ({ isOpen }: { isOpen: boolean }) => {
  const { setCreateCertificateStep } = useContentContext();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectClick = () => inputRef.current?.click();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pem")) {
      alert("Please select a .pem file");
      e.target.value = "";
      return;
    }

    try {
      const pem = await file.text();
      const bytes = pemToDer(pem);
      const fields = parse_cert(bytes);

      verify_cert(bytes, ISSUER_PUBKEY_DER);
      console.log("Parsed certificate fields:", fields);
      setCreateCertificateStep?.(2);
    } catch (error) {
      e.target.value = "";
      console.error("Error parsing certificate:", error);
    }
  };
  return isOpen ? (
    <div className="bg-white/90 border border-white/20 rounded-3xl p-6 flex items-center justify-center relative">
      <div className="bg-white/50 border border-white/50 rounded-2xl py-10 px-20 flex flex-col justify-center items-center gap-6">
        <FaFileInvoice className="bg-[#7F20E4]/10 p-5 w-20 h-auto rounded-2xl text-[#7F20E4]" />
        <h1 className="text-3xl font-bold">Upload your .PEM certificate</h1>
        <div className="text-center">
          <p className="text-[#4C4355]">
            Drag and drop your encrypted PEM file or click to brose.
          </p>
          <p className="text-[#7F20E4]">
            Verification occurs locally on your machine.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pem"
          className="hidden"
          onChange={handleFileChange}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="py-4 px-12 flex items-center gap-1 rounded-xl text-2xl bg-linear-to-r from-[#7F20E4] to-[#0080A9] to-75% cursor-pointer text-white w-fit"
          onClick={handleSelectClick}
        >
          <p className="text-nowrap">Select Certificate</p>
        </motion.button>
        <div className="flex gap-10">
          <div className="flex gap-1 items-center text-[#4C4355]">
            <MdOutlineShield className="text-lg" />
            <p className="font-bold text-sm">ZK-Proof Ready</p>
          </div>
          <div className="flex gap-1 items-center text-[#4C4355]">
            <IoFingerPrint className="text-lg" />
            <p className="font-bold text-sm">Private</p>
          </div>
        </div>
      </div>
    </div>
  ) : null;
};
