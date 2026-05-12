"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useAccount, useChainId, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { agents, agentGroups } from "@/config/agents";
import { swarm_abi, metaSwarmContractAddress } from "@/lib/deployments";
import LogoComponent from "@/components/logo";
import CyberButton from "@/components/cyberButton";
import OptimizedBackground from "@/components/background";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import SwarmPreview from "@/components/swarmPreview";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { ChainBanner } from "@/components/chain-banner";
import { ExplorerTxLink } from "@/components/explorer-link";
import { EXPECTED_CHAIN_ID } from "@/lib/expected-chain";
import { Abi } from "viem";

const swarmAddress = metaSwarmContractAddress();
const swarmAbi = swarm_abi as Abi;

export default function CreateSwarmPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const chainOk = chainId === EXPECTED_CHAIN_ID;
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState(agentGroups[0].id);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const handleAgentSelect = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      setSelectedAgents((prev) => prev.filter((id) => id !== agentId));
    } else {
      setSelectedAgents((prev) => [...prev, agentId]);
    }
  };

  const handleCreateSwarm = async () => {
    if (!chainOk) return;
    try {
      const threadId = `swarm_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}`;
      const agentIds = selectedAgents
        .map((id) => {
          const agent = agents.find((a) => a.id === id);
          return agent?.num || 0;
        })
        .filter((num) => num !== 0);

      if (agentIds.length < 2) {
        alert("Please select at least 2 agents");
        return;
      }

      await writeContract({
        address: swarmAddress,
        abi: swarmAbi,
        functionName: "createSwarm",
        args: [threadId, agentIds],
      });
    } catch (err) {
      console.error("Error creating swarm:", err);
    }
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
                  return (
                    <motion.div
                      key={agent.id}
                      whileHover={{ scale: 1.02 }}
                      className={`relative rounded-lg overflow-hidden cursor-pointer border transition-colors duration-300 p-3 ${
                        isSelected
                          ? "border-cyan-500/50 bg-gradient-to-r from-purple-900/40 to-cyan-900/40"
                          : "border-purple-500/20 bg-gradient-to-r from-purple-900/20 to-cyan-900/20"
                      }`}
                      onClick={() => handleAgentSelect(agent.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12">
                          <Image
                            src={agent.avatarUrl}
                            alt={agent.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold">{agent.name}</h3>
                          <p className="text-xs text-gray-400">{agent.type}</p>
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
            className="absolute top-1/2 -right-4 transform -translate-y-1/2 w-8 h-16 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-r-lg flex items-center justify-center text-white transition-transform duration-300"
          >
            {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
          </button>
        </motion.div>

        <div
          className={`flex-1 transition-all duration-300 ${
            isSidebarOpen ? "ml-80" : "ml-0"
          }`}
        >
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
                <p>Swarm created successfully.</p>
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
                <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-purple-900/20 border border-purple-500/20 backdrop-blur-sm">
                  <div className="flex items-center space-x-4">
                    <div className="text-cyan-400">
                      <span className="text-2xl font-bold">
                        {selectedAgents.length}
                      </span>
                      <span className="ml-2 text-sm">Agents Selected</span>
                    </div>
                    <div className="h-6 w-px bg-purple-500/20" />
                    <div className="text-purple-400">
                      <span className="text-sm">Combined Capabilities:</span>
                      <span className="ml-2 font-bold">
                        {
                          new Set(
                            selectedAgents.flatMap((id) =>
                              (
                                agents.find((a) => a.id === id)?.capabilities ||
                                []
                              ).map((c) => c.name)
                            )
                          ).size
                        }
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {selectedAgents.length < 2
                      ? "Select more agents to form a swarm"
                      : "Ready to create swarm"}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedAgents.map((agentId) => {
                    const agent = agents.find((a) => a.id === agentId);
                    if (!agent) return null;
                    return (
                      <div
                        key={agent.id}
                        className="p-4 rounded-lg bg-purple-900/10 border border-purple-500/20 backdrop-blur-sm hover:bg-purple-900/20 transition-colors duration-300"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="relative w-12 h-12">
                            <Image
                              src={agent.avatarUrl}
                              alt={agent.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-white">
                              {agent.name}
                            </h3>
                            <p className="text-xs text-gray-400 mb-2">
                              {agent.type}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {agent.capabilities.slice(0, 3).map((cap, i) => (
                                <span
                                  key={cap.name}
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    i % 2 === 0
                                      ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                                      : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                                  }`}
                                >
                                  {cap.name.replace("Capability", "")}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

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
                      isPending ||
                      isConfirming
                    }
                  >
                    {isPending || isConfirming
                      ? "Creating Swarm…"
                      : "Create Swarm"}
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
