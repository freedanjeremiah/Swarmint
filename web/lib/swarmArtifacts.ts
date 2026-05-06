export const swarm_contract = "0x418EBcE67a27E56860258156565dB10269fcfD31";
export const swarm_abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "swarmId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "agentId",
        type: "uint256",
      },
    ],
    name: "AgentAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "swarmId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "agentId",
        type: "uint256",
      },
    ],
    name: "AgentRemoved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "swarmId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "threadId",
        type: "string",
      },
    ],
    name: "SwarmCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "swarmId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "enum AISwarmManager.SwarmStatus",
        name: "status",
        type: "uint8",
      },
    ],
    name: "SwarmStatusUpdated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "swarmId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "agentId",
        type: "uint256",
      },
    ],
    name: "addAgentToSwarm",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "threadId",
        type: "string",
      },
      {
        internalType: "uint256[]",
        name: "initialAgentIds",
        type: "uint256[]",
      },
    ],
    name: "createSwarm",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "swarmId",
        type: "uint256",
      },
    ],
    name: "getSwarmAgents",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "swarmId",
        type: "uint256",
      },
    ],
    name: "getSwarmDetails",
    outputs: [
      {
        internalType: "string",
        name: "threadId",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "agentCount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "createdAt",
        type: "uint256",
      },
      {
        internalType: "enum AISwarmManager.SwarmStatus",
        name: "status",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "getUserSwarms",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "swarmId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "agentId",
        type: "uint256",
      },
    ],
    name: "removeAgentFromSwarm",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "swarms",
    outputs: [
      {
        internalType: "string",
        name: "threadId",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "createdAt",
        type: "uint256",
      },
      {
        internalType: "enum AISwarmManager.SwarmStatus",
        name: "status",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "swarmId",
        type: "uint256",
      },
      {
        internalType: "enum AISwarmManager.SwarmStatus",
        name: "newStatus",
        type: "uint8",
      },
    ],
    name: "updateSwarmStatus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "userSwarms",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
