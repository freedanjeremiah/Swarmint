"use client";

import React from "react";
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
import { Swarm } from "@/types/agents";
import { swarm_abi, swarmContractAddress } from "@/lib/deployments";
import { Abi } from "viem";
import { ChainBanner } from "@/components/chain-banner";
import Link from "next/link";
import { EXPECTED_CHAIN_ID } from "@/lib/expected-chain";

const CONTRACT_ADDRESS = swarmContractAddress();
const CONTRACT_ABI = swarm_abi as Abi;

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const {
    data: swarmIdsResult,
    isPending: isLoadingSwarmIds,
    error: swarmIdsError,
  } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "getUserSwarms",
        args: [address as `0x${string}`],
      },
    ],
    query: {
      enabled: !!address && isConnected && chainId === EXPECTED_CHAIN_ID,
    },
  });

  const swarmIds = swarmIdsResult?.[0]?.result as readonly bigint[] | undefined;

  const swarmDetailsContracts =
    swarmIds
      ?.map((swarmId) => [
        {
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "getSwarmDetails",
          args: [swarmId],
        },
        {
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "getSwarmAgents",
          args: [swarmId],
        },
      ])
      .flat() || [];

  const {
    data: swarmDetailsResult,
    isPending: isLoadingDetails,
    error: swarmDetailsError,
  } = useReadContracts({
    contracts: swarmDetailsContracts,
    query: {
      enabled: !!swarmIds?.length && chainId === EXPECTED_CHAIN_ID,
    },
  });

  const userSwarms: Swarm[] = [];

  if (swarmIds && swarmDetailsResult) {
    for (let i = 0; i < swarmIds.length; i++) {
      const detailsResult = swarmDetailsResult[i * 2]?.result as
        | [string, bigint, bigint, number, string]
        | undefined;
      const agentsResult = swarmDetailsResult[i * 2 + 1]?.result as
        | readonly bigint[]
        | undefined;

      if (!detailsResult || !agentsResult) continue;

      const [threadId, agentCount, createdAt] = detailsResult;
      const swarmId = swarmIds[i];

      const swarmAgents = agentsResult
        .map((id) => {
          const agent = agents.find((a) => a.num === Number(id));
          return agent ? agent.id : null;
        })
        .filter(Boolean);

      const createdDate = new Date(Number(createdAt) * 1000);

      userSwarms.push({
        id: swarmId.toString(),
        name: `Swarm ${swarmId}`,
        description: `A dynamic swarm of ${agentCount} specialized agents`,
        agents: swarmAgents as string[],
        lastActive: createdDate.toISOString(),
        created: createdDate.toISOString(),
        threadId,
      });
    }
  }

  const handleCreateSwarm = () => {
    window.location.href = "/createswarm";
  };

  const handleEnterSwarm = (swarmId: string) => {
    window.location.href = `/swarm/${swarmId}`;
  };

  if (swarmIdsError || swarmDetailsError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-red-500 mb-4">Error loading swarms</p>
          <p className="text-sm text-gray-400 break-words">
            {(swarmIdsError || swarmDetailsError)?.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <OptimizedBackground />
      <ChainBanner />

      <header className="border-b border-purple-500/20 bg-black/30 backdrop-blur-sm backdrop-opacity-20 fixed top-0 w-full z-50">
        <div className="container mx-auto px-4 flex justify-between items-center h-16">
          <div className="scale-50 origin-left">
            <LogoComponent />
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/mint-agent"
              className="text-xs text-cyan-300 hover:underline hidden sm:inline"
            >
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
                onClick={handleCreateSwarm}
              >
                <CreateSwarmCard onClick={handleCreateSwarm} />
              </motion.div>

              {!isConnected ? (
                <div className="col-span-full text-center text-gray-400">
                  Connect your wallet to view your swarms
                </div>
              ) : isLoadingSwarmIds ? (
                <div className="col-span-full flex justify-center items-center min-h-[200px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
                </div>
              ) : !swarmIds || swarmIds.length === 0 ? (
                <div className="col-span-full text-center text-gray-400">
                  Create a swarm to get started!
                </div>
              ) : isLoadingDetails ? (
                <div className="col-span-full flex justify-center items-center min-h-[200px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
                </div>
              ) : userSwarms.length > 0 ? (
                userSwarms.map((swarm) => (
                  <div key={swarm.id} className="space-y-2">
                    <SwarmCard
                      swarm={swarm}
                      onClick={() => handleEnterSwarm(swarm.id)}
                    />
                    <div className="text-center">
                      <Link
                        href={`/swarm/${swarm.id}/deliberation`}
                        className="text-xs text-purple-300 hover:underline"
                      >
                        Activity record
                      </Link>
                    </div>
                  </div>
                ))
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="explore" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
