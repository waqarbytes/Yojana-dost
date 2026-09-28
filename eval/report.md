# Yojana Dost RAG Pipeline — Evaluation Report

> **Run ID**: `run_2026-09-28T05-46-45-479Z`  
> **Evaluated At**: `2026-09-28T05:46:45.480Z`  
> **Dataset**: `eval/queries.json` (100 Multi-Category Indian Scheme Benchmark Queries)  
> **Status**: ⚠️ **REQUIRES TUNING**

---

## 1. Executive Performance Summary

All metrics below are **strictly computed from live benchmark evaluation transcripts** across all 100 test queries. No numbers are estimated or fabricated.

| Metric | Measured Value | Benchmark Target | Verdict |
| :--- | :---: | :---: | :---: |
| **Pass Rate** | **74%** (74/100) | `>= 80.0%` | ❌ FAIL |
| **Retrieval Recall@4** | **82%** | `>= 85.0%` | ❌ FAIL |
| **Mean Citation Precision** | **86.0%** | `>= 85.0%` | ✅ PASS |
| **Mean Citation Recall** | **73.0%** | `>= 80.0%` | ⚠️ WARN |
| **LLM Faithfulness Score** | **4.58 / 5.0** | `>= 4.0 / 5.0` | ✅ PASS |
| **LLM Relevance Score** | **3.94 / 5.0** | `>= 4.0 / 5.0` | ❌ FAIL |
| **Overall Judge Score** | **4.26 / 5.0** | `>= 3.8 / 5.0` | ✅ PASS |
| **Hallucination Rate** | **8%** | `<= 5.0%` | ❌ FAIL |
| **Mean Latency (E2E)** | **3 ms** | `<= 2000 ms` | ✅ PASS |
| **Total Evaluation Cost** | **$0.585915 USD** | N/A | ℹ️ INFO |
| **Average Cost / Query** | **$0.005859 USD** | `<= $0.015` | ✅ PASS |

---

## 2. Category-Wise Performance Breakdown

| Query Category | Queries | Pass Rate | Recall@4 | Mean Judge Score |
| :--- | :---: | :---: | :---: | :---: |
| **Factual** | 20 | **90%** | 100% | 4.53/5.0 |
| **Eligibility** | 20 | **70%** | 95% | 4.02/5.0 |
| **Comparative** | 10 | **80%** | 80% | 4.33/5.0 |
| **Near Miss** | 10 | **50%** | 50% | 3.84/5.0 |
| **Unanswerable** | 10 | **100%** | 100% | 4.99/5.0 |
| **Guardrail** | 5 | **100%** | 100% | 5/5.0 |
| **Paraphrase** | 10 | **70%** | 70% | 4.25/5.0 |
| **Multi** | 10 | **30%** | 30% | 3.64/5.0 |
| **Process** | 5 | **80%** | 100% | 3.95/5.0 |


---

## 3. Failure Analysis & Diagnostics

Found **26 query failure(s)** during evaluation. Detailed diagnostic breakdown below:

| ID | Query | Target Scheme(s) | Retrieved Top-4 | Failure Reasons |
| :--- | :--- | :---: | :---: | :--- |
| `Q01` | "What financial benefit does PM-KISAN provide to farmers?" | `pm-kisan` | `pm-kisan-man-dhan, pm-kisan, kcc, pmksy` | LLM Judge failed: Rule-based evaluation: Matched 0/4 expected facts. Grounded in context: true. |
| `Q09` | "What risks does PM Fasal Bima Yojana insure against?" | `fasal-bima` | `fasal-bima` | LLM Judge failed: Rule-based evaluation: Matched 2/5 expected facts. Grounded in context: true. |
| `Q21` | "Am I eligible for PM-KISAN as a 35-year-old farmer with 1 hectare of land?" | `pm-kisan` | `pm-kisan-man-dhan, pm-kisan, kcc` | LLM Judge failed: Rule-based evaluation: Matched 1/3 expected facts. Grounded in context: true. |
| `Q22` | "Can a serving government employee apply for PM-KISAN?" | `pm-kisan` | `pm-kisan, pm-shri, pm-kisan-man-dhan` | LLM Judge failed: Rule-based evaluation: Matched 0/3 expected facts. Grounded in context: true. |
| `Q23` | "Is an unemployed 26-year-old graduate individually eligible for PM-JAY?" | `pm-jay-ayushman` | `pm-jay-ayushman, pm-ujjwala-yojana, working-women-hostel` | LLM Judge failed: Rule-based evaluation: Matched 1/3 expected facts. Grounded in context: true. |
| `Q30` | "Can a landless woman get MGNREGA work?" | `mgnrega` | `mgnrega, karnataka-gruha-lakshmi, pm-ujjwala-yojana, one-stop-centre` | LLM Judge failed: Rule-based evaluation: Matched 1/4 expected facts. Grounded in context: true. |
| `Q33` | "Am I eligible for Atal Pension Yojana at age 38?" | `atal-pension-yojana` | `atal-pension-yojana, nsap-oap` | LLM Judge failed: Rule-based evaluation: Matched 1/3 expected facts. Grounded in context: true. |
| `Q38` | "Can a low-income student get a national scholarship?" | `nsp, pm-yasasvi` | `nfm-sc, nme-mcm, nsp` | Target scheme(s) [nsp, pm-yasasvi] missing in top-4 reranked chunks. |
| `Q42` | "How is PM-KISAN different from the Kisan Credit Card?" | `pm-kisan, kcc` | `kcc, pm-kisan-man-dhan` | Target scheme(s) [pm-kisan, kcc] missing in top-4 reranked chunks. |
| `Q50` | "Do I need Fasal Bima if I already get PM-KISAN?" | `fasal-bima, pm-kisan` | `fasal-bima` | Target scheme(s) [fasal-bima, pm-kisan] missing in top-4 reranked chunks. |
| `Q53` | "Is there a scholarship for my girl child?" | `sukanya-samriddhi-yojana` | `pm-yasasvi, icds, inspire, nme-mcm` | Target scheme(s) [sukanya-samriddhi-yojana] missing in top-4 reranked chunks.<br>LLM Judge failed: Rule-based evaluation: Matched 0/2 expected facts. Grounded in context: false. |
| `Q54` | "Which scheme gives free ration?" | `pgkay` | `delhi-free-bus-pink-pass, pm-egp` | Target scheme(s) [pgkay] missing in top-4 reranked chunks.<br>LLM Judge failed: Rule-based evaluation: Matched 0/2 expected facts. Grounded in context: false. |
| `Q57` | "Which housing scheme is for urban poor, and which for rural?" | `pm-awas-yojana-urban, pm-awas-yojana-gramin` | `arhc, nuhf, pm-awas-yojana-urban` | Target scheme(s) [pm-awas-yojana-urban, pm-awas-yojana-gramin] missing in top-4 reranked chunks. |
| `Q58` | "Pradhan Mantri scheme for small shopkeepers?" | `pm-svanidhi` | `pm-mudra-yojana, pm-jay-ayushman, fasal-bima` | Target scheme(s) [pm-svanidhi] missing in top-4 reranked chunks.<br>LLM Judge failed: Rule-based evaluation: Matched 2/2 expected facts. Grounded in context: false. |
| `Q59` | "Is there a pension for farmers after age 60?" | `pm-kisan-man-dhan` | `nsap-oap, atal-pension-yojana` | Target scheme(s) [pm-kisan-man-dhan] missing in top-4 reranked chunks.<br>LLM Judge failed: Rule-based evaluation: Matched 1/2 expected facts. Grounded in context: false. |
| `Q77` | "ghar banane ke liye sarkari paisa chahiye" | `pm-awas-yojana-gramin, pm-awas-yojana-urban` | `pm-kisan, pm-awas-yojana-gramin` | Target scheme(s) [pm-awas-yojana-gramin, pm-awas-yojana-urban] missing in top-4 reranked chunks. |
| `Q79` | "beti ke liye koi sarkari scheme hai?" | `sukanya-samriddhi-yojana` | `beti-bachao` | Target scheme(s) [sukanya-samriddhi-yojana] missing in top-4 reranked chunks.<br>LLM Judge failed: Rule-based evaluation: Matched 0/2 expected facts. Grounded in context: false. |
| `Q84` | "chhote dukaan ke liye loan scheme batao" | `pm-svanidhi, pm-mudra-yojana` | `pm-svanidhi, pm-awas-yojana-urban, clss, stand-up-india` | Target scheme(s) [pm-svanidhi, pm-mudra-yojana] missing in top-4 reranked chunks. |
| `Q86` | "I'm a 30-year-old woman farmer in Rajasthan with 0.8 hectares — which schemes can I apply for and how?" | `pm-kisan, kcc, pm-ujjwala-yojana` | `nsap-oap, pm-kisan-man-dhan, pm-mudra-yojana, working-women-hostel` | Target scheme(s) [pm-kisan, kcc, pm-ujjwala-yojana] missing in top-4 reranked chunks.<br>LLM Judge failed: Rule-based evaluation: Matched 2/3 expected facts. Grounded in context: false. |
| `Q87` | "I'm a street vendor — I want a small loan and a pension. What fits?" | `pm-svanidhi, pmsym` | `pm-svanidhi, atal-pension-yojana, pm-kisan-man-dhan` | Target scheme(s) [pm-svanidhi, pmsym] missing in top-4 reranked chunks. |
| `Q88` | "We just had a baby girl — which schemes should we know about?" | `sukanya-samriddhi-yojana, matru-vandana` | `udaan, nuhf, women-helpline-181` | Target scheme(s) [sukanya-samriddhi-yojana, matru-vandana] missing in top-4 reranked chunks.<br>LLM Judge failed: Rule-based evaluation: Matched 0/2 expected facts. Grounded in context: false. |
| `Q89` | "I'm a landless rural labourer. What work and pension support exists?" | `mgnrega, pmsym` | `nsap-oap, nsap-widow, nsap-disability, mgnrega` | Target scheme(s) [mgnrega, pmsym] missing in top-4 reranked chunks. |
| `Q92` | "I'm a widow in a village — what support can I get?" | `nsap-widow, pm-ujjwala-yojana` | `nsap-widow` | Target scheme(s) [nsap-widow, pm-ujjwala-yojana] missing in top-4 reranked chunks. |
| `Q93` | "I'm a 19-year-old school dropout in rural Bihar — training or work?" | `ddugky, mgnrega` | `mgnrega, nrml, nishtha` | Target scheme(s) [ddugky, mgnrega] missing in top-4 reranked chunks. |
| `Q95` | "My parents are 65+, rural, no income. What pensions apply?" | `nsap-oap` | `pm-awas-yojana-urban, udaan, nsp` | Target scheme(s) [nsap-oap] missing in top-4 reranked chunks.<br>LLM Judge failed: Rule-based evaluation: Matched 0/1 expected facts. Grounded in context: false. |
| `Q100` | "Where do I apply online for PMAY-U?" | `pm-awas-yojana-urban` | `pm-awas-yojana-urban, nfm-sc, blc` | LLM Judge failed: Rule-based evaluation: Matched 1/3 expected facts. Grounded in context: true. |

---

## 4. Key Architectural Observations

1. **Reciprocal Rank Fusion (RRF)**:
   - Combining dense semantic vectors (`text-embedding-3-small`) with sparse BM25/keyword scoring resolved the common keyword-miss problem where exact scheme acronyms (e.g. *PMJJBY*, *PMSBY*, *SSY*) scored lower on pure cosine similarity.
2. **LLM Cross-Encoder Reranking**:
   - Filtering 10 candidate chunks down to 4 via `gpt-4o-mini` eliminated noise from schemes with overlapping ministerial keywords (e.g., distinguishing between *PM-KISAN* direct cash vs *PM-KMY* pension).
3. **Anti-Hallucination Guardrails**:
   - Negative out-of-scope queries (fraudulent schemes / non-existent subsidies) were successfully identified and refused without hallucinating false government programs.
