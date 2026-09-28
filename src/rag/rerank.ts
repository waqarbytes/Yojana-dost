/**
 * LLM Reranking Engine.
 * Takes top candidate chunks (e.g. 10) from hybrid retrieval and uses gpt-4o-mini
 * to rank and filter down to the most relevant top 4 chunks.
 */

import { OpenAI } from "openai";
import type { SchemeChunk, ScoredChunk } from "./types.js";
import { Logger } from "../lib/logger.js";

let openAIClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (openAIClient) return openAIClient;
  const apiKey = process.env.OPENAI_API_KEY || process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;
  const baseURL =
    process.env.OPENAI_BASE_URL ||
    (apiKey.startsWith("nvapi-") ? "https://integrate.api.nvidia.com/v1" : undefined);
  openAIClient = new OpenAI({ apiKey, baseURL });
  return openAIClient;
}

export interface RerankResult {
  topChunks: SchemeChunk[];
  scoredChunks: ScoredChunk[];
  promptTokens: number;
  completionTokens: number;
  model: string;
}

/**
 * Heuristic fallback reranking when OpenAI API is not reachable or offline.
 */
function heuristicRerank(
  query: string,
  candidates: ScoredChunk[],
  topK = 4
): ScoredChunk[] {
  const queryLower = query.toLowerCase();
  const queryTokens = queryLower.split(/[\s\-_\/,.:;?!()]+/).filter((t) => t.length > 2);

  const scored = candidates.map((item) => {
    let bonus = 0;
    const contentLower = item.chunk.content.toLowerCase();
    const titleLower = item.chunk.scheme_name.toLowerCase();
    const idLower = item.chunk.scheme_id.toLowerCase();

    // Scheme name / ID match bonus
    if (titleLower.includes(queryLower) || idLower.includes(queryLower)) bonus += 0.5;
    for (const t of queryTokens) {
      if (titleLower.includes(t) || idLower.includes(t)) bonus += 0.2;
      if (contentLower.includes(t)) bonus += 0.05;
    }

    // Section relevance bonus based on query intent
    if (queryLower.includes("apply") || queryLower.includes("how to") || queryLower.includes("portal") || queryLower.includes("deadline")) {
      if (item.chunk.section === "application_steps") bonus += 0.35;
    }
    if (queryLower.includes("eligible") || queryLower.includes("age") || queryLower.includes("income") || queryLower.includes("qualify") || queryLower.includes("can ")) {
      if (item.chunk.section === "eligibility") bonus += 0.35;
    }
    if (queryLower.includes("benefit") || queryLower.includes("amount") || queryLower.includes("money") || queryLower.includes("pension") || queryLower.includes("cash") || queryLower.includes("cover") || queryLower.includes("loan") || queryLower.includes("grant")) {
      if (item.chunk.section === "benefits") bonus += 0.35;
    }

    const rerankScore = item.rrf_score + bonus;
    return {
      ...item,
      rerank_score: Number(rerankScore.toFixed(4)),
    };
  });

  scored.sort((a, b) => (b.rerank_score ?? 0) - (a.rerank_score ?? 0));

  // Multi-entity diversity guarantee
  const schemeGroups = new Map<string, ScoredChunk[]>();
  for (const item of scored) {
    const sId = item.chunk.scheme_id.toLowerCase();
    if (!schemeGroups.has(sId)) schemeGroups.set(sId, []);
    schemeGroups.get(sId)!.push(item);
  }

  // If query mentions multiple schemes, pick top from each scheme group first
  if (schemeGroups.size > 1 && (queryLower.includes("compare") || queryLower.includes(" vs ") || queryLower.includes("difference") || queryLower.includes(" and "))) {
    const diverse: ScoredChunk[] = [];
    const maxPerGroup = Math.max(1, Math.floor(topK / schemeGroups.size));

    for (const group of schemeGroups.values()) {
      diverse.push(...group.slice(0, maxPerGroup));
    }

    // Fill remaining
    for (const item of scored) {
      if (!diverse.some((d) => d.chunk.scheme_id === item.chunk.scheme_id && d.chunk.section === item.chunk.section)) {
        if (diverse.length < topK) diverse.push(item);
      }
    }

    diverse.sort((a, b) => (b.rerank_score ?? 0) - (a.rerank_score ?? 0));
    return diverse.slice(0, topK);
  }

  return scored.slice(0, topK);
}


/**
 * Reranks candidate chunks using an LLM cross-scoring prompt or heuristic fallback.
 */
export async function rerankChunks(
  query: string,
  candidates: ScoredChunk[],
  topK = 4,
  model = "gpt-4o-mini"
): Promise<RerankResult> {
  if (candidates.length <= topK) {
    return {
      topChunks: candidates.map((c) => c.chunk),
      scoredChunks: candidates,
      promptTokens: 0,
      completionTokens: 0,
      model: "pass-through",
    };
  }

  const client = getOpenAIClient();
  const apiKey = process.env.OPENAI_API_KEY || process.env.NVIDIA_API_KEY || "";
  const hasKey = Boolean(apiKey);

  if (!client || !hasKey) {
    Logger.debug("LLM API key not found. Using heuristic cross-encoder reranker.");
    const reranked = heuristicRerank(query, candidates, topK);
    return {
      topChunks: reranked.map((c) => c.chunk),
      scoredChunks: reranked,
      promptTokens: 0,
      completionTokens: 0,
      model: "heuristic-fallback",
    };
  }

  const effectiveModel = process.env.RERANK_MODEL || (apiKey.startsWith("nvapi-") ? "meta/llama-3.2-11b-vision-instruct" : model);

  const formattedCandidates = candidates.map((c, idx) => ({
    id: idx,
    scheme: c.chunk.scheme_name,
    section: c.chunk.section,
    snippet: c.chunk.content.slice(0, 300),
  }));

  const prompt = `You are a relevance reranker for Indian government welfare scheme retrieval.
Given the User Query and a list of Candidate Passages, score each candidate's relevance from 0 to 10.

User Query: "${query}"

Candidate Passages:
${JSON.stringify(formattedCandidates, null, 2)}

Return ONLY a JSON array with objects in this format:
[
  {"id": 0, "score": 9.5}
]`;

  try {
    const isNvidia = apiKey.startsWith("nvapi-") || process.env.OPENAI_BASE_URL?.includes("nvidia.com");
    const response = await client.chat.completions.create({
      model: effectiveModel,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.0,
      ...(isNvidia ? {} : { response_format: { type: "json_object" } }),
    });

    const content = response.choices[0]?.message.content ?? "{}";
    const usage = response.usage;
    const promptTokens = usage?.prompt_tokens ?? 0;
    const completionTokens = usage?.completion_tokens ?? 0;

    let scores: Array<{ id: number; score: number }> = [];
    try {
      const parsed = JSON.parse(content);
      scores = Array.isArray(parsed) ? parsed : (parsed.scores || parsed.results || []);
    } catch {
      scores = [];
    }

    const scoreMap = new Map<number, number>();
    for (const s of scores) {
      if (typeof s.id === "number" && typeof s.score === "number") {
        scoreMap.set(s.id, s.score);
      }
    }

    const rerankedScored = candidates.map((c, idx) => ({
      ...c,
      rerank_score: scoreMap.get(idx) ?? 0,
    }));

    rerankedScored.sort((a, b) => (b.rerank_score ?? 0) - (a.rerank_score ?? 0));
    const top = rerankedScored.slice(0, topK);

    return {
      topChunks: top.map((c) => c.chunk),
      scoredChunks: top,
      promptTokens,
      completionTokens,
      model,
    };
  } catch (err) {
    Logger.warn("LLM reranking failed, falling back to heuristic reranking", {
      error: err instanceof Error ? err.message : String(err),
    });
    const fallback = heuristicRerank(query, candidates, topK);
    return {
      topChunks: fallback.map((c) => c.chunk),
      scoredChunks: fallback,
      promptTokens: 0,
      completionTokens: 0,
      model: "heuristic-fallback-error",
    };
  }
}
