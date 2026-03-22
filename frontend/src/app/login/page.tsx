"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        const err = await login(email, password);
        setLoading(false);
        if (err) {
            setError(err);
        } else {
            router.push("/");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-bg-fixed" />
            <div className="auth-bg-overlay" />

            <div className="auth-card">
                {/* Logo */}
                <div className="auth-logo">
                    <div className="auth-logo-icon">🌿</div>
                    <div className="auth-logo-text">
                        <span className="logo-krishi">Krishi</span>
                        <span className="logo-mane">Mane</span>
                    </div>
                </div>

                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Sign in to your KrishiMane account</p>

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    {error && (
                        <div className="auth-error" role="alert">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="login-email" className="form-label">
                            Email Address
                        </label>
                        <input
                            id="login-email"
                            type="email"
                            className="auth-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="login-password" className="form-label">
                            Password
                        </label>
                        <input
                            id="login-password"
                            type="password"
                            className="auth-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-btn"
                        id="login-submit-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="auth-spinner" />
                        ) : (
                            "Sign In →"
                        )}
                    </button>
                </form>

                {/* Admin hint */}
                <div className="auth-hint">
                    <span className="auth-hint-badge">🛡 Admin?</span>
                    Use <code>admin@krishimane.com</code> / <code>admin123</code>
                </div>

                <div className="auth-divider">
                    <span>New to KrishiMane?</span>
                </div>

                <Link href="/register" className="auth-link-btn" id="go-register-btn">
                    Create Customer Account
                </Link>
            </div>
        </div>
    );
}
