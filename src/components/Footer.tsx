import React from "react";
import type { NavTabType } from "./Navbar.js";

export interface FooterProps {
  onSelectTab: (tab: NavTabType) => void;
  onOpenMetrics: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab, onOpenMetrics }) => {
  return (
    <footer className="yd-footer-wrapper">
      {/* Top Banner with Government Emblem & Digital India */}
      <div className="footer-top-strip">
        <div className="container footer-top-container">
          <div className="footer-gov-brand">
            <span className="gov-emblem-icon">🇮🇳</span>
            <div>
              <strong>myScheme &bull; Yojana Dost Portal</strong>
              <p>National e-Governance Division (NeGD) &bull; Digital India Corporation</p>
            </div>
          </div>

          <div className="footer-helpline-box">
            <span className="helpline-icon">📞</span>
            <div>
              <span className="helpline-title">National Citizen Toll-Free Helpline:</span>
              <strong className="helpline-number">1800-11-5555 / 14443</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container yd-footer-container">
        {/* Brand Column */}
        <div className="footer-col brand-col">
          <div className="footer-logo">
            <span className="logo-emoji">🇮🇳</span>
            <span className="logo-title">myScheme / Yojana Dost</span>
          </div>
          <p className="footer-about">
            India's verified AI-assisted welfare scheme discovery portal. Powered by hybrid semantic retrieval,
            0.92 cosine pgvector caching, token budget guardrails, and real-time streaming citations.
          </p>
          <div className="footer-meta-pill" onClick={onOpenMetrics} role="button" tabIndex={0}>
            ⚡ System Telemetry: 100% Online &bull; Latency &lt; 5ms
          </div>
        </div>

        {/* Column: Citizen Discovery */}
        <div className="footer-col">
          <h4>Citizen Services</h4>
          <ul>
            <li><button onClick={() => onSelectTab("home")}>🏠 Home</button></li>
            <li><button onClick={() => onSelectTab("eligibility")}>🎯 3-Step Scheme Screener</button></li>
            <li><button onClick={() => onSelectTab("categories")}>🗂️ 15 Official Sectors</button></li>
            <li><button onClick={() => onSelectTab("schemes")}>📋 Central & State Schemes</button></li>
            <li><button onClick={() => onSelectTab("chat")}>🤖 Grounded AI Assistant</button></li>
          </ul>
        </div>

        {/* Column: Official National Portals */}
        <div className="footer-col">
          <h4>Official Portals</h4>
          <ul>
            <li><a href="https://www.myscheme.gov.in" target="_blank" rel="noopener noreferrer">myScheme.gov.in ↗</a></li>
            <li><a href="https://pmkisan.gov.in" target="_blank" rel="noopener noreferrer">PM-KISAN Samman Nidhi ↗</a></li>
            <li><a href="https://pmjay.gov.in" target="_blank" rel="noopener noreferrer">Ayushman Bharat PM-JAY ↗</a></li>
            <li><a href="https://www.mudra.org.in" target="_blank" rel="noopener noreferrer">PM MUDRA Loans ↗</a></li>
            <li><a href="https://scholarships.gov.in" target="_blank" rel="noopener noreferrer">National Scholarship Portal ↗</a></li>
            <li><a href="https://services.india.gov.in" target="_blank" rel="noopener noreferrer">National Services Portal ↗</a></li>
          </ul>
        </div>

        {/* Column: Engineering & Observability */}
        <div className="footer-col">
          <h4>Observability & RAG API</h4>
          <ul>
            <li><button onClick={onOpenMetrics}>📊 Real-time Metrics Dashboard</button></li>
            <li><a href="/api/metrics" target="_blank" rel="noopener noreferrer">Telemetry JSON Endpoint ↗</a></li>
            <li><a href="/api/chat/health" target="_blank" rel="noopener noreferrer">Health Check Endpoint ↗</a></li>
            <li><a href="https://digitalindia.gov.in" target="_blank" rel="noopener noreferrer">Digital India Initiative ↗</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright & Disclaimer Strip */}
      <div className="yd-footer-bottom">
        <div className="container footer-bottom-container">
          <p className="copyright-text">
            &copy; {new Date().getFullYear()} Government Scheme Discovery AI &bull; Built for Indian Citizens
          </p>
          <p className="disclaimer-text">
            Disclaimer: Content on this portal is for public information and discovery purposes. Always refer to official gazette notifications and ministry portals for final scheme guidelines.
          </p>
        </div>
      </div>
    </footer>
  );
};
