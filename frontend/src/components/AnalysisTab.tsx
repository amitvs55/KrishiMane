"use client";

const BARS = [
    { label: "Vitamin E Content", val: "High", pct: 88 },
    { label: "Unsaturated Fats", val: "~80%", pct: 80 },
    { label: "Saturated Fats", val: "~12%", pct: 12 },
    { label: "Omega-6 (Linoleic)", val: "~74%", pct: 74 },
    { label: "Antioxidant Score", val: "Excellent", pct: 92 },
];

const INFO_CARDS = [
    {
        icon: "🥗",
        title: "Nutritional Benefits",
        text: "Rich in Vitamin E, Omega-6 & monounsaturated fats. Supports cellular health, skin glow, and immune function.",
    },
    {
        icon: "❤️",
        title: "Heart Health",
        text: "Low saturated fat, high linoleic acid content helps maintain healthy cholesterol levels and reduces cardiovascular risk.",
    },
    {
        icon: "✅",
        title: "Quality Standards",
        text: "Cold-pressed below 45°C preserving all nutrients. Zero bleaching, deodorising, or chemical refining.",
    },
    {
        icon: "🌾",
        title: "Farm Transparency",
        text: "Directly sourced from certified farmers in Karnataka & Andhra Pradesh with full supply-chain traceability.",
    },
];

const SOURCING = [
    { icon: "🌱", title: "Seed-to-Bottle", desc: "Full traceability from organic seed to your kitchen shelf." },
    { icon: "🏡", title: "Small Farms", desc: "Supporting 200+ family-run farms across South India." },
    { icon: "🧪", title: "Lab Tested", desc: "Every batch independently tested for purity & quality." },
    { icon: "♻️", title: "Eco Packaging", desc: "Recyclable glass bottles, minimal plastic waste." },
    { icon: "🚜", title: "Direct Trade", desc: "Fair prices direct to farmers — no middlemen." },
    { icon: "🏆", title: "FSSAI Certified", desc: "Compliant with all Indian food safety regulations." },
];

export default function AnalysisTab() {
    return (
        <div className="tab-content">
            <div className="section">
                <div className="section-header">
                    <span className="section-eyebrow">Deep Dive</span>
                    <h2 className="section-title">Quality &amp; Nutrition Analysis</h2>
                    <p className="section-desc">
                        Science-backed insights into what makes KrishiMane oils exceptional
                        — from farm gate to your plate.
                    </p>
                </div>

                {/* Featured + Info cards */}
                <div className="analysis-grid">
                    <div className="analysis-featured">
                        <div style={{ fontSize: "2.5rem" }}>🔬</div>
                        <h3>Cold-Press Advantage</h3>
                        <p>
                            Our traditional cold-pressing method operates below 45°C,
                            preserving heat-sensitive vitamins, flavour compounds, and
                            natural antioxidants that refinery processes destroy.
                        </p>
                        <p>
                            The result is an oil that tastes exactly as nature intended —
                            full-bodied, aromatic, and nutritionally complete.
                        </p>
                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                            {["Cold-Pressed", "Zero Additives", "Non-GMO", "Unrefined"].map((t) => (
                                <span key={t} className="tag">{t}</span>
                            ))}
                        </div>
                    </div>

                    <div className="analysis-infos">
                        {INFO_CARDS.map((c) => (
                            <div key={c.title} className="info-card">
                                <span className="info-icon">{c.icon}</span>
                                <div className="info-title">{c.title}</div>
                                <p className="info-text">{c.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Nutrition bars */}
                <div className="nutrition-section">
                    <h3>Nutritional Profile (Avg. across all oils)</h3>
                    <div className="bar-chart">
                        {BARS.map((b) => (
                            <div key={b.label} className="bar-item">
                                <span className="bar-label">{b.label}</span>
                                <div className="bar-track">
                                    <div className="bar-fill" style={{ width: `${b.pct}%` }} />
                                </div>
                                <span className="bar-val">{b.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sourcing cards */}
                <div className="section-header" style={{ marginBottom: "1.5rem" }}>
                    <span className="section-eyebrow">Transparency</span>
                    <h2 className="section-title" style={{ fontSize: "1.8rem" }}>
                        Farm Sourcing Commitment
                    </h2>
                </div>
                <div className="sourcing-cards">
                    {SOURCING.map((s) => (
                        <div key={s.title} className="sourcing-card">
                            <span className="sourcing-icon">{s.icon}</span>
                            <div className="sourcing-title">{s.title}</div>
                            <p className="sourcing-desc">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
