export type AgentStepRole = "recommend" | "dissent" | "veto" | "info";

export interface AgentStep {
  agentId: string;
  role: AgentStepRole;
  summary: string;
  at: string;
}

export interface DeliberationRecord {
  threadId: string;
  merkleRoot?: string;
  anchorTxHash?: string;
  steps: AgentStep[];
}
