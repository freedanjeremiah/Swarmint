import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted ensures mockVerifyService is available inside the vi.mock factory,
// which is hoisted to the top of the file by Vitest's transform.
const { mockVerifyService } = vi.hoisted(() => ({
  mockVerifyService: vi.fn().mockResolvedValue({ success: false, steps: [] }),
}));

// Mock the 0G compute SDK
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
      verifyService: mockVerifyService,
    },
  }),
}));

vi.mock("ethers", () => ({
  ethers: {
    JsonRpcProvider: vi.fn(),
    Wallet: vi.fn().mockReturnValue({}),
  },
}));

// Import the module once at the top level — no dynamic imports needed.
import { chat } from "../src/compute/broker.js";

describe("broker.chat", () => {
  beforeEach(() => {
    process.env.ZG_RPC_URL = "https://evmrpc-testnet.0g.ai";
    process.env.PRIVATE_KEY = "0x" + "a".repeat(64);
    process.env.ZG_PROVIDER_ADDRESS = "0x" + "b".repeat(40);
    // Reset call history between tests.
    mockVerifyService.mockClear();
  });

  it("throws when TEE attestation fails", async () => {
    // Default mock already returns { success: false }
    mockVerifyService.mockResolvedValueOnce({ success: false, steps: [] });

    await expect(
      chat([{ role: "user", content: "hello" }], "You are helpful.")
    ).rejects.toThrow("TEE attestation");
  });

  it("resolves with content and attestation when TEE attestation passes", async () => {
    // Override verifyService to return a successful result for this test only.
    const verificationResult = { success: true, steps: [] };
    mockVerifyService.mockResolvedValueOnce(verificationResult);

    // Mock global fetch to return a valid OpenAI-compatible completion response.
    const mockFetch = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Hello, I am a helpful assistant." } }],
      }),
    } as Response);

    const result = await chat(
      [{ role: "user", content: "hello" }],
      "You are helpful."
    );

    expect(result).toEqual({
      content: "Hello, I am a helpful assistant.",
      attestation: JSON.stringify(verificationResult),
    });

    mockFetch.mockRestore();
  });
});
