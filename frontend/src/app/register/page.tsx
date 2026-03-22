"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) return setError("Please enter your full name.");
        if (!phone.trim()) return setError("Please enter your phone number.");
        if (password.length < 6) return setError("Password must be at least 6 characters.");
        if (password !== confirm) return setError("Passwords do not match.");

        setLoading(true);
        const err = await register(name.trim(), email.trim(), phone.trim(), password);
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

                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Join KrishiMane for pure, natural oils</p>

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    {error && (
                        <div className="auth-error" role="alert">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="reg-name" className="form-label">
                            Full Name
                        </label>
                        <input
                            id="reg-name"
                            type="text"
                            className="auth-input"
                            placeholder="Your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoComplete="name"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-email" className="form-label">
                            Email Address
                        </label>
                        <input
                            id="reg-email"
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
                        <label htmlFor="reg-phone" className="form-label">
                            Phone Number
                        </label>
                        <input
                            id="reg-phone"
                            type="tel"
                            className="auth-input"
                            placeholder="+91 999 999 9999"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-password" className="form-label">
                            Password
                        </label>
                        <input
                            id="reg-password"
                            type="password"
                            className="auth-input"
                            placeholder="Min. 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-confirm" className="form-label">
                            Confirm Password
                        </label>
                        <input
                            id="reg-confirm"
                            type="password"
                            className="auth-input"
                            placeholder="Repeat password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-btn"
                        id="register-submit-btn"
                        disabled={loading}
                    >
                        {loading ? <span className="auth-spinner" /> : "Create Account →"}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>Already have an account?</span>
                </div>

                <Link href="/login" className="auth-link-btn" id="go-login-btn">
                    Sign In Instead
                </Link>
            </div>
        </div>
    );
}
