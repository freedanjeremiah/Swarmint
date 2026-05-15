import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// vi.hoisted ensures mock variables are available inside vi.mock factories,
// which are hoisted to the top of the file by Vitest's transform.
const { mockUpload, mockMemData } = vi.hoisted(() => ({
  mockUpload: vi.fn().mockResolvedValue([
    { txHash: "0xtxhash", rootHash: "0xroot", txSeq: 1 },
    null,
  ]),
  mockMemData: vi.fn().mockImplementation((data: ArrayLike<number>) => ({ data })),
}));

// Mock the 0G storage SDK
vi.mock("@0gfoundation/0g-storage-ts-sdk", () => ({
  MemData: mockMemData,
  Indexer: vi.fn().mockImplementation(() => ({
    upload: mockUpload,
  })),
}));

// Mock ethers so the Wallet/Provider construction doesn't fail
vi.mock("ethers", () => ({
  ethers: {
    JsonRpcProvider: vi.fn().mockReturnValue({}),
    Wallet: vi.fn().mockReturnValue({}),
  },
}));

import { uploadEncrypted, decrypt } from "../src/storage/log.js";

describe("storage/log", () => {
  const TEST_KEY = "a".repeat(64); // 32 bytes of 0xaa

  beforeEach(() => {
    process.env.ZG_ENCRYPTION_KEY = TEST_KEY;
    process.env.ZG_RPC_URL = "https://evmrpc-testnet.0g.ai";
    process.env.ZG_INDEXER_URL = "https://indexer-storage-testnet.0g.ai";
    process.env.PRIVATE_KEY = "0x" + "b".repeat(64);
    mockUpload.mockClear();
    mockMemData.mockClear();
  });

  it("uploadEncrypted returns { root, txHash } (happy path)", async () => {
    const result = await uploadEncrypted("hello world");
    expect(result).toHaveProperty("root");
    expect(result).toHaveProperty("txHash");
    expect(typeof result.root).toBe("string");
    expect(typeof result.txHash).toBe("string");
    expect(result.txHash).toBe("0xtxhash");
    expect(result.root).toBe("0xroot");
  });

  it("buffer passed to SDK does NOT contain the plaintext (encryption invariant)", async () => {
    const plaintext = "super secret deliberation data";
    await uploadEncrypted(plaintext);

    // mockMemData was called once this test; inspect its first argument
    expect(mockMemData).toHaveBeenCalledOnce();

    const callArg: ArrayLike<number> = mockMemData.mock.calls[0][0];
    const buf = Buffer.from(callArg as Uint8Array);
    // The raw UTF-8 bytes of the plaintext must not appear verbatim in the buffer
    const plaintextBytes = Buffer.from(plaintext, "utf8");
    expect(buf.includes(plaintextBytes)).toBe(false);
  });

  it("decrypt recovers the original plaintext (round-trip)", () => {
    const plaintext = "hello world";
    const key = Buffer.from(TEST_KEY, "hex");

    // Manually encrypt using AES-256-GCM
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Build the encrypted buffer: [iv][ciphertext][authTag]
    const cipherBuffer = Buffer.concat([iv, ciphertext, authTag]);

    // Decrypt and verify it matches the original plaintext
    expect(decrypt(cipherBuffer)).toBe(plaintext);
  });
});
