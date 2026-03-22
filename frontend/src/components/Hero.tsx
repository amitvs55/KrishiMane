"use client";

import { useAuth } from "@/context/AuthContext";

interface HeroProps {
    onExplore: () => void;
}

export default function Hero({ onExplore }: HeroProps) {
    const { user } = useAuth();

    return (
        <section className="hero">
            <div className="hero-badge">
                🌾 100% Natural &amp; Farm Fresh
            </div>

            <h1>
                <span className="kannada-text">ಒಳ್ಳೇದಾಗಿರಲಿ ದೇಶದಾಗಿರಲಿ</span> <br />
                <span className="accent">Eat healthy start living</span>
            </h1>

            <p className="hero-sub">
            </p>

            <div className="hero-actions">
                <button className="btn-primary" onClick={onExplore} id="explore-btn">
                    Explore Products →
                </button>
                {user?.role === "admin" && (
                    <button className="btn-secondary" id="hero-analysis-btn">
                        View Analysis
                    </button>
                )}
            </div>

            <div className="hero-stats">
                <div className="stat">
                    <span className="stat-num">4+</span>
                    <span className="stat-label">Premium Oils</span>
                </div>
                <div className="stat">
                    <span className="stat-num">100%</span>
                    <span className="stat-label">Natural</span>
                </div>
                <div className="stat">
                    <span className="stat-num">Zero</span>
                    <span className="stat-label">Additives</span>
                </div>
                <div className="stat">
                    <span className="stat-num">Farm</span>
                    <span className="stat-label">Sourced</span>
                </div>
            </div>
        </section>
    );
}
