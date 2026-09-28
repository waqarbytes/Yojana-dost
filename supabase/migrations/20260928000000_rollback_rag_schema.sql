-- ============================================================================
-- Rollback Migration: 20260928000000_rollback_rag_schema.sql
-- Description: Reverts RAG embeddings table, metrics, RPC function, and indexes.
--              Existing application tables and RLS policies remain untouched.
-- ============================================================================

DROP FUNCTION IF EXISTS public.hybrid_scheme_search(TEXT, vector, INTEGER, FLOAT, FLOAT, TEXT, TEXT);

DROP TABLE IF EXISTS public.rag_metrics CASCADE;

DROP INDEX IF EXISTS public.idx_scheme_chunks_embedding_hnsw;
DROP INDEX IF EXISTS public.idx_scheme_chunks_fts;
DROP INDEX IF EXISTS public.idx_scheme_chunks_scheme_id;
DROP INDEX IF EXISTS public.idx_scheme_chunks_section;

DROP TABLE IF EXISTS public.scheme_chunks CASCADE;

-- Note: We do not drop the vector extension by default in case other services depend on it.
-- If full cleanup is required, uncomment below:
-- DROP EXTENSION IF EXISTS vector CASCADE;
