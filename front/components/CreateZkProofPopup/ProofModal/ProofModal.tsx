import { PiMedalBold } from "react-icons/pi";

export const ProofModal = ({ isOpen }: { isOpen: boolean }) => {
  return (
    isOpen && (
      <div className="bg-white/90 border border-white/20 rounded-3xl p-10 flex flex-col items-start justify-center relative gap-12">
        <div className="flex gap-40">
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
        <div className="grid grid-cols-2 grid-rows-2 gap-x-12 gap-y-6">
          <div className="flex flex-col">
            <p className="font-bold text-sm text-[#4C4355]">ISSUER</p>
            <p className="text-2xl font-medium">Organization</p>
          </div>
          <div className="flex flex-col">
            <p className="font-bold text-sm text-[#4C4355]">BIRTH DATE</p>
            <p className="text-lg">01/01/2000</p>
          </div>
          <div className="flex flex-col">
            <p className="font-bold text-sm text-[#4C4355]">ISSUED ON</p>
            <p className="text-lg">01/01/2026</p>
          </div>
          <div className="flex flex-col">
            <p className="font-bold text-sm text-[#4C4355]">VALID UNTIL</p>
            <p className="text-lg">01/01/2027</p>
          </div>
        </div>
      </div>
    )
  );
};
