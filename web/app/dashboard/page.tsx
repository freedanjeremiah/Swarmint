"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAccount, useChainId, useReadContracts } from "wagmi";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import LogoComponent from "@/components/logo";
import OptimizedBackground from "@/components/background";
import AgentCard from "@/components/agent-card";
import SwarmCard from "@/components/swarm-card";
import { agents } from "@/config/agents";
import CreateSwarmCard from "@/components/createSwarm";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import type { Swarm } from "@/types/agents";
import {
  swarm_abi,
  agent_nft_abi,
  swarmContractAddress,
  agentNftContractAddress,
} from "@/lib/deployments";
import type { Abi } from "viem";
import { ChainBanner } from "@/components/chain-banner";
import Link from "next/link";
import { EXPECTED_CHAIN_ID } from "@/lib/expected-chain";
import MintAgentModal from "@/components/MintAgentModal";

const SWARM_ADDRESS = swarmContractAddress();
const SWARM_ABI = swarm_abi as Abi;

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const onCorrectChain = chainId === EXPECTED_CHAIN_ID;

  // Step 1: Get user's swarm token IDs
  const { data: swarmIdsResult, isPending: isLoadingSwarmIds } = useReadContracts({
    contracts: [
      {
        address: SWARM_ADDRESS,
        abi: SWARM_ABI,
        functionName: "getUserSwarms",
        args: [address as `0x${string}`],
      },
    ],
    query: { enabled: !!address && isConnected && onCorrectChain },
  });

  const swarmIds = swarmIdsResult?.[0]?.result as readonly bigint[] | undefined;

  // Step 2: For each swarmId, read swarms() metadata + getSwarmMembers() in one batch
  const swarmInfoCalls = (swarmIds ?? []).flatMap((swarmId) => [
    {
      address: SWARM_ADDRESS,
      abi: SWARM_ABI,
      functionName: "swarms" as const,
      args: [swarmId] as const,
    },
    {
      address: SWARM_ADDRESS,
      abi: SWARM_ABI,
      functionName: "getSwarmMembers" as const,
      args: [swarmId] as const,
    },
  ]);

  const { data: swarmInfoResults, isPending: isLoadingSwarmInfo } = useReadContracts({
    contracts: swarmInfoCalls,
    query: { enabled: (swarmIds?.length ?? 0) > 0 && onCorrectChain },
  });

  // Step 3: Collect all member token IDs across all swarms for tokenAgentId multicall
  const allMemberTokenIds: bigint[] = [];
  if (swarmInfoResults) {
    for (let i = 0; i < (swarmIds?.length ?? 0); i++) {
      const membersResult = swarmInfoResults[i * 2 + 1];
      if (membersResult?.status === "success") {
        const tokenIds = membersResult.result as readonly bigint[];
        allMemberTokenIds.push(...tokenIds);
      }
    }
  }

  const agentNftAddr = agentNftContractAddress();
  const tokenAgentIdCalls = allMemberTokenIds.map((tokenId) => ({
    address: agentNftAddr as `0x${string}`,
    abi: agent_nft_abi,
    functionName: "tokenAgentId" as const,
    args: [tokenId] as const,
  }));

  const { data: tokenAgentIdResults, isPending: isLoadingTokenIds } = useReadContracts({
    contracts: tokenAgentIdCalls,
    query: { enabled: allMemberTokenIds.length > 0 && !!agentNftAddr },
  });

  // Build tokenId → archetypeId map
  const tokenToArchetype: Record<string, number> = {};
  allMemberTokenIds.forEach((tokenId, i) => {
    const r = tokenAgentIdResults?.[i];
    if (r?.status === "success") {
      tokenToArchetype[tokenId.toString()] = Number(r.result as bigint);
    }
  });

  // Reconstruct userSwarms
  const userSwarms: Swarm[] = [];
  if (swarmIds && swarmInfoResults) {
    for (let i = 0; i < swarmIds.length; i++) {
      const metaResult = swarmInfoResults[i * 2];
      const membersResult = swarmInfoResults[i * 2 + 1];
      if (!metaResult || !membersResult) continue;

      // swarms() returns [threadId, deliberationRoot, createdAt, status]
      const meta = metaResult.result as readonly [string, `0x${string}`, bigint, number] | undefined;
      const memberTokenIds = (
        membersResult.status === "success" ? (membersResult.result as readonly bigint[]) : []
      );

      const createdAt = meta ? Number(meta[2]) : 0;
      const threadId = meta ? meta[0] : "";

      const swarmAgentIds = memberTokenIds
        .map((tokenId) => {
          const archetypeId = tokenToArchetype[tokenId.toString()];
          return agents.find((a) => a.archetypeId === archetypeId)?.id ?? null;
        })
        .filter(Boolean) as string[];

      userSwarms.push({
        id: swarmIds[i].toString(),
        name: `Swarm #${swarmIds[i]}`,
        description: `A swarm of ${memberTokenIds.length} agents`,
        agents: swarmAgentIds,
        lastActive: createdAt > 0 ? new Date(createdAt * 1000).toISOString() : new Date().toISOString(),
        created: createdAt > 0 ? new Date(createdAt * 1000).toISOString() : new Date().toISOString(),
        threadId,
      });
    }
  }

  const isLoading = isLoadingSwarmIds || isLoadingSwarmInfo || isLoadingTokenIds;

  const [mintingAgent, setMintingAgent] = useState<(typeof agents)[0] | null>(null);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <OptimizedBackground />
      <ChainBanner />

      <header className="border-b border-purple-500/20 bg-black/30 backdrop-blur-sm fixed top-0 w-full z-50">
        <div className="container mx-auto px-4 flex justify-between items-center h-16">
          <div className="scale-50 origin-left">
            <LogoComponent />
          </div>
          <div className="flex items-center gap-4">
            <Link href="/mint-agent" className="text-xs text-cyan-300 hover:underline hidden sm:inline">
              Mint agent
            </Link>
            <DynamicWidget />
          </div>
        </div>
      </header>

      <main className="container w-4/5 mx-auto px-4 pt-36 relative z-10">
        <Tabs defaultValue="swarms" className="w-full">
          <TabsList className="w-full mb-8 p-1 bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-purple-500/10 rounded-lg backdrop-blur-sm">
            <TabsTrigger
              value="swarms"
              className="w-full text-base font-medium tracking-wide data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/80 data-[state=active]:to-cyan-500/80 data-[state=active]:text-white data-[state=inactive]:text-gray-400 transition-all duration-300"
            >
              Your Swarms
            </TabsTrigger>
            <TabsTrigger
              value="explore"
              className="w-full text-base font-medium tracking-wide data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/80 data-[state=active]:to-cyan-500/80 data-[state=active]:text-white data-[state=inactive]:text-gray-400 transition-all duration-300"
            >
              Explore Agents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="swarms" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative group rounded-xl overflow-hidden cursor-pointer"
                onClick={() => { window.location.href = "/createswarm"; }}
              >
                <CreateSwarmCard onClick={() => { window.location.href = "/createswarm"; }} />
              </motion.div>

              {!isConnected ? (
                <div className="col-span-full text-center text-gray-400">
                  Connect your wallet to view your swarms
                </div>
              ) : !onCorrectChain ? (
                <div className="col-span-full text-center text-amber-400">
                  Switch to 0G Galileo (chain 16602) to view swarms
                </div>
              ) : isLoading ? (
                <div className="col-span-full flex justify-center items-center min-h-[200px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
                </div>
              ) : !swarmIds || swarmIds.length === 0 ? (
                <div className="col-span-full text-center text-gray-400">
                  No swarms yet — create one to get started!
                </div>
              ) : (
                userSwarms.map((swarm) => (
                  <div key={swarm.id} className="space-y-2">
                    <SwarmCard swarm={swarm} onClick={() => { window.location.href = `/swarm/${swarm.id}`; }} />
                    <div className="text-center">
                      <Link href={`/swarm/${swarm.id}/deliberation`} className="text-xs text-purple-300 hover:underline">
                        Activity record
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="explore" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <div key={agent.id} className="flex flex-col gap-2">
                  <AgentCard agent={agent} />
                  <button
                    onClick={() => setMintingAgent(agent)}
                    className="w-full py-2 rounded-lg border border-cyan-500/40 text-cyan-300 text-xs hover:bg-cyan-950/30 transition-colors"
                  >
                    Mint iNFT
                  </button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      {mintingAgent && (
        <MintAgentModal
          agent={mintingAgent}
          onClose={() => setMintingAgent(null)}
        />
      )}
    </div>
  );
}
