import * as accountant from "./accountant.js";
import * as advisor from "./advisor.js";
import * as riskManager from "./riskManager.js";
import * as researcher from "./researcher.js";
import * as governance from "./governance.js";
import * as degenTrader from "./degenTrader.js";
import * as godAgent from "./godAgent.js";
import * as dataScientist from "./dataScientist.js";
import * as newsAggregator from "./newsAggregator.js";
import * as patternDetector from "./patternDetector.js";
import * as voteCalculator from "./voteCalculator.js";
import * as strategyCoordinator from "./strategyCoordinator.js";
import type { AgentArchetype } from "../types.js";

export const ARCHETYPES: AgentArchetype[] = [
  { id: accountant.id, name: accountant.name, systemPrompt: accountant.systemPrompt, isVetoAgent: accountant.isVetoAgent },
  { id: advisor.id, name: advisor.name, systemPrompt: advisor.systemPrompt, isVetoAgent: advisor.isVetoAgent },
  { id: degenTrader.id, name: degenTrader.name, systemPrompt: degenTrader.systemPrompt, isVetoAgent: degenTrader.isVetoAgent },
  { id: riskManager.id, name: riskManager.name, systemPrompt: riskManager.systemPrompt, isVetoAgent: riskManager.isVetoAgent },
  { id: godAgent.id, name: godAgent.name, systemPrompt: godAgent.systemPrompt, isVetoAgent: godAgent.isVetoAgent },
  { id: researcher.id, name: researcher.name, systemPrompt: researcher.systemPrompt, isVetoAgent: researcher.isVetoAgent },
  { id: dataScientist.id, name: dataScientist.name, systemPrompt: dataScientist.systemPrompt, isVetoAgent: dataScientist.isVetoAgent },
  { id: newsAggregator.id, name: newsAggregator.name, systemPrompt: newsAggregator.systemPrompt, isVetoAgent: newsAggregator.isVetoAgent },
  { id: patternDetector.id, name: patternDetector.name, systemPrompt: patternDetector.systemPrompt, isVetoAgent: patternDetector.isVetoAgent },
  { id: governance.id, name: governance.name, systemPrompt: governance.systemPrompt, isVetoAgent: governance.isVetoAgent },
  { id: voteCalculator.id, name: voteCalculator.name, systemPrompt: voteCalculator.systemPrompt, isVetoAgent: voteCalculator.isVetoAgent },
  { id: strategyCoordinator.id, name: strategyCoordinator.name, systemPrompt: strategyCoordinator.systemPrompt, isVetoAgent: strategyCoordinator.isVetoAgent },
];

export function getArchetype(agentId: number): AgentArchetype | undefined {
  return ARCHETYPES.find((a) => a.id === agentId);
}
