import crypto from "crypto";
import { MemData, Indexer } from "@0gfoundation/0g-storage-ts-sdk";
import { ethers } from "ethers";

// ---------------------------------------------------------------------------
// Encryption helpers
// ---------------------------------------------------------------------------

function getEncryptionKey(): Buffer {
  const hex = process.env.ZG_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("ZG_ENCRYPTION_KEY must be 32 bytes hex (64 hex chars)");
  }
  return Buffer.from(hex, "hex");
}

/**
 * AES-256-GCM encryption.
 * Layout: [iv (12 bytes)][ciphertext][authTag (16 bytes)]
 * Plaintext never leaves this function unencrypted.
 */
function encrypt(plaintext: string): Buffer {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, encrypted, authTag]);
}

/**
 * Decrypt a buffer produced by `encrypt()`.
 * Layout expected: [iv (12 bytes)][ciphertext][authTag (16 bytes)]
 */
export function decrypt(cipherBuffer: Buffer): string {
  const key = getEncryptionKey();
  const iv = cipherBuffer.subarray(0, 12);
  const authTag = cipherBuffer.subarray(cipherBuffer.length - 16);
  const encrypted = cipherBuffer.subarray(12, cipherBuffer.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted).toString("utf8") + decipher.final("utf8");
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

/**
 * Encrypt `plaintext` with AES-256-GCM then upload to 0G Storage via the
 * Indexer. Returns the Merkle root hash and on-chain transaction hash.
 *
 * Hard invariants:
 *  1. `encrypt()` is called before any SDK call — plaintext never leaves
 *     this function unencrypted.
 *  2. Encryption key is read from `ZG_ENCRYPTION_KEY` (32-byte hex).
 */
export async function uploadEncrypted(
  plaintext: string
): Promise<{ root: string; txHash: string }> {
  // 1. Encrypt FIRST — plaintext never touches the network.
  const cipherBuffer = encrypt(plaintext);

  // 2. Wrap the cipher bytes in a MemData (in-memory AbstractFile).
  const memData = new MemData(cipherBuffer);

  // 3. Build signer from env.
  const rpcUrl = process.env.ZG_RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;
  if (!rpcUrl) throw new Error("ZG_RPC_URL is required");
  if (!privateKey) throw new Error("PRIVATE_KEY is required");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  // 4. Upload via Indexer.
  const indexerUrl =
    process.env.ZG_INDEXER_URL ?? "https://indexer-storage-testnet.0g.ai";
  const indexer = new Indexer(indexerUrl);

  const [result, err] = await indexer.upload(memData, rpcUrl, signer);

  if (err) throw err;

  // The single-root response shape is { txHash, rootHash, txSeq }.
  // The multi-root shape is { txHashes, rootHashes, txSeqs }.
  if ("rootHash" in result && "txHash" in result) {
    return { root: result.rootHash, txHash: result.txHash };
  }

  // Multi-root fallback — use the first entry.
  return {
    root: result.rootHashes[0],
    txHash: result.txHashes[0],
  };
}
