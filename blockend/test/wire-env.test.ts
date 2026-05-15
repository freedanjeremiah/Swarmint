import { expect } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { wireEnvFiles } from "../scripts/wire-env";

describe("wireEnvFiles", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wire-env-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  function setup() {
    const deployedPath = path.join(tmpDir, "deployed_addresses.json");
    const blockendEnvPath = path.join(tmpDir, "blockend.env");
    const agentEnvPath = path.join(tmpDir, "agent.env");
    const webEnvPath = path.join(tmpDir, "web.env");
    const deploymentsOut = path.join(tmpDir, "deployments.json");

    fs.writeFileSync(deployedPath, JSON.stringify({
      "SwarmintDeploy#AgentINFT": "0xAAAA",
      "SwarmintDeploy#AgentRegistry": "0xBBBB",
      "SwarmintDeploy#SwarmMetaINFT": "0xCCCC",
    }));
    fs.writeFileSync(blockendEnvPath, "PRIVATE_KEY=0xDEAD\n");
    fs.writeFileSync(agentEnvPath,
      "PRIVATE_KEY=\nAGENT_INFT_ADDRESS=\nAGENT_REGISTRY_ADDRESS=\nSWARM_META_INFT_ADDRESS=\n"
    );
    fs.writeFileSync(webEnvPath,
      "NEXT_PUBLIC_AGENT_NFT_CONTRACT_ADDRESS=\n" +
      "NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT_ADDRESS=\n" +
      "NEXT_PUBLIC_SWARM_CONTRACT_ADDRESS=\n" +
      "NEXT_PUBLIC_META_SWARM_CONTRACT_ADDRESS=\n"
    );

    return { deployedPath, blockendEnvPath, agentEnvPath, webEnvPath, deploymentsOut };
  }

  it("writes contract addresses and PRIVATE_KEY to agent/.env", () => {
    const p = setup();
    wireEnvFiles(p.deployedPath, p.blockendEnvPath, p.agentEnvPath, p.webEnvPath, p.deploymentsOut);
    const content = fs.readFileSync(p.agentEnvPath, "utf8");
    expect(content).to.include("AGENT_INFT_ADDRESS=0xAAAA");
    expect(content).to.include("AGENT_REGISTRY_ADDRESS=0xBBBB");
    expect(content).to.include("SWARM_META_INFT_ADDRESS=0xCCCC");
    expect(content).to.include("PRIVATE_KEY=0xDEAD");
  });

  it("writes contract addresses to web/.env.local", () => {
    const p = setup();
    wireEnvFiles(p.deployedPath, p.blockendEnvPath, p.agentEnvPath, p.webEnvPath, p.deploymentsOut);
    const content = fs.readFileSync(p.webEnvPath, "utf8");
    expect(content).to.include("NEXT_PUBLIC_AGENT_NFT_CONTRACT_ADDRESS=0xAAAA");
    expect(content).to.include("NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT_ADDRESS=0xBBBB");
    expect(content).to.include("NEXT_PUBLIC_SWARM_CONTRACT_ADDRESS=0xCCCC");
    expect(content).to.include("NEXT_PUBLIC_META_SWARM_CONTRACT_ADDRESS=0xCCCC");
  });

  it("writes deployments.json with correct structure", () => {
    const p = setup();
    wireEnvFiles(p.deployedPath, p.blockendEnvPath, p.agentEnvPath, p.webEnvPath, p.deploymentsOut);
    const d = JSON.parse(fs.readFileSync(p.deploymentsOut, "utf8"));
    expect(d.AgentINFT).to.equal("0xAAAA");
    expect(d.AgentRegistry).to.equal("0xBBBB");
    expect(d.SwarmMetaINFT).to.equal("0xCCCC");
    expect(d.chainId).to.equal(16600);
    expect(d.network).to.equal("galileo");
  });

  it("throws when deployed_addresses.json is missing", () => {
    const p = setup();
    expect(() =>
      wireEnvFiles(
        path.join(tmpDir, "missing.json"),
        p.blockendEnvPath, p.agentEnvPath, p.webEnvPath, p.deploymentsOut
      )
    ).to.throw("Run 'npm run deploy:galileo' first");
  });
});
