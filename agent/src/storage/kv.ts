import { ethers } from "ethers";

export function agentStreamId(agentId: number): string {
  return ethers.keccak256(ethers.toUtf8Bytes(`swarmint:agent:${agentId}`));
}

export function swarmStreamId(swarmId: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(`swarmint:swarm:${swarmId}`));
}

const KV_KEY = "memory";

export async function readMemory(streamId: string): Promise<string | null> {
  const base = process.env.ZG_KV_URL!.replace(/\/$/, "");
  try {
    const res = await fetch(
      `${base}/v1/value?stream_id=${streamId}&key=${encodeURIComponent(KV_KEY)}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: string };
    if (!data.data) return null;
    return Buffer.from(data.data, "base64").toString("utf8");
  } catch {
    return null;
  }
}

export async function writeMemory(streamId: string, value: string): Promise<void> {
  const base = process.env.ZG_KV_URL!.replace(/\/$/, "");
  const body = {
    stream_id: streamId,
    key: KV_KEY,
    data: Buffer.from(value).toString("base64"),
  };
  const res = await fetch(`${base}/v1/value`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`KV write failed: ${res.status} ${await res.text()}`);
  }
}
