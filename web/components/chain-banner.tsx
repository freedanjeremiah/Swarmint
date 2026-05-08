"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { EXPECTED_CHAIN_ID } from "@/lib/expected-chain";

export function ChainBanner() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected || chainId === EXPECTED_CHAIN_ID) return null;

  return (
    <div
      role="alert"
      className="border border-amber-500/50 bg-amber-950/40 text-amber-100 px-4 py-3 text-sm flex flex-wrap items-center gap-3 justify-between"
    >
      <span>
        Wrong network: switch to chain ID {EXPECTED_CHAIN_ID} to use contract
        actions.
      </span>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          switchChain?.({
            chainId: EXPECTED_CHAIN_ID,
          })
        }
        className="rounded-md border border-amber-400/60 px-3 py-1 text-xs font-medium hover:bg-amber-500/20 disabled:opacity-50"
      >
        {isPending ? "Switching…" : "Switch network"}
      </button>
    </div>
  );
}
