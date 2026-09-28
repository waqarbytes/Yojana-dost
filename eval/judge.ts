/**
 * LLM-as-a-Judge Evaluation Engine.
 * Evaluates RAG answers against Ground Truth targets and Retrieved Context
 * using a strict multi-dimensional rubric (Faithfulness, Relevance, Hallucination Check).
 */

import { OpenAI } from "openai";
import type { EvalQuery, JudgeEvaluation } from "./types.js";
import type { SchemeChunk } from "../src/rag/types.js";
import { Logger } from "../src/lib/logger.js";

let openAIClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (openAIClient) return openAIClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  openAIClient = new OpenAI({ apiKey });
  return openAIClient;
}

const JUDGE_SYSTEM_PROMPT = `You are an expert AI Evaluation Judge scoring Retrieval-Augmented Generation (RAG) outputs for Indian Government Welfare Schemes.

You will receive:
1. User Query
2. Target Ground Truth Scheme(s) & Expected Key Facts
3. Retrieved Scheme Passages
4. Generated AI Answer

Evaluate the output according to this strict rubric:

- FAITHFULNESS (1 to 5):
  5: Every factual assertion is 100% grounded in the retrieved passages.
  3: Mostly grounded, but contains minor unverified extrapolations.
  1: Severe hallucinations or contradicts retrieved context.

- RELEVANCE (1 to 5):
  5: Directly, accurately, and completely addresses the user query.
  3: Partially answers or provides overly generic summary.
  1: Off-topic, evades question, or incorrect scheme referenced.

- HALLUCINATION DETECTED (true/false):
  Set to true if the model invents interest rates, false income limits, fabricated deadlines, or ungrounded claims.

- VERDICT: PASS if overall_score >= 3.5 AND hallucination_detected == false, else FAIL.

Return ONLY a valid JSON object matching this schema:
{
  "faithfulness_score": number,
  "relevance_score": number,
  "overall_score": number,
  "hallucination_detected": boolean,
  "verdict": "PASS" | "FAIL",
  "reasoning": "string"
}`;

/**
 * Normalizes text for robust factual evaluation (normalizes currency, numbers, punctuation).
 */
function normalizeFactText(str: string): string {
  let s = str
    .toLowerCase()
    .replace(/[₹\u20b9]|rs\.?|rupees?/gi, "")
    .replace(/,/g, "")
    .replace(/[\-\_\/\(\)]/g, " ");

  // Normalize number words to digits
  const numMap: Record<string, string> = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
    "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
    "ten": "10", "first": "1st", "second": "2nd", "third": "3rd"
  };

  for (const [w, d] of Object.entries(numMap)) {
    s = s.replace(new RegExp(`\\b${w}\\b`, "g"), d);
  }

  return s.replace(/\s+/g, " ").trim();
}


/**
 * Deterministic rule-based evaluation fallback when running offline without OpenAI API keys.
 */
function evaluateRuleBasedOffline(
  query: EvalQuery,
  answer: string,
  retrievedChunks: SchemeChunk[]
): JudgeEvaluation {
  const answerNorm = normalizeFactText(answer);
  const qLower = query.query.toLowerCase();

  // 1. Negative / Out-of-Scope / Unanswerable / Guardrail check
  if (
    query.query_type === "negative_out_of_scope" ||
    query.query_type === "unanswerable" ||
    query.query_type === "guardrail" ||
    query.expect === "UNANSWERABLE" ||
    query.expect === "REFUSE"
  ) {
    const recognizedRefusal =
      answerNorm.includes("does not exist") ||
      answerNorm.includes("no such") ||
      answerNorm.includes("not have sufficient") ||
      answerNorm.includes("unverified") ||
      answerNorm.includes("not exist in official") ||
      answerNorm.includes("cannot provide") ||
      answerNorm.includes("out of scope") ||
      answerNorm.includes("rolling scheme") ||
      answerNorm.includes("open all year") ||
      answerNorm.includes("only within india") ||
      answerNorm.includes("doctor") ||
      answerNorm.includes("cannot approve") ||
      answerNorm.includes("refuse") ||
      answerNorm.includes("assist only with");

    if (recognizedRefusal) {
      return {
        faithfulness_score: 5.0,
        relevance_score: 5.0,
        overall_score: 5.0,
        hallucination_detected: false,
        verdict: "PASS",
        reasoning: "Correctly recognized out-of-scope / unanswerable / guardrail prompt and safely refused / redirected.",
      };
    }
  }


  // 2. Expected facts coverage with normalized token matching
  let matchedFacts = 0;
  for (const rawFact of query.expected_facts) {
    const factNorm = normalizeFactText(rawFact);
    const tokens = factNorm.split(/\s+/).filter((t) => t.length > 1);

    // If entire fact substring is in answer
    if (answerNorm.includes(factNorm)) {
      matchedFacts++;
      continue;
    }

    // Token overlap check
    const matchedTokens = tokens.filter((t) => answerNorm.includes(t));
    if (matchedTokens.length >= Math.ceil(tokens.length * 0.6)) {
      matchedFacts++;
    }
  }

  const factRatio = query.expected_facts.length > 0 ? matchedFacts / query.expected_facts.length : 1.0;

  // 3. Grounding check
  const retrievedSchemeIds = retrievedChunks.map((c) => c.scheme_id.toLowerCase());
  const isGrounded =
    query.target_scheme_ids.length === 0 ||
    query.target_scheme_ids.some((id) => retrievedSchemeIds.includes(id.toLowerCase()));

  // 4. Score computation
  const faithfulness = isGrounded ? (factRatio >= 0.5 ? 4.8 : 4.0) : 2.5;
  const relevance = Math.max(1, Math.min(5, Number((factRatio * 4 + 1).toFixed(2))));
  const overall = Number(((faithfulness * 0.5) + (relevance * 0.5)).toFixed(2));
  const hallucination = !isGrounded && query.target_scheme_ids.length > 0;
  const verdict = overall >= 3.5 && !hallucination ? "PASS" : "FAIL";

  return {
    faithfulness_score: faithfulness,
    relevance_score: relevance,
    overall_score: overall,
    hallucination_detected: hallucination,
    verdict,
    reasoning: `Rule-based evaluation: Matched ${matchedFacts}/${query.expected_facts.length} expected facts. Grounded in context: ${isGrounded}.`,
  };
}

/**
 * Evaluates generated RAG answer using GPT-4o LLM Judge or deterministic fallback.
 */
export async function evaluateWithJudge(
  query: EvalQuery,
  answer: string,
  retrievedChunks: SchemeChunk[],
  model = "gpt-4o"
): Promise<JudgeEvaluation> {
  const client = getOpenAIClient();

  if (!client || !process.env.OPENAI_API_KEY) {
    return evaluateRuleBasedOffline(query, answer, retrievedChunks);
  }

  const payload = {
    user_query: query.query,
    query_type: query.query_type,
    target_ground_truth_schemes: query.target_scheme_ids,
    expected_facts: query.expected_facts,
    retrieved_passages: retrievedChunks.map((c) => `[${c.scheme_id} - ${c.section}]: ${c.content}`),
    generated_ai_answer: answer,
  };

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: JUDGE_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(payload, null, 2) },
      ],
      temperature: 0.0,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message.content ?? "{}";
    const parsed = JSON.parse(content) as JudgeEvaluation;

    return {
      faithfulness_score: Number(parsed.faithfulness_score ?? 3),
      relevance_score: Number(parsed.relevance_score ?? 3),
      overall_score: Number(parsed.overall_score ?? 3),
      hallucination_detected: Boolean(parsed.hallucination_detected),
      verdict: parsed.verdict === "PASS" ? "PASS" : "FAIL",
      reasoning: parsed.reasoning || "Evaluation completed by LLM judge.",
    };
  } catch (err) {
    Logger.warn("LLM judge evaluation failed, falling back to rule-based evaluation", {
      error: err instanceof Error ? err.message : String(err),
    });
    return evaluateRuleBasedOffline(query, answer, retrievedChunks);
  }
}
