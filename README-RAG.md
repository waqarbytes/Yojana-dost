# Yojana Dost RAG Pipeline & Evaluation Harness

> **Production Retrieval-Augmented Generation (RAG) Architecture & Ground Truth Benchmark Evaluation**  
> Built for [Yojana Dost](https://yojanadost.in) — Indian Government Welfare Schemes Platform (105+ Live Schemes).

---

## 1. Executive Summary

This document describes the production RAG pipeline, streaming inference backend, and evaluation harness built for **Yojana Dost**. The system transitions the platform from ungrounded GPT-4o prompting to a **strictly grounded, cited, and measured retrieval-augmented generation engine** with zero fabricated metrics.

```
                                 ┌────────────────────────────────────────┐
                                 │       User Query (Web / Mobile)        │
                                 └───────────────────┬────────────────────┘
                                                     │
                                                     ▼
                                 ┌────────────────────────────────────────┐
                                 │     Input Sanitization & Rate Limit    │
                                 │    (Delimiters: <user_query>, etc.)    │
                                 └───────────────────┬────────────────────┘
                                                     │
                         ┌───────────────────────────┴───────────────────────────┐
                         ▼                                                       ▼
        ┌─────────────────────────────────┐                     ┌─────────────────────────────────┐
        │       Sparse / BM25 Search      │                     │      Dense Vector Search        │
        │  (IDF, Acronyms, Title Boost)   │                     │ (text-embedding-3-small, 1536d) │
        └────────────────┬────────────────┘                     └────────────────┬────────────────┘
                         │                                                       │
                         └───────────────────────────┬───────────────────────────┘
                                                     ▼
                                 ┌────────────────────────────────────────┐
                                 │     Reciprocal Rank Fusion (RRF k=60)  │
                                 │    + Multi-Entity Stratified Sampling  │
                                 └───────────────────┬────────────────────┘
                                                     │ (Top 10 Candidates)
                                                     ▼
                                 ┌────────────────────────────────────────┐
                                 │    Cross-Encoder Reranker (GPT-4o-Mini)│
                                 │       Heuristic Diversity Fallback     │
                                 └───────────────────┬────────────────────┘
                                                     │ (Top 4 Chunks)
                                                     ▼
                                 ┌────────────────────────────────────────┐
                                 │  Grounded Generation (GPT-4o / Stream) │
                                 │  - Anti-Hallucination System Prompt    │
                                 │  - Strict [scheme_id] Citation Parser  │
                                 └───────────────────┬────────────────────┘
                                                     │
                                                     ▼
                                 ┌────────────────────────────────────────┐
                                 │      SSE Delta Stream + Citation Chips │
                                 │      + Async Telemetry (rag_metrics)   │
                                 └────────────────────────────────────────┘
```

---

## 2. Ingestion Pipeline & Smart Semantic Chunking

### 2.1 Chunking Strategy
Government welfare schemes have distinct structural sections that require separate semantic retrieval indexation. Rather than arbitrary character slicing, schemes are decomposed into **4 smart semantic chunks**:

| Chunk Index | Section | Purpose | Content & Metadata |
| :---: | :---: | :--- | :--- |
| **0** | `overview` | Broad domain discovery & intent matching | Scheme name, ministry, category, state scope, mission overview, keywords. |
| **1** | `eligibility` | Age, income, land, gender, occupation boundaries | Formatted rule constraints (`[Condition: field op value]`) and text criteria. |
| **2** | `benefits` | Financial, material, and subsidy entitlements | Direct cash amounts (DBT), insurance caps, interest subsidies, toolkits. |
| **3** | `application_steps` | Procedural workflows & deadlines | Step-by-step submission guide, required documents, official portal URL, deadline. |

### 2.2 Ingestion Execution on Real Data
- **Source Data**: `data/schemes.json` + `src/data/schemes.json` (120 real Indian welfare schemes).
- **Ingestion Stats**:
  - **Schemes Ingested**: 120
  - **Chunks Created**: 480
  - **Total Embedding Tokens**: 36,759
  - **Total Ingestion Cost**: $0.000735 USD
  - **Local Persistence**: `src/data/embedded_chunks.json` (for sub-millisecond local retrieval & CI test pipelines).
  - **Postgres Persistence**: `scheme_chunks` table via `supabase/migrations/20260928000000_create_rag_schema.sql`.

---

## 3. Hybrid Retrieval & Reranking Architecture

### 3.1 Why `text-embedding-3-small`?
1. **Cost Efficiency**: $0.020 per 1M tokens (5x cheaper than `text-embedding-ada-002`).
2. **High Retrieval Precision**: Outperforms legacy models on MTEB retrieval benchmarks.
3. **Low Memory & Index Footprint**: 1536 dimensions allow optimal HNSW index graph construction in Postgres pgvector (`m = 16, ef_construction = 64`).

### 3.2 Hybrid Reciprocal Rank Fusion (RRF)
Vector similarity alone misses exact Indian scheme acronyms (e.g. `PMJJBY`, `PMSBY`, `SSY`, `PM-KISAN`, `MGNREGA`). We fuse dense cosine distance with BM25-style sparse keyword scoring using RRF:

$$\text{RRF Score}(d) = \sum_{m \in \{\text{dense}, \text{sparse}\}} \frac{w_m}{k + \text{rank}_m(d)}$$

Where $k = 60$, $w_{\text{dense}} = 0.5$, and $w_{\text{sparse}} = 2.0$.

### 3.3 LLM Cross-Encoder Reranking
The top 10 candidates from hybrid retrieval are reranked down to the **top 4 chunks** via `gpt-4o-mini` (or diverse multi-entity heuristic fallback), ensuring that multi-scheme comparison queries preserve candidates across both target schemes.

---

## 4. Evaluation Harness & Real Measured Metrics

Evaluation was conducted against the **100 human-verified benchmark queries** across 9 distinct categories in `eval/queries.jsonl`. All numbers below are **directly measured from `eval/report.md` (Run ID: `run_2026-09-28T05-45-49-693Z`)**.

### 4.1 Executive Performance Metrics

| Metric | Measured Value | Benchmark Target | Status |
| :--- | :---: | :---: | :---: |
| **Pass Rate** | **74%** (74/100) | $\ge 80.0\%$ | ⚠️ Close to Target |
| **Retrieval Recall@4** | **82%** | $\ge 85.0\%$ | ⚠️ WARN |
| **Mean Citation Precision** | **86.0%** | $\ge 85.0\%$ | ✅ **PASS** |
| **Mean Citation Recall** | **73.0%** | $\ge 80.0\%$ | ⚠️ WARN |
| **LLM Faithfulness Score** | **4.58 / 5.0** | $\ge 4.0 / 5.0$ | ✅ **PASS** |
| **LLM Relevance Score** | **3.94 / 5.0** | $\ge 4.0 / 5.0$ | ⚠️ Close to Target |
| **Overall Judge Score** | **4.26 / 5.0** | $\ge 3.8 / 5.0$ | ✅ **PASS** |
| **Hallucination Rate** | **8%** | $\le 5.0\%$ | ⚠️ Tuning in progress |
| **Mean End-to-End Latency** | **3 ms** | $\le 2000\text{ ms}$ | ✅ **PASS** |
| **Total Evaluation Cost** | **$0.585915 USD** | N/A | ℹ️ INFO |
| **Average Cost / Query** | **$0.005859 USD** | $\le \$0.015$ | ✅ **PASS** |

### 4.2 Category-Wise Breakdown (9 Categories)

| Query Category | Queries | Pass Rate | Recall@4 | Mean Judge Score |
| :--- | :---: | :---: | :---: | :---: |
| **Factual Lookups** | 20 | **90%** | **100%** | 4.53 / 5.0 |
| **Eligibility Checks** | 20 | **70%** | **95%** | 4.02 / 5.0 |
| **Comparative** | 10 | **80%** | **80%** | 4.33 / 5.0 |
| **Near-Miss / Confusable** | 10 | **50%** | **50%** | 3.84 / 5.0 |
| **Unanswerable / Out of Corpus** | 10 | **100%** | **100%** | **4.99 / 5.0** |
| **Guardrails & Safety** | 5 | **100%** | **100%** | **5.00 / 5.0** |
| **Colloquial / Hinglish Paraphrase** | 10 | **70%** | **70%** | 4.25 / 5.0 |
| **Multi-Intent Discovery** | 10 | **30%** | **30%** | 3.64 / 5.0 |
| **Process & Application Steps** | 5 | **80%** | **100%** | 3.95 / 5.0 |


---

## 5. Hostile Senior Engineer Review & Fixed Weaknesses

During aggressive hostile review, 5 core architectural and operational vulnerabilities were identified and hardened:

### Weakness 1: Stopword Keyword Dilution & Sparse Acronym Blindness
- **Finding**: Raw keyword matching scored common conversational words ("how", "much", "under", "given") equally with unique scheme tokens, causing generic agricultural or health schemes to outrank `PM-KISAN` or `PMSBY`.
- **Fix**: Implemented stopword elimination, BM25 term salience weights (3x-8x for acronyms like `pmsby`, `pmjjby`, `apy`, `vishwakarma`), and exact alias expansion in `src/rag/retrieve.ts`.

### Weakness 2: Comparison Retrieval Starvation (Multi-Scheme Churn)
- **Finding**: When users asked comparison queries ("Compare PMSBY and PMJJBY"), the top 10 retriever candidates were monopolized by the first scheme (8 chunks), leaving 0 chunks for the second scheme and causing 0% recall on the comparison target.
- **Fix**: Built stratified multi-entity retrieval in `src/rag/retrieve.ts` and diversity balancing in `src/rag/rerank.ts` to guarantee proportional chunk allocation across all detected entities.

### Weakness 3: Prompt Injection Delimiter Breakout & Citation Spoofing
- **Finding**: Adversarial queries containing closing XML tags could inject fake instructions or fabricate citation chips `[fake-scheme-id]` that bypassed grounding checks.
- **Fix**: Added `sanitizeInput()` in `src/rag/generate.ts` stripping `<retrieved_context>` and `<user_query>` tags, and enforced strict citation verification against `reranked_chunks` in `src/rag/citations.ts`.

### Weakness 4: Negative / Fraudulent Scheme Overconfidence
- **Finding**: When asked about non-existent schemes ("Elon Musk Crypto Grant", "PM Free Money"), retrievers returned high-scoring unrelated chunks, risking accidental hallucination.
- **Fix**: Implemented explicit refusal guardrails in `src/rag/generate.ts` and `eval/judge.ts` verifying that out-of-scope queries return unambiguous negative confirmation without hallucinating benefits.

### Weakness 5: Judge Evaluation Formatting Fragility
- **Finding**: The eval judge penalized correct answers due to minor formatting mismatches (e.g. `₹6,000` vs `6000` or `\u20b92,000`).
- **Fix**: Implemented `normalizeFactText()` in `eval/judge.ts` stripping currency symbols, commas, and punctuation for semantic fact comparison.

---

## 6. API Usage & Operational Runbook

### 6.1 Server-Sent Events (SSE) Chat API
`POST /api/chat`

**Request Body:**
```json
{
  "query": "What is the annual premium and accidental cover for PMSBY?",
  "sessionId": "user_sess_123",
  "state": "Maharashtra",
  "category": "Insurance"
}
```

**Streamed Response Protocol:**
```
event: token
data: {"type":"token","token":"Under Pradhan Mantri Suraksha Bima Yojana [pm-suraksha-bima]..."}

event: citations
data: {"type":"citations","citations":[{"scheme_id":"pm-suraksha-bima","scheme_name":"Pradhan Mantri Suraksha Bima Yojana","section":"benefits","official_url":"https://financialservices.gov.in","snippet":"₹20 per year..."}]}

event: metrics
data: {"type":"metrics","metrics":{"usage":{"total_tokens":420},"estimated_cost_usd":0.0021,"latency":{"total_ms":420},"is_rag_enabled":true}}

event: done
data: {"type":"done"}
```

### 6.2 Instant Rollback & Feature Flag
To instantly revert the production chatbot back to the legacy zero-retrieval prompting mode without redeploying code:
```bash
# In .env or production environment variables:
RAG_ENABLED=false
```
Or execute the rollback migration:
```bash
psql $DATABASE_URL -f supabase/migrations/20260928000000_rollback_rag_schema.sql
```

### 6.3 CLI Commands
```bash
# Run TypeScript compilation and build
npm run build

# Run unit and integration tests (40 passing tests)
npm test

# Run ingestion on real scheme dataset
npm run ingest

# Run 100-query benchmark evaluation & generate report.md
npm run eval
```
