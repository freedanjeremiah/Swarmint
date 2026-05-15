import { Router } from "express";
import { chat } from "../compute/broker.js";
import { getArchetype } from "../agents/index.js";
import type { Request, Response } from "express";

const router = Router();

router.post("/:agentId/:threadId", async (req: Request, res: Response) => {
  try {
    const agentId = Number(req.params.agentId);
    const archetype = getArchetype(agentId);
    if (!archetype) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }

    const { message } = req.body as { message: string };
    if (!message) {
      res.status(400).json({ error: "message required" });
      return;
    }

    const result = await chat(
      [{ role: "user", content: message }],
      archetype.systemPrompt
    );
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

export default router;
