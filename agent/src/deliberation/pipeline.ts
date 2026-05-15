import { ethers } from "ethers";
import { chat } from "../compute/broker.js";
import { uploadEncrypted } from "../storage/log.js";
import { swarmStreamId, readMemory, writeMemory } from "../storage/kv.js";
import { getArchetype } from "../agents/index.js";
import type { AgentRecord, DeliberationRecord } from "../types.js";

const SWARM_META_ABI = [
  "function updateDeliberationRoot(uint256 swarmTokenId, bytes32 newRoot) external",
];

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
  const { swarmId, swarmTokenId, memberAgentIds, threadId, userPrompt } = input;

  // Step 1: Load per-swarm KV memory and inject as context
  const sid = swarmStreamId(swarmId);
  const memory = await readMemory(sid);
  const memoryContext = memory ? `\n\nSwarm memory (prior decisions):\n${memory}` : "";

  const agentRecords: AgentRecord[] = [];
  let outcome: "approved" | "vetoed" = "approved";

  // Step 2: Separate veto agent from non-veto agents
  const vetoAgentId = memberAgentIds.find((id) => getArchetype(id)?.isVetoAgent);
  const nonVetoIds = memberAgentIds.filter((id) => id !== vetoAgentId);

  // Step 3: Run each non-veto agent via compute/broker chat(), collect AgentRecord
  for (const agentId of nonVetoIds) {
    const archetype = getArchetype(agentId);
    if (!archetype) continue;
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

  // Step 4: Run veto agent LAST with full context of all other recommendations
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

    // Step 5: If veto agent returns veto: true — set outcome = "vetoed"
    if (parsed.veto) outcome = "vetoed";
  }

  // Step 6: Build canonical DeliberationRecord
  const record: DeliberationRecord = {
    swarmId,
    threadId,
    timestamp: new Date().toISOString(),
    prompt: userPrompt,
    agents: agentRecords,
    outcome,
  };

  // Step 7: Upload record JSON to 0G Storage Log via uploadEncrypted() — get root
  let root: string;
  try {
    const result = await uploadEncrypted(JSON.stringify(record));
    root = result.root;
  } catch (e) {
    throw new Error(`0G Storage upload failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  record.deliberationRoot = root;

  // Step 8: Call SwarmMetaINFT.updateDeliberationRoot on-chain via ethers
  const provider = new ethers.JsonRpcProvider(process.env.ZG_RPC_URL!);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const contract = new ethers.Contract(
    process.env.SWARM_META_INFT_ADDRESS!,
    SWARM_META_ABI,
    signer,
  );
  try {
    const tx = await contract.updateDeliberationRoot(swarmTokenId, root);
    record.onChainTxHash = tx.hash;
  } catch (e) {
    throw new Error(`On-chain deliberation root update failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Step 9: Update KV memory with decision summary
  const summary = `[${record.timestamp}] ${userPrompt} → ${outcome.toUpperCase()}`;
  const updated = memory ? `${memory}\n${summary}` : summary;
  await writeMemory(sid, updated);

  // Step 10: Return full DeliberationRecord
  return record;
}
