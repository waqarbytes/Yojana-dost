import { describe, it, expect, beforeEach } from "vitest";
import {
  computeCosineSimilarity,
  localSemanticCache,
  lookupSemanticCache,
  storeInSemanticCache,
  invalidateSemanticCache,
} from "../src/rag/cache.js";
import { embedText } from "../src/rag/embed.js";
import type { RAGResponse } from "../src/rag/types.js";

const mockResponse: RAGResponse = {
  answer: "PM-KISAN provides ₹6,000 per year in three equal installments of ₹2,000 [pm-kisan].",
  citations: [
    {
      scheme_id: "pm-kisan",
      scheme_name: "PM-KISAN",
      section: "benefits",
      official_url: "https://pmkisan.gov.in",
    },
  ],
  retrieved_chunks: [],
  reranked_chunks: [],
  metrics: {
    usage: {
      prompt_tokens: 100,
      completion_tokens: 30,
      embedding_tokens: 15,
      rerank_tokens: 50,
      total_tokens: 195,
    },
    estimated_cost_usd: 0.0005,
    latency: {
      retrieval_ms: 20,
      rerank_ms: 15,
      generation_ms: 120,
      total_ms: 155,
    },
    retrieved_chunk_count: 6,
    reranked_chunk_count: 3,
    citation_count: 1,
    is_rag_enabled: true,
  },
};

describe("Semantic Cache Unit & Integration Tests", () => {
  beforeEach(() => {
    localSemanticCache.clear();
  });

  it("computes cosine similarity accurately", () => {
    const vecA = [1, 0, 0];
    const vecB = [1, 0, 0];
    const vecC = [0, 1, 0];

    expect(computeCosineSimilarity(vecA, vecB)).toBeCloseTo(1.0, 4);
    expect(computeCosineSimilarity(vecA, vecC)).toBeCloseTo(0.0, 4);
  });

  it("stores and retrieves exact match queries with >= 0.92 threshold", async () => {
    const query = "What financial benefit does PM-KISAN provide?";
    const embedRes = await embedText(query);

    await storeInSemanticCache(query, embedRes.embedding, mockResponse);

    const lookup = await lookupSemanticCache(query, embedRes.embedding, {
      similarityThreshold: 0.92,
    });

    expect(lookup.hit).toBe(true);
    expect(lookup.source).toBe("memory");
    expect(lookup.similarity).toBeGreaterThanOrEqual(0.92);
    expect(lookup.cachedResponse?.answer).toContain("PM-KISAN provides ₹6,000");
    expect(lookup.cachedResponse?.metrics.latency.total_ms).toBeLessThanOrEqual(5);
  });

  it("misses when similarity is below the 0.92 threshold", async () => {
    const queryA = "What financial benefit does PM-KISAN provide?";
    const queryB = "How do I apply for a passport in Delhi?";

    const embedA = await embedText(queryA);
    const embedB = await embedText(queryB);

    await storeInSemanticCache(queryA, embedA.embedding, mockResponse);

    const lookup = await lookupSemanticCache(queryB, embedB.embedding, {
      similarityThreshold: 0.92,
    });

    expect(lookup.hit).toBe(false);
  });

  it("invalidates cache entries by scheme_id", async () => {
    const query = "What financial benefit does PM-KISAN provide?";
    const embed = await embedText(query);

    await storeInSemanticCache(query, embed.embedding, mockResponse);
    expect(localSemanticCache.size()).toBe(1);

    const invalidation = await invalidateSemanticCache("pm-kisan");
    expect(invalidation.memoryInvalidated).toBe(1);
    expect(localSemanticCache.size()).toBe(0);
  });

  it("respects TTL expiration", async () => {
    const query = "Short lived query test";
    const embed = await embedText(query);

    // Store with 0 second TTL (expired immediately)
    localSemanticCache.set(query, embed.embedding, mockResponse, ["pm-kisan"], -1);

    const lookup = await lookupSemanticCache(query, embed.embedding);
    expect(lookup.hit).toBe(false);
  });
});
