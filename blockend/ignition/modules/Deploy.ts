import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SwarmintDeploy", (m) => {
  const agentINFT = m.contract("AgentINFT");
  const agentRegistry = m.contract("AgentRegistry", [agentINFT]);
  const swarmMetaINFT = m.contract("SwarmMetaINFT");
  return { agentINFT, agentRegistry, swarmMetaINFT };
});
