import React, { useState } from "react";
import { Navbar, type NavTabType } from "../components/Navbar.js";
import { Hero } from "../components/Hero.js";
import { HowItWorks } from "../components/HowItWorks.js";
import { CategoryGrid } from "../components/CategoryGrid.js";
import { YojanaChat } from "../components/Chat/YojanaChat.js";
import { SchemeDirectory } from "../components/SchemeDirectory.js";
import { EligibilityChecker } from "../components/EligibilityChecker.js";
import { MetricsDashboard } from "../components/MetricsDashboard.js";
import { FloatingChatWidget } from "../components/FloatingChatWidget.js";
import { Footer } from "../components/Footer.js";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTabType>("home");
  const [initialChatQuery, setInitialChatQuery] = useState<string>("");
  const [isMetricsOpen, setIsMetricsOpen] = useState<boolean>(false);
  const [directorySearch, setDirectorySearch] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  const handleLaunchChatWithQuery = (query: string) => {
    setInitialChatQuery(query);
    setActiveTab("chat");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchFromHero = (searchQuery: string) => {
    setDirectorySearch(searchQuery);
    setSelectedCategoryFilter("all");
    setActiveTab("schemes");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryFilter(catId);
    setActiveTab("schemes");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="yd-app-root">
      {/* Top Government Header & Main Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenMetrics={() => setIsMetricsOpen(true)}
      />

      {/* Main Content Body */}
      <main className="yd-main-content">
        {/* TAB 1: HOME */}
        {activeTab === "home" && (
          <>
            {/* Hero Section */}
            <Hero
              onSearch={handleSearchFromHero}
              onLaunchChatWithQuery={handleLaunchChatWithQuery}
              onStartEligibilityWizard={() => {
                setActiveTab("eligibility");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onExploreCategories={() => {
                setActiveTab("categories");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />

            {/* How It Works (3 Steps) */}
            <HowItWorks
              onStartFinder={() => {
                setActiveTab("eligibility");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />

            {/* 15 Official Sectors Category Grid */}
            <CategoryGrid
              onSelectCategory={handleSelectCategory}
              selectedCategory={selectedCategoryFilter}
            />

            {/* Featured Interactive Chat Preview on Home */}
            <section className="container yd-home-chat-preview">
              <div className="section-title-wrap">
                <span className="section-eyebrow">VERIFIED AI CONVERSATION</span>
                <h2 className="section-title">Ask Yojana Dost AI Assistant</h2>
                <p className="section-desc">
                  Query any scheme rule, eligibility threshold, financial subsidy amount, or application step.
                  All answers are backed with direct official citations and pgvector 0.92 cosine caching.
                </p>
              </div>

              <div className="home-chat-viewport-card">
                <YojanaChat
                  initialQuery={initialChatQuery}
                  onClearInitialQuery={() => setInitialChatQuery("")}
                />
              </div>
            </section>

            {/* Featured Directory Preview */}
            <SchemeDirectory
              onAskAboutScheme={handleLaunchChatWithQuery}
              initialCategory="all"
            />
          </>
        )}

        {/* TAB 2: FIND SCHEMES / ELIGIBILITY WIZARD */}
        {activeTab === "eligibility" && (
          <div className="tab-page-container">
            <EligibilityChecker onAskAIAboutResults={handleLaunchChatWithQuery} />
          </div>
        )}

        {/* TAB 3: CATEGORIES BROWSER */}
        {activeTab === "categories" && (
          <div className="tab-page-container">
            <CategoryGrid
              onSelectCategory={handleSelectCategory}
              selectedCategory={selectedCategoryFilter}
            />
          </div>
        )}

        {/* TAB 4: SCHEMES DIRECTORY */}
        {activeTab === "schemes" && (
          <div className="tab-page-container">
            <SchemeDirectory
              onAskAboutScheme={handleLaunchChatWithQuery}
              initialSearch={directorySearch}
              initialCategory={selectedCategoryFilter}
            />
          </div>
        )}

        {/* TAB 5: DEDICATED AI CHAT */}
        {activeTab === "chat" && (
          <div className="tab-page-container container">
            <div className="section-title-wrap">
              <span className="section-eyebrow">GROUNDED WELFARE AI</span>
              <h2 className="section-title">Yojana Dost AI Assistant</h2>
              <p className="section-desc">
                Ask about scheme rules, required documents, and benefits across 120+ Indian Government welfare programs.
              </p>
            </div>
            <div className="standalone-chat-wrapper">
              <YojanaChat
                initialQuery={initialChatQuery}
                onClearInitialQuery={() => setInitialChatQuery("")}
              />
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom-Right Chat Assistant (Accessible across all tabs) */}
      <FloatingChatWidget onOpenFullChat={() => setActiveTab("chat")} />

      {/* Observability Telemetry Modal */}
      <MetricsDashboard
        isOpen={isMetricsOpen}
        onClose={() => setIsMetricsOpen(false)}
      />

      {/* Government Footer */}
      <Footer
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenMetrics={() => setIsMetricsOpen(true)}
      />
    </div>
  );
};
