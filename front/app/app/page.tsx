import { NavBar } from "@/components/NavBar/NavBar";
import { LuShieldCheck } from "react-icons/lu";

export default function App() {
  return (
    <div className="flex flex-col w-full h-screen relative bg-white z-10 text-black">
      <NavBar />
      <section className="w-full px-26 py-14 flex flex-col justify-start items-start gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-bold">Welcome!</h1>
          <p className="text-[#4C4355] text-lg">
            Your cryptographic identity is active on Solana. Begin your
            zero-knowledge<br></br>academic verification to unlock
            protocol-gated benefits.
          </p>
        </div>
        <section>
          <div className="flex flex-col gap-4 items-start">
            <div className="flex gap-2 items-center text-[#7F20E4] bg-[#7F20E4]/10 rounded-full py-2 px-6">
              <LuShieldCheck className="text-2xl" />
              <p className="text-xl font-bold">PENDING VERIFICATION</p>
            </div>
            <h3 className="text-4xl font-bold">Verify Academic Standing</h3>
          </div>
        </section>
      </section>
    </div>
  );
}
