/**
 * In-Memory Metrics Store & Observability Aggregator
 * Tracks p50/p95/p99 latency, semantic cache hit rates, daily token/USD costs,
 * and top failing queries with strict typing.
 */

export interface FailingQueryRecord {
  query: string;
  failure_count: number;
  last_seen: string;
  reason: string;
}

export interface DailyCostRecord {
  date: string;
  total_cost_usd: number;
  total_tokens: number;
  budget_consumed_percent: number;
  degradation_mode: "normal" | "degraded_mini" | "degraded_local";
}

export interface CacheStatistics {
  total_lookups: number;
  hits: number;
  misses: number;
  invalidations: number;
  hit_rate: number;
}

export interface ObservabilityMetrics {
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  cache_hit_rate: number;
  cache_stats: CacheStatistics;
  cost_per_day: DailyCostRecord;
  top_failing_queries: FailingQueryRecord[];
  rate_limiting: {
    active_tracked_ips: number;
    throttled_requests_total: number;
  };
  total_requests: number;
  uptime_seconds: number;
}

class MetricsStore {
  private readonly latencies: number[] = [];
  private readonly maxLatencySamples = 10000;
  private readonly startTime = Date.now();

  private cacheLookups = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  private cacheInvalidations = 0;

  private dailyTokens = 0;
  private dailyCostUSD = 0;
  private dailyBudgetTokens = 500_000; // default 500k tokens/day
  private currentDateStr = new Date().toISOString().split("T")[0]!;

  private readonly failingQueries: Map<string, { count: number; lastSeen: string; reason: string }> = new Map();
  private throttledRequestsTotal = 0;
  private activeTrackedIPsCount = 0;

  constructor() {
    this.resetDailyWindowIfNewDay();
  }

  private resetDailyWindowIfNewDay(): void {
    const today = new Date().toISOString().split("T")[0]!;
    if (today !== this.currentDateStr) {
      this.currentDateStr = today;
      this.dailyTokens = 0;
      this.dailyCostUSD = 0;
    }
  }

  /**
   * Record a completed chat request latency in ms.
   */
  public recordLatency(latencyMs: number): void {
    if (this.latencies.length >= this.maxLatencySamples) {
      this.latencies.shift();
    }
    this.latencies.push(latencyMs);
  }

  /**
   * Record semantic cache lookup result.
   */
  public recordCacheLookup(isHit: boolean): void {
    this.cacheLookups++;
    if (isHit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }
  }

  /**
   * Record cache invalidation event.
   */
  public recordCacheInvalidation(): void {
    this.cacheInvalidations++;
  }

  /**
   * Record token consumption & cost in USD.
   */
  public recordUsage(tokens: number, costUSD: number): void {
    this.resetDailyWindowIfNewDay();
    this.dailyTokens += tokens;
    this.dailyCostUSD += costUSD;
  }

  /**
   * Record a query failure or ungrounded generation.
   */
  public recordFailingQuery(query: string, reason: string): void {
    const normalized = query.trim();
    const existing = this.failingQueries.get(normalized);
    if (existing) {
      existing.count++;
      existing.lastSeen = new Date().toISOString();
      existing.reason = reason;
    } else {
      this.failingQueries.set(normalized, {
        count: 1,
        lastSeen: new Date().toISOString(),
        reason,
      });
    }
  }

  /**
   * Record rate limiter throttling event.
   */
  public recordThrottledRequest(): void {
    this.throttledRequestsTotal++;
  }

  public updateActiveTrackedIPs(count: number): void {
    this.activeTrackedIPsCount = count;
  }

  public setDailyTokenBudget(budget: number): void {
    this.dailyBudgetTokens = budget;
  }

  public getDailyTokensUsed(): number {
    this.resetDailyWindowIfNewDay();
    return this.dailyTokens;
  }

  public getDailyBudgetTokens(): number {
    return this.dailyBudgetTokens;
  }

  private calculatePercentile(percentile: number): number {
    if (this.latencies.length === 0) return 0;
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const index = Math.min(
      Math.floor((percentile / 100) * sorted.length),
      sorted.length - 1
    );
    return Math.round((sorted[index] ?? 0) * 10) / 10;
  }

  /**
   * Generates observability payload for /api/metrics.
   */
  public getMetrics(): ObservabilityMetrics {
    this.resetDailyWindowIfNewDay();
    const hitRate =
      this.cacheLookups > 0
        ? Number((this.cacheHits / this.cacheLookups).toFixed(4))
        : 0;

    const budgetPercent =
      this.dailyBudgetTokens > 0
        ? Number(((this.dailyTokens / this.dailyBudgetTokens) * 100).toFixed(2))
        : 0;

    let degradationMode: DailyCostRecord["degradation_mode"] = "normal";
    if (budgetPercent >= 100) {
      degradationMode = "degraded_local";
    } else if (budgetPercent >= 80) {
      degradationMode = "degraded_mini";
    }

    const topFailing: FailingQueryRecord[] = Array.from(this.failingQueries.entries())
      .map(([query, data]) => ({
        query,
        failure_count: data.count,
        last_seen: data.lastSeen,
        reason: data.reason,
      }))
      .sort((a, b) => b.failure_count - a.failure_count)
      .slice(0, 10);

    return {
      p50_latency_ms: this.calculatePercentile(50),
      p95_latency_ms: this.calculatePercentile(95),
      p99_latency_ms: this.calculatePercentile(99),
      cache_hit_rate: hitRate,
      cache_stats: {
        total_lookups: this.cacheLookups,
        hits: this.cacheHits,
        misses: this.cacheMisses,
        invalidations: this.cacheInvalidations,
        hit_rate: hitRate,
      },
      cost_per_day: {
        date: this.currentDateStr,
        total_cost_usd: Number(this.dailyCostUSD.toFixed(6)),
        total_tokens: this.dailyTokens,
        budget_consumed_percent: budgetPercent,
        degradation_mode: degradationMode,
      },
      top_failing_queries: topFailing,
      rate_limiting: {
        active_tracked_ips: this.activeTrackedIPsCount,
        throttled_requests_total: this.throttledRequestsTotal,
      },
      total_requests: this.latencies.length,
      uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  /**
   * Reset state for testing.
   */
  public reset(): void {
    this.latencies.length = 0;
    this.cacheLookups = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.cacheInvalidations = 0;
    this.dailyTokens = 0;
    this.dailyCostUSD = 0;
    this.failingQueries.clear();
    this.throttledRequestsTotal = 0;
  }
}

export const metricsStore = new MetricsStore();
