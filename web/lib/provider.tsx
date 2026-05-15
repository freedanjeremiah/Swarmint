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
