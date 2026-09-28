/**
 * Embedding Client for OpenAI text-embedding-3-small (1536 dimensions).
 * Supports batching, caching, and deterministic offline mock fallback for unit tests.
 */

import { OpenAI } from "openai";
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

/**
 * Deterministic unit-vector generator for offline development & tests when OPENAI_API_KEY is not configured.
 */
function generateDeterministicOfflineEmbedding(text: string, dimensions = 1536): number[] {
  const vector = new Array<number>(dimensions).fill(0);
  const normalized = text.toLowerCase().trim();

  let seed = 0;
  for (let i = 0; i < normalized.length; i++) {
    seed = (seed * 31 + normalized.charCodeAt(i)) >>> 0;
  }

  for (let i = 0; i < dimensions; i++) {
    const x = Math.sin(seed + i) * 10000;
    vector[i] = x - Math.floor(x) - 0.5;
  }

  // Normalize to unit length for cosine similarity
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += (vector[i] ?? 0) * (vector[i] ?? 0);
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] = (vector[i] ?? 0) / norm;
    }
  }

  return vector;
}

export interface EmbeddingResult {
  embeddings: number[][];
  tokensUsed: number;
  model: string;
}

/**
 * Embeds a single query or text string.
 */
export async function embedText(
  text: string,
  model = "text-embedding-3-small"
): Promise<{ embedding: number[]; tokensUsed: number }> {
  const result = await embedTexts([text], model);
  return {
    embedding: result.embeddings[0] ?? [],
    tokensUsed: result.tokensUsed,
  };
}

/**
 * Embeds multiple text strings in batches.
 */
export async function embedTexts(
  texts: string[],
  model = "text-embedding-3-small"
): Promise<EmbeddingResult> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NVIDIA_API_KEY || "";
  const isRealOpenAI = apiKey.startsWith("sk-") && !process.env.OPENAI_BASE_URL?.includes("nvidia.com");
  const client = isRealOpenAI ? getOpenAIClient() : null;

  if (!client) {
    Logger.debug("Using deterministic offline embeddings (1536-dim).");
    const embeddings = texts.map((t) => generateDeterministicOfflineEmbedding(t, 1536));
    const estimatedTokens = texts.reduce((acc, t) => acc + Math.ceil(t.length / 4), 0);
    return {
      embeddings,
      tokensUsed: estimatedTokens,
      model: `${model}-offline-simulated`,
    };
  }

  try {
    const response = await client.embeddings.create({
      model,
      input: texts,
      encoding_format: "float",
    });

    const embeddings = response.data.map((item: { embedding: number[] }) => item.embedding);
    const tokensUsed = response.usage.total_tokens;

    return {
      embeddings,
      tokensUsed,
      model,
    };
  } catch (error) {
    Logger.warn("OpenAI embeddings failed, falling back to deterministic embeddings", {
      error: error instanceof Error ? error.message : String(error),
    });
    const embeddings = texts.map((t) => generateDeterministicOfflineEmbedding(t, 1536));
    const estimatedTokens = texts.reduce((acc, t) => acc + Math.ceil(t.length / 4), 0);
    return {
      embeddings,
      tokensUsed: estimatedTokens,
      model: `${model}-fallback-simulated`,
    };
  }
}
