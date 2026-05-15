import { ethers } from "ethers";
import * as crypto from "crypto";
import * as path from "path";
import { updateEnvFile } from "./env-utils";

export function generateAndWriteWallet(blockendEnvPath: string, agentEnvPath: string): string {
  const wallet = ethers.Wallet.createRandom();
  const encryptionKey = crypto.randomBytes(32).toString("hex");
  updateEnvFile(blockendEnvPath, { PRIVATE_KEY: wallet.privateKey });
  updateEnvFile(agentEnvPath, { ZG_ENCRYPTION_KEY: encryptionKey });
  return wallet.address;
}

if (require.main === module) {
  const base = path.join(__dirname, "..");
  const address = generateAndWriteWallet(
    path.join(base, ".env"),
    path.join(base, "../agent/.env")
  );
  console.log("\n=== Swarmint Deployer Wallet Generated ===");
  console.log(`\nAddress: ${address}`);
  console.log("\nFund this address on 0G Galileo Testnet before deploying.");
  console.log("\nOnce funded, run:");
  console.log("  npm run deploy:galileo && npm run wire");
  console.log("\nKeys written:");
  console.log("  blockend/.env   -> PRIVATE_KEY");
  console.log("  agent/.env      -> ZG_ENCRYPTION_KEY");
}
