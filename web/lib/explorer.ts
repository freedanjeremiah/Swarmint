/** Build transaction URL for the active explorer base (no trailing slash in env). */
export function txExplorerUrl(chainId: number, hash: string): string | undefined {
  const base = explorerBaseForChain(chainId);
  if (!base || !hash) return undefined;
  return `${base.replace(/\/$/, "")}/tx/${hash}`;
}

export function addressExplorerUrl(
  chainId: number,
  address: string
): string | undefined {
  const base = explorerBaseForChain(chainId);
  if (!base || !address) return undefined;
  return `${base.replace(/\/$/, "")}/address/${address}`;
}

function explorerBaseForChain(chainId: number): string | undefined {
  const custom = process.env.NEXT_PUBLIC_EXPLORER_BASE_URL;
  if (custom) return custom;
  if (chainId === 84532) return "https://sepolia.basescan.org";
  return process.env.NEXT_PUBLIC_TARGET_EXPLORER_BASE_URL;
}
