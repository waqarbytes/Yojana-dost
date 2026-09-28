/**
 * Observability Metrics Endpoint Route
 * Exposes /api/metrics for system health, p95 latency, cache efficiency,
 * token costs, and failure diagnostics.
 */

import { Router, type Request, type Response } from "express";
import { metricsStore } from "../lib/metricsStore.js";

export const metricsRouter = Router();

/**
 * GET /api/metrics
 * Returns comprehensive telemetry on latency, caching, cost, and failing queries.
 */
metricsRouter.get("/", (_req: Request, res: Response) => {
  const metrics = metricsStore.getMetrics();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    ...metrics,
  });
});
