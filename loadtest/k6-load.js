/**
 * k6 Load Test Suite for Yojana Dost Production RAG API
 *
 * Simulates 50 concurrent users sending diverse queries over 5 minutes.
 * Measures p50, p95, p99 latency, throughput (req/s), cache hit behavior, and HTTP error rate.
 *
 * Usage:
 *   k6 run loadtest/k6-load.js
 *   k6 run --env SMOKE=1 loadtest/k6-load.js  # quick 15s smoke test
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

// Custom Telemetry Metrics
const ragLatencyTrend = new Trend("rag_latency_ms");
const errorRate = new Rate("error_rate");
const cacheHitCounter = new Counter("semantic_cache_hits");

const isSmoke = __ENV.SMOKE === "1";

export const options = {
  scenarios: {
    rag_user_traffic: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: isSmoke
        ? [
            { duration: "5s", target: 10 },
            { duration: "10s", target: 10 },
            { duration: "5s", target: 0 },
          ]
        : [
            { duration: "30s", target: 20 },  // Ramp up to 20 VUs
            { duration: "1m", target: 50 },   // Ramp up to 50 concurrent VUs
            { duration: "3m", target: 50 },   // Steady state 50 VUs (sustained load)
            { duration: "30s", target: 0 },   // Ramp down
          ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],         // HTTP error rate < 1%
    http_req_duration: ["p(95)<500"],       // p95 latency < 500ms
    rag_latency_ms: ["p(95)<300"],          // p95 application latency < 300ms
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3001";

const TEST_QUERIES = [
  "What financial benefit does PM-KISAN provide to farmers?",
  "How many days of guaranteed wage employment does MGNREGA provide per year?",
  "What is the annual health cover amount under PM-JAY?",
  "Who can get a Kisan Credit Card?",
  "What are the loan categories under PM Mudra Yojana and their limits?",
  "What does a beneficiary receive under PM Ujjwala Yojana?",
  "What does the Sukanya Samriddhi Yojana offer?",
  "What is PM SVANidhi for?",
  "Am I eligible for PM-KISAN as a 35-year-old farmer with 1 hectare of land?",
  "Can a serving government employee apply for PM-KISAN?",
  "What is the difference between PMAY-G and PMAY-U?",
  "How is PM-KISAN different from the Kisan Credit Card?",
  "kisan ko sarkar se paise milenge kaise?",
  "ghar banane ke liye sarkari paisa chahiye",
  "free gas cylinder wali yojana kaunsi hai?",
  "beti ke liye koi sarkari scheme hai?",
  "bina paisa ke business shuru karna hai",
  "What is the goal of the Jal Jeevan Mission?",
  "Who qualifies for old-age pension under NSAP?",
  "How do I apply for PM-KISAN step by step?",
];

export default function () {
  const query = TEST_QUERIES[Math.floor(Math.random() * TEST_QUERIES.length)];
  const payload = JSON.stringify({
    message: query,
    stream: false,
    sessionId: `vu_${__VU}_iter_${__ITER}`,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Forwarded-For": `192.168.1.${(__VU % 250) + 1}`,
    },
    timeout: "10s",
  };

  const res = http.post(`${BASE_URL}/api/chat`, payload, params);

  const passed = check(res, {
    "status is 200": (r) => r.status === 200,
    "response has answer": (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body.answer === "string" && body.answer.length > 0;
      } catch {
        return false;
      }
    },
    "response has valid citations": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.citations);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!passed);

  if (res.status === 200) {
    try {
      const body = JSON.parse(res.body);
      const totalLatency = body.metrics?.latency?.total_ms || res.timings.duration;
      ragLatencyTrend.add(totalLatency);

      // Check if served from semantic cache (latency <= 5ms)
      if (totalLatency <= 5) {
        cacheHitCounter.add(1);
      }
    } catch {
      // ignore json parse error
    }
  }

  // Realistic user think time between 500ms and 1.5s
  sleep(0.5 + Math.random());
}
