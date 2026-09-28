import { describe, it, expect, beforeEach } from "vitest";
import { budgetGuardrail } from "../src/lib/budgetGuardrail.js";
import { metricsStore } from "../src/lib/metricsStore.js";
import { DEFAULT_RAG_CONFIG } from "../src/rag/types.js";

describe("Budget Guardrails & Cost Protection Tests", () => {
  beforeEach(() => {
    metricsStore.reset();
    budgetGuardrail.updateBudget(10_000); // 10k daily budget for testing
  });

  it("enforces per-IP burst limits and rejects excess requests", () => {
    const testIp = "192.168.1.100";
    let allowedCount = 0;

    // Default burst capacity is 45 requests
    for (let i = 0; i < 60; i++) {
      const res = budgetGuardrail.checkRateLimit(testIp);
      if (res.allowed) {
        allowedCount++;
      }
    }

    expect(allowedCount).toBe(45);
    const throttled = budgetGuardrail.checkRateLimit(testIp);
    expect(throttled.allowed).toBe(false);
    expect(throttled.resetInMs).toBeGreaterThan(0);
  });

  it("operates in standard tier when under 80% daily token budget", () => {
    metricsStore.recordUsage(5000, 0.01); // 50% of 10,000

    const effective = budgetGuardrail.getEffectiveConfig(DEFAULT_RAG_CONFIG);
    expect(effective.tier).toBe("standard");
    expect(effective.config.generationModel).toBe("gpt-4o");
    expect(effective.consumedPercent).toBe(50);
  });

  it("gracefully degrades to gpt-4o-mini when >= 80% of daily budget consumed", () => {
    metricsStore.recordUsage(8500, 0.02); // 85% of 10,000

    const effective = budgetGuardrail.getEffectiveConfig(DEFAULT_RAG_CONFIG);
    expect(effective.tier).toBe("degraded_mini");
    expect(effective.config.generationModel).toBe("gpt-4o-mini");
    expect(effective.config.rerankLimit).toBe(2);
    expect(effective.consumedPercent).toBe(85);
  });

  it("gracefully degrades to local synthesis when 100% of daily budget consumed", () => {
    metricsStore.recordUsage(10000, 0.03); // 100% of 10,000

    const effective = budgetGuardrail.getEffectiveConfig(DEFAULT_RAG_CONFIG);
    expect(effective.tier).toBe("degraded_local");
    expect(effective.config.generationModel).toBe("local-grounded-synthesizer");
    expect(effective.consumedPercent).toBe(100);
  });
});
