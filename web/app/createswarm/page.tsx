"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useAccount, useChainId, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { agents, agentGroups } from "@/config/agents";
import { swarm_abi, agent_registry_abi, metaSwarmContractAddress, agentRegistryContractAddress } from "@/lib/deployments";
import LogoComponent from "@/components/logo";
import CyberButton from "@/components/cyberButton";
import OptimizedBackground from "@/components/background";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import SwarmPreview from "@/components/swarmPreview";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { ChainBanner } from "@/components/chain-banner";
import { ExplorerTxLink } from "@/components/explorer-link";
import { EXPECTED_CHAIN_ID } from "@/lib/expected-chain";
import type { Abi } from "viem";

const swarmAddress = metaSwarmContractAddress();
const regAddress = agentRegistryContractAddress();
const swarmAbi = swarm_abi as Abi;

const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

export default function CreateSwarmPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const chainOk = chainId === EXPECTED_CHAIN_ID;
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState(agentGroups[0].id);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Build AgentRegistry.getTokenId multicall for each selected agent
  const selectedAgentObjects = selectedAgents
    .map((id) => agents.find((a) => a.id === id))
    .filter(Boolean) as (typeof agents)[0][];

  const tokenIdCalls = regAddress
    ? selectedAgentObjects.map((a) => ({
        address: regAddress as `0x${string}`,
        abi: agent_registry_abi,
        functionName: "getTokenId" as const,
        args: [BigInt(a.archetypeId)] as const,
      }))
    : [];

  const { data: tokenIdResults } = useReadContracts({
    contracts: tokenIdCalls,
    query: { enabled: tokenIdCalls.length > 0 },
  });

  // Map agent id → resolved tokenId (0 means not registered)
  const tokenIdByAgentId: Record<string, bigint> = {};
  selectedAgentObjects.forEach((a, i) => {
    const r = tokenIdResults?.[i];
    tokenIdByAgentId[a.id] = r?.status === "success" ? (r.result as bigint) : BigInt(0);
  });

  const unregisteredAgents = selectedAgentObjects.filter(
    (a) => (tokenIdByAgentId[a.id] ?? BigInt(0)) === BigInt(0) && tokenIdResults !== undefined
  );

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const handleCreateSwarm = async () => {
    if (!chainOk || !swarmAddress) return;

    if (selectedAgents.length < 2) {
      alert("Please select at least 2 agents");
      return;
    }

    if (unregisteredAgents.length > 0) {
      alert(
        `These agents are not yet minted & registered:\n${unregisteredAgents.map((a) => a.name).join(", ")}\n\nGo to /mint-agent first.`
      );
      return;
    }

    const memberTokenIds = selectedAgentObjects.map((a) => tokenIdByAgentId[a.id]);
    const threadId = `swarm_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    writeContract({
      address: swarmAddress,
      abi: swarmAbi,
      functionName: "compose",
      args: [threadId, memberTokenIds, ZERO_BYTES32],
    });
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <OptimizedBackground />
      <ChainBanner />

      <header className="border-b border-purple-500/20 bg-black/30 backdrop-blur-sm fixed top-0 w-full z-50">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="scale-50 origin-left">
            <LogoComponent />
          </div>
          <DynamicWidget />
        </div>
      </header>

      <div className="pt-24 flex relative min-h-[calc(100vh-96px)]">
        <motion.div
          initial={{ x: -320 }}
          animate={{ x: isSidebarOpen ? 0 : -320 }}
          className="fixed left-0 top-24 bottom-0 w-80 bg-black/80 border-r border-purple-500/20 backdrop-blur-md z-40"
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-purple-500/20">
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Available Agents
              </h2>
            </div>
            <div className="flex flex-col gap-2 p-4">
              {agentGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveGroup(group.id)}
                  className={`px-4 py-2 rounded-lg text-left transition-all duration-300 ${
                    activeGroup === group.id
                      ? "bg-gradient-to-r from-purple-500/80 to-cyan-500/80 text-white"
                      : "bg-gray-900/50 text-gray-400 hover:bg-gray-900/80"
                  }`}
                >
                  {group.name}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {agents
                .filter((agent) => agent.group === activeGroup)
                .map((agent) => {
                  const isSelected = selectedAgents.includes(agent.id);
                  const tokenId = tokenIdByAgentId[agent.id];
                  const notRegistered =
                    isSelected && tokenId !== undefined && tokenId === BigInt(0);
                  return (
                    <motion.div
                      key={agent.id}
                      whileHover={{ scale: 1.02 }}
                      className={`relative rounded-lg overflow-hidden cursor-pointer border transition-colors duration-300 p-3 ${
                        notRegistered
                          ? "border-amber-500/50 bg-amber-900/10"
                          : isSelected
                          ? "border-cyan-500/50 bg-gradient-to-r from-purple-900/40 to-cyan-900/40"
                          : "border-purple-500/20 bg-gradient-to-r from-purple-900/20 to-cyan-900/20"
                      }`}
                      onClick={() => handleAgentSelect(agent.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12">
                          <Image src={agent.avatarUrl} alt={agent.name} fill className="object-contain" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold">{agent.name}</h3>
                          <p className="text-xs text-gray-400">{agent.type}</p>
                          {notRegistered && (
                            <p className="text-xs text-amber-400">Not minted yet</p>
                          )}
                        </div>
                        {isSelected ? (
                          <X className="w-5 h-5 text-cyan-400" />
                        ) : (
                          <Plus className="w-5 h-5 text-purple-400" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="absolute top-1/2 -right-4 transform -translate-y-1/2 w-8 h-16 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-r-lg flex items-center justify-center text-white"
          >
            {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
          </button>
        </motion.div>

        <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-80" : "ml-0"}`}>
          <div className="container mx-auto px-8 py-4">
            {error && (
              <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
                Error: {error.message}
              </div>
            )}
            {isConfirming && (
              <div className="mb-4 p-4 bg-purple-900/50 border border-purple-500 rounded-lg">
                Creating your swarm… Please wait.
              </div>
            )}
            {isConfirmed && hash && (
              <div className="mb-4 p-4 bg-green-900/50 border border-green-500 rounded-lg space-y-2">
                <p>Swarm composed successfully.</p>
                <ExplorerTxLink chainId={chainId} hash={hash} />
              </div>
            )}
            <SwarmPreview
              selectedAgents={selectedAgents}
              hoveredAgent={hoveredAgent}
              setHoveredAgent={setHoveredAgent}
            />

            {selectedAgents.length > 0 && (
              <div className="mt-8 space-y-6">
                {unregisteredAgents.length > 0 && (
                  <div className="p-3 bg-amber-900/20 border border-amber-500/40 rounded-lg text-sm text-amber-300">
                    These agents need to be minted first:{" "}
                    {unregisteredAgents.map((a) => a.name).join(", ")}. Go to{" "}
                    <a href="/mint-agent" className="underline">
                      /mint-agent
                    </a>
                    .
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center mt-8"
                >
                  <CyberButton
                    cyberSize="xl"
                    onClick={handleCreateSwarm}
                    disabled={
                      !isConnected ||
                      !chainOk ||
                      selectedAgents.length < 2 ||
                      unregisteredAgents.length > 0 ||
                      isPending ||
                      isConfirming
                    }
                  >
                    {isPending || isConfirming ? "Creating Swarm…" : "Create Swarm"}
                  </CyberButton>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
