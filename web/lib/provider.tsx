"use client";

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import type { ReactNode } from "react";
import { galileo, appChains } from "./chains";

const queryClient = new QueryClient();

const wagmiConfig = createConfig({
  chains: appChains,
  multiInjectedProviderDiscovery: false,
  transports: {
    [galileo.id]: http(process.env.NEXT_PUBLIC_ZG_RPC_URL ?? undefined),
  },
});

const zgGalileo = {
  blockExplorerUrls: ["https://chainscan-galileo.0g.ai"],
  chainId: 16602,
  chainName: "0G Galileo Testnet",
  iconUrls: [] as string[],
  name: "0G Galileo",
  nativeCurrency: { decimals: 18, name: "0G", symbol: "A0GI" },
  networkId: 16602,
  rpcUrls: [process.env.NEXT_PUBLIC_ZG_RPC_URL ?? "https://evmrpc-testnet.0g.ai"],
  vanityName: "0G Galileo",
};

export function Providers({ children }: { children: ReactNode }) {
  const environmentId =
    process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID ||
    "8c6cc3a3-6751-4038-b749-5c4775a58510";

  return (
    <DynamicContextProvider
      theme="dark"
      settings={{
        environmentId,
        walletConnectors: [EthereumWalletConnectors],
        initialAuthenticationMode: "connect-and-sign",
        overrides: { evmNetworks: [zgGalileo] },
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>{children}</DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}
