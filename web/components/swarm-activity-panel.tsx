"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { agents } from "@/config/agents";
import type { DeliberationRecord } from "@/types/deliberation";
import { ExplorerTxLink } from "@/components/explorer-link";
import { useChainId } from "wagmi";

export interface SwarmEventItem {
  agentId: string;
  timestamp: Date;
  metadata: unknown;
}

function isDeliberationRecord(v: unknown): v is DeliberationRecord {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.threadId === "string" && Array.isArray(o.steps);
}

export function SwarmActivityPanel({
  threadId,
  liveEvents,
}: {
  threadId: string | undefined;
  liveEvents: SwarmEventItem[];
}) {
  const chainId = useChainId();
  const [record, setRecord] = useState<DeliberationRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openRawIndex, setOpenRawIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!threadId) return;
    const base = process.env.NEXT_PUBLIC_ACTIVITY_API_BASE?.replace(/\/$/, "");
    if (!base) {
      setRecord(null);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`${base}/activity?threadId=${encodeURIComponent(threadId)}`, {
      signal: ac.signal,
    })
      .then(async (r) => {
        if (r.status === 404) {
          setRecord(null);
          return;
        }
        if (!r.ok) throw new Error(await r.text());
        const data: unknown = await r.json();
        if (isDeliberationRecord(data)) setRecord(data);
        else setRecord(null);
      })
      .catch((e: Error) => {
        if (e.name === "AbortError") return;
        setError(e.message || "Failed to load activity");
        setRecord(null);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [threadId]);

  return (
    <aside className="w-full xl:w-80 border-l border-purple-500/20 bg-black/30 backdrop-blur-sm xl:block pt-20 shrink-0 min-h-0 flex flex-col">
      <div className="p-4 flex-1 overflow-y-auto">
        <h2 className="text-sm font-semibold text-gray-400 mb-4">
          Swarm activity
        </h2>
        {loading && (
          <p className="text-xs text-gray-500">Loading structured record…</p>
        )}
        {error && (
          <p className="text-xs text-red-300 mb-2" role="alert">
            {error}
          </p>
        )}
        {record?.steps?.length ? (
          <div className="space-y-3 mb-6">
            {record.steps.map((step, i) => {
              const agent = agents.find((a) => a.id === step.agentId);
              return (
                <div
                  key={`${step.at}-${i}`}
                  className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {agent && (
                      <div className="relative w-6 h-6">
                        <Image
                          src={agent.avatarUrl}
                          alt=""
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    <span className="text-xs font-medium text-cyan-200">
                      {agent?.name ?? step.agentId}
                    </span>
                    <span className="text-[10px] uppercase text-gray-500">
                      {step.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">{step.summary}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{step.at}</p>
                </div>
              );
            })}
            {record.merkleRoot && (
              <div className="text-xs text-gray-400 break-all">
                <span className="text-gray-500">Root: </span>
                {record.merkleRoot}
              </div>
            )}
            {record.anchorTxHash && (
              <div className="mt-2">
                <ExplorerTxLink
                  chainId={chainId}
                  hash={record.anchorTxHash}
                  label="Anchor tx"
                />
              </div>
            )}
          </div>
        ) : null}

        <h3 className="text-xs font-semibold text-gray-500 mb-2">Live events</h3>
        <div className="space-y-4">
          {liveEvents.map((event, index) => {
            const agent = agents.find((a) => a.id === event.agentId);
            return (
              <div
                key={`${event.agentId}-${index}`}
                className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  {agent && (
                    <div className="relative w-6 h-6">
                      <Image
                        src={agent.avatarUrl}
                        alt=""
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <span className="text-sm font-medium">{agent?.name}</span>
                </div>
                <button
                  type="button"
                  className="text-[10px] text-cyan-400 mb-1"
                  onClick={() =>
                    setOpenRawIndex((v) => (v === index ? null : index))
                  }
                >
                  {openRawIndex === index ? "Hide" : "Show"} raw metadata
                </button>
                {openRawIndex === index && (
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap max-h-40 overflow-auto">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
