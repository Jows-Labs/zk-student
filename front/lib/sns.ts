import {
  Record,
  getDomainRecord,
  getDomainsForAddress,
  getPrimaryDomain,
  resolveDomain,
} from "@solana-name-service/sns-sdk-kit";
import {
  Address,
  createDefaultRpcTransport,
  createSolanaRpcFromTransport,
} from "@solana/kit";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  "https://api.mainnet-beta.solana.com";

let rpcInstance: ReturnType<typeof createSolanaRpcFromTransport> | null = null;

const initializeRpc = () => {
  if (!rpcInstance) {
    const transport = createDefaultRpcTransport({
      url: RPC_URL,
    });
    rpcInstance = createSolanaRpcFromTransport(transport);
  }
  return rpcInstance;
};

export const resolveSNSDomain = async (domain: string) => {
  const rpc = initializeRpc();
  return resolveDomain(rpc, domain);
};

export const getSNSDomainRecord = async (domain: string, record: Record) => {
  const rpc = initializeRpc();
  return getDomainRecord(rpc, domain, record, {
    deserialize: true,
  });
};

export const getSNSPrimaryDomain = async (walletAddress: Address) => {
  const rpc = initializeRpc();
  const domains = await getDomainsForAddress(rpc, walletAddress);
  return domains[0];
};

export type { Record };
