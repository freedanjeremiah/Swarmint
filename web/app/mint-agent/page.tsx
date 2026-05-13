"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useAccount,
  useChainId,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { agents, agentGroups } from "@/config/agents";
import {
  agent_nft_abi,
  agentNftContractAddress,
} from "@/lib/deployments";
import OptimizedBackground from "@/components/background";
import LogoComponent from "@/components/logo";
import CyberButton from "@/components/cyberButton";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { ChainBanner } from "@/components/chain-banner";
import { ExplorerTxLink } from "@/components/explorer-link";
import { EXPECTED_CHAIN_ID } from "@/lib/expected-chain";
import Image from "next/image";

export default function MintAgentPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const chainOk = chainId === EXPECTED_CHAIN_ID;
  const nft = agentNftContractAddress();
  const [group, setGroup] = useState(agentGroups[0].id);
  const [agentId, setAgentId] = useState<string | null>(null);
  const agent = useMemo(
    () => agents.find((a) => a.id === agentId) ?? null,
    [agentId]
  );

  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const onMint = () => {
    if (!nft || !agent || !chainOk) return;
    writeContract({
      address: nft,
      abi: agent_nft_abi,
      functionName: "mint",
      args: [BigInt(agent.num)],
    });
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
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

      <main className="container mx-auto px-4 pt-28 pb-16 max-w-3xl space-y-8 relative z-10">
        <h1 className="text-2xl font-pixel text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
          Mint agent token
        </h1>

        {!nft && (
          <p className="text-sm text-amber-200 border border-amber-500/40 rounded-lg p-4">
            Set <code className="text-cyan-300">NEXT_PUBLIC_AGENT_NFT_CONTRACT_ADDRESS</code>{" "}
            to your deployed NFT contract.
          </p>
        )}

        <div className="space-y-2">
          <label className="text-xs text-gray-400" htmlFor="group">
            Group
          </label>
          <select
            id="group"
            value={group}
            onChange={(e) => {
              setGroup(e.target.value);
              setAgentId(null);
            }}
            className="w-full bg-purple-500/10 border border-purple-500/30 rounded-lg px-3 py-2 text-sm"
          >
            {agentGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-gray-400">Agent</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {agents
              .filter((a) => a.group === group)
              .map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => setAgentId(a.id)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    agentId === a.id
                      ? "border-cyan-400/60 bg-cyan-950/30"
                      : "border-purple-500/20 bg-purple-950/20 hover:border-purple-400/40"
                  }`}
                >
                  <div className="relative w-12 h-12 shrink-0">
                    <Image src={a.avatarUrl} alt="" fill className="object-contain" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{a.name}</div>
                    <div className="text-xs text-gray-500">#{a.num}</div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-300 border border-red-500/40 rounded-lg p-3">
            {error.message}
          </div>
        )}

        {isConfirming && (
          <p className="text-sm text-purple-200">Confirming transaction…</p>
        )}
        {isSuccess && hash && (
          <div className="space-y-2 text-sm text-green-200">
            <p>Mint submitted.</p>
            <ExplorerTxLink chainId={chainId} hash={hash} />
          </div>
        )}

        <CyberButton
          cyberSize="lg"
          disabled={
            !isConnected ||
            !chainOk ||
            !nft ||
            !agent ||
            isPending ||
            isConfirming
          }
          onClick={onMint}
        >
          {isPending || isConfirming ? "Working…" : "Mint"}
        </CyberButton>
      </main>
    </div>
  );
}
