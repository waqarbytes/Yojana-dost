/**
 * Express SSE Chat Route with RAG_ENABLED Feature Flag.
 * Streams tokens in real-time, attaches citation chips, and outputs performance telemetry.
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateRAGStream, generateRAGAnswer } from "../rag/generate.js";
import { budgetGuardrail } from "../lib/budgetGuardrail.js";
import { Logger } from "../lib/logger.js";
import type { SchemeChunk } from "../rag/types.js";

export const chatRouter = Router();

// In-memory cache for local chunks
let cachedCorpus: SchemeChunk[] | null = null;

async function getLocalCorpus(): Promise<SchemeChunk[]> {
  if (cachedCorpus) return cachedCorpus;
  try {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const path = resolve(currentDir, "../data/embedded_chunks.json");
    const raw = await readFile(path, "utf-8");
    cachedCorpus = JSON.parse(raw) as SchemeChunk[];
    return cachedCorpus;
  } catch {
    return [];
  }
}

const chatRequestSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message exceeds 2000 characters"),
  sessionId: z.string().max(100).optional(),
  stream: z.boolean().default(true).optional(),
});

/**
 * Health check endpoint for chat service.
 */
chatRouter.get("/health", (_req: Request, res: Response) => {
  const isRagEnabled = process.env.RAG_ENABLED !== "false";
  res.json({
    status: "ok",
    service: "yojana-dost-chat",
    rag_enabled: isRagEnabled,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Main chat endpoint supporting both SSE streaming and standard JSON responses.
 */
chatRouter.post("/", async (req: Request, res: Response) => {
  // 1. Per-IP Rate Limiting
  const forwarded = req.headers["x-forwarded-for"];
  const clientIp =
    (typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : null) ||
    req.ip ||
    "127.0.0.1";

  const rateCheck = budgetGuardrail.checkRateLimit(clientIp);
  if (!rateCheck.allowed) {
    const retrySec = Math.max(1, Math.ceil(rateCheck.resetInMs / 1000));
    res.setHeader("Retry-After", String(retrySec));
    res.status(429).json({
      error: "Rate limit exceeded",
      message: `Too many requests from client IP. Please wait ${retrySec}s before retrying.`,
      retryAfterSeconds: retrySec,
    });
    return;
  }

  const parseResult = chatRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: "Validation failed",
      details: parseResult.error.errors,
    });
    return;
  }

  const { message, sessionId, stream = true } = parseResult.data;
  const isRagEnabled = process.env.RAG_ENABLED !== "false";
  const corpus = await getLocalCorpus();

  // If non-streaming requested
  if (!stream || req.headers.accept === "application/json") {
    try {
      const response = await generateRAGAnswer(message, {
        localCorpus: corpus,
        sessionId,
        isRagEnabled,
      });
      res.json(response);
      return;
    } catch (error) {
      Logger.error("Non-streaming chat generation failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: "Internal generation error" });
      return;
    }
  }

  // SSE Streaming
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  let isClientConnected = true;
  req.on("close", () => {
    isClientConnected = false;
  });

  try {
    const generator = generateRAGStream(message, {
      localCorpus: corpus,
      sessionId,
      isRagEnabled,
    });

    for await (const event of generator) {
      if (!isClientConnected) break;
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      // Flush if supported
      if (typeof (res as any).flush === "function") {
        (res as any).flush();
      }
    }
  } catch (err) {
    if (isClientConnected) {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          error: err instanceof Error ? err.message : "Stream processing error",
        })}\n\n`
      );
    }
  } finally {
    if (isClientConnected) {
      res.end();
    }
  }
});
