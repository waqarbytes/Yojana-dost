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
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(currentDir, "..");

export function createExpressApp(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Serve static UI assets (index.html, chatbot.html, etc.)
  app.use(express.static(publicDir));
  app.use(express.static(process.cwd()));
  app.use(express.static(resolve(currentDir, "../dist")));

  // Explicit Root route
  app.get("/", (_req, res) => {
    const possibleIndexPaths = [
      resolve(process.cwd(), "index.html"),
      resolve(publicDir, "index.html"),
      resolve(currentDir, "../index.html"),
      resolve(currentDir, "../../index.html"),
      resolve(process.cwd(), "dist/index.html"),
    ];
    const foundPath = possibleIndexPaths.find((p) => existsSync(p));
    if (foundPath) {
      res.sendFile(foundPath);
    } else {
      res.status(200).send("<!DOCTYPE html><html><head><title>Yojana Dost</title></head><body><h1>Yojana Dost AI Backend</h1><p><a href='/api'>API Info</a> | <a href='/api/chat/health'>Health Check</a></p></body></html>");
    }
  });

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

const app = createExpressApp();
export default app;

// If run directly via node/tsx
if (process.argv[1] && (process.argv[1].endsWith("app.ts") || process.argv[1].endsWith("app.js"))) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    Logger.info(`Yojana Dost RAG backend listening on port ${PORT}`);
  });
}
