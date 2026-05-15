"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import OptimizedBackground from "@/components/background";
import LogoComponent from "@/components/logo";
import { ExplorerTxLink } from "@/components/explorer-link";
import { EXPECTED_CHAIN_ID } from "@/lib/expected-chain";
import type { DeliberationRecord } from "@/types/deliberation";

export default function DeliberationPage() {
  const params = useParams();
  const swarmId = params.slug as string;
  const [record, setRecord] = useState<DeliberationRecord | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("deliberation:" + swarmId);
    if (stored) {
      try { setRecord(JSON.parse(stored) as DeliberationRecord); } catch {}
    }
  }, [swarmId]);

  const truncate = (s: string) => s.length > 40 ? s.slice(0, 20) + "..." + s.slice(-10) : s;

  return (
    <div className="min-h-screen bg-black text-white relative">
      <OptimizedBackground />
      <header className="border-b border-purple-500/20 bg-black/30 backdrop-blur-sm fixed top-0 w-full z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link href={"/swarm/" + swarmId} className="scale-50 origin-left inline-block">
            <LogoComponent />
          </Link>
          <span className="text-xs text-gray-400">back to Swarm {swarmId}</span>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-28 pb-16 max-w-3xl relative z-10 space-y-6">
        <h1 className="text-xl font-pixel text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
          Deliberation Record
        </h1>

        {!record && (
          <p className="text-sm text-gray-400">No deliberation record found. Run a swarm decision first.</p>
        )}

        {record && (
          <>
            <div className="border border-purple-500/20 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex gap-2 items-center">
                <span className={"px-2 py-0.5 rounded text-xs font-bold " + (
                  record.outcome === "vetoed"
                    ? "bg-red-900/40 text-red-300 border border-red-500/30"
                    : "bg-green-900/40 text-green-300 border border-green-500/30"
                )}>
                  {record.outcome.toUpperCase()}
                </span>
                <span className="text-gray-400 text-xs">{record.timestamp}</span>
              </div>
              <p className="text-gray-300">Prompt: <span className="text-white">{record.prompt}</span></p>
              {record.deliberationRoot && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">0G Storage Merkle Root (deliberation record):</p>
                  <p className="font-mono text-xs text-cyan-300 break-all">{record.deliberationRoot}</p>
                </div>
              )}
              {record.onChainTxHash && (
                <ExplorerTxLink
                  chainId={EXPECTED_CHAIN_ID}
                  hash={record.onChainTxHash}
                  label="View updateDeliberationRoot on 0G Explorer"
                />
              )}
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-pixel text-purple-300">Per-agent records</h2>
              {record.agents.map((agent) => (
                <div
                  key={agent.agentId}
                  className={"border rounded-lg p-4 space-y-2 text-sm " + (
                    agent.veto
                      ? "border-red-500/40 bg-red-950/20"
                      : agent.dissent
                      ? "border-amber-500/30 bg-amber-950/10"
                      : "border-purple-500/20 bg-purple-950/10"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{agent.agentName}</span>
                    {agent.veto && <span className="text-xs text-red-300 border border-red-500/40 rounded px-1">VETO</span>}
                    {agent.dissent && !agent.veto && <span className="text-xs text-amber-300 border border-amber-500/40 rounded px-1">DISSENT</span>}
                  </div>
                  <p className="text-gray-300">{agent.recommendation}</p>
                  {agent.vetoReason && (
                    <p className="text-xs text-red-300">Veto reason: {agent.vetoReason}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">TEE Attestation:</span>
                    <span className="font-mono text-xs text-gray-400">{truncate(agent.attestation)}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(agent.attestation)}
                      className="text-xs text-cyan-400 hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}