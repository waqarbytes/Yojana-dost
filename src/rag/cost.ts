/**
 * Cost & Token Accounting for OpenAI RAG Pipeline.
 * Computes exact USD cost estimates based on official OpenAI pricing.
 */

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

export const OPENAI_PRICING: Record<string, ModelPricing> = {
  "text-embedding-3-small": {
    inputPerMillion: 0.02,
    outputPerMillion: 0.0,
  },
  "text-embedding-3-large": {
    inputPerMillion: 0.13,
    outputPerMillion: 0.0,
  },
  "gpt-4o": {
    inputPerMillion: 2.5,
    outputPerMillion: 10.0,
  },
  "gpt-4o-mini": {
    inputPerMillion: 0.15,
    outputPerMillion: 0.6,
  },
  "gpt-4-turbo": {
    inputPerMillion: 10.0,
    outputPerMillion: 30.0,
  },
};

export interface CostCalculationParams {
  embeddingTokens?: number;
  embeddingModel?: string;
  generationPromptTokens?: number;
  generationCompletionTokens?: number;
  generationModel?: string;
  rerankPromptTokens?: number;
  rerankCompletionTokens?: number;
  rerankModel?: string;
}

/**
 * Calculates the exact estimated cost in USD for a complete RAG query lifecycle.
 */
export function calculateRAGCostUSD(params: CostCalculationParams): number {
  let totalCost = 0;

  // 1. Embedding cost
  if (params.embeddingTokens && params.embeddingTokens > 0) {
    const model = params.embeddingModel ?? "text-embedding-3-small";
    const pricing = OPENAI_PRICING[model] ?? OPENAI_PRICING["text-embedding-3-small"]!;
    totalCost += (params.embeddingTokens / 1_000_000) * pricing.inputPerMillion;
  }

  // 2. Generation cost
  if (params.generationPromptTokens || params.generationCompletionTokens) {
    const model = params.generationModel ?? "gpt-4o";
    const pricing = OPENAI_PRICING[model] ?? OPENAI_PRICING["gpt-4o"]!;
    const inputCost = ((params.generationPromptTokens ?? 0) / 1_000_000) * pricing.inputPerMillion;
    const outputCost = ((params.generationCompletionTokens ?? 0) / 1_000_000) * pricing.outputPerMillion;
    totalCost += inputCost + outputCost;
  }

  // 3. Reranking cost
  if (params.rerankPromptTokens || params.rerankCompletionTokens) {
    const model = params.rerankModel ?? "gpt-4o-mini";
    const pricing = OPENAI_PRICING[model] ?? OPENAI_PRICING["gpt-4o-mini"]!;
    const inputCost = ((params.rerankPromptTokens ?? 0) / 1_000_000) * pricing.inputPerMillion;
    const outputCost = ((params.rerankCompletionTokens ?? 0) / 1_000_000) * pricing.outputPerMillion;
    totalCost += inputCost + outputCost;
  }

  return Number(totalCost.toFixed(6));
}
