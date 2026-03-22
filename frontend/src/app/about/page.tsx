"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<"products" | "analysis">("products");
  const router = useRouter();

  return (
    <div className="site-wrapper">
      <div className="bg-fixed" />
      <div className="bg-overlay" />
      <div className="content-layer">
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} onChatOpen={() => {}} />

        <main className="info-page">
          <div className="info-container">
            <button className="back-btn" onClick={() => router.back()}>
              ← Back
            </button>
            <h1 className="info-title">About KrishiMane</h1>
            <p className="info-subtitle">ಒಳ್ಳೇದಾಗಿರಲಿ ದೇಶದಾಗಿರಲಿ — From our farms to your kitchen</p>

            <section className="info-section">
              <h2>Our Story</h2>
              <p>
                KrishiMane was born from a simple belief — that every Indian kitchen deserves access to
                pure, unadulterated food products. We started as a small family farm in Humnabad, Karnataka,
                growing sunflowers and groundnuts the way our grandparents did — without chemicals,
                without shortcuts.
              </p>
              <p>
                Today, we bring that same commitment to quality directly to your doorstep. Every drop of
                oil, every grain of flour, and every cookie we make carries the essence of honest farming
                and traditional processing methods.
              </p>
            </section>

            <section className="info-section">
              <h2>Cold-Pressed, Not Factory-Pressed</h2>
              <p>
                Our oils are extracted using traditional wooden cold-press (Ghani) method at low
                temperatures. This preserves the natural nutrients, aroma, and flavor that industrial
                refining strips away. No chemicals, no heat damage — just pure oil the way nature
                intended it.
              </p>
              <div className="info-highlights">
                <div className="info-highlight-card">
                  <span className="highlight-icon">🌡️</span>
                  <h3>Low Temperature</h3>
                  <p>Pressed below 50°C to retain nutrients</p>
                </div>
                <div className="info-highlight-card">
                  <span className="highlight-icon">🧪</span>
                  <h3>Zero Chemicals</h3>
                  <p>No hexane, no bleaching, no deodorizing</p>
                </div>
                <div className="info-highlight-card">
                  <span className="highlight-icon">🌾</span>
                  <h3>Farm Direct</h3>
                  <p>Sourced from our own farms and trusted partners</p>
                </div>
                <div className="info-highlight-card">
                  <span className="highlight-icon">♻️</span>
                  <h3>Sustainable</h3>
                  <p>Eco-friendly packaging and zero-waste processing</p>
                </div>
              </div>
            </section>

            <section className="info-section">
              <h2>Our Product Range</h2>
              <p>
                We offer three categories of farm-fresh products:
              </p>
              <ul className="info-list">
                <li>
                  <strong>Cold-Pressed Oils</strong> — Safflower, Sunflower, Groundnut, and Coconut oils
                  extracted using traditional Ghani method
                </li>
                <li>
                  <strong>Chakki Aata</strong> — Stone-ground flours including Jowar, Bajra, Wheat, Ragi,
                  and Chana — preserving the fiber and nutrition that roller mills destroy
                </li>
                <li>
                  <strong>Millet Cookies</strong> — Healthy, crunchy cookies made from Ragi, Bajra, Jowar,
                  and Multi-Millet blends — no maida, no refined sugar
                </li>
              </ul>
            </section>

            <section className="info-section">
              <h2>Our Promise</h2>
              <div className="info-promises">
                <div className="promise-item">
                  <span>✅</span>
                  <p>100% natural, no preservatives or additives</p>
                </div>
                <div className="promise-item">
                  <span>✅</span>
                  <p>Directly sourced from Indian farms</p>
                </div>
                <div className="promise-item">
                  <span>✅</span>
                  <p>Fair prices for farmers, honest prices for you</p>
                </div>
                <div className="promise-item">
                  <span>✅</span>
                  <p>Free shipping on orders above ₹999</p>
                </div>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
