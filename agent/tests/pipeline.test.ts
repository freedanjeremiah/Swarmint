import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted ensures mock variables are available inside vi.mock factories,
// which are hoisted to the top of the file by Vitest's transform.
const { mockChat, mockUploadEncrypted, mockReadMemory, mockWriteMemory, mockContract, mockWallet, mockProvider } =
  vi.hoisted(() => ({
    mockChat: vi.fn(),
    mockUploadEncrypted: vi.fn().mockResolvedValue({ root: "0xdeadbeef", txHash: "0xlogtx" }),
    mockReadMemory: vi.fn().mockResolvedValue(null),
    mockWriteMemory: vi.fn().mockResolvedValue(undefined),
    mockContract: {
      updateDeliberationRoot: vi.fn().mockResolvedValue({ hash: "0xontx" }),
    },
    mockWallet: vi.fn(),
    mockProvider: vi.fn(),
  }));

vi.mock("../src/compute/broker.js", () => ({
  chat: mockChat,
}));

vi.mock("../src/storage/log.js", () => ({
  uploadEncrypted: mockUploadEncrypted,
}));

vi.mock("../src/storage/kv.js", () => ({
  swarmStreamId: vi.fn().mockReturnValue("0xstreamid"),
  readMemory: mockReadMemory,
  writeMemory: mockWriteMemory,
}));

vi.mock("ethers", () => ({
  ethers: {
    JsonRpcProvider: mockProvider,
    Wallet: mockWallet,
    Contract: vi.fn().mockImplementation(() => mockContract),
  },
}));

import { runDeliberation } from "../src/deliberation/pipeline.js";

describe("runDeliberation", () => {
  beforeEach(() => {
    process.env.ZG_RPC_URL = "https://evmrpc-testnet.0g.ai";
    process.env.PRIVATE_KEY = "0x" + "a".repeat(64);
    process.env.SWARM_META_INFT_ADDRESS = "0x" + "c".repeat(40);
    mockChat.mockReset();
    mockUploadEncrypted.mockResolvedValue({ root: "0xdeadbeef", txHash: "0xlogtx" });
    mockReadMemory.mockResolvedValue(null);
    mockWriteMemory.mockResolvedValue(undefined);
    mockContract.updateDeliberationRoot.mockResolvedValue({ hash: "0xontx" });
  });

  it("returns outcome: approved with 3 agent records when all agents approve", async () => {
    // Non-veto agents: 1 (Accountant), 2 (Advisor) — then veto agent 4 (Risk Manager)
    // chat is called 3 times total: agents 1, 2, then 4
    mockChat
      .mockResolvedValueOnce({
        content: JSON.stringify({ recommendation: "Looks good", dissent: false }),
        attestation: "attest-1",
      })
      .mockResolvedValueOnce({
        content: JSON.stringify({ recommendation: "Buy ETH", dissent: false }),
        attestation: "attest-2",
      })
      .mockResolvedValueOnce({
        content: JSON.stringify({ recommendation: "Risk acceptable", dissent: false, veto: false }),
        attestation: "attest-4",
      });

    const result = await runDeliberation({
      swarmId: "swarm-test-1",
      swarmTokenId: 1,
      memberAgentIds: [1, 2, 4],
      threadId: "thread-abc",
      userPrompt: "Should we buy ETH?",
    });

    expect(result.outcome).toBe("approved");
    expect(result.agents).toHaveLength(3);
    expect(result.deliberationRoot).toBe("0xdeadbeef");
    expect(result.onChainTxHash).toBe("0xontx");

    // Risk Manager (id=4) should be the last agent record
    const riskRecord = result.agents.find((a) => a.agentId === 4);
    expect(riskRecord).toBeDefined();
    expect(riskRecord?.veto).toBe(false);
  });

  it("returns outcome: vetoed with veto: true on Risk Manager record when it vetoes", async () => {
    // Non-veto agents: 1 (Accountant), 2 (Advisor)
    mockChat
      .mockResolvedValueOnce({
        content: JSON.stringify({ recommendation: "Seems fine", dissent: false }),
        attestation: "attest-1",
      })
      .mockResolvedValueOnce({
        content: JSON.stringify({ recommendation: "Aggressive but OK", dissent: false }),
        attestation: "attest-2",
      })
      .mockResolvedValueOnce({
        content: JSON.stringify({
          recommendation: "VETO: concentration risk too high",
          dissent: true,
          veto: true,
          vetoReason: "Proposed action would expose more than 20% of portfolio to a single position",
        }),
        attestation: "attest-4",
      });

    const result = await runDeliberation({
      swarmId: "swarm-test-2",
      swarmTokenId: 2,
      memberAgentIds: [1, 2, 4],
      threadId: "thread-def",
      userPrompt: "Put 50% of portfolio into a single token?",
    });

    expect(result.outcome).toBe("vetoed");

    const riskRecord = result.agents.find((a) => a.agentId === 4);
    expect(riskRecord).toBeDefined();
    expect(riskRecord?.veto).toBe(true);
    expect(riskRecord?.vetoReason).toBe(
      "Proposed action would expose more than 20% of portfolio to a single position"
    );
    expect(result.deliberationRoot).toBe("0xdeadbeef");
    expect(result.onChainTxHash).toBe("0xontx");
  });
});
