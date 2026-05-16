"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useReadContract, useReadContracts, useWriteContract } from "wagmi";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import OptimizedBackground from "@/components/background";
import LogoComponent from "@/components/logo";
import { ChainBanner } from "@/components/chain-banner";
import { ExplorerTxLink } from "@/components/explorer-link";
import { EXPECTED_CHAIN_ID } from "@/lib/expected-chain";
import type { DeliberationRecord } from "@/types/deliberation";
import { agents } from "@/config/agents";
import type { Agent } from "@/types/agents";
import {
  swarmContractAddress,
  agentNftContractAddress,
  swarm_abi,
  agent_nft_abi,
} from "@/lib/deployments";

interface Message {
  role: "user" | "swarm";
  content: string;
  record?: DeliberationRecord;
  anchorHash?: string;
}

export default function SwarmChatPage() {
  const params = useParams();
  const swarmId = params.slug as string;
  const swarmTokenId = Number(swarmId) || 1;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Read member AgentINFT token IDs from SwarmMetaINFT
  const { data: memberTokenIds, isPending: membersPending, isError: membersError } = useReadContract({
    address: swarmContractAddress(),
    abi: swarm_abi,
    functionName: "getSwarmMembers",
    args: [BigInt(swarmTokenId)],
  });

  // Multicall tokenAgentId for each member token ID
  const agentNftAddr = agentNftContractAddress();
  const memberCalls = (memberTokenIds ?? []).map((tokenId) => ({
    address: agentNftAddr as `0x${string}`,
    abi: agent_nft_abi,
    functionName: "tokenAgentId" as const,
    args: [tokenId] as const,
  }));

  const { data: agentIdResults, isPending: agentIdsPending } = useReadContracts({
    contracts: memberCalls,
    query: { enabled: memberCalls.length > 0 && !!agentNftAddr },
  });

  const resolvedIds =
    agentIdResults
      ?.map((r) => (r.status === "success" ? Number(r.result as bigint) : 0))
      .filter((id) => id > 0) ?? [];

  const isChainLoading = membersPending || (memberCalls.length > 0 && agentIdsPending);
  const noMembers =
    !membersPending && ((memberTokenIds?.length ?? 0) === 0 || membersError);
  const memberAgentIds = resolvedIds;

  // Write hook for updateDeliberationRoot anchor
  const { writeContractAsync: writeAnchor } = useWriteContract();

  // Map archetypeId numbers → Agent objects for the left sidebar
  const resolvedMemberAgents: Agent[] = memberAgentIds
    .map((id) => agents.find((a) => a.archetypeId === id))
    .filter(Boolean) as Agent[];

  // Latest record and anchor hash for the right sidebar
  const latestSwarmMsg = [...messages]
    .reverse()
    .find((m) => m.role === "swarm" && m.record);
  const latestRecord = latestSwarmMsg?.record;
  const latestAnchorHash = latestSwarmMsg?.anchorHash;

  const sendMessage = async () => {
    if (!input.trim() || isLoading || isChainLoading) return;
    if (memberAgentIds.length === 0) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
      const res = await fetch(
        `${backendUrl}/swarm/${swarmId}/${Date.now()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: userMsg, memberAgentIds, swarmTokenId }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const record = (await res.json()) as DeliberationRecord;

      const summary = record.agents
        .map(
          (a) =>
            `**${a.agentName}**: ${a.recommendation}${a.veto ? " VETOED" : a.dissent ? " [dissent]" : ""}`
        )
        .join("\n");

      // On approved outcome: anchor deliberation root on-chain (user signs)
      let anchorHash: string | undefined;
      if (record.outcome !== "vetoed" && record.deliberationRoot) {
        try {
          anchorHash = await writeAnchor({
            address: swarmContractAddress(),
            abi: swarm_abi,
            functionName: "updateDeliberationRoot",
            args: [BigInt(swarmTokenId), record.deliberationRoot as `0x${string}`],
          });
          record.onChainTxHash = anchorHash;
        } catch (anchorErr) {
          console.warn("On-chain anchor failed:", anchorErr);
        }
      }

      sessionStorage.setItem("deliberation:" + swarmId, JSON.stringify(record));
      setMessages((prev) => [
        ...prev,
        { role: "swarm", content: summary, record, anchorHash },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "swarm",
          content: "Error: " + (err instanceof Error ? err.message : String(err)),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      <OptimizedBackground />
      <ChainBanner />

      {/* Header */}
      <header className="border-b border-purple-500/20 bg-black/30 backdrop-blur-sm z-50 flex-shrink-0">
        <div className="px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="scale-50 origin-left inline-block">
            <LogoComponent />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-pixel text-purple-300 hidden sm:inline">
              Swarm #{swarmId}
            </span>
            <Link
              href={`/swarm/${swarmId}/deliberation`}
              className="text-xs text-cyan-400 hover:underline"
            >
              Deliberation record
            </Link>
            <DynamicWidget />
          </div>
        </div>
      </header>

      {/* 3-column body */}
      <div className="flex flex-1 overflow-hidden relative z-10">

        {/* LEFT SIDEBAR — Swarm Members */}
        <div className="w-64 border-r border-purple-500/20 bg-black/20 flex-shrink-0 overflow-y-auto p-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            Swarm Members
          </h2>
          {isChainLoading && (
            <p className="text-xs text-cyan-400 animate-pulse">
              Loading from chain…
            </p>
          )}
          {noMembers ? (
            <div className="text-xs text-red-400 border border-red-500/30 rounded-lg p-3">
              No agents found for swarm #{swarmTokenId}.{" "}
              <Link href="/createswarm" className="underline text-cyan-400">
                Compose one
              </Link>
              .
            </div>
          ) : (
            resolvedMemberAgents.map((agent) => (
              <div
                key={agent.archetypeId}
                className="flex flex-col items-center gap-2 p-3 mb-2 rounded-lg border border-purple-500/20 bg-purple-950/10"
              >
                <div className="relative w-16 h-16">
                  <Image
                    src={agent.avatarUrl}
                    alt={agent.name}
                    fill
                    className="object-contain rounded-full border-2 border-cyan-500/60"
                  />
                </div>
                <p className="text-xs font-bold text-white text-center">
                  {agent.name}
                </p>
                <span className="text-xs text-cyan-400">
                  #{agent.archetypeId}
                </span>
              </div>
            ))
          )}
        </div>

        {/* CENTER — Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 text-sm ${
                    msg.role === "user"
                      ? "bg-purple-950/40 border border-purple-500/20"
                      : "bg-cyan-950/20 border border-cyan-500/20"
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {msg.role === "user" ? "You" : "Swarm"}
                  </div>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.record && (
                    <div className="mt-2 space-y-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded border inline-block font-bold ${
                          msg.record.outcome === "vetoed"
                            ? "bg-red-500/20 text-red-400 border-red-500"
                            : "bg-cyan-500/20 text-cyan-400 border-cyan-500"
                        }`}
                      >
                        {msg.record.outcome === "vetoed"
                          ? "VETOED"
                          : "APPROVED"}
                      </span>
                      {msg.anchorHash && (
                        <div className="text-xs">
                          <ExplorerTxLink
                            chainId={EXPECTED_CHAIN_ID}
                            hash={msg.anchorHash}
                            label="View anchor on 0G Explorer"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-lg p-3">
                  <div className="flex gap-1 items-center">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="border-t border-purple-500/20 p-4 bg-black/30 flex-shrink-0">
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder={
                  noMembers
                    ? "No agents in swarm"
                    : isChainLoading
                    ? "Loading swarm…"
                    : "Ask your swarm…"
                }
                disabled={noMembers || isChainLoading}
                className="flex-1 bg-purple-500/10 border border-purple-500/30 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-400/60 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={
                  isLoading ||
                  isChainLoading ||
                  noMembers ||
                  memberAgentIds.length === 0
                }
                className="border border-cyan-400/60 rounded-lg px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-950/30 disabled:opacity-50 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR — Events */}
        <div className="w-72 border-l border-purple-500/20 bg-black/20 flex-shrink-0 overflow-y-auto p-4">
          {/* On-chain section */}
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            On-Chain
          </h2>
          {latestRecord?.deliberationRoot ? (
            <div className="mb-4 space-y-2">
              <div className="text-xs font-mono flex items-start gap-1">
                <span className="text-gray-500 shrink-0">Root:</span>
                <span className="text-cyan-300 break-all">
                  {latestRecord.deliberationRoot.slice(0, 10)}…
                  {latestRecord.deliberationRoot.slice(-6)}
                </span>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      latestRecord!.deliberationRoot!
                    )
                  }
                  className="shrink-0 text-gray-500 hover:text-white ml-1"
                  title="Copy root"
                >
                  ⧉
                </button>
              </div>
              {latestAnchorHash && (
                <ExplorerTxLink
                  chainId={EXPECTED_CHAIN_ID}
                  hash={latestAnchorHash}
                  label="View anchor tx"
                />
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500 mb-4">No anchor yet.</p>
          )}

          {/* Agent responses section */}
          <div className="border-t border-purple-500/20 pt-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Agent Responses
            </h2>
            {latestRecord?.agents?.length ? (
              latestRecord.agents.map((a) => (
                <div
                  key={a.agentId}
                  className="mb-3 p-2 border border-gray-700/50 rounded-lg"
                >
                  <p className="text-xs font-bold text-cyan-400">
                    {a.agentName}
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    {a.recommendation}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500">
                Start a conversation to see agent responses.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
