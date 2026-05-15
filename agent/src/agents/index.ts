import * as accountant from "./accountant.js";
import * as advisor from "./advisor.js";
import * as riskManager from "./riskManager.js";
import * as researcher from "./researcher.js";
import * as governance from "./governance.js";
import type { AgentArchetype } from "../types.js";

export const ARCHETYPES: AgentArchetype[] = [
  { id: accountant.id, name: accountant.name, systemPrompt: accountant.systemPrompt, isVetoAgent: accountant.isVetoAgent },
  { id: advisor.id, name: advisor.name, systemPrompt: advisor.systemPrompt, isVetoAgent: advisor.isVetoAgent },
  { id: riskManager.id, name: riskManager.name, systemPrompt: riskManager.systemPrompt, isVetoAgent: riskManager.isVetoAgent },
  { id: researcher.id, name: researcher.name, systemPrompt: researcher.systemPrompt, isVetoAgent: researcher.isVetoAgent },
  { id: governance.id, name: governance.name, systemPrompt: governance.systemPrompt, isVetoAgent: governance.isVetoAgent },
];

export function getArchetype(agentId: number): AgentArchetype | undefined {
  return ARCHETYPES.find((a) => a.id === agentId);
}
