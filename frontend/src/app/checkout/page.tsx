"use client";

import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

declare global {
    interface Window {
        Razorpay: new (options: Record<string, unknown>) => { open: () => void };
    }
}

export default function CheckoutPage() {
    const { user } = useAuth();
    const { cart, cartTotal, cartCount, clearCart } = useCart();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [addr, setAddr] = useState({ name: "", phone: "", pin: "", city: "", state: "", line1: "", line2: "" });
    const [payMethod, setPayMethod] = useState("razorpay");
    const [orderId, setOrderId] = useState("");
    const [orderNumber, setOrderNumber] = useState("");
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState("");

    const isFreeShipping = cartTotal >= 999;
    const shippingCost = isFreeShipping || cartTotal === 0 ? 0 : 60;
    const gst = Math.round((cartTotal + shippingCost) * 0.05);
    const grandTotal = cartTotal + shippingCost + gst;

    useEffect(() => {
        if (!user && step < 4) {
            router.replace("/login?redirect=/checkout");
        }
    }, [user, router, step]);

    useEffect(() => {
        if (cart.length === 0 && step < 4) {
            router.replace("/cart");
        }
    }, [cart, router, step]);

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        setAddr({ ...addr, pin: v });
        if (v.length === 6) {
            const pmap: Record<string, string> = { "56": "Bengaluru", "57": "Mysuru", "58": "Mangaluru", "40": "Mumbai", "41": "Pune", "60": "Chennai", "50": "Hyderabad", "38": "Ahmedabad", "11": "New Delhi", "30": "Jaipur" };
            const smap: Record<string, string> = { "56": "KA", "57": "KA", "58": "KA", "40": "MH", "41": "MH", "60": "TN", "50": "TG", "38": "GJ", "11": "DL", "30": "RJ" };
            const pre = v.substring(0, 2);
            setAddr(prev => ({
                ...prev,
                city: pmap[pre] || "Your City",
                state: smap[pre] || ""
            }));
        }
    };

    const nextStep = (current: number) => {
        if (current === 1) {
            if (!addr.name || !addr.phone || !addr.pin || !addr.state || !addr.line1) {
                alert("Please fill in all required fields.");
                return;
            }
        }
        setStep(current + 1);
        window.scrollTo(0, 0);
    };

    const placeOrder = async () => {
        setPlacing(true);
        setError("");

        try {
            const token = localStorage.getItem("km_token");
            const res = await fetch(`${API}/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    items: cart.map((item) => ({
                        variant_id: item.varId,
                        qty: item.qty,
                    })),
                    addr_name: addr.name,
                    addr_phone: addr.phone,
                    addr_pin: addr.pin,
                    addr_city: addr.city,
                    addr_state: addr.state,
                    addr_line1: addr.line1,
                    addr_line2: addr.line2,
                    payment_method: payMethod,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Failed to place order.");
            }

            const data = await res.json();

            // If Razorpay — open payment popup
            if (payMethod === "razorpay" && data.razorpay_order_id) {
                openRazorpay(data);
                return; // Don't go to step 4 yet — wait for payment callback
            }

            // COD — go directly to confirmation
            setOrderId(data.order_id);
            setOrderNumber(data.order_number);
            clearCart();
            setStep(4);
            window.scrollTo(0, 0);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong.";
            setError(message);
        } finally {
            setPlacing(false);
        }
    };

    const openRazorpay = (orderData: {
        order_id: string;
        order_number: string;
        grand_total: number;
        razorpay_order_id: string;
        razorpay_key_id: string;
    }) => {
        const options = {
            key: orderData.razorpay_key_id,
            amount: Math.round(orderData.grand_total * 100), // paise
            currency: "INR",
            name: "KrishiMane",
            description: `Order ${orderData.order_number}`,
            order_id: orderData.razorpay_order_id,
            handler: async function (response: {
                razorpay_payment_id: string;
                razorpay_order_id: string;
                razorpay_signature: string;
            }) {
                // Verify payment on backend
                try {
                    const token = localStorage.getItem("km_token");
                    const verifyRes = await fetch(`${API}/payments/verify`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            order_id: orderData.order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                        }),
                    });

                    if (!verifyRes.ok) {
                        const err = await verifyRes.json();
                        throw new Error(err.detail || "Payment verification failed.");
                    }

                    // Payment verified — show confirmation
                    setOrderId(orderData.order_id);
                    setOrderNumber(orderData.order_number);
                    clearCart();
                    setStep(4);
                    window.scrollTo(0, 0);
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : "Payment verification failed.";
                    setError(message);
                }
                setPlacing(false);
            },
            prefill: {
                name: addr.name,
                contact: addr.phone,
                email: user?.email || "",
            },
            theme: {
                color: "#2d5016",
            },
            modal: {
                ondismiss: function () {
                    setError("Payment was cancelled. Your order is saved — you can retry payment.");
                    setPlacing(false);
                },
            },
        };

        if (typeof window.Razorpay === "undefined") {
            setError("Razorpay SDK not loaded. Please refresh and try again.");
            setPlacing(false);
            return;
        }

        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    if (!user && step < 4) return null;

    return (
        <div id="km">
            {step < 4 && (
                <div className="step-bar">
                    {["Delivery", "Review", "Payment"].map((s, i) => {
                        const n = i + 1;
                        const cls = n < step ? "done" : n === step ? "active" : "";
                        return (
                            <React.Fragment key={s}>
                                {i > 0 && <div className={`sdiv ${n <= step ? "done" : ""}`}></div>}
                                <div className={`step ${cls}`}>
                                    <div className="snum">{n < step ? "✓" : n}</div>
                                    <div className="slbl">{s}</div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            )}

            <div className="co-wrap">
                {step === 1 && (
                    <>
                        <button className="back-link" style={{ fontSize: "15px", fontWeight: "600", marginBottom: "24px", color: "var(--text-dark)" }} onClick={() => router.push("/cart")}>&#8592; Back to Cart</button>
                        <div className="co-layout">
                            <div>
                                <div className="co-card">
                                    <div className="co-card-hd">📍 Delivery Address</div>
                                    <div className="co-card-body">
                                        <div className="form-grid">
                                            <div className="fgrp">
                                                <label>Full Name</label>
                                                <input value={addr.name} onChange={(e) => setAddr({ ...addr, name: e.target.value })} placeholder="e.g. Priya Sharma" />
                                            </div>
                                            <div className="fgrp">
                                                <label>Mobile Number</label>
                                                <input type="tel" pattern="[0-9]{10}" value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} placeholder="e.g. 98765 43210" title="10 digit mobile number" />
                                            </div>
                                            <div className="fgrp">
                                                <label>Pincode</label>
                                                <input value={addr.pin} onChange={handlePinChange} placeholder="e.g. 560001" maxLength={6} />
                                                <div className="hint">{addr.city ? `${addr.city}, ${addr.state}` : ""}</div>
                                            </div>
                                            <div className="fgrp">
                                                <label>City</label>
                                                <input value={addr.city} readOnly placeholder="Enter pincode first" />
                                            </div>
                                            <div className="fgrp form-full">
                                                <label>State <span className="opt">*</span></label>
                                                <select required value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })}>
                                                    <option value="" disabled>Select state...</option>
                                                    {["KA", "MH", "TN", "AP", "TG", "KL", "GJ", "DL", "UP", "RJ", "HR", "PB", "MP", "WB", "OD", "BR", "Other"].map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="fgrp form-full">
                                                <label>Address Line 1</label>
                                                <input value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} placeholder="House / flat no., building, street" />
                                            </div>
                                            <div className="fgrp form-full">
                                                <label>Address Line 2 <span className="opt">(optional)</span></label>
                                                <input value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} placeholder="Landmark, area, colony" />
                                            </div>
                                        </div>
                                        <div style={{ marginTop: "32px", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "24px" }}>
                                            <button className="cta-btn" onClick={() => nextStep(1)}>Continue to Review &#8594;</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="co-card" style={{ padding: "16px", fontSize: "14px", border: "1px dashed #c8941a", cursor: "pointer", background: "rgba(200, 148, 26, 0.05)", color: "var(--text-dark)", display: "flex", gap: "12px", alignItems: "center" }}>
                                    <span style={{ fontSize: "20px" }}>📍</span>
                                    <div>
                                        <div style={{ fontWeight: "700" }}>Deliver here</div>
                                        <div style={{ fontSize: "12px", color: "var(--text-light)", marginTop: "2px" }}>Auto-detect location</div>
                                    </div>
                                </div>
                                <div className="summary-box">
                                    <div className="sum-hd">Order Summary</div>
                                    <div className="sum-row"><span className="lbl">Subtotal</span><span className="val">&#8377;{cartTotal.toLocaleString("en-IN")}</span></div>
                                    <div className="sum-row"><span className="lbl">Shipping</span><span className="val" style={{ color: "var(--green-light)" }}>{isFreeShipping ? "FREE" : `₹${shippingCost}`}</span></div>
                                    <div className="sum-row"><span className="lbl">GST (5%)</span><span className="val">&#8377;{gst.toLocaleString("en-IN")}</span></div>
                                    <hr className="sum-divider" style={{ margin: "12px 0", borderTop: "1px solid rgba(0,0,0,0.08)" }} />
                                    <div className="sum-total"><span className="lbl">Est. Total</span><span className="val">&#8377;{grandTotal.toLocaleString("en-IN")}</span></div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <button className="back-link" onClick={() => setStep(1)}>&#8592; Edit Address</button>
                        <div className="co-layout">
                            <div>
                                <div className="co-card">
                                    <div className="co-card-hd">🛒 Order Items</div>
                                    <div className="co-card-body">
                                        <div className="review-items">
                                            {cart.map(i => (
                                                <div key={i.varId} className="ri">
                                                    <div>
                                                        <div className="ri-name">{i.emoji} {i.name}</div>
                                                        <div className="ri-meta">{i.label} &times; {i.qty}</div>
                                                    </div>
                                                    <div className="ri-price">&#8377;{(i.price * i.qty).toLocaleString("en-IN")}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="co-card" style={{ marginTop: "16px" }}>
                                    <div className="co-card-hd">📍 Delivering to</div>
                                    <div className="co-card-body" style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--tx)" }}>
                                        <strong>{addr.name}</strong> • {addr.phone}<br />
                                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}<br />
                                        {addr.city}, {addr.state} — {addr.pin}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="summary-box">
                                    <div className="sum-hd">Price Details</div>
                                    <div className="sum-body">
                                        <div className="sum-row"><span className="lbl">Subtotal ({cartCount} items)</span><span className="val">&#8377;{cartTotal.toLocaleString("en-IN")}</span></div>
                                        <div className="sum-row"><span className="lbl">Shipping</span><span className="val" style={{ color: "var(--g3)" }}>{isFreeShipping ? "FREE" : `₹${shippingCost}`}</span></div>
                                        <div className="sum-row"><span className="lbl">GST (5%)</span><span className="val">&#8377;{gst.toLocaleString("en-IN")}</span></div>
                                        <hr className="sum-divider" />
                                        <div className="sum-total"><span className="lbl">Total</span><span className="val">&#8377;{grandTotal.toLocaleString("en-IN")}</span></div>
                                        <button className="cta-btn" onClick={() => nextStep(2)}>Continue to Payment &#8594;</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {step === 3 && (
                    <>
                        <button className="back-link" onClick={() => setStep(2)}>&#8592; Back to Review</button>
                        <div className="co-layout">
                            <div>
                                <div className="co-card">
                                    <div className="co-card-hd">💳 Choose Payment</div>
                                    <div className="co-card-body">
                                        <div className="pay-opts">
                                            <div className={`pay-opt ${payMethod === "razorpay" ? "sel" : ""}`} onClick={() => setPayMethod("razorpay")}>
                                                <div className="pay-opt-icon">📸</div>
                                                <div>
                                                    <div className="pay-opt-name">Pay Online</div>
                                                    <div className="pay-opt-desc">UPI, Cards, Netbanking, Wallets via Razorpay</div>
                                                </div>
                                                <div className="pay-check">{payMethod === "razorpay" && <div className="pay-check-dot"></div>}</div>
                                            </div>
                                            <div className={`pay-opt ${payMethod === "cod" ? "sel" : ""}`} onClick={() => setPayMethod("cod")}>
                                                <div className="pay-opt-icon">💰</div>
                                                <div>
                                                    <div className="pay-opt-name">Cash on Delivery</div>
                                                    <div className="pay-opt-desc">Pay when your order arrives at your door</div>
                                                </div>
                                                <div className="pay-check">{payMethod === "cod" && <div className="pay-check-dot"></div>}</div>
                                            </div>
                                        </div>

                                        {error && (
                                            <div style={{ background: "#fdecea", border: "1px solid #f5c6cb", borderRadius: "8px", padding: "12px", fontSize: "13px", color: "#721c24", marginBottom: "12px" }}>
                                                {error}
                                            </div>
                                        )}

                                        <div style={{ background: "var(--cr)", border: "1px solid var(--bdr)", borderRadius: "10px", padding: "14px", fontSize: "13px", color: "var(--mt)", marginBottom: "16px" }}>
                                            🔒 Your payment is secured by 256-bit SSL encryption. KrishiMane never stores your card details.
                                        </div>
                                        <button className="cta-btn gold" onClick={placeOrder} disabled={placing}>
                                            {placing
                                                ? "Placing order..."
                                                : payMethod === "razorpay"
                                                    ? `Pay ₹${grandTotal.toLocaleString("en-IN")} via Razorpay`
                                                    : "Confirm Order — Pay on Delivery"
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="summary-box">
                                    <div className="sum-hd">Final Bill</div>
                                    <div className="sum-body">
                                        {cart.map(i => (
                                            <div key={i.varId} className="sum-row">
                                                <span className="lbl" style={{ fontSize: "13px" }}>{i.emoji} {i.name} {i.label} &times;{i.qty}</span>
                                                <span className="val" style={{ fontSize: "13px" }}>&#8377;{(i.price * i.qty).toLocaleString("en-IN")}</span>
                                            </div>
                                        ))}
                                        <hr className="sum-divider" />
                                        <div className="sum-row"><span className="lbl">Shipping</span><span className="val" style={{ color: "var(--g3)" }}>{isFreeShipping ? "FREE" : `₹${shippingCost}`}</span></div>
                                        <div className="sum-row"><span className="lbl">GST (5%)</span><span className="val">&#8377;{gst.toLocaleString("en-IN")}</span></div>
                                        <hr className="sum-divider" />
                                        <div className="sum-total"><span className="lbl">Grand Total</span><span className="val">&#8377;{grandTotal.toLocaleString("en-IN")}</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {step === 4 && (
                <div className="confirm-wrap">
                    <div className="confirm-icon">✓</div>
                    <h2>Order Placed!</h2>
                    <p>Thank you for choosing KrishiMane. Your order is confirmed and will be processed shortly.</p>
                    <div className="order-id">
                        <div className="lbl">ORDER ID</div>
                        <div className="val">{orderNumber}</div>
                    </div>
                    <div className="deliv-badge">
                        🚚 Expected delivery by <strong>{new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</strong><br />
                        Confirmation sent to your registered email.
                    </div>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                        <button className="cta-btn" style={{ width: "auto", padding: "12px 28px" }} onClick={() => router.push("/")}>&#8592; Shop More Oils</button>
                    </div>
                </div>
            )}
        </div>
    );
}
