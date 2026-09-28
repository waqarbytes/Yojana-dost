/**
 * Hybrid Retrieval Engine for Indian Government Welfare Schemes.
 * Combines dense pgvector cosine similarity with sparse full-text search (tsvector/BM25)
 * via Reciprocal Rank Fusion (RRF with k=60) and multi-entity stratified candidate selection.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { embedText } from "./embed.js";
import type { SchemeChunk, ScoredChunk } from "./types.js";
import { Logger } from "../lib/logger.js";

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClientInstance) return supabaseClientInstance;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  supabaseClientInstance = createClient(url, key);
  return supabaseClientInstance;
}

/**
 * Common English and conversational stopwords to ignore during sparse keyword scoring.
 */
const STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
  "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
  "below", "between", "both", "but", "by", "can", "can't", "cannot", "could",
  "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from",
  "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself",
  "him", "himself", "his", "how", "i", "if", "in", "into", "is", "isn't", "it",
  "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no",
  "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our",
  "ours", "ourselves", "out", "over", "own", "same", "she", "should", "so", "some",
  "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then",
  "there", "these", "they", "this", "those", "through", "to", "too", "under", "until",
  "up", "very", "was", "wasn't", "we", "were", "what", "when", "where", "which",
  "while", "who", "whom", "why", "with", "would", "you", "your", "yours", "yourself",
  "yourselves", "give", "given", "much", "many", "tell", "details", "difference", "compare",
  "scheme", "yojana", "sarkari", "kaunsi", "hai", "ke", "liye", "karna", "chahiye", "me", "ko"
]);

/**
 * Known Indian government scheme aliases, acronym expansions, and colloquial search tokens.
 */
const SCHEME_ALIASES: Record<string, string[]> = {
  "pm-kisan": ["pm-kisan", "pm kisan", "pmkisan", "kisan samman nidhi", "farmer income", "kisan", "paise milenge"],
  "pm-jay-ayushman": ["pm-jay", "pm jay", "pmjay", "ayushman bharat", "ab-pmjay", "ayushman", "hospital ka bada bill", "hospital treatment", "5 lakh health"],
  "mgnrega": ["mgnrega", "nrega", "rural employment", "100 days", "unskilled manual wage", "job card", "kaam chahiye", "zameen nahi"],
  "pmjdy": ["pmjdy", "jan dhan", "jan dhan yojana", "zero balance account", "rupay debit card"],
  "pm-ujjwala-yojana": ["pmuy", "ujjwala", "pm ujjwala", "lpg connection", "gas cylinder", "free cylinder", "free gas cylinder"],
  "sukanya-samriddhi-yojana": ["ssy", "sukanya", "sukanya samriddhi", "girl child", "beti", "beti ke liye"],
  "kcc": ["kcc", "kisan credit card", "crop loan", "credit card for farmer"],
  "fasal-bima": ["pmfby", "fasal bima", "pm fasal bima", "crop insurance", "insures my crops"],
  "pm-mudra-yojana": ["mudra", "pm mudra", "shishu", "kishore", "tarun", "mudra loan", "bina paisa ke business", "small business without collateral"],
  "atal-pension-yojana": ["apy", "atal pension", "pension yojana"],
  "pm-svanidhi": ["pmsvanidhi", "pm svanidhi", "svanidhi", "street vendor", "chhote dukaan", "shopkeeper", "thela"],
  "matru-vandana": ["pmmvy", "matru vandana", "maternity benefit", "first living child", "pregnant woman", "baby girl"],
  "pm-vishwakarma": ["vishwakarma", "pm vishwakarma", "artisan", "craftsperson", "toolkit incentive", "traditional trade"],
  "enam": ["enam", "e-nam", "national agriculture market", "apmc mandi", "electronic trading"],
  "pgkay": ["pgkay", "garib kalyan anna", "free ration", "free foodgrains", "nfsa"],
  "pmmsy": ["pmmsy", "matsya sampada", "fisheries", "fisherman", "fish farming"],
  "ddugky": ["ddugky", "ddu-gky", "deen dayal upadhyaya grameen kaushalya", "rural youth skill", "placement"],
  "nfbs": ["nfbs", "national family benefit", "breadwinner death", "family benefit scheme"],
  "jjm": ["jjm", "jal jeevan", "tap water", "drinking water mission"],
  "stand-up-india": ["standup-india", "stand up india", "standup india", "sc entrepreneur", "greenfield"],
  "pmsym": ["pmsym", "shram yogi", "shram yogi maandhan", "unorganised worker pension"],
  "nsap-oap": ["nsap-oap", "nsap old age", "ignoaps", "old age pension", "nsap", "old age pension apply"],
  "nsap-widow": ["nsap-widow", "nsap widow", "ignwps", "widow pension", "widow in a village"],
  "nsap-disability": ["nsap-disability", "nsap disability", "igndps", "disability pension"],
  "pmkvy": ["pmkvy", "kaushal vikas", "skill training", "short term training", "pmkvy training"],
  "pmksy": ["pmksy", "krishi sinchayee", "irrigation", "micro irrigation", "per drop more crop"],
  "sbm-g": ["sbm-g", "swachh bharat", "toilet grant", "ihhl"],
  "smam": ["smam", "agricultural mechanization", "farm machinery", "farming machine", "tractor subsidy"],
  "pm-suraksha-bima": ["pmsby", "suraksha bima", "accidental insurance", "pm-suraksha-bima"],
  "pm-jeevan-jyoti": ["pmjjby", "jeevan jyoti", "life insurance", "pm-jeevan-jyoti"],
  "pm-awas-yojana-gramin": ["pmay-g", "pmay-gramin", "pmay gramin", "awas gramin", "rural housing", "ghar banane", "housing for rural"],
  "pm-awas-yojana-urban": ["pmay-u", "pmay-urban", "pmay urban", "awas urban", "clss", "urban housing", "housing for urban", "apply online for pmay-u"],
  "pm-kisan-man-dhan": ["pm-kmy", "pm-kisan-maandhan", "maan dhan", "mandhan", "farmer pension", "kisan pension yojana", "pension for farmers"],
  "karnataka-gruha-lakshmi": ["gruha lakshmi", "karnataka gruha lakshmi", "gruhalakshmi"],
  "maharashtra-ladki-bahin": ["ladki bahin", "majhi ladki bahin", "maharashtra ladki bahin"],
  "delhi-free-bus-pink-pass": ["pink pass", "pink ticket", "delhi bus", "dtc free bus", "women bus pass"],
};

/**
 * Computes cosine similarity between two unit vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const valA = a[i] ?? 0;
    const valB = b[i] ?? 0;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Computes BM25-style keyword relevance score with stopword filtering and entity boosting.
 */
export function calculateKeywordScore(query: string, text: string, schemeId?: string, schemeName?: string): number {
  const queryLower = query.toLowerCase().trim();
  const textLower = text.toLowerCase();

  const queryTokens = queryLower
    .split(/[\s\-_\/,.:;?!()]+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));

  if (queryTokens.length === 0) return 0;

  let score = 0;

  // Exact phrase substring match bonus
  if (queryLower.length > 5 && textLower.includes(queryLower)) {
    score += 10.0;
  }

  // Alias & Acronym Matching Boost
  if (schemeId) {
    const normId = schemeId.toLowerCase();
    const aliases = SCHEME_ALIASES[normId] || [];
    for (const alias of [normId, ...(schemeName ? [schemeName.toLowerCase()] : []), ...aliases]) {
      if (queryLower.includes(alias)) {
        score += 25.0;
      }
    }
  }

  for (const token of queryTokens) {
    if (textLower.includes(token)) {
      const occurrences = textLower.split(token).length - 1;
      const isSalient = token.length > 4 || [
        "kisan", "mudra", "pink", "bahin", "shishu", "tarun", "pmsby", "pmjjby", "apy", "ssy",
        "dtc", "bima", "pension", "ujjwala", "poshan", "mgnrega", "nrega", "svanidhi", "vishwakarma",
        "enam", "pgkay", "pmmsy", "ddugky", "nfbs", "jjm", "standup", "pmsym", "ignoaps", "smam"
      ].includes(token);
      const weight = isSalient ? 4.0 : 1.0;
      score += weight * (1.0 + Math.log1p(occurrences));
    }
  }

  return score;
}

/**
 * Performs Reciprocal Rank Fusion (RRF) over dense and sparse ranked lists.
 * Formula: RRF_score(d) = sum_{m in models} 1 / (k + rank_m(d))
 */
export function reciprocalRankFusion(
  vectorRanked: SchemeChunk[],
  textRanked: SchemeChunk[],
  k = 60
): ScoredChunk[] {
  const scoreMap = new Map<
    string,
    {
      chunk: SchemeChunk;
      vectorRank: number;
      textRank: number;
      rrfScore: number;
      vectorSim: number;
      fulltextScore: number;
    }
  >();

  // 1. Process Sparse Text Ranks (Dominant weight for exact keyword/entity matching)
  textRanked.forEach((chunk, index) => {
    const key = `${chunk.scheme_id}_${chunk.section}_${chunk.chunk_index}`;
    const rank = index + 1;
    const rrfComponent = 2.0 / (k + rank);

    scoreMap.set(key, {
      chunk,
      vectorRank: 9999,
      textRank: rank,
      rrfScore: rrfComponent,
      vectorSim: 0,
      fulltextScore: Math.max(0.1, 1 - index * 0.05),
    });
  });

  // 2. Process Vector Ranks (Only add vector rank if present)
  vectorRanked.forEach((chunk, index) => {
    const key = `${chunk.scheme_id}_${chunk.section}_${chunk.chunk_index}`;
    const rank = index + 1;
    const rrfComponent = 0.5 / (k + rank);

    const existing = scoreMap.get(key);
    if (existing) {
      existing.vectorRank = rank;
      existing.rrfScore += rrfComponent;
      existing.vectorSim = Math.max(0.1, 1 - index * 0.05);
    } else {
      scoreMap.set(key, {
        chunk,
        vectorRank: rank,
        textRank: 9999,
        rrfScore: rrfComponent,
        vectorSim: Math.max(0.1, 1 - index * 0.05),
        fulltextScore: 0,
      });
    }
  });

  const merged = Array.from(scoreMap.values()).map((entry) => ({
    chunk: entry.chunk,
    vector_similarity: entry.vectorSim,
    fulltext_score: entry.fulltextScore,
    rrf_score: entry.rrfScore,
  }));

  merged.sort((a, b) => b.rrf_score - a.rrf_score);
  return merged;
}

export interface HybridRetrieveOptions {
  limit?: number;
  rrfK?: number;
  state?: string;
  category?: string;
  localCorpus?: SchemeChunk[];
}

/**
 * Hybrid retrieval: Vector Cosine + Full-Text Search + Reciprocal Rank Fusion + Multi-Entity Stratification.
 */
export async function hybridRetrieve(
  query: string,
  options: HybridRetrieveOptions = {}
): Promise<{ scoredChunks: ScoredChunk[]; embeddingTokens: number }> {
  const limit = options.limit ?? 10;
  const rrfK = options.rrfK ?? 60;
  const supabase = getSupabaseClient();

  // 1. Generate query embedding
  const { embedding, tokensUsed } = await embedText(query);

  // 2. If Supabase is connected, call RPC
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc("hybrid_scheme_search", {
        query_text: query,
        query_embedding: embedding,
        match_count: limit * 2,
        filter_state: options.state ?? null,
        filter_category: options.category ?? null,
      });

      if (!error && data && Array.isArray(data)) {
        const scored: ScoredChunk[] = data.map((row: any) => ({
          chunk: {
            id: row.id,
            scheme_id: row.scheme_id,
            scheme_name: row.scheme_name,
            section: row.section,
            chunk_index: row.chunk_index,
            content: row.content,
            metadata: row.metadata,
          },
          vector_similarity: row.similarity_score ?? 0,
          fulltext_score: row.fulltext_score ?? 0,
          rrf_score: row.combined_score ?? 0,
        }));
        return { scoredChunks: scored.slice(0, limit), embeddingTokens: tokensUsed };
      }
    } catch (err) {
      Logger.warn("Supabase hybrid RPC failed, falling back to local hybrid search", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // 3. In-Memory Local Hybrid Search
  const corpus = options.localCorpus ?? [];
  if (corpus.length === 0) {
    return { scoredChunks: [], embeddingTokens: tokensUsed };
  }

  // Full-text ranking with BM25 & alias expansion
  const textRanked = corpus
    .map((chunk) => {
      const score = calculateKeywordScore(
        query,
        `${chunk.scheme_name} ${chunk.scheme_id} ${chunk.section} ${chunk.content}`,
        chunk.scheme_id,
        chunk.scheme_name
      );
      return { chunk, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.chunk);

  // Vector ranking
  const vectorRanked = corpus
    .map((chunk) => {
      const sim = chunk.embedding && chunk.embedding.length > 0 ? cosineSimilarity(embedding, chunk.embedding) : 0;
      return { chunk, sim };
    })
    .sort((a, b) => b.sim - a.sim)
    .map((item) => item.chunk);

  const rrfResults = reciprocalRankFusion(vectorRanked, textRanked, rrfK);

  // 4. Stratified Multi-Entity Selection (Ensure representation for all schemes mentioned in query)
  const queryLower = query.toLowerCase();
  const detectedSchemeIds: string[] = [];

  for (const [id, aliases] of Object.entries(SCHEME_ALIASES)) {
    if (aliases.some((alias) => queryLower.includes(alias))) {
      detectedSchemeIds.push(id);
    }
  }

  if (detectedSchemeIds.length > 1) {
    // Multi-scheme query: guarantee candidate slots for each detected entity
    const selected: ScoredChunk[] = [];
    const seenChunks = new Set<string>();

    for (const targetId of detectedSchemeIds) {
      const entityChunks = rrfResults.filter(
        (item) => item.chunk.scheme_id.toLowerCase() === targetId.toLowerCase()
      );
      for (const item of entityChunks.slice(0, 3)) {
        const key = `${item.chunk.scheme_id}_${item.chunk.section}`;
        if (!seenChunks.has(key)) {
          seenChunks.add(key);
          selected.push(item);
        }
      }
    }

    // Fill remainder with top overall RRF results
    for (const item of rrfResults) {
      const key = `${item.chunk.scheme_id}_${item.chunk.section}`;
      if (!seenChunks.has(key) && selected.length < limit) {
        seenChunks.add(key);
        selected.push(item);
      }
    }

    return { scoredChunks: selected.slice(0, limit), embeddingTokens: tokensUsed };
  }

  return { scoredChunks: rrfResults.slice(0, limit), embeddingTokens: tokensUsed };
}
