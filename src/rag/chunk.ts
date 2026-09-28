/**
 * Smart Semantic Chunker for Indian Government Welfare Schemes.
 * Chunks schemes into 4 distinct semantic sections: overview, eligibility, benefits, application_steps.
 * Each chunk carries complete contextual metadata (scheme_id, name, ministry, state_scope, official_url).
 */

import type { Scheme } from "../lib/types.js";
import type { SchemeChunk, SchemeChunkMetadata } from "./types.js";

export type RawSchemeInput = (Scheme | Record<string, unknown>) & {
  title?: string;
  url?: string;
  lastUpdated?: string;
  state?: string;
  type?: string;
  howToApply?: unknown;
  documents?: unknown;
  keywords?: string[];
  [key: string]: unknown;
};

/**
 * Creates standardized metadata for all chunks originating from a scheme.
 */
function createBaseMetadata(rawScheme: RawSchemeInput): SchemeChunkMetadata {
  const schemeId = String(rawScheme.id || "").trim();
  const schemeName = String(rawScheme.title || rawScheme.name || schemeId).trim();
  const ministry = String(rawScheme.ministry || rawScheme.type || "Government of India").trim();
  const category = String(rawScheme.category || "General Welfare").trim();
  const officialUrl = String(rawScheme.url || rawScheme.official_url || "").trim();
  const deadline = String(rawScheme.application_deadline || rawScheme.lastUpdated || "open_all_year").trim();

  let stateScope: string[] = ["All India"];
  if (Array.isArray(rawScheme.state_scope) && rawScheme.state_scope.length > 0) {
    stateScope = rawScheme.state_scope as string[];
  } else if (rawScheme.state && typeof rawScheme.state === "string") {
    stateScope = [rawScheme.state];
  } else if (rawScheme.type && typeof rawScheme.type === "string" && rawScheme.type !== "Central") {
    stateScope = [rawScheme.type];
  }

  return {
    scheme_id: schemeId,
    scheme_name: schemeName,
    ministry,
    category,
    state_scope: stateScope,
    official_url: officialUrl,
    application_deadline: deadline,
  };
}

/**
 * Formats eligibility rules into clear natural language for dense vector search and keyword retrieval.
 */
function formatEligibilityRules(rawScheme: RawSchemeInput, metadata: SchemeChunkMetadata): string {
  const eligibility = rawScheme.eligibility;

  if (typeof eligibility === "string" && eligibility.trim().length > 0) {
    return `Scheme: ${metadata.scheme_name} (${metadata.scheme_id})\nMinistry: ${metadata.ministry}\nState Scope: ${metadata.state_scope.join(", ")}\nEligibility Criteria:\n${eligibility.trim()}`;
  }

  if (Array.isArray(eligibility) && eligibility.length > 0) {
    const lines = eligibility.map((rule: unknown, idx: number) => {
      if (typeof rule === "string") return `${idx + 1}. ${rule}`;
      if (typeof rule === "object" && rule !== null) {
        const r = rule as Record<string, unknown>;
        return `${idx + 1}. ${r.description || r.field || "Rule"} [Condition: ${r.field} ${r.operator || "=="} ${JSON.stringify(r.value)}]`;
      }
      return `${idx + 1}. Condition specified in official scheme documentation`;
    });
    return `Scheme: ${metadata.scheme_name} (${metadata.scheme_id})\nMinistry: ${metadata.ministry}\nState Scope: ${metadata.state_scope.join(", ")}\nEligibility Criteria:\n${lines.join("\n")}`;
  }

  return `Eligibility criteria for ${metadata.scheme_name}: Open to eligible citizens meeting government guidelines.`;
}

/**
 * Formats application steps into ordered procedure text.
 */
function formatApplicationSteps(rawScheme: RawSchemeInput, metadata: SchemeChunkMetadata): string {
  const steps = rawScheme.application_steps || rawScheme.howToApply;
  const docs = Array.isArray(rawScheme.documents)
    ? rawScheme.documents.join(", ")
    : typeof rawScheme.documents === "string"
    ? rawScheme.documents
    : "";

  let procedureText = "";
  if (Array.isArray(steps)) {
    procedureText = steps.map((s: unknown, idx: number) => `Step ${idx + 1}: ${String(s)}`).join("\n");
  } else if (typeof steps === "string") {
    procedureText = steps;
  } else {
    procedureText = `Visit the official portal at ${metadata.official_url}.`;
  }

  const docsText = docs ? `\nRequired Documents: ${docs}` : "";
  return `Scheme: ${metadata.scheme_name} (${metadata.scheme_id})\nApplication Procedure & Official Links:\nOfficial Portal: ${metadata.official_url}\nDeadline: ${metadata.application_deadline}\nProcedure:\n${procedureText}${docsText}`;
}

/**
 * Chunks a single scheme into 4 smart semantic chunks.
 */
export function chunkScheme(rawScheme: RawSchemeInput): SchemeChunk[] {
  const metadata = createBaseMetadata(rawScheme);
  const chunks: SchemeChunk[] = [];
  const description = String(rawScheme.description || "").trim();
  const benefits = String(rawScheme.benefits || "Financial assistance and welfare subsidies provided per scheme norms.").trim();

  // Chunk 1: Overview & Domain Classification
  const keywords = Array.isArray(rawScheme.keywords) ? `\nKeywords: ${rawScheme.keywords.join(", ")}` : "";
  const overviewContent = `Scheme: ${metadata.scheme_name} (${metadata.scheme_id})\nMinistry: ${metadata.ministry}\nCategory: ${metadata.category}\nState Scope: ${metadata.state_scope.join(", ")}\nOverview & Objective:\n${description}${keywords}`;
  chunks.push({
    scheme_id: metadata.scheme_id,
    scheme_name: metadata.scheme_name,
    section: "overview",
    chunk_index: 0,
    content: overviewContent,
    metadata,
  });

  // Chunk 2: Structured Eligibility Rules
  const eligibilityContent = formatEligibilityRules(rawScheme, metadata);
  chunks.push({
    scheme_id: metadata.scheme_id,
    scheme_name: metadata.scheme_name,
    section: "eligibility",
    chunk_index: 1,
    content: eligibilityContent,
    metadata,
  });

  // Chunk 3: Financial & Material Benefits
  const benefitsContent = `Scheme: ${metadata.scheme_name} (${metadata.scheme_id})\nMinistry: ${metadata.ministry}\nBenefits & Financial Support:\n${benefits}`;
  chunks.push({
    scheme_id: metadata.scheme_id,
    scheme_name: metadata.scheme_name,
    section: "benefits",
    chunk_index: 2,
    content: benefitsContent,
    metadata,
  });

  // Chunk 4: Application Procedure & Deadlines
  const applicationContent = formatApplicationSteps(rawScheme, metadata);
  chunks.push({
    scheme_id: metadata.scheme_id,
    scheme_name: metadata.scheme_name,
    section: "application_steps",
    chunk_index: 3,
    content: applicationContent,
    metadata,
  });

  return chunks;
}

/**
 * Batch chunks an array of schemes.
 */
export function chunkAllSchemes(schemes: RawSchemeInput[]): SchemeChunk[] {
  return schemes.flatMap((scheme) => chunkScheme(scheme));
}
