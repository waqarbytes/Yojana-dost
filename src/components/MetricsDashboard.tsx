import React, { useState, useEffect } from "react";
import type { ObservabilityMetrics } from "../lib/metricsStore.js";

export interface MetricsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState<ObservabilityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/metrics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data as ObservabilityMetrics);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error("Failed to fetch metrics", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void fetchMetrics();
      const timer = setInterval(fetchMetrics, 5000);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="yd-modal-overlay" onClick={onClose}>
      <div className="yd-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="yd-modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">📊</span>
            <div>
              <h3>Real-Time RAG Observability Dashboard</h3>
              <p className="modal-subtitle">Live telemetry from Yojana Dost RAG & Semantic Cache Engine</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="yd-modal-body">
          {isLoading && !metrics ? (
            <div className="loading-state">⏳ Fetching telemetry metrics...</div>
          ) : !metrics ? (
            <div className="error-state">⚠️ Telemetry data unavailable.</div>
          ) : (
            <div className="metrics-dashboard-content">
              {/* Top Stats Grid */}
              <div className="metrics-cards-grid">
                <div className="metric-box">
                  <div className="box-title">p95 E2E Latency</div>
                  <div className="box-value highlight">{metrics.p95_latency_ms} ms</div>
                  <div className="box-sub">p50: {metrics.p50_latency_ms}ms | p99: {metrics.p99_latency_ms}ms</div>
                </div>

                <div className="metric-box">
                  <div className="box-title">Semantic Cache Hit Rate</div>
                  <div className="box-value green">
                    {(metrics.cache_hit_rate * 100).toFixed(1)}%
                  </div>
                  <div className="box-sub">
                    Hits: {metrics.cache_stats.hits} / {metrics.cache_stats.total_lookups} (Cosine &ge; 0.92)
                  </div>
                </div>

                <div className="metric-box">
                  <div className="box-title">Daily Token Spend</div>
                  <div className="box-value purple">
                    {metrics.cost_per_day.total_tokens.toLocaleString()} Tokens
                  </div>
                  <div className="box-sub">
                    Cost: ${metrics.cost_per_day.total_cost_usd.toFixed(6)} USD
                  </div>
                </div>

                <div className="metric-box">
                  <div className="box-title">Budget Degradation Mode</div>
                  <div className={`box-value status-tag ${metrics.cost_per_day.degradation_mode}`}>
                    {metrics.cost_per_day.degradation_mode.toUpperCase()}
                  </div>
                  <div className="box-sub">
                    Budget Consumed: {metrics.cost_per_day.budget_consumed_percent}%
                  </div>
                </div>
              </div>

              {/* Cache Breakdown */}
              <div className="metrics-detail-section">
                <h4>⚡ Semantic Cache Telemetry</h4>
                <div className="detail-table-wrap">
                  <table className="telemetry-table">
                    <tbody>
                      <tr>
                        <td><strong>Cosine Similarity Threshold:</strong></td>
                        <td><code>0.92 (Strict semantic match)</code></td>
                      </tr>
                      <tr>
                        <td><strong>Cache Expiry TTL:</strong></td>
                        <td><code>86,400 seconds (24 Hours)</code></td>
                      </tr>
                      <tr>
                        <td><strong>Total Lookups:</strong></td>
                        <td>{metrics.cache_stats.total_lookups}</td>
                      </tr>
                      <tr>
                        <td><strong>Cache Hits (&lt; 5ms):</strong></td>
                        <td>{metrics.cache_stats.hits}</td>
                      </tr>
                      <tr>
                        <td><strong>Corpus Invalidation Triggers:</strong></td>
                        <td>{metrics.cache_stats.invalidations}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rate Limiting & Safety */}
              <div className="metrics-detail-section">
                <h4>🛡️ Per-IP Rate Limiting & Guardrails</h4>
                <div className="detail-table-wrap">
                  <table className="telemetry-table">
                    <tbody>
                      <tr>
                        <td><strong>Active Tracked Client IPs:</strong></td>
                        <td>{metrics.rate_limiting.active_tracked_ips}</td>
                      </tr>
                      <tr>
                        <td><strong>Throttled Burst Requests (429):</strong></td>
                        <td>{metrics.rate_limiting.throttled_requests_total}</td>
                      </tr>
                      <tr>
                        <td><strong>Uptime:</strong></td>
                        <td>{Math.floor(metrics.uptime_seconds / 60)} minutes ({metrics.uptime_seconds}s)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="yd-modal-footer">
          <span className="last-refreshed">Last updated: {lastRefreshed || "Just now"}</span>
          <button className="refresh-btn" onClick={() => void fetchMetrics()} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "🔄 Refresh Telemetry"}
          </button>
        </div>
      </div>
    </div>
  );
};
