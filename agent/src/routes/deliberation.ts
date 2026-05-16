import { Router } from "express";
import { download } from "../storage/log.js";
import type { Request, Response } from "express";

const router = Router();

router.get("/:root", async (req: Request, res: Response) => {
  const root = Array.isArray(req.params.root) ? req.params.root[0] : req.params.root;
  if (!root || !/^0x[0-9a-fA-F]{64}$/.test(root)) {
    res.status(400).json({ error: "Invalid root: must be 0x-prefixed 32-byte hex" });
    return;
  }
  try {
    const plaintext = await download(root);
    const record = JSON.parse(plaintext);
    res.json(record);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("not found") || msg.includes("404")) {
      res.status(404).json({ error: "Record not found in 0G Storage" });
    } else {
      res.status(500).json({ error: msg });
    }
  }
});

export default router;
