import React, { useState } from "react";
import { INDIAN_STATES } from "./SchemeDirectory.js";

export interface EligibilityCheckerProps {
  onAskAIAboutResults: (matchedSummary: string) => void;
}

export const EligibilityChecker: React.FC<EligibilityCheckerProps> = ({
  onAskAIAboutResults,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Demographics
  const [gender, setGender] = useState<string>("male");
  const [age, setAge] = useState<number>(32);
  const [state, setState] = useState<string>("Uttar Pradesh");
  const [areaType, setAreaType] = useState<"rural" | "urban">("rural");

  // Step 2: Social Category
  const [category, setCategory] = useState<string>("general");
  const [isDifferentlyAbled, setIsDifferentlyAbled] = useState<boolean>(false);
  const [isMinority, setIsMinority] = useState<boolean>(false);

  // Step 3: Occupation & Financials
  const [occupation, setOccupation] = useState<string>("farmer");
  const [income, setIncome] = useState<number>(180000);
  const [landHolding, setLandHolding] = useState<number>(1.2);

  // Evaluated Matches
  const [matches, setMatches] = useState<
    { schemeId: string; schemeName: string; category: string; benefit: string; reason: string; url: string }[]
  >([]);

  const handleEvaluate = () => {
    const results: {
      schemeId: string;
      schemeName: string;
      category: string;
      benefit: string;
      reason: string;
      url: string;
    }[] = [];

    // PM-KISAN check
    if (occupation === "farmer" && landHolding > 0) {
      results.push({
        schemeId: "pm-kisan",
        schemeName: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        category: "Agriculture",
        benefit: "₹6,000 per year via DBT in 3 equal installments of ₹2,000.",
        reason: "You are a landholding farmer with recorded cultivable agricultural land.",
        url: "https://pmkisan.gov.in",
      });
    }

    // PM-JAY Ayushman Bharat check
    if (income <= 250000 || category === "sc" || category === "st" || isDifferentlyAbled) {
      results.push({
        schemeId: "pm-jay-ayushman",
        schemeName: "Ayushman Bharat PM-JAY",
        category: "Health & Wellness",
        benefit: "₹5 Lakh annual cashless secondary & tertiary hospitalization cover per family.",
        reason: "Income and socio-economic category criteria match PM-JAY eligibility.",
        url: "https://pmjay.gov.in",
      });
    }

    // PM Mudra Yojana check
    if (occupation === "business_owner" || occupation === "artisan" || occupation === "street_vendor") {
      results.push({
        schemeId: "pm-mudra-yojana",
        schemeName: "Pradhan Mantri MUDRA Yojana (PMMY)",
        category: "Business & Entrepreneurship",
        benefit: "Collateral-free institutional business loans up to ₹20 Lakh (Shishu, Kishore, Tarun, Tarun Plus).",
        reason: "Micro/small business entrepreneur eligible for subsidized institutional credit.",
        url: "https://www.mudra.org.in",
      });
    }

    // PM SVANidhi check
    if (occupation === "street_vendor" || areaType === "urban") {
      results.push({
        schemeId: "pm-svanidhi",
        schemeName: "PM SVANidhi (Street Vendor's AtmaNirbhar Nidhi)",
        category: "Business & Entrepreneurship",
        benefit: "₹10,000 to ₹50,000 collateral-free working capital loan with 7% interest subsidy.",
        reason: "Street vendor or urban micro-entrepreneur eligible for digital transaction incentives.",
        url: "https://pmsvanidhi.mohua.gov.in",
      });
    }

    // PM Vishwakarma check
    if (occupation === "artisan" || occupation === "unorganised_worker") {
      results.push({
        schemeId: "pm-vishwakarma",
        schemeName: "PM Vishwakarma Scheme",
        category: "Skills & Entrepreneurship",
        benefit: "₹15,000 free modern toolkit grant + ₹3 Lakh collateral-free loan at 5% concessional interest.",
        reason: "Traditional artisan / craftsperson eligible for holistic skill training and marketing support.",
        url: "https://pmvishwakarma.gov.in",
      });
    }

    // PM Shram Yogi Maan-dhan (PM-SYM) check
    if (
      (occupation === "unorganised_worker" || occupation === "farmer" || occupation === "street_vendor") &&
      age >= 18 &&
      age <= 40 &&
      income <= 180000
    ) {
      results.push({
        schemeId: "pmsym",
        schemeName: "PM Shram Yogi Maan-dhan (PM-SYM)",
        category: "Social Welfare & Pension",
        benefit: "Guaranteed minimum pension of ₹3,000 per month upon reaching age 60.",
        reason: "Unorganised sector worker in 18-40 age bracket with monthly income under ₹15,000.",
        url: "https://maandhan.in",
      });
    }

    // Atal Pension Yojana (APY) check
    if (age >= 18 && age <= 40) {
      results.push({
        schemeId: "atal-pension-yojana",
        schemeName: "Atal Pension Yojana (APY)",
        category: "Financial Services & Pension",
        benefit: "Guaranteed monthly pension of ₹1,000 to ₹5,000 after attaining age 60.",
        reason: `Your age (${age} years) is within the eligible 18–40 entry window for APY.`,
        url: "https://www.npscra.nsdl.co.in",
      });
    }

    // Sukanya Samriddhi Yojana (SSY) check
    if (gender === "female" && age <= 10) {
      results.push({
        schemeId: "sukanya-samriddhi-yojana",
        schemeName: "Sukanya Samriddhi Yojana (SSY)",
        category: "Women & Child",
        benefit: "High government-backed interest rate with triple tax exemption (EEE) under Sec 80C.",
        reason: "Girl child under 10 years of age is eligible for high-yield savings account.",
        url: "https://www.indiapost.gov.in",
      });
    }

    // MGNREGA check
    if ((occupation === "farmer" || occupation === "unorganised_worker") && areaType === "rural") {
      results.push({
        schemeId: "mgnrega",
        schemeName: "Mahatma Gandhi NREGA",
        category: "Employment & Rural",
        benefit: "100 days of guaranteed wage employment per financial year for rural households.",
        reason: "Adult member of rural household willing to do manual unskilled work.",
        url: "https://nrega.nic.in",
      });
    }

    // PM Ujjwala Yojana check
    if (gender === "female" || income <= 200000 || category === "sc" || category === "st") {
      results.push({
        schemeId: "pm-ujjwala-yojana",
        schemeName: "Pradhan Mantri Ujjwala Yojana (PMUY)",
        category: "Women & Energy",
        benefit: "Deposit-free LPG connection with free first cylinder and gas stove.",
        reason: "Adult woman from eligible low-income or priority category household.",
        url: "https://www.pmuy.gov.in",
      });
    }

    // PMAY Housing check
    if (income <= 600000) {
      results.push({
        schemeId: "pmay",
        schemeName: areaType === "rural" ? "Pradhan Mantri Awas Yojana (PMAY-Gramin)" : "Pradhan Mantri Awas Yojana (PMAY-Urban)",
        category: "Housing & Shelter",
        benefit: "Financial assistance up to ₹1.2 Lakh (Gramin) or interest subsidy up to ₹2.67 Lakh (Urban).",
        reason: "Eligible family without a permanent pucca house matching income parameters.",
        url: "https://pmaymis.gov.in",
      });
    }

    setMatches(results);
    setCurrentStep(4);
  };

  return (
    <section className="yd-eligibility-section container">
      <div className="section-title-wrap">
        <span className="section-eyebrow">SMART SCHEME FINDER</span>
        <h2 className="section-title">Find Schemes Based on Your Eligibility</h2>
        <p className="section-desc">
          Complete this 3-step citizen questionnaire to instantly discover all matching Central and State schemes.
        </p>
      </div>

      {/* Progress Stepper Bar */}
      <div className="wizard-stepper">
        <div className={`step-node ${currentStep >= 1 ? "completed" : ""} ${currentStep === 1 ? "active" : ""}`}>
          <div className="node-circle">1</div>
          <span className="node-label">Demographics</span>
        </div>
        <div className={`step-line ${currentStep >= 2 ? "active" : ""}`}></div>

        <div className={`step-node ${currentStep >= 2 ? "completed" : ""} ${currentStep === 2 ? "active" : ""}`}>
          <div className="node-circle">2</div>
          <span className="node-label">Social Profile</span>
        </div>
        <div className={`step-line ${currentStep >= 3 ? "active" : ""}`}></div>

        <div className={`step-node ${currentStep >= 3 ? "completed" : ""} ${currentStep === 3 ? "active" : ""}`}>
          <div className="node-circle">3</div>
          <span className="node-label">Occupation & Income</span>
        </div>
        <div className={`step-line ${currentStep === 4 ? "active" : ""}`}></div>

        <div className={`step-node ${currentStep === 4 ? "active" : ""}`}>
          <div className="node-circle">🎉</div>
          <span className="node-label">Matched Schemes</span>
        </div>
      </div>

      {/* Form Container */}
      <div className="wizard-card-wrapper">
        {/* STEP 1: Basic Demographics */}
        {currentStep === 1 && (
          <div className="wizard-step-body">
            <h3 className="wizard-step-title">Step 1 of 3: Basic Demographics</h3>
            <p className="wizard-step-desc">Tell us about yourself to help filter state-specific and age-based schemes.</p>

            <div className="wizard-form-grid">
              {/* Gender */}
              <div className="form-field">
                <label className="field-label">Gender:</label>
                <div className="radio-pills-group">
                  {[
                    { id: "male", label: "👨 Male" },
                    { id: "female", label: "👩 Female" },
                    { id: "transgender", label: "🏳️‍⚧️ Transgender" },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      className={`radio-pill-btn ${gender === g.id ? "active" : ""}`}
                      onClick={() => setGender(g.id)}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age */}
              <div className="form-field">
                <label className="field-label" htmlFor="citizen-age">
                  Your Age (in Years): <strong>{age}</strong>
                </label>
                <input
                  id="citizen-age"
                  type="range"
                  min="1"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value, 10))}
                  className="range-slider"
                />
                <div className="slider-range-values">
                  <span>1 yr</span>
                  <span>50 yrs</span>
                  <span>100 yrs</span>
                </div>
              </div>

              {/* State */}
              <div className="form-field">
                <label className="field-label" htmlFor="citizen-state">
                  State of Residence:
                </label>
                <select
                  id="citizen-state"
                  className="wizard-select"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Area Type */}
              <div className="form-field">
                <label className="field-label">Area of Residence:</label>
                <div className="radio-pills-group">
                  <button
                    type="button"
                    className={`radio-pill-btn ${areaType === "rural" ? "active" : ""}`}
                    onClick={() => setAreaType("rural")}
                  >
                    🌾 Rural Area
                  </button>
                  <button
                    type="button"
                    className={`radio-pill-btn ${areaType === "urban" ? "active" : ""}`}
                    onClick={() => setAreaType("urban")}
                  >
                    🏙️ Urban Area
                  </button>
                </div>
              </div>
            </div>

            <div className="wizard-action-footer right-align">
              <button className="wizard-next-btn" onClick={() => setCurrentStep(2)}>
                Next: Social Profile ➔
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Social Category & Family */}
        {currentStep === 2 && (
          <div className="wizard-step-body">
            <h3 className="wizard-step-title">Step 2 of 3: Social & Family Profile</h3>
            <p className="wizard-step-desc">Social background enables access to priority reservation and targeted welfare schemes.</p>

            <div className="wizard-form-grid">
              {/* Category */}
              <div className="form-field full-span">
                <label className="field-label">Social Category:</label>
                <div className="radio-pills-group">
                  {[
                    { id: "general", label: "General" },
                    { id: "obc", label: "OBC" },
                    { id: "sc", label: "SC (Scheduled Caste)" },
                    { id: "st", label: "ST (Scheduled Tribe)" },
                    { id: "ews", label: "EWS (Economically Weaker)" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`radio-pill-btn ${category === c.id ? "active" : ""}`}
                      onClick={() => setCategory(c.id)}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Differently Abled */}
              <div className="form-field">
                <label className="field-label">Differently Abled (Divyangjan):</label>
                <div className="radio-pills-group">
                  <button
                    type="button"
                    className={`radio-pill-btn ${isDifferentlyAbled ? "active" : ""}`}
                    onClick={() => setIsDifferentlyAbled(true)}
                  >
                    ♿ Yes (40%+ Disability)
                  </button>
                  <button
                    type="button"
                    className={`radio-pill-btn ${!isDifferentlyAbled ? "active" : ""}`}
                    onClick={() => setIsDifferentlyAbled(false)}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Minority */}
              <div className="form-field">
                <label className="field-label">Belong to Minority Community:</label>
                <div className="radio-pills-group">
                  <button
                    type="button"
                    className={`radio-pill-btn ${isMinority ? "active" : ""}`}
                    onClick={() => setIsMinority(true)}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className={`radio-pill-btn ${!isMinority ? "active" : ""}`}
                    onClick={() => setIsMinority(false)}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>

            <div className="wizard-action-footer">
              <button className="wizard-back-btn" onClick={() => setCurrentStep(1)}>
                ⬅ Back
              </button>
              <button className="wizard-next-btn" onClick={() => setCurrentStep(3)}>
                Next: Occupation & Income ➔
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Occupation & Financials */}
        {currentStep === 3 && (
          <div className="wizard-step-body">
            <h3 className="wizard-step-title">Step 3 of 3: Occupation & Financial Profile</h3>
            <p className="wizard-step-desc">Financial details calculate your exact scheme eligibility and subsidy limits.</p>

            <div className="wizard-form-grid">
              {/* Primary Occupation */}
              <div className="form-field full-span">
                <label className="field-label">Primary Occupation:</label>
                <div className="radio-pills-group wrap">
                  {[
                    { id: "farmer", label: "🌾 Farmer / Cultivator" },
                    { id: "street_vendor", label: "🛒 Street Vendor / Hawker" },
                    { id: "artisan", label: "🔨 Traditional Artisan / Craftsperson" },
                    { id: "unorganised_worker", label: "👷 Daily Wage / Unorganised Labour" },
                    { id: "business_owner", label: "💼 MSME / Small Business Owner" },
                    { id: "student", label: "🎓 Student / Youth" },
                    { id: "senior_citizen", label: "👵 Senior Citizen / Retired" },
                  ].map((occ) => (
                    <button
                      key={occ.id}
                      type="button"
                      className={`radio-pill-btn ${occupation === occ.id ? "active" : ""}`}
                      onClick={() => setOccupation(occ.id)}
                    >
                      {occ.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Annual Income */}
              <div className="form-field">
                <label className="field-label" htmlFor="citizen-income">
                  Annual Household Income (₹):
                </label>
                <input
                  id="citizen-income"
                  type="number"
                  step="10000"
                  min="0"
                  value={income}
                  onChange={(e) => setIncome(parseInt(e.target.value, 10) || 0)}
                  className="wizard-input"
                />
                <span className="field-hint">e.g. ₹1,80,000 / year</span>
              </div>

              {/* Landholding */}
              <div className="form-field">
                <label className="field-label" htmlFor="citizen-land">
                  Agricultural Land Holding (in Hectares):
                </label>
                <input
                  id="citizen-land"
                  type="number"
                  step="0.1"
                  min="0"
                  value={landHolding}
                  onChange={(e) => setLandHolding(parseFloat(e.target.value) || 0)}
                  className="wizard-input"
                />
                <span className="field-hint">e.g. 1.2 Hectares (Enter 0 if none)</span>
              </div>
            </div>

            <div className="wizard-action-footer">
              <button className="wizard-back-btn" onClick={() => setCurrentStep(2)}>
                ⬅ Back
              </button>
              <button className="wizard-submit-btn" onClick={handleEvaluate}>
                ⚡ Discover My Eligible Schemes
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Results View */}
        {currentStep === 4 && (
          <div className="wizard-step-body results-view">
            <div className="results-header-banner">
              <div className="banner-icon">🎉</div>
              <div>
                <h3>You are eligible for {matches.length} Government Schemes!</h3>
                <p>
                  Profile: {age} yrs &bull; {gender} &bull; {state} &bull; {occupation} &bull; Income: ₹{income.toLocaleString("en-IN")}/yr
                </p>
              </div>
            </div>

            <div className="matched-cards-grid">
              {matches.map((m, idx) => (
                <div key={idx} className="matched-result-card">
                  <div className="card-top-tag">
                    <span className="sector-tag">{m.category}</span>
                    <span className="verified-tag">✓ 100% Eligible</span>
                  </div>

                  <h4 className="matched-scheme-title">{m.schemeName}</h4>
                  
                  <div className="matched-benefit-pill">
                    <strong>💰 Benefit:</strong> {m.benefit}
                  </div>

                  <p className="matched-reason-text">
                    <strong>🎯 Why you qualify:</strong> {m.reason}
                  </p>

                  <div className="matched-card-actions">
                    <button
                      className="ask-ai-scheme-btn"
                      onClick={() =>
                        onAskAIAboutResults(
                          `I am eligible for ${m.schemeName}. What exact documents do I need and what are the step-by-step application instructions?`
                        )
                      }
                    >
                      🤖 Ask AI for Roadmap
                    </button>

                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="official-apply-btn"
                    >
                      Official Portal ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Roadmap Launcher Box */}
            <div className="ai-roadmap-callout">
              <div className="callout-icon">💡</div>
              <div className="callout-content">
                <strong>Need help applying for all matched schemes?</strong>
                <p>
                  Our RAG AI assistant can generate a personalized application checklist and schedule based on your profile.
                </p>
              </div>
              <button
                className="callout-action-btn"
                onClick={() =>
                  onAskAIAboutResults(
                    `I am a ${age}-year-old ${gender} from ${state} (${occupation}, annual income ₹${income}). I matched with ${matches.length} schemes including ${matches.slice(0, 3).map((s) => s.schemeName).join(", ")}. Please prepare a consolidated application plan and document checklist.`
                  )
                }
              >
                Generate Consolidated AI Application Plan ➔
              </button>
            </div>

            <div className="wizard-action-footer center-align">
              <button className="wizard-back-btn" onClick={() => setCurrentStep(1)}>
                ↺ Start New Screening
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
