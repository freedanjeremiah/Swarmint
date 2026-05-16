import { createZGComputeNetworkBroker } from "@0gfoundation/0g-compute-ts-sdk";
import { ethers } from "ethers";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env preserving full values (handles 0x hex strings correctly)
const envLines = readFileSync(resolve(__dirname, ".env"), "utf8").split(/\r?\n/);
const env = {};
for (const line of envLines) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const idx = t.indexOf("=");
  if (idx < 0) continue;
  env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
}

const rpcUrl = env.ZG_RPC_URL ?? "https://evmrpc-testnet.0g.ai";
const privateKey = env.PRIVATE_KEY;
const providerAddress = env.ZG_PROVIDER_ADDRESS;

console.log("RPC:", rpcUrl);
console.log("Provider:", providerAddress);

const provider = new ethers.JsonRpcProvider(rpcUrl);
const signer = new ethers.Wallet(privateKey, provider);
console.log("Wallet:", signer.address);

const broker = await createZGComputeNetworkBroker(signer);

// Check existing ledger
try {
  const info = await broker.ledger.getLedger();
  console.log("\nExisting ledger:", JSON.stringify(info, null, 2));
} catch(e) {
  console.log("\nNo ledger found:", e.message);
}

// Add ledger — minimum 3 OG required to create the sub-account
console.log("\nDepositing 3 OG to compute ledger (minimum required)...");
try {
  const result = await broker.ledger.addLedger(3);
  console.log("addLedger result:", result);
} catch(e) {
  console.log("addLedger error:", e.message);
}
