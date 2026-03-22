"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductsTab from "@/components/ProductsTab";
import AnalysisTab from "@/components/AnalysisTab";
import ChatWidget from "@/components/ChatWidget";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";

type Tab = "products" | "analysis";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [showHero, setShowHero] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

  // Removed auth guard to allow guest access

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setShowHero(false);
  };

  const handleExplore = () => {
    setActiveTab("products");
    setShowHero(false);
  };

  // Hide loading screen if just waiting for auth check but we allow guests
  // (We'll only show a spinner if critical layout info is loading, but here we don't need it)

  return (
    <div className="site-wrapper">
      {/* Fixed background */}
      <div className="bg-fixed" />
      <div className="bg-overlay" />

      {/* Scroll content */}
      <div className="content-layer">
        <Navbar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onChatOpen={() => setChatOpen(true)}
        />

        {showHero ? (
          <Hero onExplore={handleExplore} />
        ) : activeTab === "products" ? (
          <ProductsTab />
        ) : activeTab === "analysis" ? (
          <AnalysisTab />
        ) : (
          <ProductsTab />
        )}

        <Footer />
      </div>

      {/* AI Chat Widget */}
      <ChatWidget isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      {!chatOpen && (
        <button
          className="chat-floating-btn"
          onClick={() => setChatOpen(true)}
          id="chat-float-btn"
          title="Open AI Advisor"
        >
          🤖
        </button>
      )}
    </div>
  );
}
