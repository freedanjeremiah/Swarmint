"use client";

import { txExplorerUrl } from "@/lib/explorer";

export function ExplorerTxLink({
  chainId,
  hash,
  label = "View on explorer",
}: {
  chainId: number;
  hash?: string;
  label?: string;
}) {
  const url = hash ? txExplorerUrl(chainId, hash) : undefined;
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-cyan-300 underline text-sm hover:text-cyan-200"
    >
      {label}
    </a>
  );
}
