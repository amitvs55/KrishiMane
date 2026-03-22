"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart, CartItem } from "@/context/CartContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Variant = {
    id: string;
    label: string;
    price: number;
    weight: number;
    stock: number;
};

type Product = {
    id: string;
    slug: string;
    name: string;
    emoji: string;
    badge: string;
    img: string;
    tags: string[];
    description: string;
    category: string;
    variants: Variant[];
};

const CATEGORY_LABELS: Record<string, { title: string; desc: string }> = {
    oil: {
        title: "Artisanal Cold-Pressed Oils",
        desc: "Each bottle is a promise of purity — no additives, no chemicals. Just nature, as it was meant to be.",
    },
    aata: {
        title: "Old Pressed Chakki Aata",
        desc: "Stone-ground flours from traditional chakki — retaining full nutrition, fibre, and authentic taste.",
    },
    cookies: {
        title: "Millet-Based Cookies",
        desc: "Healthy, crunchy cookies made from millets and jaggery — zero maida, zero refined sugar.",
    },
};

export default function ProductsTab() {
    const { user } = useAuth();
    const { addToCart } = useCart();
    const router = useRouter();
    const [toast, setToast] = useState<string | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

    useEffect(() => {
        fetch(`${API}/products`)
            .then((res) => res.json())
            .then((data: Product[]) => {
                setProducts(data);
                // Default to first variant for each product
                const defaults: Record<string, string> = {};
                data.forEach((p) => {
                    if (p.variants.length > 0) {
                        defaults[p.slug] = p.variants[0].id;
                    }
                });
                setSelectedVariants(defaults);
            })
            .catch((err) => console.error("Failed to load products:", err))
            .finally(() => setLoading(false));
    }, []);

    const getSelectedVariant = (product: Product): Variant | undefined => {
        const varId = selectedVariants[product.slug];
        return product.variants.find((v) => v.id === varId) || product.variants[0];
    };

    const handleBuy = (product: Product) => {
        const variant = getSelectedVariant(product);
        if (!variant) return;

        const cartItem: CartItem = {
            varId: variant.id,
            pid: product.slug,
            name: product.name,
            emoji: product.emoji,
            img: product.img,
            bg: "#F9FAF8",
            label: variant.label,
            price: variant.price,
            weight: variant.weight,
            stock: variant.stock,
            qty: 1,
        };
        addToCart(cartItem);
        setToast(`✅ "${product.name}" added to cart!`);
        setTimeout(() => setToast(null), 3000);
    };

    if (loading) {
        return (
            <div className="tab-content" style={{ textAlign: "center", padding: "60px 0" }}>
                <p style={{ color: "var(--text-light)" }}>Loading products...</p>
            </div>
        );
    }

    // Group products by category
    const grouped = products.reduce<Record<string, Product[]>>((acc, p) => {
        const cat = p.category || "oil";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(p);
        return acc;
    }, {});

    const categoryOrder = ["oil", "aata", "cookies"];
    const sortedCategories = Object.keys(grouped).sort(
        (a, b) => (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) -
                  (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b))
    );

    return (
        <div className="tab-content">
            {toast && (
                <div className="buy-toast" role="alert">
                    {toast}
                </div>
            )}

            {sortedCategories.map((cat) => {
                const catInfo = CATEGORY_LABELS[cat] || { title: cat, desc: "" };
                return (
                    <div className="section" key={cat}>
                        <div className="section-header">
                            <span className="section-eyebrow">Our Collection</span>
                            <h2 className="section-title">{catInfo.title}</h2>
                            <p className="section-desc">{catInfo.desc}</p>
                        </div>

                        <div className="products-grid">
                            {grouped[cat].map((p) => {
                                const variant = getSelectedVariant(p);
                                return (
                                    <div key={p.slug} className="product-card" id={`card-${p.slug}`}>
                                        <div className="product-img-wrap">
                                            <Image
                                                src={p.img}
                                                alt={p.name}
                                                fill
                                                style={{ objectFit: "cover" }}
                                                sizes="(max-width: 768px) 100vw, 50vw"
                                            />
                                            <span className="product-badge">{p.badge}</span>
                                        </div>
                                        <div className="product-body">
                                            <span className="product-emoji">{p.emoji}</span>
                                            <h3 className="product-name">{p.name}</h3>
                                            <p className="product-desc">{p.description}</p>
                                            <div className="product-tags">
                                                {p.tags.map((t) => (
                                                    <span key={t} className="tag">{t}</span>
                                                ))}
                                            </div>

                                            {/* Variant selector */}
                                            {p.variants.length > 1 && (
                                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "10px 0" }}>
                                                    {p.variants.map((v) => (
                                                        <button
                                                            key={v.id}
                                                            onClick={() => setSelectedVariants((prev) => ({ ...prev, [p.slug]: v.id }))}
                                                            style={{
                                                                padding: "4px 10px",
                                                                fontSize: "12px",
                                                                borderRadius: "6px",
                                                                border: selectedVariants[p.slug] === v.id
                                                                    ? "2px solid var(--gold)"
                                                                    : "1px solid rgba(0,0,0,0.12)",
                                                                background: selectedVariants[p.slug] === v.id
                                                                    ? "rgba(200,148,26,0.1)"
                                                                    : "transparent",
                                                                cursor: "pointer",
                                                                fontWeight: selectedVariants[p.slug] === v.id ? 700 : 400,
                                                            }}
                                                        >
                                                            {v.label} — ₹{v.price}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {variant && (
                                                <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--green-dark)", margin: "4px 0 8px" }}>
                                                    ₹{variant.price}
                                                    {variant.stock < 20 && (
                                                        <span style={{ fontSize: "12px", color: "#c0392b", marginLeft: "8px" }}>
                                                            Only {variant.stock} left!
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className="product-footer">
                                                <button
                                                    className="btn-buy"
                                                    id={`buy-${p.slug}`}
                                                    onClick={() => handleBuy(p)}
                                                >
                                                    Add to Cart
                                                </button>
                                                <button className="btn-learn" id={`learn-${p.slug}`}>
                                                    Learn More
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
