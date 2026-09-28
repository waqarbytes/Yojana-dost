/**
 * Citation Parser and Verification Engine.
 * Extracts [scheme_id] markers from generated RAG text and maps them to verified source chunks and URLs.
 */

import type { Citation, SchemeChunk } from "./types.js";

const CITATION_REGEX = /\[([a-zA-Z0-9_\-]+)\]/g;

/**
 * Extracts unique cited scheme IDs from generated answer text.
 */
export function extractCitationIds(text: string): string[] {
  const ids: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = CITATION_REGEX.exec(text)) !== null) {
    const rawId = match[1]?.trim().toLowerCase();
    if (rawId && !ids.includes(rawId)) {
      ids.push(rawId);
    }
  }

  return ids;
}

const SCHEME_CANONICAL_ALIASES: Record<string, string> = {
  "pmay-g": "pm-awas-yojana-gramin",
  "pmay-gramin": "pm-awas-yojana-gramin",
  "pmay-u": "pm-awas-yojana-urban",
  "pmay-urban": "pm-awas-yojana-urban",
  "pmjay": "pm-jay-ayushman",
  "pm-jay": "pm-jay-ayushman",
  "pmsvanidhi": "pm-svanidhi",
  "pm-mudra": "pm-mudra-yojana",
  "mudra": "pm-mudra-yojana",
  "sukanya": "sukanya-samriddhi-yojana",
  "ssy": "sukanya-samriddhi-yojana",
  "pmuy": "pm-ujjwala-yojana",
  "ujjwala": "pm-ujjwala-yojana",
  "pmfby": "fasal-bima",
  "pmsby": "pm-suraksha-bima",
  "pmjjby": "pm-jeevan-jyoti",
  "apy": "atal-pension-yojana",
  "pmmvy": "matru-vandana",
  "vishwakarma": "pm-vishwakarma",
  "standup-india": "stand-up-india",
  "pm-kmy": "pm-kisan-man-dhan",
  "pm-kisan-maandhan": "pm-kisan-man-dhan",
  "pmkisan": "pm-kisan",
  "poshan-shakti": "pm-poshan-shakti",
  "poshan-abhiyaan": "pm-poshan-shakti",
};


export function canonicalizeSchemeId(id: string): string {
  const norm = id.toLowerCase().trim();
  return SCHEME_CANONICAL_ALIASES[norm] || norm;
}

/**
 * Resolves citation IDs into rich citation chip objects with official URLs.
 */
export function resolveCitations(
  text: string,
  availableChunks: SchemeChunk[]
): { citations: Citation[]; ungroundedIds: string[] } {
  const citedIds = extractCitationIds(text);
  const chunkMap = new Map<string, SchemeChunk>();

  for (const chunk of availableChunks) {
    const rawKey = chunk.scheme_id.toLowerCase();
    const canonKey = canonicalizeSchemeId(rawKey);
    if (!chunkMap.has(rawKey)) chunkMap.set(rawKey, chunk);
    if (!chunkMap.has(canonKey)) chunkMap.set(canonKey, chunk);
  }

  const citations: Citation[] = [];
  const ungroundedIds: string[] = [];

  for (const id of citedIds) {
    const match = chunkMap.get(id) || chunkMap.get(canonicalizeSchemeId(id));
    if (match) {
      citations.push({
        scheme_id: match.scheme_id,
        scheme_name: match.scheme_name,
        section: match.section,
        official_url: match.metadata.official_url,
        snippet: match.content.slice(0, 150) + "...",
      });
    } else {
      ungroundedIds.push(id);
    }
  }

  return { citations, ungroundedIds };
}


/**
 * Evaluates citation fidelity (how many citations in text were grounded in retrieved context).
 */
export function evaluateCitationFidelity(
  text: string,
  retrievedChunks: SchemeChunk[],
  groundTruthSchemeIds: string[]
): {
  precision: number;
  recall: number;
  f1: number;
  citedSchemeIds: string[];
  hallucinatedCitations: string[];
} {
  const citedSchemeIds = extractCitationIds(text);
  const retrievedIdSet = new Set(retrievedChunks.map((c) => c.scheme_id.toLowerCase()));
  const groundTruthSet = new Set(groundTruthSchemeIds.map((id) => id.toLowerCase()));

  if (citedSchemeIds.length === 0) {
    return {
      precision: 0,
      recall: 0,
      f1: 0,
      citedSchemeIds: [],
      hallucinatedCitations: [],
    };
  }

  // Precision: fraction of cited schemes that were actually in retrieved context
  const validCited = citedSchemeIds.filter((id) => retrievedIdSet.has(id));
  const hallucinatedCitations = citedSchemeIds.filter((id) => !retrievedIdSet.has(id));
  const precision = validCited.length / citedSchemeIds.length;

  // Recall: fraction of ground truth schemes that were cited
  const correctlyCitedGroundTruth = groundTruthSchemeIds.filter((gt) =>
    citedSchemeIds.includes(gt.toLowerCase())
  );
  const recall = groundTruthSet.size > 0 ? correctlyCitedGroundTruth.length / groundTruthSet.size : 1.0;

  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    precision: Number(precision.toFixed(4)),
    recall: Number(recall.toFixed(4)),
    f1: Number(f1.toFixed(4)),
    citedSchemeIds,
    hallucinatedCitations,
  };
}
