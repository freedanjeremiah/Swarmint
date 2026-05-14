import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the 0G compute SDK — verifyService returns a VerificationResult with success: false
vi.mock("@0gfoundation/0g-compute-ts-sdk", () => ({
  createZGComputeNetworkBroker: vi.fn().mockResolvedValue({
    inference: {
      getServiceMetadata: vi
        .fn()
        .mockResolvedValue({
          endpoint: "https://mock-provider.example.com",
          model: "Qwen/Qwen2.5-7B-Instruct",
        }),
      getRequestHeaders: vi.fn().mockResolvedValue({
        Authorization: "Bearer mock-token",
      }),
      verifyService: vi
        .fn()
        .mockResolvedValue({ success: false, steps: [] }),
    },
  }),
}));

vi.mock("ethers", () => ({
  ethers: {
    JsonRpcProvider: vi.fn(),
    Wallet: vi.fn().mockReturnValue({}),
  },
}));

describe("broker.chat", () => {
  beforeEach(() => {
    process.env.ZG_RPC_URL = "https://evmrpc-testnet.0g.ai";
    process.env.PRIVATE_KEY = "0x" + "a".repeat(64);
    process.env.ZG_PROVIDER_ADDRESS = "0x" + "b".repeat(40);
    // Clear the singleton between tests so each test gets a fresh broker
    vi.resetModules();
  });

  it("throws when TEE attestation fails", async () => {
    const { chat } = await import("../src/compute/broker.js");
    await expect(
      chat([{ role: "user", content: "hello" }], "You are helpful.")
    ).rejects.toThrow("TEE attestation");
  });
});
