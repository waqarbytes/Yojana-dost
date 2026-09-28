-- ============================================================================
-- Migration: 20260928010000_create_semantic_cache_and_metrics.sql
-- Description: Creates pgvector semantic cache table, RPC matching function (0.92 cosine threshold),
--              and telemetry metrics storage for Yojana Dost RAG.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Semantic Query Cache Table
CREATE TABLE IF NOT EXISTS public.semantic_query_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    response_json JSONB NOT NULL,
    scheme_ids_referenced TEXT[] NOT NULL DEFAULT '{}',
    hit_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- HNSW Vector Index on query embedding for sub-millisecond similarity lookup
CREATE INDEX IF NOT EXISTS idx_semantic_cache_embedding_hnsw
    ON public.semantic_query_cache
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_semantic_cache_expires_at
    ON public.semantic_query_cache (expires_at);

CREATE INDEX IF NOT EXISTS idx_semantic_cache_scheme_ids
    ON public.semantic_query_cache USING gin (scheme_ids_referenced);

-- 2. Semantic Cache Lookup RPC Function (Cosine similarity >= threshold)
CREATE OR REPLACE FUNCTION public.semantic_cache_lookup(
    p_query_embedding vector(1536),
    p_threshold FLOAT DEFAULT 0.92
)
RETURNS TABLE (
    id UUID,
    query_text TEXT,
    response_json JSONB,
    similarity FLOAT,
    scheme_ids_referenced TEXT[]
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.query_text,
        c.response_json,
        (1 - (c.embedding <=> p_query_embedding))::FLOAT AS similarity,
        c.scheme_ids_referenced
    FROM public.semantic_query_cache c
    WHERE c.expires_at > NOW()
      AND (1 - (c.embedding <=> p_query_embedding)) >= p_threshold
    ORDER BY (1 - (c.embedding <=> p_query_embedding)) DESC
    LIMIT 1;

    -- Update hit count asynchronously / atomically
    UPDATE public.semantic_query_cache
    SET hit_count = hit_count + 1
    WHERE public.semantic_query_cache.id IN (
        SELECT c.id FROM public.semantic_query_cache c
        WHERE c.expires_at > NOW()
          AND (1 - (c.embedding <=> p_query_embedding)) >= p_threshold
        ORDER BY (1 - (c.embedding <=> p_query_embedding)) DESC
        LIMIT 1
    );
END;
$$;

-- 3. RAG Telemetry Metrics Table
CREATE TABLE IF NOT EXISTS public.rag_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    query TEXT NOT NULL,
    retrieved_chunk_ids TEXT[] DEFAULT '{}',
    reranked_chunk_ids TEXT[] DEFAULT '{}',
    citation_scheme_ids TEXT[] DEFAULT '{}',
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    embedding_tokens INTEGER NOT NULL DEFAULT 0,
    rerank_tokens INTEGER NOT NULL DEFAULT 0,
    estimated_cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0.000000,
    latency_retrieval_ms INTEGER NOT NULL DEFAULT 0,
    latency_rerank_ms INTEGER NOT NULL DEFAULT 0,
    latency_generation_ms INTEGER NOT NULL DEFAULT 0,
    latency_total_ms INTEGER NOT NULL DEFAULT 0,
    is_rag_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rag_metrics_created_at
    ON public.rag_metrics (created_at DESC);
