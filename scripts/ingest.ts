/**
 * Ingestion Script for Yojana Dost Scheme Knowledge Base.
 * Loads schemes from Supabase Postgres / JSON -> Smart Chunking -> text-embedding-3-small -> pgvector.
 * Fully Idempotent & Re-run safe.
 */

import { config } from "dotenv";
config();

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getSupabaseClient } from "../src/rag/retrieve.js";
import { chunkAllSchemes } from "../src/rag/chunk.js";
import { embedTexts } from "../src/rag/embed.js";
import { calculateRAGCostUSD } from "../src/rag/cost.js";
import { Logger } from "../src/lib/logger.js";
import type { Scheme } from "../src/lib/types.js";
import type { SchemeChunk } from "../src/rag/types.js";

async function loadSourceSchemes(): Promise<Scheme[]> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase.from("schemes").select("*");
      if (!error && data && data.length > 0) {
        Logger.info(`Loaded ${data.length} schemes from Supabase database table 'schemes'.`);
        return data as Scheme[];
      }
    } catch (err) {
      Logger.warn("Could not query Supabase 'schemes' table, falling back to local JSON dataset.", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Fallback to local files: prioritize data/schemes.json + src/data/schemes.json
  const currentDir = dirname(fileURLToPath(import.meta.url));

  const candidatePaths = [
    resolve(currentDir, "../data/schemes.json"),
    resolve(currentDir, "../yojanadostbackend/schemes.json"),
    resolve(currentDir, "../src/data/schemes.json"),
  ];

  const schemeMap = new Map<string, any>();

  for (const path of candidatePaths) {
    try {
      const raw = await readFile(path, "utf-8");
      const list = JSON.parse(raw) as any[];
      for (const item of list) {
        const id = String(item.id || "").trim().toLowerCase();
        if (id && !schemeMap.has(id)) {
          schemeMap.set(id, item);
        }
      }
    } catch {
      // ignore missing file
    }
  }

  const allSchemes = Array.from(schemeMap.values());
  Logger.info(`Loaded ${allSchemes.length} total unique schemes across local databases.`);
  return allSchemes;
}


export async function runIngestion(): Promise<{
  schemesProcessed: number;
  chunksCreated: number;
  totalTokensUsed: number;
  estimatedCostUsd: number;
}> {
  Logger.info("Starting Yojana Dost RAG Ingestion Pipeline...");
  const startTime = Date.now();

  // 1. Load source schemes
  const schemes = await loadSourceSchemes();
  if (schemes.length === 0) {
    Logger.warn("No schemes found to ingest.");
    return { schemesProcessed: 0, chunksCreated: 0, totalTokensUsed: 0, estimatedCostUsd: 0 };
  }

  // 2. Smart semantic chunking
  const chunks = chunkAllSchemes(schemes);
  Logger.info(`Generated ${chunks.length} smart semantic chunks across ${schemes.length} schemes.`);

  // 3. Batch embedding with text-embedding-3-small
  const batchSize = 50;
  const chunkContents = chunks.map((c) => `${c.scheme_name} ${c.section} ${c.content}`);
  let totalTokens = 0;
  const embeddedChunks: SchemeChunk[] = [];

  for (let i = 0; i < chunkContents.length; i += batchSize) {
    const batchTexts = chunkContents.slice(i, i + batchSize);
    const batchChunks = chunks.slice(i, i + batchSize);

    Logger.info(`Embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunkContents.length / batchSize)} (${batchTexts.length} chunks)...`);
    const { embeddings, tokensUsed } = await embedTexts(batchTexts, "text-embedding-3-small");
    totalTokens += tokensUsed;

    for (let j = 0; j < batchChunks.length; j++) {
      const c = batchChunks[j]!;
      embeddedChunks.push({
        ...c,
        embedding: embeddings[j] ?? [],
      });
    }
  }

  // 4. Save to Supabase pgvector table (Idempotent Upsert)
  const supabase = getSupabaseClient();
  if (supabase) {
    Logger.info("Persisting chunks and vector embeddings to Supabase 'scheme_chunks' table...");
    for (const chunk of embeddedChunks) {
      const { error } = await supabase.from("scheme_chunks").upsert(
        {
          scheme_id: chunk.scheme_id,
          scheme_name: chunk.scheme_name,
          section: chunk.section,
          chunk_index: chunk.chunk_index,
          content: chunk.content,
          metadata: chunk.metadata,
          embedding: chunk.embedding,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "scheme_id,section,chunk_index" }
      );

      if (error) {
        Logger.error(`Failed to upsert chunk for ${chunk.scheme_id} (${chunk.section})`, {
          error: error.message,
        });
      }
    }
    Logger.info("Supabase pgvector upsert completed successfully.");
  }

  // 5. Persist local cache file for offline development/evaluation
  try {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const cacheDir = resolve(currentDir, "../src/data");
    await mkdir(cacheDir, { recursive: true });
    const cachePath = resolve(cacheDir, "embedded_chunks.json");
    await writeFile(cachePath, JSON.stringify(embeddedChunks, null, 2), "utf-8");
    Logger.info(`Saved offline embedded chunk cache to ${cachePath}.`);
  } catch (err) {
    Logger.warn("Could not write offline cache file", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const cost = calculateRAGCostUSD({
    embeddingTokens: totalTokens,
    embeddingModel: "text-embedding-3-small",
  });

  // 6. Invalidate semantic cache since scheme knowledge base updated
  try {
    const { invalidateSemanticCache } = await import("../src/rag/cache.js");
    await invalidateSemanticCache();
    Logger.info("Triggered semantic cache invalidation hook across active nodes.");
  } catch (err) {
    Logger.debug("Semantic cache invalidation non-fatal error", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  Logger.info(`Ingestion finished in ${durationSec}s. Total tokens: ${totalTokens} ($${cost} USD).`);

  return {
    schemesProcessed: schemes.length,
    chunksCreated: embeddedChunks.length,
    totalTokensUsed: totalTokens,
    estimatedCostUsd: cost,
  };
}

// Run immediately if executed directly via CLI
if (process.argv[1] && process.argv[1].endsWith("ingest.ts")) {
  runIngestion()
    .then((stats) => {
      console.error("\n=== INGESTION SUMMARY ===");
      console.error(`Schemes Processed: ${stats.schemesProcessed}`);
      console.error(`Chunks Created:    ${stats.chunksCreated}`);
      console.error(`Tokens Consumed:   ${stats.totalTokensUsed}`);
      console.error(`Estimated Cost:    $${stats.estimatedCostUsd.toFixed(6)} USD`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Ingestion failed:", err);
      process.exit(1);
    });
}
