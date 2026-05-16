"use client";

import { useEffect, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { decodeEventLog } from "viem";
import Image from "next/image";
import {
  agent_nft_abi,
  agent_registry_abi,
  agentNftContractAddress,
  agentRegistryContractAddress,
} from "@/lib/deployments";
import { ExplorerTxLink } from "@/components/explorer-link";
import { EXPECTED_CHAIN_ID } from "@/lib/expected-chain";
import type { Agent } from "@/types/agents";

type MintStep =
  | "idle"
  | "encrypting"
  | "uploading"
  | "minting"
  | "registering"
  | "done"
  | "error";

interface Props {
  agent: Agent;
  onClose: () => void;
}

export default function MintAgentModal({ agent, onClose }: Props) {
  const nft = agentNftContractAddress();
  const regAddr = agentRegistryContractAddress();

  const [step, setStep] = useState<MintStep>("idle");
  const [storageRoot, setStorageRoot] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mint write hook
  const { data: mintHash, writeContract: writeMint } = useWriteContract();
  const { data: mintReceipt, isSuccess: mintIsSuccess } =
    useWaitForTransactionReceipt({ hash: mintHash });

  // Register write hook
  const { data: regHash, writeContractAsync: writeRegisterAsync } =
    useWriteContract();
  const { isSuccess: regIsSuccess } = useWaitForTransactionReceipt({
    hash: regHash,
  });

  // When mint confirms: parse tokenId → auto-register
  useEffect(() => {
    if (!mintIsSuccess || !mintReceipt || !regAddr) return;
    let tokenId: bigint | null = null;
    for (const log of mintReceipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: agent_nft_abi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "AgentMinted") {
          tokenId = decoded.args.tokenId;
          break;
        }
      } catch {
        // not this log
      }
    }
    if (tokenId === null) {
      setStep("done");
      return;
    }
    setStep("registering");
    writeRegisterAsync({
      address: regAddr,
      abi: agent_registry_abi,
      functionName: "register",
      args: [BigInt(agent.archetypeId), tokenId],
    }).catch((err) => {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStep("error");
    });
  }, [mintIsSuccess, mintReceipt, regAddr, agent.archetypeId, writeRegisterAsync]);

  useEffect(() => {
    if (regIsSuccess) setStep("done");
  }, [regIsSuccess]);

  const onMint = async () => {
    if (!nft) return;
    setErrorMsg(null);
    try {
      setStep("encrypting");
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
      const res = await fetch(
        `${backendUrl}/agents/${agent.archetypeId}/prepare-mint`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error(await res.text());
      const { root } = (await res.json()) as { root: string };
      if (!/^0x[0-9a-fA-F]{64}$/.test(root))
        throw new Error(`Invalid storage root: ${root}`);
      setStorageRoot(root);
      setStep("uploading");
      writeMint({
        address: nft,
        abi: agent_nft_abi,
        functionName: "mint",
        args: [BigInt(agent.archetypeId), root as `0x${string}`],
      });
      setStep("minting");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStep("error");
    }
  };

  const stepsDisplay: MintStep[] = [
    "encrypting",
    "uploading",
    "minting",
    "registering",
  ];
  const stepIndex = stepsDisplay.indexOf(step);
  const isWorking = stepsDisplay.includes(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-black border border-cyan-500/50 rounded-xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isWorking}
          className="absolute top-4 right-4 text-gray-400 hover:text-white disabled:opacity-30 text-lg leading-none"
        >
          ✕
        </button>

        {/* Agent info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative w-14 h-14 shrink-0">
            <Image
              src={agent.avatarUrl}
              alt={agent.name}
              fill
              className="object-contain rounded-full border-2 border-cyan-500/40"
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{agent.name}</h2>
            <p className="text-xs text-cyan-400">
              archetype #{agent.archetypeId}
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 text-xs mb-6">
          {stepsDisplay.map((s, i) => (
            <div
              key={s}
              className={`flex-1 text-center py-1 rounded border ${
                step === s
                  ? "border-cyan-400/60 text-cyan-300"
                  : step === "done"
                  ? "border-green-500/40 text-green-400"
                  : stepIndex > i
                  ? "border-purple-400/40 text-purple-300"
                  : "border-purple-500/20 text-gray-500"
              }`}
            >
              {["Encrypt", "Upload", "Mint", "Register"][i]}
            </div>
          ))}
        </div>

        {/* Storage root */}
        {storageRoot && (
          <p className="text-xs text-gray-400 mb-4 break-all">
            Root:{" "}
            <span className="text-cyan-300 font-mono">{storageRoot}</span>
          </p>
        )}

        {/* Error */}
        {errorMsg && (
          <p className="text-sm text-red-300 border border-red-500/40 rounded p-2 mb-4">
            {errorMsg}
          </p>
        )}

        {/* Done state */}
        {step === "done" && (
          <div className="space-y-2 mb-4 text-sm text-green-200">
            <p>✓ Minted &amp; Registered!</p>
            {mintHash && (
              <ExplorerTxLink
                chainId={EXPECTED_CHAIN_ID}
                hash={mintHash}
                label="View mint tx"
              />
            )}
            {regHash && (
              <ExplorerTxLink
                chainId={EXPECTED_CHAIN_ID}
                hash={regHash}
                label="View register tx"
              />
            )}
          </div>
        )}

        {/* Action button */}
        {step !== "done" ? (
          <button
            onClick={onMint}
            disabled={isWorking || !nft}
            className="w-full py-2 rounded-lg border border-cyan-500/60 text-cyan-300 hover:bg-cyan-950/30 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {isWorking
              ? "Working…"
              : step === "error"
              ? "Retry"
              : "Mint iNFT"}
          </button>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg border border-purple-500/60 text-purple-300 hover:bg-purple-950/30 text-sm font-medium transition-colors"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
