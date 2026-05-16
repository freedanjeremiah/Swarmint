import "dotenv/config";
import express from "express";
import cors from "cors";
import agentsRouter from "./routes/agents.js";
import chatRouter from "./routes/chat.js";
import swarmRouter from "./routes/swarm.js";
import deliberationRouter from "./routes/deliberation.js";

const app = express();
const PORT = process.env.PORT ?? 8000;

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/agents", agentsRouter);
app.use("/swarm", swarmRouter);
app.use("/deliberation", deliberationRouter);
app.use("/", chatRouter);

app.listen(PORT, () => {
  console.log(`Swarmint agent server listening on port ${PORT}`);
});
