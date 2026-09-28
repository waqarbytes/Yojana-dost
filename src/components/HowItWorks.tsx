import React from "react";

export interface HowItWorksProps {
  onStartFinder: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onStartFinder }) => {
  return (
    <section className="yd-how-it-works-section container">
      <div className="section-title-wrap">
        <span className="section-eyebrow">EASY 3-STEP CITIZEN JOURNEY</span>
        <h2 className="section-title">How Yojana Dost / myScheme Works</h2>
        <p className="section-desc">
          Discover all eligible government benefits in 3 simple steps — no paperwork or complex forms required.
        </p>
      </div>

      <div className="yd-steps-grid">
        {/* Step 1 */}
        <div className="yd-step-card">
          <div className="step-badge-number">1</div>
          <div className="step-icon-box">
            <span className="step-icon">📝</span>
          </div>
          <h3 className="step-title">Enter Details</h3>
          <p className="step-text">
            Start by sharing basic details like age, gender, occupation, income, and state of residence.
          </p>
          <div className="step-footer-tag">Demographics & Profile</div>
        </div>

        {/* Step 2 */}
        <div className="yd-step-card highlight-step">
          <div className="step-badge-number">2</div>
          <div className="step-icon-box">
            <span className="step-icon">🔍</span>
          </div>
          <h3 className="step-title">Search & Discover</h3>
          <p className="step-text">
            Our hybrid retrieval engine evaluates 120+ schemes against government rules in under 5ms.
          </p>
          <div className="step-footer-tag">Instant Rule Matching</div>
        </div>

        {/* Step 3 */}
        <div className="yd-step-card">
          <div className="step-badge-number">3</div>
          <div className="step-icon-box">
            <span className="step-icon">🏛️</span>
          </div>
          <h3 className="step-title">Apply on Official Portal</h3>
          <p className="step-text">
            View required documents checklist, step-by-step guidance, and direct links to official ministry portals.
          </p>
          <div className="step-footer-tag">Official Ministry Links</div>
        </div>
      </div>

      <div className="how-it-works-cta">
        <button className="yd-primary-pill-btn" onClick={onStartFinder}>
          <span>Check Your Eligibility Now</span>
          <span className="btn-arrow">➔</span>
        </button>
      </div>
    </section>
  );
};
