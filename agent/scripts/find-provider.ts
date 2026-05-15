import { createZGComputeNetworkReadOnlyBroker } from "@0gfoundation/0g-compute-ts-sdk";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RPC_URL = "https://evmrpc-testnet.0g.ai";
const CHAIN_ID = 16602;
const ENV_PATH = resolve(__dirname, "../.env");

function setEnvKey(content: string, key: string, value: string): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escapedKey}=.*$`, "m");
  if (regex.test(content)) return content.replace(regex, `${key}=${value}`);
  const sep = content.length === 0 || content.endsWith("\n") ? "" : "\n";
  return `${content}${sep}${key}=${value}\n`;
}

async function main(): Promise<void> {
  console.log("Connecting to 0G Compute network (read-only, no wallet needed)...");
  const broker = await createZGComputeNetworkReadOnlyBroker(RPC_URL, CHAIN_ID);

  console.log("Fetching providers...\n");
  const services = await broker.inference.listServiceWithDetail();

  if (!services || services.length === 0) {
    console.error("No providers found on 0G Galileo. Try again in a few minutes.");
    process.exit(1);
  }

  console.log(`Found ${services.length} provider(s):\n`);
  services.forEach((svc, i) => {
    const status = svc.healthMetrics?.status ?? "unknown";
    const uptime = svc.healthMetrics?.uptime ?? "?";
    const latency = svc.healthMetrics?.avgResponseTime ?? "?";
    const tee = svc.teeSignerAcknowledged ? "TEE✓" : "TEE✗";
    console.log(`  [${i}] ${svc.provider}`);
    console.log(`       status=${status}  uptime=${uptime}%  latency=${latency}ms  ${tee}  model=${svc.model}`);
  });

  const chosen =
    services.find(s => s.teeSignerAcknowledged && s.healthMetrics?.status === "healthy") ??
    services.find(s => s.healthMetrics?.status === "healthy") ??
    services[0];

  const providerAddress = chosen.provider;

  let envContent = "";
  try { envContent = readFileSync(ENV_PATH, "utf8"); } catch { /* ok if missing */ }
  envContent = setEnvKey(envContent, "ZG_PROVIDER_ADDRESS", providerAddress);
  writeFileSync(ENV_PATH, envContent);

  console.log(`\nSelected: ${providerAddress}`);
  console.log(`ZG_PROVIDER_ADDRESS written to agent/.env`);
}

main().catch(err => {
  console.error("Error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
