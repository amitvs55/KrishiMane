"use client";

import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Footer from "@/components/Footer";
import Image from "next/image";

export default function CartPage() {
    const { cart, updateQty, removeItem, cartTotal, cartCount } = useCart();
    const { user } = useAuth();
    const router = useRouter();

    const isFreeShipping = cartTotal >= 999;
    const shippingCost = isFreeShipping || cartTotal === 0 ? 0 : 60;
    const gst = Math.round((cartTotal + shippingCost) * 0.03);
    const grandTotal = cartTotal + shippingCost + gst;
    const freeShipProgress = Math.min((cartTotal / 999) * 100, 100);

    const handleProceedToCheckout = () => {
        if (!user) {
            router.push("/login?redirect=/checkout");
        } else {
            router.push("/checkout");
        }
    };

    return (
        <div className="site-wrapper">
            <div className="bg-fixed" />
            <div className="bg-overlay" />
            <div className="content-layer">
                <div className="cart-page">
                    <button className="back-btn" onClick={() => router.push("/")}>
                        ← Continue Shopping
                    </button>

                    <h1 className="cart-page-title">
                        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                        </svg>
                        {cart.length === 0 ? "Your Cart" : `Your Cart (${cartCount} items)`}
                    </h1>

                    {cart.length === 0 ? (
                        <div className="empty-cart">
                            <div className="empty-cart-icon">
                                <svg width="80" height="80" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
                                    <circle cx="9" cy="21" r="1" />
                                    <circle cx="20" cy="21" r="1" />
                                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                                </svg>
                            </div>
                            <h2>Your cart is empty</h2>
                            <p>Looks like you haven't added any farm-fresh goodness yet!</p>
                            <button className="cta-btn empty-cart-btn" onClick={() => router.push("/")}>
                                Explore Products →
                            </button>
                        </div>
                    ) : (
                        <div className="cart-layout">
                            <div className="cart-items">
                                {/* Free shipping progress bar */}
                                <div className="ship-progress-wrap">
                                    {isFreeShipping ? (
                                        <div className="ship-progress-msg success">
                                            <span>🎉</span> You've unlocked <strong>FREE shipping!</strong>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="ship-progress-msg">
                                                Add <strong>₹{(999 - cartTotal).toLocaleString("en-IN")}</strong> more for free shipping
                                            </div>
                                            <div className="ship-progress-bar">
                                                <div className="ship-progress-fill" style={{ width: `${freeShipProgress}%` }} />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {cart.map((i, idx) => (
                                    <div key={i.varId} className="citem" style={{ animationDelay: `${idx * 0.05}s` }}>
                                        <div className="citem-icon" style={{ background: i.bg, position: "relative", overflow: "hidden" }}>
                                            {i.img ? (
                                                <Image src={i.img} alt={i.name} fill style={{ objectFit: "cover" }} sizes="80px" />
                                            ) : (
                                                <span className="citem-emoji">{i.emoji}</span>
                                            )}
                                        </div>
                                        <div className="citem-info">
                                            <div className="citem-name">{i.name}</div>
                                            <div className="citem-var">{i.label}</div>
                                            <div className="citem-unit-price">₹{i.price.toLocaleString("en-IN")} each</div>
                                        </div>
                                        <div className="citem-right">
                                            <div className="qty-ctrl">
                                                <button className="qbtn" onClick={() => updateQty(i.varId, -1)} aria-label="Decrease quantity">−</button>
                                                <div className="qnum">{i.qty}</div>
                                                <button className="qbtn" onClick={() => updateQty(i.varId, 1)} aria-label="Increase quantity">+</button>
                                            </div>
                                            <div className="citem-price">₹{(i.price * i.qty).toLocaleString("en-IN")}</div>
                                            <button className="rm-btn" onClick={() => removeItem(i.varId)} aria-label="Remove item">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                                </svg>
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="cart-sidebar">
                                <div className="summary-box">
                                    <div className="sum-hd">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="16" y1="13" x2="8" y2="13" />
                                            <line x1="16" y1="17" x2="8" y2="17" />
                                        </svg>
                                        Order Summary
                                    </div>

                                    <div className="sum-rows">
                                        <div className="sum-row">
                                            <span className="lbl">Subtotal ({cartCount} items)</span>
                                            <span className="val">₹{cartTotal.toLocaleString("en-IN")}</span>
                                        </div>
                                        <div className="sum-row">
                                            <span className="lbl">Shipping</span>
                                            <span className={`val ${isFreeShipping ? "free-tag" : ""}`}>
                                                {isFreeShipping ? "FREE" : `₹${shippingCost}`}
                                            </span>
                                        </div>
                                        <div className="sum-row">
                                            <span className="lbl">GST (3%)</span>
                                            <span className="val">₹{gst.toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>

                                    <div className="sum-divider" />

                                    <div className="promo-box">
                                        <input type="text" className="promo-input" placeholder="Promo code" />
                                        <button className="btn-apply">Apply</button>
                                    </div>

                                    <div className="sum-divider" />

                                    <div className="sum-total">
                                        <span className="lbl">Total</span>
                                        <span className="val">₹{grandTotal.toLocaleString("en-IN")}</span>
                                    </div>

                                    <button className="cta-btn" onClick={handleProceedToCheckout}>
                                        Proceed to Checkout →
                                    </button>

                                    <div className="cart-trust">
                                        <div className="trust-item">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                <path d="M7 11V7a5 5 0 0110 0v4" />
                                            </svg>
                                            Secure Checkout
                                        </div>
                                        <div className="trust-item">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                            </svg>
                                            100% Safe
                                        </div>
                                        <div className="trust-item">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            Farm Fresh
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <Footer />
            </div>
        </div>
    );
}
