import Image from "next/image";
import SolanaIcon from "@/public/images/solana.png";

export const PoweredBySolSection = () => {
  return (
    <section className="flex flex-col p-14 items-center w-full relative gap-8 overflow-hidden min-h-fit">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-4 z-20 bg-gradient-to-b from-[#343440]/5 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 z-20 bg-gradient-to-t from-[#343440]/5 to-transparent" />
      <div className="rounded-full w-240 aspect-3/2 bg-[#7F20E4]/60 opacity-15 absolute left-1/2 top-1/2 -translate-y-1/2 transform -translate-x-1/2 z-0 blur-2xl"></div>

      <div className="bg-[#343440]/5 h-32 aspect-square p-5 rounded-2xl border border-[#343440]/10 flex items-center justify-center">
        <Image
          src={SolanaIcon}
          alt="Solana Logo"
          className="h-auto w-full"
          loading="eager"
        />
      </div>
      <h1 className="text-5xl font-semibold">Powered by Solana.</h1>
      <p className="text-center text-[#343440]/60 text-lg">
        Leveraging the world&apos;s most performant blockchain to provide
        student credentials that<br></br>are as fast as the internet and as
        secure as vault.
      </p>
      <div className="flex gap-12 items-center justify-center">
        <p className="text-2xl text-[#343440]/40 font-bold">DECENTRALIZED</p>
        <p className="text-2xl text-[#343440]/40 font-bold">SECURE</p>
        <p className="text-2xl text-[#343440]/40 font-bold">EFFICIENT</p>
      </div>
    </section>
  );
};
