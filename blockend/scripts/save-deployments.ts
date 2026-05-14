import fs from "fs";
import path from "path";

const deployedFile = path.join(
  __dirname,
  "../ignition/deployments/chain-16600/deployed_addresses.json"
);

if (!fs.existsSync(deployedFile)) {
  console.error("Run 'npm run deploy:galileo' first");
  process.exit(1);
}

const deployed = JSON.parse(fs.readFileSync(deployedFile, "utf8")) as Record<string, string>;

const deployments = {
  network: "galileo",
  chainId: 16600,
  AgentINFT: deployed["SwarmintDeploy#AgentINFT"],
  AgentRegistry: deployed["SwarmintDeploy#AgentRegistry"],
  SwarmMetaINFT: deployed["SwarmintDeploy#SwarmMetaINFT"],
};

fs.writeFileSync(
  path.join(__dirname, "../deployments.json"),
  JSON.stringify(deployments, null, 2)
);

console.log("deployments.json written:");
console.log(JSON.stringify(deployments, null, 2));
console.log("\n0G Explorer links:");
console.log(`AgentINFT:     https://chainscan-galileo.0g.ai/address/${deployments.AgentINFT}`);
console.log(`AgentRegistry: https://chainscan-galileo.0g.ai/address/${deployments.AgentRegistry}`);
console.log(`SwarmMetaINFT: https://chainscan-galileo.0g.ai/address/${deployments.SwarmMetaINFT}`);
