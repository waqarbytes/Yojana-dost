import { describe, it, expect, beforeEach } from "vitest";
import { metricsStore } from "../src/lib/metricsStore.js";

describe("Observability & /api/metrics Tests", () => {
  beforeEach(() => {
    metricsStore.reset();
  });

  it("calculates accurate p50, p95, and p99 latencies", () => {
    // Record sample latencies from 1ms to 100ms
    for (let i = 1; i <= 100; i++) {
      metricsStore.recordLatency(i);
    }

    const metrics = metricsStore.getMetrics();
    expect(metrics.p50_latency_ms).toBe(51);
    expect(metrics.p95_latency_ms).toBe(96);
    expect(metrics.p99_latency_ms).toBe(100);
    expect(metrics.total_requests).toBe(100);
  });

  it("tracks cache hit rates and invalidations accurately", () => {
    metricsStore.recordCacheLookup(true);
    metricsStore.recordCacheLookup(true);
    metricsStore.recordCacheLookup(false);
    metricsStore.recordCacheInvalidation();

    const metrics = metricsStore.getMetrics();
    expect(metrics.cache_stats.total_lookups).toBe(3);
    expect(metrics.cache_stats.hits).toBe(2);
    expect(metrics.cache_stats.misses).toBe(1);
    expect(metrics.cache_stats.invalidations).toBe(1);
    expect(metrics.cache_hit_rate).toBeCloseTo(0.6667, 3);
  });

  it("records top failing queries sorted by failure frequency", () => {
    metricsStore.recordFailingQuery("How do I get free money?", "Out of scope guardrail");
    metricsStore.recordFailingQuery("How do I get free money?", "Out of scope guardrail");
    metricsStore.recordFailingQuery("Random invalid scheme query", "Missing entity in corpus");

    const metrics = metricsStore.getMetrics();
    expect(metrics.top_failing_queries.length).toBe(2);
    expect(metrics.top_failing_queries[0]?.query).toBe("How do I get free money?");
    expect(metrics.top_failing_queries[0]?.failure_count).toBe(2);
    expect(metrics.top_failing_queries[1]?.query).toBe("Random invalid scheme query");
    expect(metrics.top_failing_queries[1]?.failure_count).toBe(1);
  });
});
