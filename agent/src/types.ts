export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AgentResponse {
  content: string;
  attestation: string;
}

export interface AgentRecord {
  agentId: number;
  agentName: string;
  recommendation: string;
  attestation: string;
  dissent: boolean;
  veto?: boolean;
  vetoReason?: string;
}

export interface DeliberationRecord {
  swarmId: string;
  threadId: string;
  timestamp: string;
  prompt: string;
  agents: AgentRecord[];
  outcome: "approved" | "vetoed";
  deliberationRoot?: string;
  onChainTxHash?: string;
}

export interface AgentArchetype {
  id: number;
  name: string;
  systemPrompt: string;
  isVetoAgent: boolean;
}
