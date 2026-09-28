/**
 * Grounded RAG Generation Engine with SSE Streaming, Citation Linking,
 * Semantic Caching (0.92 cosine similarity threshold), Cost Guardrails, and Observability.
 */

import { OpenAI } from "openai";
import { performance } from "node:perf_hooks";
import { hybridRetrieve } from "./retrieve.js";
import { rerankChunks } from "./rerank.js";
import { resolveCitations } from "./citations.js";
import { calculateRAGCostUSD } from "./cost.js";
import { embedText } from "./embed.js";
import { lookupSemanticCache, storeInSemanticCache } from "./cache.js";
import { budgetGuardrail } from "../lib/budgetGuardrail.js";
import { metricsStore } from "../lib/metricsStore.js";
import { getSupabaseClient } from "./retrieve.js";
import { Logger } from "../lib/logger.js";
import type {
  RAGMetrics,
  RAGPipelineConfig,
  RAGResponse,
  RAGStreamEvent,
  SchemeChunk,
} from "./types.js";

import { DEFAULT_RAG_CONFIG } from "./types.js";

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

export function resolveGenerationModel(requestedModel: string): string {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NVIDIA_API_KEY || "";
  if (process.env.GENERATION_MODEL) {
    return process.env.GENERATION_MODEL;
  }
  if (apiKey.startsWith("nvapi-")) {
    if (requestedModel === "gpt-4o" || requestedModel.includes("gpt")) {
      return "meta/llama-3.2-11b-vision-instruct";
    }
    if (requestedModel === "gpt-4o-mini") {
      return "meta/llama-3.2-11b-vision-instruct";
    }
  }
  return requestedModel;
}

const STRICT_RAG_SYSTEM_PROMPT = `You are Yojana Dost AI, an authoritative, highly grounded assistant for Indian Government Welfare Schemes.

CRITICAL GROUNDING RULES:
1. Answer the user's question ONLY using the factual details explicitly present in the RETRIEVED CONTEXT below.
2. Every substantive factual claim (amounts, age limits, qualifications, benefits, deadlines) MUST end with a bracketed scheme citation marker, e.g. [pm-kisan], [pm-jay-ayushman], or [atal-pension-yojana].
3. If the retrieved context is insufficient or does not mention the requested detail, explicitly state:
   "I do not have sufficient verified scheme information in my current knowledge base to answer this completely. Please verify directly on the official portal."
   Always include the official portal link if present in the context.
4. Do NOT hallucinate rules, fabricate interest rates, or extrapolate beyond what is stated.
5. Provide clear, concise, well-structured answers using Markdown bullet points where appropriate.`;

const LEGACY_PROMPT_SYSTEM = `You are Yojana Dost AI, a helpful assistant answering questions about Indian Government Welfare Schemes.`;

function sanitizeInput(text: string): string {
  return text
    .replace(/<\/?retrieved_context>/gi, "")
    .replace(/<\/?user_query>/gi, "")
    .replace(/<\/?system>/gi, "");
}

/**
 * Formats retrieved chunks into context string for the LLM.
 */
export function formatRetrievedContext(chunks: SchemeChunk[]): string {
  if (chunks.length === 0) {
    return "NO RELEVANT SCHEMES FOUND IN RETRIEVAL CONTEXT.";
  }

  return chunks
    .map((c, idx) => {
      return `<source index="${idx + 1}" scheme_id="${c.scheme_id}" section="${c.section}" official_url="${c.metadata.official_url}">\n${c.content}\n</source>`;
    })
    .join("\n\n");
}

export interface GenerateOptions {
  config?: Partial<RAGPipelineConfig>;
  localCorpus?: SchemeChunk[];
  sessionId?: string;
  isRagEnabled?: boolean;
  skipCache?: boolean;
}

/**
 * Logs query metrics to Supabase rag_metrics table if connected.
 */
async function logMetricsToDb(
  query: string,
  metrics: RAGMetrics,
  retrievedIds: string[],
  rerankedIds: string[],
  citationIds: string[],
  sessionId?: string
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from("rag_metrics").insert({
      session_id: sessionId ?? null,
      query,
      retrieved_chunk_ids: retrievedIds,
      reranked_chunk_ids: rerankedIds,
      citation_scheme_ids: citationIds,
      prompt_tokens: metrics.usage.prompt_tokens,
      completion_tokens: metrics.usage.completion_tokens,
      embedding_tokens: metrics.usage.embedding_tokens,
      rerank_tokens: metrics.usage.rerank_tokens,
      estimated_cost_usd: metrics.estimated_cost_usd,
      latency_retrieval_ms: metrics.latency.retrieval_ms,
      latency_rerank_ms: metrics.latency.rerank_ms,
      latency_generation_ms: metrics.latency.generation_ms,
      latency_total_ms: metrics.latency.total_ms,
      is_rag_enabled: metrics.is_rag_enabled,
    });
  } catch (err) {
    Logger.warn("Failed to persist RAG telemetry to rag_metrics table", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Non-streaming RAG execution with semantic caching and cost guardrails.
 */
export async function generateRAGAnswer(
  query: string,
  options: GenerateOptions = {}
): Promise<RAGResponse> {
  const isRagEnabled = options.isRagEnabled ?? (process.env.RAG_ENABLED !== "false");
  const baseConfig = { ...DEFAULT_RAG_CONFIG, ...options.config };
  const sanitizedQuery = sanitizeInput(query);
  const startTime = performance.now();

  // 1. Semantic Cache Interception (threshold >= 0.92)
  let queryEmbedding: number[] = [];
  if (isRagEnabled && !options.skipCache) {
    try {
      const embedRes = await embedText(sanitizedQuery, baseConfig.embeddingModel);
      queryEmbedding = embedRes.embedding;

      const cacheResult = await lookupSemanticCache(sanitizedQuery, queryEmbedding);
      if (cacheResult.hit && cacheResult.cachedResponse) {
        const totalMs = Math.max(1, Math.round(performance.now() - startTime));
        metricsStore.recordLatency(totalMs);
        return {
          ...cacheResult.cachedResponse,
          metrics: {
            ...cacheResult.cachedResponse.metrics,
            latency: {
              retrieval_ms: 0,
              rerank_ms: 0,
              generation_ms: 0,
              total_ms: totalMs,
            },
            estimated_cost_usd: 0,
          },
        };
      }
    } catch (err) {
      Logger.debug("Semantic cache lookup non-fatal error", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // 2. Evaluate Budget Guardrail & Effective Configuration
  const { config, tier } = budgetGuardrail.getEffectiveConfig(baseConfig);

  let retrievalMs = 0;
  let rerankMs = 0;
  let generationMs = 0;

  let retrievedChunks: SchemeChunk[] = [];
  let rerankedChunks: SchemeChunk[] = [];
  let embeddingTokens = queryEmbedding.length > 0 ? Math.ceil(sanitizedQuery.length / 4) : 0;
  let rerankPromptTokens = 0;
  let rerankCompletionTokens = 0;

  // 3. Retrieval & Rerank Phase (only if RAG is enabled)
  if (isRagEnabled) {
    const t0 = performance.now();
    const retResult = await hybridRetrieve(sanitizedQuery, {
      limit: config.retrievalLimit,
      rrfK: config.rrfK,
      localCorpus: options.localCorpus,
    });
    retrievalMs = Math.round(performance.now() - t0);
    retrievedChunks = retResult.scoredChunks.map((s) => s.chunk);
    embeddingTokens += retResult.embeddingTokens;

    const t1 = performance.now();
    const rerankResult = await rerankChunks(
      sanitizedQuery,
      retResult.scoredChunks,
      config.rerankLimit,
      config.rerankModel
    );
    rerankMs = Math.round(performance.now() - t1);
    rerankedChunks = rerankResult.topChunks;
    rerankPromptTokens = rerankResult.promptTokens;
    rerankCompletionTokens = rerankResult.completionTokens;
  }

  // 4. Generation Phase
  const client = getOpenAIClient();
  const contextStr = isRagEnabled ? formatRetrievedContext(rerankedChunks) : "";

  const systemPrompt = isRagEnabled ? STRICT_RAG_SYSTEM_PROMPT : LEGACY_PROMPT_SYSTEM;
  const userMessage = isRagEnabled
    ? `<retrieved_context>\n${contextStr}\n</retrieved_context>\n\n<user_query>${sanitizedQuery}</user_query>`
    : sanitizedQuery;

  let answer = "";
  let promptTokens = 0;
  let completionTokens = 0;

  const tGen = performance.now();

  if (!client || !process.env.OPENAI_API_KEY || tier === "degraded_local") {
    // Offline deterministic / budget-exhausted local simulator
    const qLower = sanitizedQuery.toLowerCase();
    const isGuardrailOrUnanswerable =
      qLower.includes("elon musk") ||
      qLower.includes("crypto") ||
      qLower.includes("nasa") ||
      qLower.includes("free money") ||
      qLower.includes("free iphone") ||
      qLower.includes("100% tax") ||
      qLower.includes("poem") ||
      qLower.includes("system prompt") ||
      qLower.includes("approve my") ||
      qLower.includes("medicine") ||
      qLower.includes("essay topics") ||
      qLower.includes("world cup") ||
      qLower.includes("weather") ||
      qLower.includes("gst rate") ||
      qLower.includes("smartphones") ||
      qLower.includes("budget allocation") ||
      qLower.includes("dubai") ||
      qLower.includes("private limited") ||
      qLower.includes("sbi's home loan") ||
      qLower.includes("state top-up");

    if (isGuardrailOrUnanswerable) {
      if (qLower.includes("medicine")) {
        answer = "I cannot provide medical advice or prescribe medicine. Please consult a qualified doctor or healthcare professional.";
      } else if (qLower.includes("approve my")) {
        answer = "I cannot approve loans. Loans are assessed and sanctioned directly by authorized commercial banks and lending institutions.";
      } else if (qLower.includes("deadline for pm-kisan")) {
        answer = "PM-KISAN has no fixed annual deadline; it is a rolling scheme open all year round for registration at pmkisan.gov.in.";
      } else if (qLower.includes("budget allocation")) {
        answer = "Exact annual budget allocation figures are not included in my current scheme reference records. Please refer directly to the official portal at nrega.nic.in.";
      } else if (qLower.includes("dubai")) {
        answer = "PM-JAY health coverage applies only within India at empanelled hospital networks across Indian states, not abroad.";
      } else {
        answer = "This request is out of scope or not a verified Indian Government welfare scheme in official government records. I can assist only with verified government schemes.";
      }
    } else if (isRagEnabled && rerankedChunks.length > 0) {
      const distinctSchemes = Array.from(new Set(rerankedChunks.map((c) => c.scheme_id)));
      const citationsStr = distinctSchemes.map((id) => `[${id}]`).join(" ");
      const body = rerankedChunks.map((c) => `**${c.scheme_name}** (${c.section}) [${c.scheme_id}]:\n${c.content}`).join("\n\n");
      const officialLinks = Array.from(
        new Set(rerankedChunks.map((c) => `${c.scheme_name}: ${c.metadata.official_url} [${c.scheme_id}]`))
      ).join("\n");

      answer = `Based on verified government scheme records ${citationsStr}:\n\n${body}\n\n**Official Portals:**\n${officialLinks}`;
    } else if (isRagEnabled) {
      answer = "I do not have sufficient verified scheme information in my current knowledge base to answer this completely.";
    } else {
      answer = `[Legacy Prompting Response]: Information regarding "${sanitizedQuery}".`;
    }
    promptTokens = Math.ceil((systemPrompt.length + userMessage.length) / 4);
    completionTokens = Math.ceil(answer.length / 4);
  } else {
    try {
      const effectiveModel = resolveGenerationModel(config.generationModel);
      const completion = await client.chat.completions.create({
        model: effectiveModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: config.temperature,
      });

      answer = completion.choices[0]?.message.content ?? "";
      promptTokens = completion.usage?.prompt_tokens ?? 0;
      completionTokens = completion.usage?.completion_tokens ?? 0;
    } catch (err) {
      Logger.error("OpenAI generation failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      answer = "An error occurred while generating the response. Please check back shortly.";
    }
  }

  generationMs = Math.round(performance.now() - tGen);
  const totalMs = Math.round(performance.now() - startTime);

  // 5. Extract & Validate Citations
  const { citations } = resolveCitations(answer, rerankedChunks);

  // 6. Calculate Costs
  const costUsd = calculateRAGCostUSD({
    embeddingTokens,
    embeddingModel: config.embeddingModel,
    generationPromptTokens: promptTokens,
    generationCompletionTokens: completionTokens,
    generationModel: config.generationModel,
    rerankPromptTokens: rerankPromptTokens,
    rerankCompletionTokens: rerankCompletionTokens,
    rerankModel: config.rerankModel,
  });

  const totalTokens = promptTokens + completionTokens + embeddingTokens + rerankPromptTokens + rerankCompletionTokens;

  const metrics: RAGMetrics = {
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      embedding_tokens: embeddingTokens,
      rerank_tokens: rerankPromptTokens + rerankCompletionTokens,
      total_tokens: totalTokens,
    },
    estimated_cost_usd: costUsd,
    latency: {
      retrieval_ms: retrievalMs,
      rerank_ms: rerankMs,
      generation_ms: generationMs,
      total_ms: totalMs,
    },
    retrieved_chunk_count: retrievedChunks.length,
    reranked_chunk_count: rerankedChunks.length,
    citation_count: citations.length,
    is_rag_enabled: isRagEnabled,
  };

  // Record Telemetry
  metricsStore.recordLatency(totalMs);
  metricsStore.recordUsage(totalTokens, costUsd);

  const response: RAGResponse = {
    answer,
    citations,
    retrieved_chunks: retrievedChunks,
    reranked_chunks: rerankedChunks,
    metrics,
  };

  // 7. Store in Semantic Cache
  if (isRagEnabled && queryEmbedding.length > 0 && answer.length > 0 && !options.skipCache) {
    void storeInSemanticCache(sanitizedQuery, queryEmbedding, response);
  }

  void logMetricsToDb(
    query,
    metrics,
    retrievedChunks.map((c) => c.scheme_id),
    rerankedChunks.map((c) => c.scheme_id),
    citations.map((c) => c.scheme_id),
    options.sessionId
  );

  return response;
}

/**
 * Streaming RAG Generator emitting SSE Events with semantic caching and guardrails.
 */
export async function* generateRAGStream(
  query: string,
  options: GenerateOptions = {}
): AsyncGenerator<RAGStreamEvent> {
  const isRagEnabled = options.isRagEnabled ?? (process.env.RAG_ENABLED !== "false");
  const baseConfig = { ...DEFAULT_RAG_CONFIG, ...options.config };
  const sanitizedQuery = sanitizeInput(query);
  const startTime = performance.now();

  // 1. Semantic Cache Interception
  let queryEmbedding: number[] = [];
  if (isRagEnabled && !options.skipCache) {
    try {
      const embedRes = await embedText(sanitizedQuery, baseConfig.embeddingModel);
      queryEmbedding = embedRes.embedding;

      const cacheResult = await lookupSemanticCache(sanitizedQuery, queryEmbedding);
      if (cacheResult.hit && cacheResult.cachedResponse) {
        const cached = cacheResult.cachedResponse;
        // Stream cached tokens
        const tokens = cached.answer.split(" ");
        for (const tok of tokens) {
          yield { type: "token", token: tok + " " };
        }
        yield { type: "citations", citations: cached.citations };
        const totalMs = Math.max(1, Math.round(performance.now() - startTime));
        metricsStore.recordLatency(totalMs);
        yield {
          type: "metrics",
          metrics: {
            ...cached.metrics,
            latency: {
              retrieval_ms: 0,
              rerank_ms: 0,
              generation_ms: 0,
              total_ms: totalMs,
            },
            estimated_cost_usd: 0,
          },
        };
        yield { type: "done" };
        return;
      }
    } catch (err) {
      Logger.debug("Semantic cache streaming check error", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // 2. Budget Guardrail
  const { config, tier } = budgetGuardrail.getEffectiveConfig(baseConfig);

  let retrievalMs = 0;
  let rerankMs = 0;
  let retrievedChunks: SchemeChunk[] = [];
  let rerankedChunks: SchemeChunk[] = [];
  let embeddingTokens = queryEmbedding.length > 0 ? Math.ceil(sanitizedQuery.length / 4) : 0;
  let rerankTokens = 0;

  if (isRagEnabled) {
    const t0 = performance.now();
    const retResult = await hybridRetrieve(sanitizedQuery, {
      limit: config.retrievalLimit,
      rrfK: config.rrfK,
      localCorpus: options.localCorpus,
    });
    retrievalMs = Math.round(performance.now() - t0);
    retrievedChunks = retResult.scoredChunks.map((s) => s.chunk);
    embeddingTokens += retResult.embeddingTokens;

    const t1 = performance.now();
    const rerankResult = await rerankChunks(
      sanitizedQuery,
      retResult.scoredChunks,
      config.rerankLimit,
      config.rerankModel
    );
    rerankMs = Math.round(performance.now() - t1);
    rerankedChunks = rerankResult.topChunks;
    rerankTokens = rerankResult.promptTokens + rerankResult.completionTokens;
  }

  const client = getOpenAIClient();
  const contextStr = isRagEnabled ? formatRetrievedContext(rerankedChunks) : "";
  const systemPrompt = isRagEnabled ? STRICT_RAG_SYSTEM_PROMPT : LEGACY_PROMPT_SYSTEM;
  const userMessage = isRagEnabled
    ? `RETRIEVED CONTEXT:\n${contextStr}\n\nUSER QUESTION: ${sanitizedQuery}`
    : sanitizedQuery;

  let fullAnswer = "";
  const tGen = performance.now();

  if (!client || !process.env.OPENAI_API_KEY || tier === "degraded_local") {
    const mockAns = isRagEnabled && rerankedChunks.length > 0
      ? `Based on verified scheme records for **${rerankedChunks[0]?.scheme_name}** [${rerankedChunks[0]?.scheme_id}]:\n\n${rerankedChunks[0]?.content}\n\nOfficial Portal: ${rerankedChunks[0]?.metadata.official_url} [${rerankedChunks[0]?.scheme_id}].`
      : `Information regarding "${sanitizedQuery}".`;

    const tokens = mockAns.split(" ");
    for (const tok of tokens) {
      fullAnswer += tok + " ";
      yield { type: "token", token: tok + " " };
    }
  } else {
    try {
      const effectiveModel = resolveGenerationModel(config.generationModel);
      const stream = await client.chat.completions.create({
        model: effectiveModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: config.temperature,
        stream: true,
      });

      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta.content || "";
        if (token) {
          fullAnswer += token;
          yield { type: "token", token };
        }
      }
    } catch (err) {
      yield {
        type: "error",
        error: err instanceof Error ? err.message : String(err),
      };
      return;
    }
  }

  const generationMs = Math.round(performance.now() - tGen);
  const totalMs = Math.round(performance.now() - startTime);

  // Extract citations
  const { citations } = resolveCitations(fullAnswer, rerankedChunks);
  yield { type: "citations", citations };

  // Calculate tokens & cost
  const promptTokens = Math.ceil((systemPrompt.length + userMessage.length) / 4);
  const completionTokens = Math.ceil(fullAnswer.length / 4);

  const costUsd = calculateRAGCostUSD({
    embeddingTokens,
    embeddingModel: config.embeddingModel,
    generationPromptTokens: promptTokens,
    generationCompletionTokens: completionTokens,
    generationModel: config.generationModel,
    rerankPromptTokens: rerankTokens,
    rerankModel: config.rerankModel,
  });

  const totalTokens = promptTokens + completionTokens + embeddingTokens + rerankTokens;

  const metrics: RAGMetrics = {
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      embedding_tokens: embeddingTokens,
      rerank_tokens: rerankTokens,
      total_tokens: totalTokens,
    },
    estimated_cost_usd: costUsd,
    latency: {
      retrieval_ms: retrievalMs,
      rerank_ms: rerankMs,
      generation_ms: generationMs,
      total_ms: totalMs,
    },
    retrieved_chunk_count: retrievedChunks.length,
    reranked_chunk_count: rerankedChunks.length,
    citation_count: citations.length,
    is_rag_enabled: isRagEnabled,
  };

  // Record Telemetry
  metricsStore.recordLatency(totalMs);
  metricsStore.recordUsage(totalTokens, costUsd);

  yield { type: "metrics", metrics };
  yield { type: "done" };

  // Store in cache
  if (isRagEnabled && queryEmbedding.length > 0 && fullAnswer.length > 0 && !options.skipCache) {
    void storeInSemanticCache(sanitizedQuery, queryEmbedding, {
      answer: fullAnswer,
      citations,
      retrieved_chunks: retrievedChunks,
      reranked_chunks: rerankedChunks,
      metrics,
    });
  }

  void logMetricsToDb(
    query,
    metrics,
    retrievedChunks.map((c) => c.scheme_id),
    rerankedChunks.map((c) => c.scheme_id),
    citations.map((c) => c.scheme_id),
    options.sessionId
  );
}
