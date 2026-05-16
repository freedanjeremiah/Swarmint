import type { Address } from "viem";
import { swarm_abi } from "./swarmArtifacts";

export { swarm_abi };

export function swarmContractAddress(): Address {
  return (process.env.NEXT_PUBLIC_SWARM_CONTRACT_ADDRESS ?? "") as Address;
}

export function metaSwarmContractAddress(): Address {
  return (process.env.NEXT_PUBLIC_META_SWARM_CONTRACT_ADDRESS ?? "") as Address;
}

export function agentNftContractAddress(): Address | undefined {
  const v = process.env.NEXT_PUBLIC_AGENT_NFT_CONTRACT_ADDRESS as Address | undefined;
  if (!v || v === "0x0000000000000000000000000000000000000000") return undefined;
  return v;
}

export function agentRegistryContractAddress(): Address | undefined {
  const v = process.env.NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT_ADDRESS as Address | undefined;
  if (!v || v === "0x0000000000000000000000000000000000000000") return undefined;
  return v;
}

export const agent_nft_abi = [
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "bytes32", name: "dataHash", type: "bytes32" },
    ],
    name: "mint",
    outputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenDataHash",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenAgentId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: true, internalType: "uint256", name: "agentId", type: "uint256" },
      { indexed: false, internalType: "address", name: "owner", type: "address" },
      { indexed: false, internalType: "bytes32", name: "dataHash", type: "bytes32" },
    ],
    name: "AgentMinted",
    type: "event",
  },
] as const;

export const agent_registry_abi = [
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "register",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "agentId", type: "uint256" }],
    name: "getTokenId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
