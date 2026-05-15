import { defineChain } from "viem";

export const galileo = defineChain({
  id: 16602,
  name: "0G Chain Galileo",
  nativeCurrency: { name: "0G", symbol: "A0GI", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ZG_RPC_URL ?? "https://evmrpc-testnet.0g.ai"],
    },
  },
  blockExplorers: {
    default: {
      name: "0G Explorer",
      url: "https://chainscan-galileo.0g.ai",
    },
  },
});

export const appChains = [galileo] as const;
export type AppChain = (typeof appChains)[number];
