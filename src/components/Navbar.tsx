import React, { useState, useEffect } from "react";

export type NavTabType = "home" | "schemes" | "chat" | "eligibility" | "categories";

export interface NavbarProps {
  activeTab: NavTabType;
  onSelectTab: (tab: NavTabType) => void;
  onOpenMetrics: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, onOpenMetrics }) => {
  const [cacheHitRate, setCacheHitRate] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState<"normal" | "large" | "small">("normal");
  const [language, setLanguage] = useState<"en" | "hi">("en");

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/metrics");
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.cache_hit_rate === "number") {
            setCacheHitRate(Math.round(data.cache_hit_rate * 100));
          }
        }
      } catch {
        // non-fatal
      }
    }
    void fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleFontSizeChange = (level: "normal" | "large" | "small") => {
    setFontSizeLevel(level);
    if (level === "large") {
      document.documentElement.style.fontSize = "17px";
    } else if (level === "small") {
      document.documentElement.style.fontSize = "15px";
    } else {
      document.documentElement.style.fontSize = "16px";
    }
  };

  return (
    <header className="yd-navbar-wrapper">
      {/* Top Official Government Strip */}
      <div className="yd-govt-top-bar">
        <div className="container govt-top-container">
          <div className="govt-identity">
            <svg className="govt-emblem-svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4zm0 2.18l6 3v4.82c0 4.54-3.04 8.78-6 9.9-2.96-1.12-6-5.36-6-9.9V7.18l6-3zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z" />
            </svg>
            <span className="emblem-text">भारत सरकार &bull; Government of India</span>
            <span className="ministry-tagline">Ministry of Electronics & IT &bull; National Portal</span>
          </div>

          <div className="govt-top-actions">
            {/* Font Sizer */}
            <div className="accessibility-font-controls" aria-label="Text size controls">
              <button
                className={`font-btn ${fontSizeLevel === "small" ? "active" : ""}`}
                onClick={() => handleFontSizeChange("small")}
                title="Decrease font size"
              >
                A-
              </button>
              <button
                className={`font-btn ${fontSizeLevel === "normal" ? "active" : ""}`}
                onClick={() => handleFontSizeChange("normal")}
                title="Default font size"
              >
                A
              </button>
              <button
                className={`font-btn ${fontSizeLevel === "large" ? "active" : ""}`}
                onClick={() => handleFontSizeChange("large")}
                title="Increase font size"
              >
                A+
              </button>
            </div>

            {/* Language Switcher */}
            <div className="lang-switcher">
              <button
                className={`lang-btn ${language === "en" ? "active" : ""}`}
                onClick={() => setLanguage("en")}
              >
                English
              </button>
              <span className="lang-sep">|</span>
              <button
                className={`lang-btn ${language === "hi" ? "active" : ""}`}
                onClick={() => setLanguage("hi")}
              >
                हिंदी
              </button>
            </div>

            {/* Live Telemetry Pill */}
            <button
              className="yd-metrics-pill"
              onClick={onOpenMetrics}
              title="Live Observability Telemetry"
            >
              <span className="status-dot online"></span>
              <span className="metrics-label">
                {cacheHitRate !== null ? `Cache: ${cacheHitRate}%` : "RAG 2.0"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Official Navigation Bar */}
      <div className="yd-main-header">
        <div className="container main-header-container">
          {/* Authentic myScheme Brand Logo */}
          <div
            className="yd-brand-logo"
            onClick={() => onSelectTab("home")}
            role="button"
            tabIndex={0}
          >
            <div className="logo-badge-icon">
              <span className="logo-symbol">🇮🇳</span>
            </div>
            <div className="logo-typography">
              <div className="brand-title-line">
                <span className="brand-my">my</span>
                <span className="brand-scheme">Scheme</span>
                <span className="brand-divider">/</span>
                <span className="brand-portal-name">Yojana Dost</span>
              </div>
              <span className="brand-subtext">National Welfare & Scheme Discovery</span>
            </div>
          </div>

          {/* Clean Modern Nav Items (Clean Typography - No Emoji Clutter) */}
          <nav className={`yd-nav-links ${isMobileMenuOpen ? "mobile-open" : ""}`}>
            <button
              className={`yd-nav-link ${activeTab === "home" ? "active" : ""}`}
              onClick={() => {
                onSelectTab("home");
                setIsMobileMenuOpen(false);
              }}
            >
              Home
            </button>

            <button
              className={`yd-nav-link ${activeTab === "eligibility" ? "active" : ""}`}
              onClick={() => {
                onSelectTab("eligibility");
                setIsMobileMenuOpen(false);
              }}
            >
              Find Schemes
            </button>

            <button
              className={`yd-nav-link ${activeTab === "categories" ? "active" : ""}`}
              onClick={() => {
                onSelectTab("categories");
                setIsMobileMenuOpen(false);
              }}
            >
              Categories
            </button>

            <button
              className={`yd-nav-link ${activeTab === "schemes" ? "active" : ""}`}
              onClick={() => {
                onSelectTab("schemes");
                setIsMobileMenuOpen(false);
              }}
            >
              All Schemes
            </button>

            <button
              className={`yd-nav-link ai-link ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => {
                onSelectTab("chat");
                setIsMobileMenuOpen(false);
              }}
            >
              <span>AI Assistant</span>
              <span className="rag-badge">RAG</span>
            </button>
          </nav>

          {/* Right Header Actions */}
          <div className="header-right-actions">
            <button
              className="primary-action-btn"
              onClick={() => onSelectTab("eligibility")}
            >
              Check Eligibility
            </button>

            {/* Mobile Toggle */}
            <button
              className="yd-mobile-toggle"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
