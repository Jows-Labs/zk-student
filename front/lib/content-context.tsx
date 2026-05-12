"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getSNSPrimaryDomain } from "./sns";
import type { Address } from "@solana/kit";
import { ISSUER_PUBKEY_DER } from "./issuerPubkeyDer";
import { PhantomWallet } from "@/interfaces/interfaces";
import {
  fetchCredential,
  type StudentCredential,
  formatCredential,
  type CredentialFormatted,
  bytesToHex,
} from "./protocol";

interface SolanaWindow extends Window {
  solana?: PhantomWallet;
}

export interface ProverResponse {
  is_valid_student: boolean;
  is_not_expired: boolean;
  issuer_pubkey_hash: string;
  credential_type: number;
  cert_expires_at: number;
  cert_nullifier: string;
  proof_timestamp: number;
}

type ContentContextProviderProps = {
  children: ReactNode;
};

type ContentContextValue = {
  walletAddress: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  createCertificateStep?: number;
  setCreateCertificateStep?: (step: number) => void;
  primaryDomain?: string | null;
  getSNSPrimaryDomain?: (address: string) => Promise<string | null>;
  fetchProverApiZkProccess?: (params: {
    cert_der_hex: string;
    issuer_pubkey_hex?: string;
  }) => Promise<ProverResponse>;
  setWallet?: (wallet: PhantomWallet | null) => void;
  wallet?: PhantomWallet | null;
  studentCredential?: CredentialFormatted | null;
};

const ContentContext = createContext<ContentContextValue>({
  walletAddress: null,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  createCertificateStep: 0,
  setCreateCertificateStep: () => {},
  primaryDomain: null,
  getSNSPrimaryDomain: async () => null,
  fetchProverApiZkProccess: async () => ({
    is_valid_student: false,
    is_not_expired: false,
    issuer_pubkey_hash: "",
    credential_type: 0,
    cert_expires_at: 0,
    cert_nullifier: "",
    proof_timestamp: 0,
  }),
  setWallet: () => {},
  wallet: null,
  studentCredential: null,
} as ContentContextValue);

export function useContentContext() {
  const context = useContext(ContentContext);

  if (!context) {
    throw new Error("useContentContext must be used within a ContextProvider");
  }

  return context;
}

export function ContextProvider({ children }: ContentContextProviderProps) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [wallet, setWallet] = useState<PhantomWallet | null>(null);
  const [createCertificateStep, setCreateCertificateStep] = useState<number>(0);
  const [primaryDomain, setPrimaryDomain] = useState<string | null>(null);
  const [studentCredential, setStudentCredential] =
    useState<CredentialFormatted | null>(null);

  const fetchPrimaryDomain = async (address: string) => {
    try {
      const domain = await getSNSPrimaryDomain(address as Address);
      const domainName = domain?.domain ?? null;
      setPrimaryDomain(domainName);
      return domainName;
    } catch (error) {
      console.warn("Erro ao buscar domínio SNS:", error);
      return null;
    }
  };

  const checkStudentCredential = async (walletAddr: string) => {
    try {
      const credential = await fetchCredential(walletAddr);
      if (credential) {
        const formatted = formatCredential(credential);
        setStudentCredential(formatted);
        console.log("Student credential found:", formatted);
        return formatted;
      } else {
        setStudentCredential(null);
        console.log("No student credential found");
        return null;
      }
    } catch (error) {
      console.error("Error checking student credential:", error);
      setStudentCredential(null);
      return null;
    }
  };

  const connectWallet = async () => {
    const solana = (window as SolanaWindow).solana;

    try {
      if (!solana) {
        return;
      }

      const response = await solana.connect();

      try {
        localStorage.setItem("phantom.connected", "true");
      } catch (e) {}
      setWalletAddress(response.publicKey.toString());
      setWallet(solana);
    } catch (error) {
      console.log("Error connecting wallet:", error);
    }
  };

  const disconnectWallet = async () => {
    const solana = (window as SolanaWindow).solana;

    try {
      if (!solana) {
        return;
      }
      await solana.disconnect();
      try {
        localStorage.removeItem("phantom.connected");
      } catch (e) {}

      setWalletAddress(null);
      setWallet(null);
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      void fetchPrimaryDomain(walletAddress);
      void checkStudentCredential(walletAddress);
    } else {
      setPrimaryDomain(null);
      setStudentCredential(null);
    }
  }, [walletAddress]);

  useEffect(() => {
    const checkIfWalletIsConnected = async () => {
      const solana = (window as SolanaWindow).solana;

      try {
        if (!solana) {
          alert("Phantom wallet not found.");
          return;
        }

        const handleConnect = () => {
          setWalletAddress(solana.publicKey?.toString() ?? null);
          setWallet(solana);
        };

        const handleDisconnect = () => {
          setWalletAddress(null);
          setWallet(null);
        };

        solana.on?.("connect", handleConnect);
        solana.on?.("disconnect", handleDisconnect);

        const previouslyConnected = (() => {
          try {
            return localStorage.getItem("phantom.connected") === "true";
          } catch (e) {
            return false;
          }
        })();

        if (previouslyConnected) {
          try {
            const resp = await solana.connect({ onlyIfTrusted: true });
            if (resp?.publicKey) {
              setWalletAddress(resp.publicKey.toString());
              setWallet(solana);
            }
          } catch (e) {}
        } else {
          if (solana.isPhantom && solana.publicKey) {
            setWalletAddress(solana.publicKey.toString());
            setWallet(solana);
          } else if (solana.isPhantom && solana.isConnected) {
            setWalletAddress(solana.publicKey?.toString() ?? null);
            setWallet(solana);
          }
        }

        return () => {
          solana.off?.("connect", handleConnect);
          solana.off?.("disconnect", handleDisconnect);
        };
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    };

    void checkIfWalletIsConnected();
  }, []);

  const fetchProverApiZkProccess = async ({
    cert_der_hex,
    issuer_pubkey_hex,
  }: {
    cert_der_hex: string;
    issuer_pubkey_hex?: string;
  }): Promise<ProverResponse> => {
    try {
      const proverApiUrl =
        process.env.NEXT_PUBLIC_PROVER_API_URL || "https://56.126.143.134.nip.io";

      const executeRes = await fetch(`${proverApiUrl}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cert_der_hex,
          issuer_pubkey_hex: issuer_pubkey_hex ?? bytesToHex(ISSUER_PUBKEY_DER),
          credential_type: 0,
          current_timestamp: Math.floor(Date.now() / 1000),
        }),
      });
      const data: ProverResponse = await executeRes.json();

      return data;
    } catch (error) {
      console.error("Error fetching ZK process:", error);
      throw error;
    }
  };

  return (
    <ContentContext.Provider
      value={{
        walletAddress,
        connectWallet,
        disconnectWallet,
        createCertificateStep,
        setCreateCertificateStep,
        primaryDomain,
        getSNSPrimaryDomain: fetchPrimaryDomain,
        fetchProverApiZkProccess: fetchProverApiZkProccess,
        setWallet,
        wallet,
        studentCredential,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
}
