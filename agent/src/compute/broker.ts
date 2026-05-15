/**
 * 0G Compute broker wrapper with TEE attestation enforcement.
 *
 * Hard invariants:
 * 1. Broker is a lazy singleton — initialized once from env vars.
 * 2. Every chat() call verifies TEE attestation via verifyService().
 *    If attestation fails or cannot be verified, we throw with a message
 *    containing "TEE attestation". Never return unverified inference.
 */

import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0gfoundation/0g-compute-ts-sdk";
import type { AgentMessage, AgentResponse } from "../types.js";

// The broker is typed as the resolved value of createZGComputeNetworkBroker.
// We use a loose type here to avoid importing the SDK class directly.
type ZGBroker = Awaited<ReturnType<typeof createZGComputeNetworkBroker>>;

let _broker: ZGBroker | null = null;

async function getBroker(): Promise<ZGBroker> {
  if (_broker) return _broker;

  const rpcUrl = process.env.ZG_RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;

  if (!rpcUrl) throw new Error("ZG_RPC_URL env var is required");
  if (!privateKey) throw new Error("PRIVATE_KEY env var is required");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  _broker = await createZGComputeNetworkBroker(signer);
  return _broker;
}

/**
 * Send a chat request to the 0G Compute provider.
 *
 * TEE attestation is verified on every call. If attestation fails or cannot
 * be confirmed, this function throws an error containing "TEE attestation".
 *
 * @param messages  - Conversation messages (role + content).
 * @param systemPrompt - System-level instruction for the model.
 * @returns AgentResponse with content and attestation string.
 */
export async function chat(
  messages: AgentMessage[],
  systemPrompt: string
): Promise<AgentResponse> {
  // Fail fast — check required env vars before making any RPC call.
  const providerAddress = process.env.ZG_PROVIDER_ADDRESS;
  if (!providerAddress) throw new Error("ZG_PROVIDER_ADDRESS env var is required");

  const broker = await getBroker();

  // ----- Step 1: verify TEE attestation (fail-closed) -----
  let attestationString = "";
  try {
    const verificationResult = await broker.inference.verifyService(providerAddress);
    if (!verificationResult || !verificationResult.success) {
      throw new Error("TEE attestation verification failed: service is not verified");
    }
    // Serialize the verification result as the attestation evidence.
    attestationString = JSON.stringify(verificationResult);
  } catch (err: unknown) {
    // Re-throw if it already contains our sentinel phrase.
    if (err instanceof Error && err.message.includes("TEE attestation")) {
      throw err;
    }
    // Wrap any other error (network failure, unexpected response, etc.)
    throw new Error(
      `TEE attestation could not be verified: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // ----- Step 2: get service metadata + request headers -----
  const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
  const headers = await broker.inference.getRequestHeaders(providerAddress);

  // ----- Step 3: call the OpenAI-compatible endpoint -----
  const allMessages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const response = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(headers as unknown as Record<string, string>),
    },
    body: JSON.stringify({ model, messages: allMessages }),
  });

  if (!response.ok) {
    throw new Error(
      `0G Compute request failed: ${response.status} ${response.statusText}`
    );
  }

  const completion = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = completion.choices?.[0]?.message?.content ?? "";

  return { content, attestation: attestationString };
}
