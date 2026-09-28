/**
 * Cost Guardrails & Graceful Degradation Controller
 *
 * Implements:
 * 1. Per-IP Token-Bucket Rate Limiter (prevents burst flooding and DDoS).
 * 2. Daily Token Budget Enforcement.
 * 3. Graceful Model Degradation:
 *    - < 80% daily budget: Standard tier (`gpt-4o` + 4 reranked chunks).
 *    - >= 80% daily budget: Degraded tier (`gpt-4o-mini` + 2 reranked chunks, 10x cost reduction).
 *    - >= 100% daily budget: Budget-exhausted tier (Local grounded synthesis, $0 API spend).
 */

import { TokenBucketRateLimiter } from "./rateLimiter.js";
import { metricsStore } from "./metricsStore.js";
import { Logger } from "./logger.js";
import type { RAGPipelineConfig } from "../rag/types.js";

export type DegradationTier = "standard" | "degraded_mini" | "degraded_local";

export interface BudgetGuardrailConfig {
  dailyTokenBudget: number;       // default: 500,000 tokens
  degradationThreshold: number;   // default: 0.80 (80%)
  rateLimitBurstTokens: number;   // default: 45 requests per burst
  rateLimitRefillPerMin: number;  // default: 30 requests per minute
}

export const DEFAULT_BUDGET_CONFIG: BudgetGuardrailConfig = {
  dailyTokenBudget: parseInt(process.env.DAILY_TOKEN_BUDGET || "500000", 10),
  degradationThreshold: 0.8,
  rateLimitBurstTokens: 45,
  rateLimitRefillPerMin: 30,
};

class BudgetGuardrailController {
  private config: BudgetGuardrailConfig;
  private ipRateLimiter: TokenBucketRateLimiter;

  constructor(config: BudgetGuardrailConfig = DEFAULT_BUDGET_CONFIG) {
    this.config = config;
    this.ipRateLimiter = new TokenBucketRateLimiter({
      capacity: config.rateLimitBurstTokens,
      refillRatePerMinute: config.rateLimitRefillPerMin,
    });
    metricsStore.setDailyTokenBudget(this.config.dailyTokenBudget);
  }

  /**
   * Evaluates per-IP rate limit.
   */
  public checkRateLimit(ip: string): {
    allowed: boolean;
    remaining: number;
    resetInMs: number;
  } {
    const cleanIp = (ip || "127.0.0.1").replace(/[^a-zA-Z0-9_\-.:]/g, "_");
    const result = this.ipRateLimiter.tryConsume(cleanIp, 1);

    metricsStore.updateActiveTrackedIPs(this.ipRateLimiter.getActiveBucketCount());

    if (!result.allowed) {
      metricsStore.recordThrottledRequest();
      Logger.warn(`Rate limit exceeded for IP: ${cleanIp}`, {
        resetInMs: result.resetInMs,
      });
    }

    return result;
  }

  /**
   * Determine current budget consumption tier and adapt pipeline configuration.
   */
  public getEffectiveConfig(baseConfig: RAGPipelineConfig): {
    tier: DegradationTier;
    config: RAGPipelineConfig;
    consumedPercent: number;
  } {
    const tokensUsed = metricsStore.getDailyTokensUsed();
    const budget = this.config.dailyTokenBudget;
    const consumedPercent = budget > 0 ? (tokensUsed / budget) * 100 : 0;

    if (tokensUsed >= budget) {
      // 100% budget reached: Local synthesis
      return {
        tier: "degraded_local",
        config: {
          ...baseConfig,
          generationModel: "local-grounded-synthesizer",
          rerankLimit: 2,
          retrievalLimit: 6,
        },
        consumedPercent,
      };
    }

    if (consumedPercent >= this.config.degradationThreshold * 100) {
      // 80% budget reached: Degrade to gpt-4o-mini
      return {
        tier: "degraded_mini",
        config: {
          ...baseConfig,
          generationModel: "gpt-4o-mini",
          rerankModel: "gpt-4o-mini",
          rerankLimit: 2,
          retrievalLimit: 8,
        },
        consumedPercent,
      };
    }

    return {
      tier: "standard",
      config: baseConfig,
      consumedPercent,
    };
  }

  public updateBudget(newBudget: number): void {
    this.config.dailyTokenBudget = newBudget;
    metricsStore.setDailyTokenBudget(newBudget);
  }
}

export const budgetGuardrail = new BudgetGuardrailController();
