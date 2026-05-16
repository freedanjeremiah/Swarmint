import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AGENT_INFT_ADDRESS = "0x669545CFbb78C79be84D3B8344e3287FADc49983";

export default buildModule("AgentRegistryOnly", (m) => {
  const agentRegistry = m.contract("AgentRegistry", [AGENT_INFT_ADDRESS]);
  return { agentRegistry };
});
