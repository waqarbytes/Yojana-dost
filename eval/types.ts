/**
 * Types for Yojana Dost RAG Evaluation Harness.
 */

export type EvalQueryType =
  | "factual"
  | "eligibility"
  | "comparative"
  | "near-miss"
  | "unanswerable"
  | "guardrail"
  | "paraphrase"
  | "multi"
  | "process"
  | "factual_lookup"
  | "eligibility_check"
  | "comparison"
  | "edge_case"
  | "near_miss_trap"
  | "negative_out_of_scope";

export type EvalDifficulty = "easy" | "medium" | "hard";

export interface EvalQuery {
  id: string;
  cat?: string;
  query_type: EvalQueryType;
  q?: string;
  query: string;
  expect: string[] | "UNANSWERABLE" | "REFUSE";
  target_scheme_ids: string[];
  expected_facts: string[];
  note?: string;
  difficulty?: EvalDifficulty;
  human_verified?: boolean;
}

export interface JudgeEvaluation {
  faithfulness_score: number; // 1 to 5
  relevance_score: number;    // 1 to 5
  overall_score: number;      // 1 to 5
  hallucination_detected: boolean;
  verdict: "PASS" | "FAIL";
  reasoning: string;
}

export interface EvalRunItem {
  query_id: string;
  query: string;
  query_type: EvalQueryType;
  target_scheme_ids: string[];
  retrieved_scheme_ids: string[];
  reranked_scheme_ids: string[];
  cited_scheme_ids: string[];
  generated_answer: string;
  recall_at_4: boolean;
  citation_precision: number;
  citation_recall: number;
  judge: JudgeEvaluation;
  latency_ms: number;
  cost_usd: number;
  passed: boolean;
  failure_reasons: string[];
}

export interface EvalRunSummary {
  run_id: string;
  timestamp: string;
  total_queries: number;
  passed_queries: number;
  failed_queries: number;
  pass_rate_percentage: number;
  metrics: {
    retrieval_recall_at_4: number;
    mean_citation_precision: number;
    mean_citation_recall: number;
    mean_faithfulness_score: number;
    mean_relevance_score: number;
    mean_overall_judge_score: number;
    hallucination_rate_percentage: number;
    mean_latency_ms: number;
    total_cost_usd: number;
    mean_cost_per_query_usd: number;
  };
  by_query_type: Record<
    string,
    {
      count: number;
      pass_rate: number;
      recall_at_4: number;
      mean_judge_score: number;
    }
  >;
  items: EvalRunItem[];
}
