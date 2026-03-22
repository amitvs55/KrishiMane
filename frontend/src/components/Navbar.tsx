"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

interface NavbarProps {
    activeTab: "products" | "analysis";
    onTabChange: (tab: "products" | "analysis") => void;
    onChatOpen: () => void;
}

export default function Navbar({ activeTab, onTabChange, onChatOpen }: NavbarProps) {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const isAdmin = user?.role === "admin";
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="navbar">
            <a className="navbar-logo" href="#">
                <div className="logo-icon">🌿</div>
                <div>
                    <div className="logo-text">
                        <span className="logo-krishi">Krishi</span><span className="logo-mane">Mane</span>
                    </div>
                    <span className="logo-tagline">Pure • Natural • Farm Fresh</span>
                </div>
            </a>

            {/* Mobile: cart + hamburger */}
            <div className="navbar-mobile-actions">
                <a href="/cart" className="cart-btn" aria-label="View Cart">
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                    </svg>
                    {cartCount > 0 && <div className="cart-badge">{cartCount}</div>}
                </a>
                <button
                    className={`hamburger-btn ${menuOpen ? "open" : ""}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    <span /><span /><span />
                </button>
            </div>

            {/* Desktop tabs (center) */}
            <div className="navbar-tabs">
                <button
                    id="tab-products"
                    className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
                    onClick={() => onTabChange("products")}
                >
                    🛒 Products
                </button>
                <button
                    id="tab-analysis"
                    className={`tab-btn ${activeTab === "analysis" ? "active" : ""}`}
                    onClick={() => onTabChange("analysis")}
                >
                    📊 Analysis
                </button>
            </div>

            {/* Desktop right actions */}
            <div className="navbar-right">
                {user ? (
                    <div className="navbar-user">
                        <span className="navbar-username">
                            {isAdmin ? "🛡" : "🌿"} {user.name}
                        </span>
                        {isAdmin && (
                            <a href="/admin" className="admin-link-btn">
                                Dashboard
                            </a>
                        )}
                        <a href="/cart" className="cart-btn" id="nav-cart-btn" aria-label="View Cart">
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1" />
                                <circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                            </svg>
                            Cart
                            {cartCount > 0 && <div className="cart-badge" id="cbadge">{cartCount}</div>}
                        </a>
                        <button className="btn-logout" id="logout-btn" onClick={logout}>
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <>
                        <a href="/cart" className="cart-btn" id="nav-cart-btn" aria-label="View Cart">
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1" />
                                <circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                            </svg>
                            Cart
                            {cartCount > 0 && <div className="cart-badge" id="cbadge">{cartCount}</div>}
                        </a>
                        <a href="/login" className="btn-login-nav" id="nav-login-btn">
                            Login
                        </a>
                    </>
                )}
            </div>

            {/* Mobile slide-down menu */}
            {menuOpen && (
                <div className="mobile-menu">
                    <div className="mobile-menu-tabs">
                        <button
                            className={`mobile-menu-item ${activeTab === "products" ? "active" : ""}`}
                            onClick={() => { onTabChange("products"); setMenuOpen(false); }}
                        >
                            🛒 Products
                        </button>
                        <button
                            className={`mobile-menu-item ${activeTab === "analysis" ? "active" : ""}`}
                            onClick={() => { onTabChange("analysis"); setMenuOpen(false); }}
                        >
                            📊 Analysis
                        </button>
                        <button
                            className="mobile-menu-item"
                            onClick={() => { onChatOpen(); setMenuOpen(false); }}
                        >
                            🤖 AI Advisor
                        </button>
                    </div>
                    <div className="mobile-menu-actions">
                        {user ? (
                            <>
                                <div className="mobile-user-info">
                                    {isAdmin ? "🛡" : "🌿"} {user.name}
                                    <span className={`role-tag ${isAdmin ? "role-admin" : "role-customer"}`}>
                                        {isAdmin ? "Admin" : "Customer"}
                                    </span>
                                </div>
                                {isAdmin && (
                                    <a href="/admin" className="mobile-menu-item" onClick={() => setMenuOpen(false)}>
                                        🛡 Admin Dashboard
                                    </a>
                                )}
                                <button className="mobile-menu-item logout" onClick={() => { logout(); setMenuOpen(false); }}>
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <a href="/login" className="mobile-menu-item login" onClick={() => setMenuOpen(false)}>
                                Login / Register
                            </a>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
