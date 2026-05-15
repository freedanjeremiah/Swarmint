import { Router } from "express";
import { ARCHETYPES } from "../agents/index.js";
import { uploadEncrypted } from "../storage/log.js";
import { agentStreamId } from "../storage/kv.js";
import type { Request, Response } from "express";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const list = ARCHETYPES.map((a) => ({
    id: a.id,
    name: a.name,
    isVetoAgent: a.isVetoAgent,
  }));
  res.json(list);
});

router.post("/:agentId/prepare-mint", async (req: Request, res: Response) => {
  try {
    const agentId = Number(req.params.agentId);
    const archetype = ARCHETYPES.find((a) => a.id === agentId);
    if (!archetype) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }

    const blob = JSON.stringify({
      id: archetype.id,
      name: archetype.name,
      systemPrompt: archetype.systemPrompt,
      streamId: agentStreamId(agentId),
      mintedAt: new Date().toISOString(),
    });

    const { root, txHash } = await uploadEncrypted(blob);
    res.json({ root, storageTxHash: txHash, agentId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

export default router;
