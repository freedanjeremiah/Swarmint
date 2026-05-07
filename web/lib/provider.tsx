"use client";

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { baseSepolia } from "viem/chains";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import type { ReactNode } from "react";
import { appChains, configuredTargetChain } from "./chains";

const queryClient = new QueryClient();

const transports: Record<number, ReturnType<typeof http>> = {
  [baseSepolia.id]: http(
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || undefined
  ),
};
if (configuredTargetChain) {
  transports[configuredTargetChain.id] = http(
    process.env.NEXT_PUBLIC_TARGET_RPC_URL || undefined
  );
}

const wagmiConfig = createConfig({
  chains: appChains,
  multiInjectedProviderDiscovery: false,
  transports,
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
