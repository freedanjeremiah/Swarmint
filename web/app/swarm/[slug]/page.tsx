"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useReadContract, useReadContracts } from "wagmi";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import OptimizedBackground from "@/components/background";
import LogoComponent from "@/components/logo";
import { ChainBanner } from "@/components/chain-banner";
import type { DeliberationRecord } from "@/types/deliberation";
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
}

const FALLBACK_MEMBER_IDS = [1, 2, 4, 6, 10];

export default function SwarmChatPage() {
  const params = useParams();
  const swarmId = params.slug as string;
  const swarmTokenId = Number(swarmId) || 1;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: read member AgentINFT token IDs from SwarmMetaINFT
  const { data: memberTokenIds, isPending: membersPending } = useReadContract({
    address: swarmContractAddress(),
    abi: swarm_abi,
    functionName: "getSwarmMembers",
    args: [BigInt(swarmTokenId)],
  });

  // Step 2: multicall tokenAgentId for each member token ID
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

  // Resolve archetype IDs; fall back to hardcoded if chain reads not ready or return zeros
  const resolvedIds =
    agentIdResults
      ?.map((r) => (r.status === "success" ? Number(r.result as bigint) : 0))
      .filter((id) => id > 0) ?? [];

  const memberAgentIds =
    resolvedIds.length > 0 ? resolvedIds : FALLBACK_MEMBER_IDS;

  const isChainLoading = membersPending || (memberCalls.length > 0 && agentIdsPending);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || isChainLoading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
      const res = await fetch(
        backendUrl + "/swarm/" + swarmId + "/" + Date.now(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: userMsg, memberAgentIds, swarmTokenId }),
        }
      );
      const record = (await res.json()) as DeliberationRecord;
      const summary = record.agents
        .map(
          (a) =>
            "**" +
            a.agentName +
            "**: " +
            a.recommendation +
            (a.veto ? " VETOED" : a.dissent ? " dissent" : "")
        )
        .join("\n");
      sessionStorage.setItem(
        "deliberation:" + swarmId,
        JSON.stringify(record)
      );
      setMessages((prev) => [
        ...prev,
        { role: "swarm", content: summary, record },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "swarm",
          content:
            "Error: " +
            (err instanceof Error ? err.message : String(err)),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col">
      <OptimizedBackground />
      <ChainBanner />
      <header className="border-b border-purple-500/20 bg-black/30 backdrop-blur-sm fixed top-0 w-full z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="scale-50 origin-left inline-block">
            <LogoComponent />
          </Link>
          <DynamicWidget />
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-32 max-w-3xl flex-1 relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-pixel text-purple-300">Swarm {swarmId}</h1>
          <Link
            href={"/swarm/" + swarmId + "/deliberation"}
            className="text-xs text-cyan-400 hover:underline"
          >
            View deliberation record
          </Link>
        </div>

        <div className="space-y-3 min-h-[400px]">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={
                "rounded-lg p-3 text-sm whitespace-pre-wrap " +
                (msg.role === "user"
                  ? "bg-purple-950/40 border border-purple-500/20 ml-8"
                  : "bg-cyan-950/20 border border-cyan-500/20 mr-8")
              }
            >
              <div className="text-xs text-gray-500 mb-1">
                {msg.role === "user" ? "You" : "Swarm"}
              </div>
              {msg.content}
              {msg.record && (
                <div
                  className={
                    "mt-2 text-xs px-2 py-1 rounded inline-block " +
                    (msg.record.outcome === "vetoed"
                      ? "bg-red-900/40 text-red-300 border border-red-500/30"
                      : "bg-green-900/40 text-green-300 border border-green-500/30")
                  }
                >
                  {msg.record.outcome === "vetoed" ? "VETOED" : "APPROVED"}
                  {msg.record.onChainTxHash && (
                    <span className="ml-2 text-gray-400">(anchored on-chain)</span>
                  )}
                </div>
              )}
            </div>
          ))}
          {isChainLoading && (
            <div className="text-xs text-cyan-400 animate-pulse">
              Loading swarm members from chain...
            </div>
          )}
          {isLoading && (
            <div className="text-xs text-purple-300 animate-pulse">
              Swarm deliberating...
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-black/80 border-t border-purple-500/20 p-4 z-50">
        <div className="container mx-auto max-w-3xl flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask your swarm..."
            className="flex-1 bg-purple-500/10 border border-purple-500/30 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-400/60"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || isChainLoading}
            className="border border-cyan-400/60 rounded-lg px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-950/30 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
