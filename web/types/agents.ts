// types/agents.ts

export interface Capability {
  name: string;
  description: string;
}

export interface AgentGroup {
  id: string;
  name: string;
  description: string;
}

export interface Agent {
  num: number;
  id: string;
  name: string;
  type: string;
  group: string;
  description: string;
  capabilities: Capability[];
  avatarUrl: string;
  apiendpoint: string;
}

export interface Swarm {
  id: string;
  name: string;
  description: string;
  agents: string[]; // Array of agent IDs
  lastActive?: string;
  created: string;
  threadId?: string;
}
