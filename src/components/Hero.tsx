import React, { useState } from "react";

export interface HeroProps {
  onSearch: (query: string) => void;
  onLaunchChatWithQuery: (query: string) => void;
  onStartEligibilityWizard: () => void;
  onExploreCategories: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onSearch,
  onLaunchChatWithQuery,
  onStartEligibilityWizard,
  onExploreCategories,
}) => {
  const [searchInput, setSearchInput] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    onSearch(searchInput.trim());
  };

  const quickFilterChips = [
    { label: "🌾 Farmers (PM-KISAN)", query: "What financial benefit does PM-KISAN provide to farmers?" },
    { label: "👩 Women & Child (Sukanya)", query: "What does the Sukanya Samriddhi Yojana offer?" },
    { label: "🏥 Health Cover (PM-JAY)", query: "What is the annual health cover amount under PM-JAY?" },
    { label: "💼 Loans (Mudra Yojana)", query: "What are the loan categories under PM Mudra Yojana and their limits?" },
    { label: "🎓 Students & Youth", query: "What educational scholarship schemes are available for students?" },
    { label: "👵 Senior Pension (APY)", query: "Who is eligible for Atal Pension Yojana and what are the benefits?" },
  ];

  return (
    <section className="yd-hero-wrapper">
      <div className="container yd-hero-inner">
        {/* Top Government Verification Tag */}
        <div className="hero-govt-badge">
          <span className="badge-flag">🇮🇳</span>
          <span>Official Discovery Portal &bull; Verified Citations &bull; 0.92 Semantic Caching</span>
        </div>

        {/* Main Headline */}
        <h1 className="hero-main-heading">
          Find schemes that are <span className="highlight-text">right for you</span>
          <span className="sub-heading-hi">योजना खोजें और आवेदन करें</span>
        </h1>

        <p className="hero-main-subheading">
          Discover 120+ Central and State welfare programs across 15 sectors. Check eligibility in 3 easy steps or ask our AI assistant for grounded, cited answers.
        </p>

        {/* Primary Call-to-Action Bar */}
        <div className="hero-cta-group">
          <button className="hero-primary-cta" onClick={onStartEligibilityWizard}>
            <span className="cta-icon">🎯</span>
            <span className="cta-label">Find Schemes For You</span>
            <span className="cta-arrow">➔</span>
          </button>

          <button className="hero-secondary-cta" onClick={onExploreCategories}>
            <span className="cta-icon">🗂️</span>
            <span>Browse 15 Categories</span>
          </button>
        </div>

        {/* Search Input Box */}
        <form className="hero-search-bar" onSubmit={handleSearchSubmit}>
          <div className="search-icon-prefix">🔍</div>
          <input
            type="text"
            className="hero-search-input"
            placeholder="Search by scheme name, ministry, or keyword (e.g. 'farmer subsidy', 'free LPG', 'business loan', 'scholarship')..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button type="button" className="clear-btn" onClick={() => setSearchInput("")}>
              ✕
            </button>
          )}
          <button type="submit" className="hero-search-submit-btn">
            Search Schemes
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="hero-quick-chips">
          <span className="chips-title">Popular Searches:</span>
          <div className="chips-container">
            {quickFilterChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className="hero-chip-pill"
                onClick={() => onLaunchChatWithQuery(chip.query)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Official Scheme Counter Highlights */}
        <div className="hero-metrics-strip">
          <div className="metric-item">
            <div className="metric-icon-box">🏛️</div>
            <div className="metric-data">
              <span className="metric-val">120+</span>
              <span className="metric-lbl">Central Schemes</span>
            </div>
          </div>

          <div className="metric-divider"></div>

          <div className="metric-item">
            <div className="metric-icon-box">🗺️</div>
            <div className="metric-data">
              <span className="metric-val">500+</span>
              <span className="metric-lbl">State / UT Schemes</span>
            </div>
          </div>

          <div className="metric-divider"></div>

          <div className="metric-item">
            <div className="metric-icon-box">🗂️</div>
            <div className="metric-data">
              <span className="metric-val">15</span>
              <span className="metric-lbl">Official Categories</span>
            </div>
          </div>

          <div className="metric-divider"></div>

          <div className="metric-item">
            <div className="metric-icon-box">⚡</div>
            <div className="metric-data">
              <span className="metric-val">&lt; 5 ms</span>
              <span className="metric-lbl">p95 Cache Latency</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
