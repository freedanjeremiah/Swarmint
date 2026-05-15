import { expect } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ethers } from "ethers";
import { generateAndWriteWallet } from "../scripts/setup-wallet";

describe("generateAndWriteWallet", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "setup-wallet-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it("writes PRIVATE_KEY to blockend env and ZG_ENCRYPTION_KEY to agent env", () => {
    const blockendEnvPath = path.join(tmpDir, "blockend.env");
    const agentEnvPath = path.join(tmpDir, "agent.env");
    fs.writeFileSync(blockendEnvPath, "PRIVATE_KEY=\n");
    fs.writeFileSync(agentEnvPath, "ZG_ENCRYPTION_KEY=\n");

    const address = generateAndWriteWallet(blockendEnvPath, agentEnvPath);

    expect(address).to.match(/^0x[0-9a-fA-F]{40}$/);

    const bContent = fs.readFileSync(blockendEnvPath, "utf8");
    expect(bContent).to.match(/^PRIVATE_KEY=0x[0-9a-fA-F]{64}$/m);

    const aContent = fs.readFileSync(agentEnvPath, "utf8");
    expect(aContent).to.match(/^ZG_ENCRYPTION_KEY=[0-9a-fA-F]{64}$/m);

    const pkMatch = bContent.match(/^PRIVATE_KEY=(0x[0-9a-fA-F]{64})$/m);
    const writtenKey = pkMatch![1];
    const reconstructed = new ethers.Wallet(writtenKey);
    expect(reconstructed.address).to.equal(address);
  });
});
