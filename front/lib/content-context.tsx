"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface PhantomWallet {
  isPhantom: boolean;
  isConnected?: boolean;
  publicKey?: { toString: () => string } | null;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{
    publicKey: { toString: () => string };
  }>;
  disconnect: () => Promise<void>;
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
};

const ContentContext = createContext<ContentContextValue>({
  walletAddress: null,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
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

  const connectWallet = async () => {
    const solana = (window as SolanaWindow).solana;

    try {
      if (!solana) {
        return;
      }

      const response = await solana.connect();

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
      setWalletAddress(null);
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  useEffect(() => {
    const checkIfWalletIsConnected = async () => {
      const solana = (window as SolanaWindow).solana;

      try {
        if (!solana) {
          alert("Phantom wallet not found.");
          return;
        }

        if (solana.isPhantom && solana.publicKey) {
          setWalletAddress(solana.publicKey.toString());
          return;
        }

        if (solana.isPhantom && solana.isConnected) {
          setWalletAddress(solana.publicKey?.toString() ?? null);
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    };

    void checkIfWalletIsConnected();
  }, []);

  return (
    <ContentContext.Provider
      value={{ walletAddress, connectWallet, disconnectWallet }}
    >
      {children}
    </ContentContext.Provider>
  );
}
