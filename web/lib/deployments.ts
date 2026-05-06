import type { Address } from "viem";
import { swarm_abi, swarm_contract as defaultSwarmAddress } from "./swarmArtifacts";

export { swarm_abi };

export function swarmContractAddress(): Address {
  const v = process.env.NEXT_PUBLIC_SWARM_CONTRACT_ADDRESS as Address | undefined;
  return v ?? (defaultSwarmAddress as Address);
}

/** Meta-swarm / composition contract; defaults to primary swarm when unset. */
export function metaSwarmContractAddress(): Address {
  const v = process.env.NEXT_PUBLIC_META_SWARM_CONTRACT_ADDRESS as Address | undefined;
  return v ?? swarmContractAddress();
}

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

export function agentNftContractAddress(): Address | undefined {
  const v = process.env.NEXT_PUBLIC_AGENT_NFT_CONTRACT_ADDRESS as Address | undefined;
  if (!v || v === ZERO) return undefined;
  return v;
}

/** Minimal ABI for agent mint — replace when your contract differs. */
export const agent_nft_abi = [
  {
    type: "function",
    name: "mint",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "tokenId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
] as const;
