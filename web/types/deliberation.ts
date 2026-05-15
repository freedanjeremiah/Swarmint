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
