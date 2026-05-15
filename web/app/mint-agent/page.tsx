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
import { agent_nft_abi, agentNftContractAddress } from "@/lib/deployments";
import OptimizedBackground from "@/components/background";
import LogoComponent from "@/components/logo";
import CyberButton from "@/components/cyberButton";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { ChainBanner } from "@/components/chain-banner";
import { ExplorerTxLink } from "@/components/explorer-link";
import { EXPECTED_CHAIN_ID } from "@/lib/expected-chain";
import Image from "next/image";

type MintStep = "idle" | "encrypting" | "uploading" | "minting" | "confirming" | "done" | "error";

export default function MintAgentPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const chainOk = chainId === EXPECTED_CHAIN_ID;
  const nft = agentNftContractAddress();
  const [group, setGroup] = useState(agentGroups[0].id);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [step, setStep] = useState<MintStep>("idle");
  const [storageRoot, setStorageRoot] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const agent = useMemo(
    () => agents.find((a) => a.id === agentId) ?? null,
    [agentId]
  );

  const { data: hash, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (isSuccess && step === "confirming") setStep("done");

  const onMint = async () => {
    if (!nft || !agent || !chainOk) return;
    setErrorMsg(null);
    try {
      // Step 1+2: Encrypt agent blob + upload to 0G Storage
      setStep("encrypting");
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
      const res = await fetch(`${backendUrl}/agents/${agent.num}/prepare-mint`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text());
      const { root } = (await res.json()) as { root: string };
      setStorageRoot(root);

      // Step 3: Mint iNFT on-chain with the Merkle root as dataHash
      setStep("minting");
      writeContract({
        address: nft,
        abi: agent_nft_abi,
        functionName: "mint",
        args: [BigInt(agent.num), root as `0x${string}`],
      });
      setStep("confirming");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStep("error");
    }
  };

  const stepLabel: Record<MintStep, string> = {
    idle: "Mint",
    encrypting: "Encrypting agent data…",
    uploading: "Uploading to 0G Storage…",
    minting: "Confirm in wallet…",
    confirming: "Confirming on-chain…",
    done: "Minted!",
    error: "Retry",
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
          Mint agent iNFT
        </h1>

        {!nft && (
          <p className="text-sm text-amber-200 border border-amber-500/40 rounded-lg p-4">
            Set <code className="text-cyan-300">NEXT_PUBLIC_AGENT_NFT_CONTRACT_ADDRESS</code> in <code>.env.local</code>.
          </p>
        )}

        {/* Step indicator */}
        <div className="flex gap-2 text-xs">
          {(["encrypting", "uploading", "minting", "confirming"] as MintStep[]).map((s, i) => (
            <div key={s} className={`flex-1 text-center py-1 rounded border ${
              step === s
                ? "border-cyan-400/60 text-cyan-300"
                : step === "done"
                ? "border-green-500/40 text-green-400"
                : "border-purple-500/20 text-gray-500"
            }`}>
              {i + 1}. {s === "encrypting" ? "Encrypt" : s === "uploading" ? "0G Storage" : s === "minting" ? "Mint iNFT" : "Confirm"}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-400" htmlFor="group">Group</label>
          <select
            id="group"
            value={group}
            onChange={(e) => { setGroup(e.target.value); setAgentId(null); }}
            className="w-full bg-purple-500/10 border border-purple-500/30 rounded-lg px-3 py-2 text-sm"
          >
            {agentGroups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
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

        {storageRoot && (
          <div className="text-xs text-gray-400 border border-purple-500/20 rounded p-3 space-y-1">
            <p>0G Storage root: <span className="text-cyan-300 font-mono break-all">{storageRoot}</span></p>
          </div>
        )}

        {errorMsg && (
          <p className="text-sm text-red-300 border border-red-500/40 rounded-lg p-3">{errorMsg}</p>
        )}

        {step === "done" && hash && (
          <div className="space-y-2 text-sm text-green-200">
            <p>Agent iNFT minted. Intelligence anchored on 0G Storage.</p>
            <ExplorerTxLink chainId={chainId} hash={hash} label="View mint on 0G Explorer" />
          </div>
        )}

        <CyberButton
          cyberSize="lg"
          disabled={
            !isConnected || !chainOk || !nft || !agent ||
            ["encrypting", "uploading", "minting", "confirming"].includes(step)
          }
          onClick={onMint}
        >
          {stepLabel[step]}
        </CyberButton>
      </main>
    </div>
  );
}
