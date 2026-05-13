"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useChainId, useReadContracts } from "wagmi";
import { swarm_abi, swarmContractAddress } from "@/lib/deployments";
import { Abi } from "viem";
import OptimizedBackground from "@/components/background";
import LogoComponent from "@/components/logo";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { SwarmActivityPanel, type SwarmEventItem } from "@/components/swarm-activity-panel";
import { ChainBanner } from "@/components/chain-banner";
import { EXPECTED_CHAIN_ID } from "@/lib/expected-chain";

const CONTRACT = swarmContractAddress();
const ABI = swarm_abi as Abi;

export default function DeliberationPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const chainId = useChainId();
  const chainOk = chainId === EXPECTED_CHAIN_ID;

  const { data, isLoading } = useReadContracts({
    contracts: [
      {
        address: CONTRACT,
        abi: ABI,
        functionName: "getSwarmDetails",
        args: [BigInt(slug || "0")],
      },
    ],
    query: { enabled: !!slug && chainOk },
  });

  const details = data?.[0]?.result as
    | [string, bigint, bigint, number, string]
    | undefined;
  const threadId = details?.[0];

  const emptyLive: SwarmEventItem[] = [];

  return (
    <div className="min-h-screen bg-black text-white">
      <OptimizedBackground />
      <ChainBanner />
      <header className="border-b border-purple-500/20 bg-black/30 backdrop-blur-sm fixed top-0 w-full z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/swarm/${slug}`} className="text-xs text-cyan-300 hover:underline">
              ← Back to chat
            </Link>
            <div className="scale-50 origin-left">
              <LogoComponent />
            </div>
            <span className="text-sm text-purple-300">Swarm #{slug}</span>
          </div>
          <DynamicWidget />
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-8 max-w-4xl relative z-10">
        <h1 className="text-lg font-pixel text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-4">
          Activity record
        </h1>
        {isLoading && <p className="text-sm text-gray-400">Loading…</p>}
        {!chainOk && (
          <p className="text-sm text-amber-200">Switch to the expected chain to load on-chain data.</p>
        )}
        {threadId && (
          <div className="border border-purple-500/20 rounded-lg overflow-hidden bg-black/40">
            <SwarmActivityPanel threadId={threadId} liveEvents={emptyLive} />
          </div>
        )}
      </main>
    </div>
  );
}
