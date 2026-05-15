import * as fs from "fs";
import * as path from "path";
import { updateEnvFile } from "./env-utils";

export function wireEnvFiles(
  deployedAddressesPath: string,
  blockendEnvPath: string,
  agentEnvPath: string,
  webEnvPath: string,
  deploymentsOutputPath: string
): void {
  if (!fs.existsSync(deployedAddressesPath)) {
    throw new Error(
      `deployed_addresses.json not found at ${deployedAddressesPath}. Run 'npm run deploy:galileo' first.`
    );
  }

  const deployed = JSON.parse(
    fs.readFileSync(deployedAddressesPath, "utf8")
  ) as Record<string, string>;

  const agentINFT = deployed["SwarmintDeploy#AgentINFT"];
  const agentRegistry = deployed["SwarmintDeploy#AgentRegistry"];
  const swarmMetaINFT = deployed["SwarmintDeploy#SwarmMetaINFT"];

  for (const [name, addr] of [
    ["SwarmintDeploy#AgentINFT", agentINFT],
    ["SwarmintDeploy#AgentRegistry", agentRegistry],
    ["SwarmintDeploy#SwarmMetaINFT", swarmMetaINFT],
  ] as [string, string][]) {
    if (!addr) throw new Error(`Missing key "${name}" in deployed_addresses.json`);
  }

  fs.mkdirSync(path.dirname(deploymentsOutputPath), { recursive: true });
  fs.writeFileSync(
    deploymentsOutputPath,
    JSON.stringify(
      { network: "galileo", chainId: 16600, AgentINFT: agentINFT, AgentRegistry: agentRegistry, SwarmMetaINFT: swarmMetaINFT },
      null, 2
    )
  );

  if (!fs.existsSync(blockendEnvPath)) {
    throw new Error(`blockend/.env not found at ${blockendEnvPath}. Run 'npm run setup' first.`);
  }

  const blockendContent = fs.readFileSync(blockendEnvPath, "utf8");
  const pkMatch = blockendContent.match(/^PRIVATE_KEY=(.+)$/m);
  const privateKey = pkMatch ? pkMatch[1].trim() : "";
  if (!privateKey) {
    throw new Error("PRIVATE_KEY not found or empty in blockend/.env. Run 'npm run setup' first.");
  }

  updateEnvFile(agentEnvPath, {
    PRIVATE_KEY: privateKey,
    AGENT_INFT_ADDRESS: agentINFT,
    AGENT_REGISTRY_ADDRESS: agentRegistry,
    SWARM_META_INFT_ADDRESS: swarmMetaINFT,
  });

  updateEnvFile(webEnvPath, {
    NEXT_PUBLIC_AGENT_NFT_CONTRACT_ADDRESS: agentINFT,
    NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT_ADDRESS: agentRegistry,
    NEXT_PUBLIC_SWARM_CONTRACT_ADDRESS: swarmMetaINFT,
    NEXT_PUBLIC_META_SWARM_CONTRACT_ADDRESS: swarmMetaINFT,
  });

  console.log("\n=== Deployment Addresses Written ===");
  console.log(`AgentINFT:     ${agentINFT}`);
  console.log(`AgentRegistry: ${agentRegistry}`);
  console.log(`SwarmMetaINFT: ${swarmMetaINFT}`);
  console.log("\n0G Explorer links:");
  console.log(`  AgentINFT:     https://chainscan-galileo.0g.ai/address/${agentINFT}`);
  console.log(`  AgentRegistry: https://chainscan-galileo.0g.ai/address/${agentRegistry}`);
  console.log(`  SwarmMetaINFT: https://chainscan-galileo.0g.ai/address/${swarmMetaINFT}`);
  console.log("\nEnv files updated:");
  console.log("  agent/.env");
  console.log("  web/.env.local");
  console.log("  blockend/deployments.json");
}

if (require.main === module) {
  const base = path.join(__dirname, "..");
  wireEnvFiles(
    path.join(base, "ignition/deployments/chain-16600/deployed_addresses.json"),
    path.join(base, ".env"),
    path.join(base, "../agent/.env"),
    path.join(base, "../web/.env.local"),
    path.join(base, "deployments.json")
  );
}
