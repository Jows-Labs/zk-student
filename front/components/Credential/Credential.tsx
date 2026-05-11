import { useContentContext } from "@/lib/content-context";
import { ShineBorder } from "@/components/ui/shine-border";
import { PiMedalBold } from "react-icons/pi";

export const Credential = () => {
  const { studentCredential } = useContentContext();

  if (!studentCredential) {
    return null;
  }

  const credential = studentCredential.credential;
  const credentialTypeLabel =
    "dne" in credential.credentialType ? "DNE Certificate" : "ISIC Card";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/90 p-10 shadow-lg">
      <ShineBorder
        shineColor={["#7F20E4", "#9945FF", "#14F195"]}
        className="rounded-[inherit]"
      />
      <div className="relative z-10 flex flex-col items-start justify-center gap-12">
        <div className="flex gap-12 w-full justify-between items-start">
          <div className="flex flex-col gap-2">
            <h2 className="text-md text-[#7F20E4] font-bold">
              ACADEMIC CREDENTIAL
            </h2>
            <h1 className="text-3xl font-bold">Verified Identity</h1>
          </div>
          <div className="flex gap-1 items-center text-[#007243] h-fit">
            <PiMedalBold className="text-3xl" />
            <p className="text-lg font-bold">ZK-VERIFIED</p>
          </div>
        </div>

        <div className="grid grid-cols-2 grid-rows-3 gap-x-12 gap-y-6 w-full">
          <div className="flex flex-col">
            <p className="font-bold text-sm text-[#4C4355]">CREDENTIAL TYPE</p>
            <p className="text-2xl font-medium">{credentialTypeLabel}</p>
          </div>

          <div className="flex flex-col">
            <p className="font-bold text-sm text-[#4C4355]">STATUS</p>
            <p
              className={`text-lg font-semibold ${
                studentCredential.isExpired ? "text-red-600" : "text-green-600"
              }`}
            >
              {studentCredential.isExpired ? "EXPIRED" : "VALID"}
            </p>
          </div>

          <div className="flex flex-col">
            <p className="font-bold text-sm text-[#4C4355]">ISSUED ON</p>
            <p className="text-lg">{studentCredential.issuedAtFormatted}</p>
          </div>

          <div className="flex flex-col">
            <p className="font-bold text-sm text-[#4C4355]">EXPIRES ON</p>
            <p className="text-lg">{studentCredential.expiresAtFormatted}</p>
          </div>

          <div className="flex flex-col col-span-2">
            <p className="font-bold text-sm text-[#4C4355]">WALLET</p>
            <p className="text-sm font-mono break-all">
              {credential.wallet.toBase58()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
