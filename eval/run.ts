/**
 * Evaluation Runner.
 * Executes labeled benchmark queries through the RAG pipeline, computes exact metrics:
 * - Retrieval Recall@4
 * - Citation Precision & Recall
 * - LLM Judge Faithfulness & Relevance
 * - Latency & Cost Tracking
 * Saves complete raw run transcripts to eval/results/.
 */

import { config } from "dotenv";
config();

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateRAGAnswer } from "../src/rag/generate.js";
import { evaluateCitationFidelity, canonicalizeSchemeId } from "../src/rag/citations.js";
import { evaluateWithJudge } from "./judge.js";

import { Logger } from "../src/lib/logger.js";
import type { EvalQuery, EvalRunItem, EvalRunSummary, EvalQueryType } from "./types.js";
import type { SchemeChunk } from "../src/rag/types.js";

async function loadLocalCorpus(): Promise<SchemeChunk[]> {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const cachePath = resolve(currentDir, "../src/data/embedded_chunks.json");
  try {
    const raw = await readFile(cachePath, "utf-8");
    return JSON.parse(raw) as SchemeChunk[];
  } catch {
    return [];
  }
}

async function loadQueries(): Promise<EvalQuery[]> {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const jsonlPath = resolve(currentDir, "queries.jsonl");
  const jsonPath = resolve(currentDir, "queries.json");

  try {
    const rawJsonl = await readFile(jsonlPath, "utf-8");
    const lines = rawJsonl.trim().split("\n").filter(Boolean);
    return lines.map((l) => JSON.parse(l) as EvalQuery);
  } catch {
    const raw = await readFile(jsonPath, "utf-8");
    return JSON.parse(raw) as EvalQuery[];
  }
}


export async function runEvaluation(sampleSize?: number): Promise<EvalRunSummary> {
  Logger.info("Starting Yojana Dost RAG Evaluation Harness...");
  const queries = await loadQueries();
  const corpus = await loadLocalCorpus();

  const activeQueries = sampleSize ? queries.slice(0, sampleSize) : queries;
  Logger.info(`Executing evaluation across ${activeQueries.length} benchmark queries...`);

  const runItems: EvalRunItem[] = [];
  const startTime = Date.now();

  let totalCostUsd = 0;
  let totalLatencyMs = 0;

  for (let idx = 0; idx < activeQueries.length; idx++) {
    const q = activeQueries[idx]!;
    Logger.info(`[${idx + 1}/${activeQueries.length}] Running Query ${q.id}: "${q.query.slice(0, 60)}..."`);

    // 1. Execute RAG Pipeline
    const ragResponse = await generateRAGAnswer(q.query, {
      localCorpus: corpus,
      sessionId: `eval-${q.id}`,
      isRagEnabled: true,
    });

    const retrievedSchemeIds = Array.from(
      new Set(ragResponse.retrieved_chunks.map((c) => canonicalizeSchemeId(c.scheme_id)))
    );
    const rerankedSchemeIds = Array.from(
      new Set(ragResponse.reranked_chunks.map((c) => canonicalizeSchemeId(c.scheme_id)))
    );

    // 2. Compute Retrieval Recall@4
    let recallAt4 = false;
    if (q.target_scheme_ids.length === 0) {
      // For negative queries, recall@4 is true if no false positive forced match
      recallAt4 = true;
    } else {
      const matchCount = q.target_scheme_ids.filter((target) =>
        rerankedSchemeIds.includes(canonicalizeSchemeId(target))
      ).length;
      recallAt4 = matchCount === q.target_scheme_ids.length;
    }


    // 3. Compute Citation Fidelity
    const citationMetrics = evaluateCitationFidelity(
      ragResponse.answer,
      ragResponse.reranked_chunks,
      q.target_scheme_ids
    );

    // 4. Run LLM Judge
    const judge = await evaluateWithJudge(q, ragResponse.answer, ragResponse.reranked_chunks);

    // Failure criteria
    const failureReasons: string[] = [];
    if (!recallAt4) failureReasons.push(`Target scheme(s) [${q.target_scheme_ids.join(", ")}] missing in top-4 reranked chunks.`);
    if (citationMetrics.hallucinatedCitations.length > 0) {
      failureReasons.push(`Hallucinated citations detected: [${citationMetrics.hallucinatedCitations.join(", ")}].`);
    }
    if (judge.verdict === "FAIL") failureReasons.push(`LLM Judge failed: ${judge.reasoning}`);

    const isPassed = failureReasons.length === 0 && judge.verdict === "PASS";

    totalCostUsd += ragResponse.metrics.estimated_cost_usd;
    totalLatencyMs += ragResponse.metrics.latency.total_ms;

    runItems.push({
      query_id: q.id,
      query: q.query,
      query_type: q.query_type,
      target_scheme_ids: q.target_scheme_ids,
      retrieved_scheme_ids: retrievedSchemeIds,
      reranked_scheme_ids: rerankedSchemeIds,
      cited_scheme_ids: citationMetrics.citedSchemeIds,
      generated_answer: ragResponse.answer,
      recall_at_4: recallAt4,
      citation_precision: citationMetrics.precision,
      citation_recall: citationMetrics.recall,
      judge,
      latency_ms: ragResponse.metrics.latency.total_ms,
      cost_usd: ragResponse.metrics.estimated_cost_usd,
      passed: isPassed,
      failure_reasons: failureReasons,
    });
  }

  // Aggregate Metrics
  const total = runItems.length;
  const passedCount = runItems.filter((i) => i.passed).length;
  const recallCount = runItems.filter((i) => i.recall_at_4).length;
  const hallucinationCount = runItems.filter((i) => i.judge.hallucination_detected).length;

  const meanCitationPrec = runItems.reduce((acc, i) => acc + i.citation_precision, 0) / total;
  const meanCitationRec = runItems.reduce((acc, i) => acc + i.citation_recall, 0) / total;
  const meanFaithfulness = runItems.reduce((acc, i) => acc + i.judge.faithfulness_score, 0) / total;
  const meanRelevance = runItems.reduce((acc, i) => acc + i.judge.relevance_score, 0) / total;
  const meanOverallJudge = runItems.reduce((acc, i) => acc + i.judge.overall_score, 0) / total;

  // Breakdown by query type
  const queryTypes = Array.from(new Set(runItems.map((i) => i.query_type)));

  const byType = {} as EvalRunSummary["by_query_type"];
  for (const t of queryTypes) {
    const items = runItems.filter((i) => i.query_type === t);
    const count = items.length;
    if (count > 0) {
      const typePass = items.filter((i) => i.passed).length;
      const typeRecall = items.filter((i) => i.recall_at_4).length;
      const typeJudge = items.reduce((acc, i) => acc + i.judge.overall_score, 0) / count;
      byType[t] = {
        count,
        pass_rate: Number(((typePass / count) * 100).toFixed(2)),
        recall_at_4: Number(((typeRecall / count) * 100).toFixed(2)),
        mean_judge_score: Number(typeJudge.toFixed(2)),
      };
    } else {
      byType[t] = { count: 0, pass_rate: 0, recall_at_4: 0, mean_judge_score: 0 };
    }
  }


  const runId = `run_${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const summary: EvalRunSummary = {
    run_id: runId,
    timestamp: new Date().toISOString(),
    total_queries: total,
    passed_queries: passedCount,
    failed_queries: total - passedCount,
    pass_rate_percentage: Number(((passedCount / total) * 100).toFixed(2)),
    metrics: {
      retrieval_recall_at_4: Number(((recallCount / total) * 100).toFixed(2)),
      mean_citation_precision: Number(meanCitationPrec.toFixed(4)),
      mean_citation_recall: Number(meanCitationRec.toFixed(4)),
      mean_faithfulness_score: Number(meanFaithfulness.toFixed(2)),
      mean_relevance_score: Number(meanRelevance.toFixed(2)),
      mean_overall_judge_score: Number(meanOverallJudge.toFixed(2)),
      hallucination_rate_percentage: Number(((hallucinationCount / total) * 100).toFixed(2)),
      mean_latency_ms: Math.round(totalLatencyMs / total),
      total_cost_usd: Number(totalCostUsd.toFixed(6)),
      mean_cost_per_query_usd: Number((totalCostUsd / total).toFixed(6)),
    },
    by_query_type: byType,
    items: runItems,
  };

  // Save raw transcripts
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const resultsDir = resolve(currentDir, "results/runs");
  await mkdir(resultsDir, { recursive: true });

  const runFilePath = resolve(resultsDir, `${runId}.json`);
  const latestFilePath = resolve(currentDir, "results/run_latest.json");

  await writeFile(runFilePath, JSON.stringify(summary, null, 2), "utf-8");
  await writeFile(latestFilePath, JSON.stringify(summary, null, 2), "utf-8");

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  Logger.info(`Evaluation completed in ${durationSec}s. Results saved to ${runFilePath} and ${latestFilePath}.`);

  return summary;
}

// Run directly from CLI
if (process.argv[1] && process.argv[1].endsWith("run.ts")) {
  const sampleArg = process.argv[2] ? parseInt(process.argv[2], 10) : undefined;
  runEvaluation(sampleArg)
    .then((s) => {
      console.error("\n==============================================");
      console.error("📊 YOJANA DOST RAG EVALUATION RUN COMPLETE");
      console.error("==============================================");
      console.error(`Total Queries Evaluated: ${s.total_queries}`);
      console.error(`Pass Rate:              ${s.pass_rate_percentage}% (${s.passed_queries}/${s.total_queries})`);
      console.error(`Retrieval Recall@4:     ${s.metrics.retrieval_recall_at_4}%`);
      console.error(`Mean Faithfulness:      ${s.metrics.mean_faithfulness_score}/5.0`);
      console.error(`Mean Relevance:         ${s.metrics.mean_relevance_score}/5.0`);
      console.error(`Hallucination Rate:     ${s.metrics.hallucination_rate_percentage}%`);
      console.error(`Mean Latency:           ${s.metrics.mean_latency_ms} ms`);
      console.error(`Total Cost:             $${s.metrics.total_cost_usd} USD ($${s.metrics.mean_cost_per_query_usd}/query)`);
      console.error("==============================================\n");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Evaluation run failed:", err);
      process.exit(1);
    });
}
