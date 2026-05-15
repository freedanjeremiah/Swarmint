// SwarmMetaINFT ABI — update swarm_contract from blockend/deployments.json
export const swarm_contract = process.env.NEXT_PUBLIC_SWARM_CONTRACT_ADDRESS ?? "";

export const swarm_abi = [
  {
    inputs: [
      { internalType: "string", name: "threadId", type: "string" },
      { internalType: "uint256[]", name: "memberTokenIds", type: "uint256[]" },
      { internalType: "bytes32", name: "deliberationRoot", type: "bytes32" },
    ],
    name: "compose",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "swarmTokenId", type: "uint256" },
      { internalType: "bytes32", name: "newRoot", type: "bytes32" },
    ],
    name: "updateDeliberationRoot",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "swarmTokenId", type: "uint256" }],
    name: "getSwarmMembers",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserSwarms",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "swarms",
    outputs: [
      { internalType: "string", name: "threadId", type: "string" },
      { internalType: "bytes32", name: "deliberationRoot", type: "bytes32" },
      { internalType: "uint256", name: "createdAt", type: "uint256" },
      { internalType: "uint8", name: "status", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "swarmTokenId", type: "uint256" },
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: false, internalType: "uint256[]", name: "memberTokenIds", type: "uint256[]" },
      { indexed: false, internalType: "bytes32", name: "deliberationRoot", type: "bytes32" },
    ],
    name: "SwarmComposed",
    type: "event",
  },
] as const;
