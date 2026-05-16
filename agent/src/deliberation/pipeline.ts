import { ethers } from "ethers";
import { chat } from "../compute/broker.js";
import { uploadEncrypted } from "../storage/log.js";
import { swarmStreamId, readMemory, writeMemory } from "../storage/kv.js";
import { getArchetype } from "../agents/index.js";
import type { AgentRecord, DeliberationRecord } from "../types.js";

export interface PipelineInput {
  swarmId: string;
  swarmTokenId: number;
  memberAgentIds: number[];
  threadId: string;
  userPrompt: string;
}

interface AgentLLMResponse {
  recommendation: string;
  dissent?: boolean;
  veto?: boolean;
  vetoReason?: string;
  reasoning?: string;
}

function parseAgentResponse(raw: string): AgentLLMResponse {
  try {
    return JSON.parse(raw) as AgentLLMResponse;
  } catch {
    return { recommendation: raw, dissent: false };
  }
}

export async function runDeliberation(input: PipelineInput): Promise<DeliberationRecord> {
  const { swarmId, swarmTokenId: _swarmTokenId, memberAgentIds, threadId, userPrompt } = input;

  // Validate all agent IDs before doing any work
  const unknownIds = memberAgentIds.filter((id) => !getArchetype(id));
  if (unknownIds.length > 0) {
    throw new Error(`Unknown agent id(s): ${unknownIds.join(", ")}. Valid IDs: 1-5, 7-12.`);
  }

  // Load per-swarm KV memory
  const sid = swarmStreamId(swarmId);
  let memory: string | null = null;
  try {
    memory = await readMemory(sid);
  } catch {
    // KV failure is non-fatal
  }
  const memoryContext = memory ? `\n\nSwarm memory (prior decisions):\n${memory}` : "";

  const agentRecords: AgentRecord[] = [];
  let outcome: "approved" | "vetoed" = "approved";

  // Separate veto agent from non-veto agents
  const vetoAgentId = memberAgentIds.find((id) => getArchetype(id)?.isVetoAgent);
  const nonVetoIds = memberAgentIds.filter((id) => id !== vetoAgentId);

  // Run each non-veto agent
  for (const agentId of nonVetoIds) {
    const archetype = getArchetype(agentId)!;
    const messages = [
      { role: "user" as const, content: `Swarm prompt: ${userPrompt}${memoryContext}` },
    ];
    const { content, attestation } = await chat(messages, archetype.systemPrompt);
    const parsed = parseAgentResponse(content);
    agentRecords.push({
      agentId,
      agentName: archetype.name,
      recommendation: parsed.recommendation,
      attestation,
      dissent: parsed.dissent ?? false,
    });
  }

  // Run veto agent LAST with full context
  if (vetoAgentId !== undefined) {
    const vetoArchetype = getArchetype(vetoAgentId)!;
    const context = agentRecords
      .map((r) => `${r.agentName}: ${r.recommendation}${r.dissent ? " [DISSENT]" : ""}`)
      .join("\n");
    const messages = [
      {
        role: "user" as const,
        content: `Swarm prompt: ${userPrompt}\n\nOther agents' recommendations:\n${context}${memoryContext}`,
      },
    ];
    const { content, attestation } = await chat(messages, vetoArchetype.systemPrompt);
    const parsed = parseAgentResponse(content);
    agentRecords.push({
      agentId: vetoAgentId,
      agentName: vetoArchetype.name,
      recommendation: parsed.recommendation,
      attestation,
      dissent: parsed.dissent ?? false,
      veto: parsed.veto ?? false,
      vetoReason: parsed.vetoReason,
    });
    if (parsed.veto) outcome = "vetoed";
  }

  // Build canonical DeliberationRecord
  const record: DeliberationRecord = {
    swarmId,
    threadId,
    timestamp: new Date().toISOString(),
    prompt: userPrompt,
    agents: agentRecords,
    outcome,
  };

  // Upload record to 0G Storage regardless of outcome (preserves record)
  let root: string;
  try {
    const result = await uploadEncrypted(JSON.stringify(record));
    root = result.root;
  } catch (e) {
    throw new Error(`0G Storage upload failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Normalize root to 32-byte hex (bytes32)
  const normalizedRoot = ethers.zeroPadValue(root.startsWith("0x") ? root : `0x${root}`, 32);
  record.deliberationRoot = normalizedRoot;

  // NOTE: On veto, updateDeliberationRoot is intentionally NOT called on-chain.
  // On approved, the frontend (swarm chat page) calls updateDeliberationRoot via wagmi.
  // onChainTxHash is absent from this return value — the frontend sets it after anchoring.

  // Update KV memory (non-fatal if KV is unavailable)
  try {
    const summary = `[${record.timestamp}] ${userPrompt} → ${outcome.toUpperCase()}`;
    const updated = memory ? `${memory}\n${summary}` : summary;
    await writeMemory(sid, updated);
  } catch {
    // KV failure is non-fatal
  }

  return record;
}
