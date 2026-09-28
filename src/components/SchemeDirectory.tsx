import React, { useState, useEffect } from "react";
import type { Scheme } from "../lib/types.js";

export interface SchemeDirectoryProps {
  onAskAboutScheme: (schemeQuery: string) => void;
  onCheckEligibilityForScheme?: (schemeId: string) => void;
  initialCategory?: string;
  initialSearch?: string;
}

export const INDIAN_STATES = [
  "All India (Central)",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi (UT)",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export const SchemeDirectory: React.FC<SchemeDirectoryProps> = ({
  onAskAboutScheme,
  onCheckEligibilityForScheme,
  initialCategory,
  initialSearch,
}) => {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [search, setSearch] = useState(initialSearch || "");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || "all");
  const [selectedTab, setSelectedTab] = useState<"all" | "central" | "state">("all");
  const [selectedState, setSelectedState] = useState<string>("All India (Central)");
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSchemes() {
      try {
        const res = await fetch("/data/schemes.json");
        if (res.ok) {
          const data = await res.json();
          // Normalize scheme records to match Scheme interface
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const normalized = data.map((item: any) => ({
            id: item.id || `scheme-${Math.random()}`,
            name: item.name || item.title || "Government Welfare Scheme",
            ministry: item.ministry || (item.type === "Central" ? "Government of India" : "State Government"),
            category: item.category || "General Welfare",
            description: item.description || "",
            benefits: item.benefits || "",
            eligibility: Array.isArray(item.eligibility)
              ? item.eligibility
              : typeof item.eligibility === "string"
              ? [{ field: "general", operator: "eq", value: true, description: item.eligibility }]
              : [],
            application_steps: Array.isArray(item.application_steps)
              ? item.application_steps
              : item.howToApply
              ? [item.howToApply]
              : [],
            official_url: item.official_url || item.url || "https://myscheme.gov.in",
            state_scope: item.state_scope || (item.type === "State" ? ["State Specific"] : ["All India"]),
            is_sample: false,
          }));
          setSchemes(normalized);
        }
      } catch (err) {
        console.error("Failed to load schemes list", err);
      } finally {
        setIsLoading(false);
      }
    }
    void loadSchemes();
  }, []);

  const categories = [
    { id: "all", label: "🌟 All Sectors" },
    { id: "Agriculture", label: "🌾 Agriculture" },
    { id: "Health", label: "🏥 Health & Wellness" },
    { id: "Education", label: "🎓 Education & Learning" },
    { id: "Housing", label: "🏠 Housing & Shelter" },
    { id: "Women & Child", label: "👩 Women & Child" },
    { id: "Financial Services", label: "💳 Banking & Finance" },
    { id: "Business & Employment", label: "💼 Business & Jobs" },
    { id: "Social Welfare", label: "🤝 Social Welfare" },
    { id: "Skills & Employment", label: "🛠️ Skills & Training" },
  ];

  const filteredSchemes = schemes.filter((s) => {
    // Tab filter (Central vs State)
    if (selectedTab === "central") {
      const isCentral =
        s.state_scope.includes("All India") ||
        s.state_scope.includes("National") ||
        s.ministry.toLowerCase().includes("ministry");
      if (!isCentral) return false;
    } else if (selectedTab === "state") {
      if (selectedState !== "All India (Central)") {
        const matchesState = s.state_scope.some(
          (st) => st.toLowerCase().includes(selectedState.toLowerCase()) || st === "All India"
        );
        if (!matchesState) return false;
      }
    }

    // Category filter
    const matchesCategory =
      selectedCategory === "all" ||
      s.category?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      selectedCategory.toLowerCase().includes(s.category?.toLowerCase());

    // Text search
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.ministry.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.benefits.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  return (
    <section className="yd-schemes-directory-section container">
      {/* Directory Section Header */}
      <div className="section-title-wrap">
        <span className="section-eyebrow">OFFICIAL DATABASE</span>
        <h2 className="section-title">Government Schemes Directory</h2>
        <p className="section-desc">
          Search and discover verified welfare schemes across Central Ministries and State Departments.
        </p>
      </div>

      {/* Main Tabs: All / Central / State */}
      <div className="directory-scope-tabs">
        <button
          className={`scope-tab-btn ${selectedTab === "all" ? "active" : ""}`}
          onClick={() => setSelectedTab("all")}
        >
          🌟 All Schemes ({schemes.length})
        </button>
        <button
          className={`scope-tab-btn ${selectedTab === "central" ? "active" : ""}`}
          onClick={() => setSelectedTab("central")}
        >
          🏛️ Central Government Schemes
        </button>
        <button
          className={`scope-tab-btn ${selectedTab === "state" ? "active" : ""}`}
          onClick={() => setSelectedTab("state")}
        >
          🗺️ State & UT Schemes
        </button>
      </div>

      {/* State Filter Dropdown (Visible on State tab or all) */}
      {selectedTab === "state" && (
        <div className="state-filter-banner">
          <label htmlFor="state-select">Select Your State / UT:</label>
          <select
            id="state-select"
            className="state-dropdown"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
          >
            {INDIAN_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Search Toolbar & Category Pills */}
      <div className="yd-directory-toolbar">
        <div className="yd-search-field">
          <span className="search-field-icon">🔍</span>
          <input
            type="text"
            placeholder="Filter schemes by name, benefits, keywords, or ministry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch("")} title="Clear search">
              ✕
            </button>
          )}
        </div>

        {/* Sector Category Pills */}
        <div className="yd-category-chips-bar">
          {categories.map((c) => (
            <button
              key={c.id}
              className={`cat-pill ${selectedCategory === c.id ? "active" : ""}`}
              onClick={() => setSelectedCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count & Current Filter Badge */}
      <div className="yd-directory-status">
        <span className="status-count">
          Showing <strong>{filteredSchemes.length}</strong> matching schemes
        </span>
        {(search || selectedCategory !== "all" || selectedTab !== "all") && (
          <button
            className="reset-filters-btn"
            onClick={() => {
              setSearch("");
              setSelectedCategory("all");
              setSelectedTab("all");
            }}
          >
            Reset Filters ↺
          </button>
        )}
      </div>

      {/* Scheme Cards Grid */}
      {isLoading ? (
        <div className="yd-loading-state">
          <div className="loading-spinner"></div>
          <p>Loading official government scheme records...</p>
        </div>
      ) : filteredSchemes.length === 0 ? (
        <div className="yd-empty-state">
          <div className="empty-icon">📂</div>
          <h3>No matching schemes found</h3>
          <p>Try clearing your search query or selecting "All Sectors".</p>
          <button
            className="yd-primary-pill-btn"
            onClick={() => {
              setSearch("");
              setSelectedCategory("all");
              setSelectedTab("all");
            }}
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="yd-schemes-grid">
          {filteredSchemes.map((s) => {
            const isExpanded = expandedSchemeId === s.id;
            return (
              <div key={s.id} className="yd-scheme-card">
                {/* Header Pills */}
                <div className="scheme-card-header">
                  <span className="scheme-category-badge">{s.category || "Welfare"}</span>
                  <span className="scheme-type-badge">
                    {s.state_scope.includes("All India") ? "Central Sector" : "State Scheme"}
                  </span>
                </div>

                {/* Ministry Line */}
                <div className="scheme-ministry-row">
                  <span className="ministry-icon">🏛️</span>
                  <span className="scheme-ministry-name">{s.ministry}</span>
                </div>

                {/* Title & Description */}
                <h3 className="scheme-title">{s.name}</h3>
                <p className="scheme-desc">{s.description}</p>

                {/* Highlighted Benefits Box */}
                {s.benefits && (
                  <div className="scheme-benefit-box">
                    <span className="benefit-badge-title">💰 Key Benefits:</span>
                    <p className="benefit-text">{s.benefits}</p>
                  </div>
                )}

                {/* Expandable Accordion */}
                {isExpanded && (
                  <div className="scheme-expanded-details">
                    {s.eligibility && s.eligibility.length > 0 && (
                      <div className="detail-block">
                        <h4>🎯 Eligibility Criteria</h4>
                        <ul className="criteria-list">
                          {s.eligibility.map((r, rIdx) => (
                            <li key={rIdx}>{r.description}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {s.application_steps && s.application_steps.length > 0 && (
                      <div className="detail-block">
                        <h4>📝 How to Apply</h4>
                        <ol className="steps-list">
                          {s.application_steps.map((st, sIdx) => (
                            <li key={sIdx}>{st}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons Footer */}
                <div className="scheme-card-footer">
                  <button
                    className="toggle-details-btn"
                    onClick={() => setExpandedSchemeId(isExpanded ? null : s.id)}
                  >
                    {isExpanded ? "Hide Details ▲" : "View Details ▼"}
                  </button>

                  {onCheckEligibilityForScheme && (
                    <button
                      className="check-elig-card-btn"
                      onClick={() => onCheckEligibilityForScheme(s.id)}
                      title="Check if you qualify for this scheme"
                    >
                      🎯 Check Eligibility
                    </button>
                  )}

                  <button
                    className="ask-ai-action-btn"
                    onClick={() =>
                      onAskAboutScheme(`What are the complete eligibility criteria, benefits, and steps for ${s.name}?`)
                    }
                    title="Ask AI about this scheme"
                  >
                    🤖 Ask AI
                  </button>

                  {s.official_url && (
                    <a
                      href={s.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="official-apply-link"
                      title="Open Official Ministry Portal"
                    >
                      Apply ↗
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
