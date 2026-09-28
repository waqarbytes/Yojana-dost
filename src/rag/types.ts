/**
 * Types and Interfaces for Yojana Dost RAG Pipeline & Evaluation
 */

export type SchemeSection =
  | "overview"
  | "eligibility"
  | "benefits"
  | "application_steps"
  | "additional_info";

export interface SchemeChunkMetadata {
  scheme_id: string;
  scheme_name: string;
  ministry: string;
  category: string;
  state_scope: string[];
  official_url: string;
  application_deadline?: string;
  [key: string]: unknown;
}

export interface SchemeChunk {
  id?: string;
  scheme_id: string;
  scheme_name: string;
  section: SchemeSection;
  chunk_index: number;
  content: string;
  metadata: SchemeChunkMetadata;
  embedding?: number[];
}

export interface ScoredChunk {
  chunk: SchemeChunk;
  vector_similarity: number;
  fulltext_score: number;
  rrf_score: number;
  rerank_score?: number;
  final_rank?: number;
}

export interface Citation {
  scheme_id: string;
  scheme_name: string;
  section: SchemeSection;
  official_url: string;
  snippet?: string;
}

export interface LatencyBreakdown {
  retrieval_ms: number;
  rerank_ms: number;
  generation_ms: number;
  total_ms: number;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  embedding_tokens: number;
  rerank_tokens: number;
  total_tokens: number;
}

export interface RAGMetrics {
  usage: TokenUsage;
  estimated_cost_usd: number;
  latency: LatencyBreakdown;
  retrieved_chunk_count: number;
  reranked_chunk_count: number;
  citation_count: number;
  is_rag_enabled: boolean;
}

export interface RAGStreamEvent {
  type: "token" | "citations" | "metrics" | "error" | "done";
  token?: string;
  citations?: Citation[];
  metrics?: RAGMetrics;
  error?: string;
}

export interface RAGResponse {
  answer: string;
  citations: Citation[];
  retrieved_chunks: SchemeChunk[];
  reranked_chunks: SchemeChunk[];
  metrics: RAGMetrics;
}

export interface RAGPipelineConfig {
  embeddingModel: string;
  generationModel: string;
  rerankModel: string;
  retrievalLimit: number;
  rerankLimit: number;
  rrfK: number;
  temperature: number;
}

export const DEFAULT_RAG_CONFIG: RAGPipelineConfig = {
  embeddingModel: "text-embedding-3-small",
  generationModel: "gpt-4o",
  rerankModel: "gpt-4o-mini",
  retrievalLimit: 10,
  rerankLimit: 4,
  rrfK: 60,
  temperature: 0.1,
};
