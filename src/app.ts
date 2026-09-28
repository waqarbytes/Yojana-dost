/**
 * Yojana Dost Express Application
 * Mounts the /api/chat RAG route with CORS, JSON parsing, and health endpoints.
 */

import express, { type Application } from "express";
import cors from "cors";
import { chatRouter } from "./routes/chat.js";
import { metricsRouter } from "./routes/metrics.js";
import { Logger } from "./lib/logger.js";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(currentDir, "..");

export function createExpressApp(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Serve static UI assets (index.html, chatbot.html, etc.)
  app.use(express.static(publicDir));

  // Mount chat and metrics API routes
  app.use("/api/chat", chatRouter);
  app.use("/api/metrics", metricsRouter);

  // Health check endpoint
  app.get("/api", (_req, res) => {
    res.json({
      name: "Yojana Dost Backend API",
      rag_enabled: process.env.RAG_ENABLED !== "false",
      version: "2.0.0",
      endpoints: {
        chat: "POST /api/chat",
        health: "GET /api/chat/health",
        metrics: "GET /api/metrics",
      },
    });
  });

  return app;
}

// If run directly via node/tsx
if (process.argv[1] && (process.argv[1].endsWith("app.ts") || process.argv[1].endsWith("app.js"))) {
  const app = createExpressApp();
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    Logger.info(`Yojana Dost RAG backend listening on port ${PORT}`);
  });
}
