import { describe, it, expect } from "vitest";
import { chunkScheme } from "../src/rag/chunk.js";
import { resolveCitations, extractCitationIds, evaluateCitationFidelity } from "../src/rag/citations.js";
import { calculateRAGCostUSD } from "../src/rag/cost.js";
import { reciprocalRankFusion } from "../src/rag/retrieve.js";
import { generateRAGAnswer } from "../src/rag/generate.js";
import type { Scheme } from "../src/lib/types.js";

const sampleScheme: Scheme = {
  id: "pm-kisan",
  name: "PM Kisan Samman Nidhi",
  ministry: "Ministry of Agriculture and Farmers Welfare",
  category: "Agriculture",
  description: "Direct income support of ₹6,000 per year.",
  eligibility: [
    {
      field: "occupation",
      operator: "eq",
      value: "farmer",
      description: "Applicant must be a landholding farmer",
    },
  ],
  benefits: "₹6,000 annually payable in 3 installments.",
  application_deadline: "open_all_year",
  official_url: "https://pmkisan.gov.in",
  state_scope: ["All India"],
  application_steps: ["Step 1: Visit pmkisan.gov.in", "Step 2: Enter Aadhaar"],
  is_sample: true,
};

describe("RAG Pipeline Unit Tests", () => {
  it("should smartly chunk a scheme into 4 distinct semantic sections with metadata", () => {
    const chunks = chunkScheme(sampleScheme);
    expect(chunks).toHaveLength(4);

    const sections = chunks.map((c) => c.section);
    expect(sections).toEqual(["overview", "eligibility", "benefits", "application_steps"]);

    for (const chunk of chunks) {
      expect(chunk.scheme_id).toBe("pm-kisan");
      expect(chunk.scheme_name).toBe("PM Kisan Samman Nidhi");
      expect(chunk.metadata.official_url).toBe("https://pmkisan.gov.in");
    }
  });

  it("should accurately extract and resolve bracketed citation IDs", () => {
    const text = "Under [pm-kisan], farmers receive ₹6,000. Also check [pm-jay-ayushman].";
    const ids = extractCitationIds(text);
    expect(ids).toEqual(["pm-kisan", "pm-jay-ayushman"]);

    const chunks = chunkScheme(sampleScheme);
    const { citations, ungroundedIds } = resolveCitations(text, chunks);

    expect(citations).toHaveLength(1);
    expect(citations[0]?.scheme_id).toBe("pm-kisan");
    expect(citations[0]?.official_url).toBe("https://pmkisan.gov.in");
    expect(ungroundedIds).toEqual(["pm-jay-ayushman"]);
  });

  it("should evaluate citation precision and recall metrics correctly", () => {
    const text = "Benefits provided by [pm-kisan].";
    const chunks = chunkScheme(sampleScheme);
    const result = evaluateCitationFidelity(text, chunks, ["pm-kisan"]);

    expect(result.precision).toBe(1.0);
    expect(result.recall).toBe(1.0);
    expect(result.hallucinatedCitations).toHaveLength(0);
  });

  it("should calculate exact RAG USD costs accurately", () => {
    const cost = calculateRAGCostUSD({
      embeddingTokens: 1000,           // $0.00002
      generationPromptTokens: 2000,    // 2000 / 1M * 2.50 = $0.00500
      generationCompletionTokens: 500, // 500 / 1M * 10.00 = $0.00500
      rerankPromptTokens: 1000,        // 1000 / 1M * 0.15 = $0.00015
    });

    expect(cost).toBeGreaterThan(0.01);
  });

  it("should rank chunks using Reciprocal Rank Fusion (RRF with k=60)", () => {
    const chunks = chunkScheme(sampleScheme);
    const vectorRanked = [chunks[0]!, chunks[1]!];
    const textRanked = [chunks[1]!, chunks[0]!];

    const fused = reciprocalRankFusion(vectorRanked, textRanked, 60);
    expect(fused).toHaveLength(2);
    expect(fused[0]?.rrf_score).toBeGreaterThan(0);
  });

  it("should execute generateRAGAnswer with citations and metrics", async () => {
    const chunks = chunkScheme(sampleScheme);
    const response = await generateRAGAnswer("What are the benefits of PM-KISAN?", {
      localCorpus: chunks,
      isRagEnabled: true,
    });

    expect(response.answer).toBeDefined();
    expect(response.metrics).toBeDefined();
    expect(response.metrics.is_rag_enabled).toBe(true);
  });

  it("should support feature flag fallback when isRagEnabled is false", async () => {
    const response = await generateRAGAnswer("What are the benefits of PM-KISAN?", {
      isRagEnabled: false,
    });

    expect(response.answer).toBeDefined();
    expect(response.metrics.is_rag_enabled).toBe(false);
    expect(response.retrieved_chunks).toHaveLength(0);
  });
});
