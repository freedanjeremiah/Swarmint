import { Router } from "express";
import { runDeliberation } from "../deliberation/pipeline.js";
import type { Request, Response } from "express";

const router = Router();

router.post("/:swarmId/:threadId", async (req: Request, res: Response) => {
  try {
    const swarmId = Array.isArray(req.params.swarmId) ? req.params.swarmId[0] : req.params.swarmId;
    const threadId = Array.isArray(req.params.threadId) ? req.params.threadId[0] : req.params.threadId;
    const { prompt, memberAgentIds, swarmTokenId } = req.body as {
      prompt: string;
      memberAgentIds: number[];
      swarmTokenId: number;
    };

    if (!prompt || !memberAgentIds || !swarmTokenId) {
      res.status(400).json({ error: "prompt, memberAgentIds, and swarmTokenId required" });
      return;
    }

    const record = await runDeliberation({
      swarmId,
      swarmTokenId,
      memberAgentIds,
      threadId,
      userPrompt: prompt,
    });

    res.json(record);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

export default router;
