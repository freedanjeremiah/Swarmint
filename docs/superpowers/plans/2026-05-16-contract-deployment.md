# Contract Deployment & Env Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a deployer wallet, deploy the three Swarmint contracts to 0G Galileo testnet, and automatically propagate deployed addresses into `agent/.env` and `web/.env.local`.

**Architecture:** Two phases — Phase 1 generates a fresh EOA wallet and AES encryption key, writing them into the relevant env files and printing the address to fund. Phase 2 (after funding) runs Hardhat Ignition deploy then a wire script that reads `deployed_addresses.json` and updates both downstream env files in-place. A shared `env-utils.ts` helper handles all env-file key replacement, tested independently.

**Tech Stack:** TypeScript, ts-node, ethers v6 (via hardhat-toolbox), Node.js built-ins (`crypto`, `fs`, `path`, `os`), Mocha + Chai (via hardhat-toolbox), Hardhat Ignition.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `blockend/scripts/env-utils.ts` | `setEnvKey` (string) + `updateEnvFile` (file I/O) helpers |
| Create | `blockend/scripts/setup-wallet.ts` | Phase 1: generate wallet + AES key, write to env files |
| Create | `blockend/scripts/wire-env.ts` | Phase 2: read deployed addresses, write deployments.json + update env files |
| Create | `blockend/test/env-utils.test.ts` | Tests for `setEnvKey` and `updateEnvFile` |
| Create | `blockend/test/setup-wallet.test.ts` | Tests for `generateAndWriteWallet` |
| Create | `blockend/test/wire-env.test.ts` | Tests for `wireEnvFiles` |
| Modify | `blockend/package.json` | Add `setup` and `wire` scripts; remove `save-deployments` |
| Delete | `blockend/scripts/save-deployments.ts` | Superseded by `wire-env.ts` |

---

## Task 1: Shared `env-utils.ts` + Tests

**Files:**
- Create: `blockend/scripts/env-utils.ts`
- Create: `blockend/test/env-utils.test.ts`

- [ ] **Step 1: Write the failing test**

Create `blockend/test/env-utils.test.ts`:

```typescript
import { expect } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { setEnvKey, updateEnvFile } from "../scripts/env-utils";

describe("setEnvKey", () => {
  it("replaces an existing key value", () => {
    const result = setEnvKey("FOO=old\nBAR=keep\n", "FOO", "new");
    expect(result).to.equal("FOO=new\nBAR=keep\n");
  });

  it("appends a new key when not present", () => {
    const result = setEnvKey("FOO=old\n", "BAR", "new");
    expect(result).to.include("FOO=old");
    expect(result).to.include("BAR=new");
  });

  it("replaces an empty value", () => {
    const result = setEnvKey("FOO=\nBAR=keep\n", "FOO", "filled");
    expect(result).to.equal("FOO=filled\nBAR=keep\n");
  });

  it("does not match a key that has the target as a prefix", () => {
    const result = setEnvKey("PRIVATE_KEY_EXTRA=keep\nPRIVATE_KEY=old\n", "PRIVATE_KEY", "new");
    expect(result).to.include("PRIVATE_KEY_EXTRA=keep");
    expect(result).to.include("PRIVATE_KEY=new");
    expect(result).not.to.include("PRIVATE_KEY=old");
  });
});

describe("updateEnvFile", () => {
  let tmpDir: string;
  let tmpFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "env-utils-test-"));
    tmpFile = path.join(tmpDir, ".env");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it("writes multiple key updates to a file", () => {
    fs.writeFileSync(tmpFile, "A=old\nB=old\n");
    updateEnvFile(tmpFile, { A: "new_a", B: "new_b" });
    const result = fs.readFileSync(tmpFile, "utf8");
    expect(result).to.equal("A=new_a\nB=new_b\n");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
cd blockend
npx hardhat test test/env-utils.test.ts
```

Expected: FAIL — `Cannot find module '../scripts/env-utils'`

- [ ] **Step 3: Implement `env-utils.ts`**

Create `blockend/scripts/env-utils.ts`:

```typescript
import * as fs from "fs";

export function setEnvKey(content: string, key: string, value: string): string {
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`);
  }
  const sep = content.endsWith("\n") ? "" : "\n";
  return `${content}${sep}${key}=${value}\n`;
}

export function updateEnvFile(filePath: string, updates: Record<string, string>): void {
  let content = fs.readFileSync(filePath, "utf8");
  for (const [key, value] of Object.entries(updates)) {
    content = setEnvKey(content, key, value);
  }
  fs.writeFileSync(filePath, content);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx hardhat test test/env-utils.test.ts
```

Expected:
```
  setEnvKey
    ✓ replaces an existing key value
    ✓ appends a new key when not present
    ✓ replaces an empty value
    ✓ does not match a key that has the target as a prefix

  updateEnvFile
    ✓ writes multiple key updates to a file

  5 passing
```

- [ ] **Step 5: Commit**

```bash
git add blockend/scripts/env-utils.ts blockend/test/env-utils.test.ts
git commit -m "feat(blockend): add setEnvKey / updateEnvFile helpers with tests"
```

---

## Task 2: `setup-wallet.ts` + Tests + `npm run setup`

**Files:**
- Create: `blockend/scripts/setup-wallet.ts`
- Create: `blockend/test/setup-wallet.test.ts`
- Modify: `blockend/package.json`

- [ ] **Step 1: Write the failing test**

Create `blockend/test/setup-wallet.test.ts`:

```typescript
import { expect } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
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
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npx hardhat test test/setup-wallet.test.ts
```

Expected: FAIL — `Cannot find module '../scripts/setup-wallet'`

- [ ] **Step 3: Implement `setup-wallet.ts`**

Create `blockend/scripts/setup-wallet.ts`:

```typescript
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
  console.log("  blockend/.env   → PRIVATE_KEY");
  console.log("  agent/.env      → ZG_ENCRYPTION_KEY");
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx hardhat test test/setup-wallet.test.ts
```

Expected:
```
  generateAndWriteWallet
    ✓ writes PRIVATE_KEY to blockend env and ZG_ENCRYPTION_KEY to agent env

  1 passing
```

- [ ] **Step 5: Add `setup` script to `blockend/package.json`**

In `blockend/package.json`, update the `"scripts"` section:

```json
"scripts": {
  "compile": "hardhat compile",
  "test": "hardhat test",
  "setup": "ts-node scripts/setup-wallet.ts",
  "deploy:galileo": "hardhat ignition deploy ignition/modules/Deploy.ts --network galileo",
  "save-deployments": "ts-node scripts/save-deployments.ts",
  "wire": "ts-node scripts/wire-env.ts"
},
```

(Leave `save-deployments` in for now; it will be removed in Task 3.)

- [ ] **Step 6: Smoke-test the setup command**

```
npm run setup
```

Expected output (addresses will differ each run):
```
=== Swarmint Deployer Wallet Generated ===

Address: 0x<40 hex chars>

Fund this address on 0G Galileo Testnet before deploying.

Once funded, run:
  npm run deploy:galileo && npm run wire

Keys written:
  blockend/.env   → PRIVATE_KEY
  agent/.env      → ZG_ENCRYPTION_KEY
```

Verify `blockend/.env` now contains `PRIVATE_KEY=0x<64 hex chars>` and `agent/.env` contains `ZG_ENCRYPTION_KEY=<64 hex chars>`.

- [ ] **Step 7: Commit**

```bash
git add blockend/scripts/setup-wallet.ts blockend/test/setup-wallet.test.ts blockend/package.json
git commit -m "feat(blockend): add setup-wallet script and npm run setup"
```

---

## Task 3: `wire-env.ts` + Tests + Cleanup

**Files:**
- Create: `blockend/scripts/wire-env.ts`
- Create: `blockend/test/wire-env.test.ts`
- Modify: `blockend/package.json`
- Delete: `blockend/scripts/save-deployments.ts`

- [ ] **Step 1: Write the failing tests**

Create `blockend/test/wire-env.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```
npx hardhat test test/wire-env.test.ts
```

Expected: FAIL — `Cannot find module '../scripts/wire-env'`

- [ ] **Step 3: Implement `wire-env.ts`**

Create `blockend/scripts/wire-env.ts`:

```typescript
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

  // Write deployments.json
  fs.writeFileSync(
    deploymentsOutputPath,
    JSON.stringify({ network: "galileo", chainId: 16600, AgentINFT: agentINFT, AgentRegistry: agentRegistry, SwarmMetaINFT: swarmMetaINFT }, null, 2)
  );

  // Read PRIVATE_KEY from blockend/.env
  const blockendContent = fs.readFileSync(blockendEnvPath, "utf8");
  const pkMatch = blockendContent.match(/^PRIVATE_KEY=(.+)$/m);
  const privateKey = pkMatch ? pkMatch[1].trim() : "";

  // Update agent/.env
  updateEnvFile(agentEnvPath, {
    PRIVATE_KEY: privateKey,
    AGENT_INFT_ADDRESS: agentINFT,
    AGENT_REGISTRY_ADDRESS: agentRegistry,
    SWARM_META_INFT_ADDRESS: swarmMetaINFT,
  });

  // Update web/.env.local
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
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx hardhat test test/wire-env.test.ts
```

Expected:
```
  wireEnvFiles
    ✓ writes contract addresses and PRIVATE_KEY to agent/.env
    ✓ writes contract addresses to web/.env.local
    ✓ writes deployments.json with correct structure
    ✓ throws when deployed_addresses.json is missing

  4 passing
```

- [ ] **Step 5: Run full test suite to confirm no regressions**

```
npx hardhat test
```

Expected: All tests pass (3 existing contract tests + 6 new script tests = 9 passing).

- [ ] **Step 6: Update `blockend/package.json` — add `wire`, remove `save-deployments`**

Replace the `"scripts"` section in `blockend/package.json` with:

```json
"scripts": {
  "compile": "hardhat compile",
  "test": "hardhat test",
  "setup": "ts-node scripts/setup-wallet.ts",
  "deploy:galileo": "hardhat ignition deploy ignition/modules/Deploy.ts --network galileo",
  "wire": "ts-node scripts/wire-env.ts"
},
```

- [ ] **Step 7: Delete `save-deployments.ts`**

```bash
git rm blockend/scripts/save-deployments.ts
```

- [ ] **Step 8: Commit**

```bash
git add blockend/scripts/wire-env.ts blockend/test/wire-env.test.ts blockend/package.json
git commit -m "feat(blockend): add wire-env script; replace save-deployments"
```

---

## Deployment Runbook (not a task — reference only)

After all tasks are complete, the full deployment flow is:

```bash
# From blockend/
npm run setup
# → prints 0x<address>. Fund it on https://faucet.0g.ai or similar.

npm run deploy:galileo
# → deploys all 3 contracts via Hardhat Ignition

npm run wire
# → writes blockend/deployments.json, agent/.env, web/.env.local
```

After `npm run wire` completes, all address env vars are filled. Start the agent and web servers normally.
