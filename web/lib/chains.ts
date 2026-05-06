import { defineChain } from "viem";
import { baseSepolia } from "viem/chains";

const targetId = Number(process.env.NEXT_PUBLIC_TARGET_CHAIN_ID || 0);
const targetRpc =
  process.env.NEXT_PUBLIC_TARGET_RPC_URL || "https://sepolia.base.org";

/** Optional second chain (e.g. mainnet deployment). Omitted when unset or same as Base Sepolia. */
export const configuredTargetChain =
  targetId > 0 && targetId !== baseSepolia.id
    ? defineChain({
        id: targetId,
        name: "Target chain",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: { default: { http: [targetRpc] } },
      })
    : null;

export const appChains = configuredTargetChain
  ? ([baseSepolia, configuredTargetChain] as const)
  : ([baseSepolia] as const);

export type AppChain = (typeof appChains)[number];
