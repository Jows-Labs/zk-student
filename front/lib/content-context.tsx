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

interface PhantomWallet {
  isPhantom: boolean;
  isConnected?: boolean;
  publicKey?: { toString: () => string } | null;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{
    publicKey: { toString: () => string };
  }>;
  disconnect: () => Promise<void>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  off?: (event: string, handler: (...args: any[]) => void) => void;
}

interface SolanaWindow extends Window {
  solana?: PhantomWallet;
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
  }) => Promise<void>;
};

const ContentContext = createContext<ContentContextValue>({
  walletAddress: null,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  createCertificateStep: 0,
  setCreateCertificateStep: () => {},
  primaryDomain: null,
  getSNSPrimaryDomain: async () => null,
  fetchProverApiZkProccess: async () => {},
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
  const [createCertificateStep, setCreateCertificateStep] = useState<number>(0);
  const [primaryDomain, setPrimaryDomain] = useState<string | null>(null);

  const fetchPrimaryDomain = async (address: string) => {
    try {
      const domain = await getSNSPrimaryDomain(
        "85mzQzu2DZ1yzbTm9d3F9wUenoFyn2HqdD1mviK2UKPZ" as Address,
      );
      const domainName = domain?.domain ?? null;
      setPrimaryDomain(domainName);
      return domainName;
    } catch (error) {
      console.warn("Erro ao buscar domínio SNS:", error);
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
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      void fetchPrimaryDomain(walletAddress);
    } else {
      setPrimaryDomain(null);
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
        };

        const handleDisconnect = () => {
          setWalletAddress(null);
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
            }
          } catch (e) {}
        } else {
          if (solana.isPhantom && solana.publicKey) {
            setWalletAddress(solana.publicKey.toString());
          } else if (solana.isPhantom && solana.isConnected) {
            setWalletAddress(solana.publicKey?.toString() ?? null);
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
  }: {
    cert_der_hex: string;
  }) => {
    try {
      const proverApiUrl =
        process.env.NEXT_PUBLIC_PROVER_API_URL || "http://localhost:3001";

      const executeRes = await fetch(`${proverApiUrl}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cert_der_hex,
          issuer_pubkey_hex: ISSUER_PUBKEY_DER,
          credential_type: 0,
          current_timestamp: Math.floor(Date.now() / 1000),
        }),
      });

      if (executeRes.ok) {
        try {
          const result = await fetch(`${proverApiUrl}/prove`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cert_der_hex,
              issuer_pubkey_hex: ISSUER_PUBKEY_DER,
              credential_type: 0,
              current_timestamp: Math.floor(Date.now() / 1000),
            }),
          });
          const data = await result.json();
          console.log("ZK Process Result:", data);
        } catch (error) {
          console.error("Error fetching ZK process result:", error);
        }
      } else {
        console.error("Error executing ZK process:", executeRes.statusText);
      }
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
      }}
    >
      {children}
    </ContentContext.Provider>
  );
}
