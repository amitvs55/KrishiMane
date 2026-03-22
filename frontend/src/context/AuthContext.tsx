"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────
export type UserRole = "admin" | "customer";

export interface AuthUser {
    name: string;
    role: UserRole;
    email: string;
}

interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<string | null>;
    register: (name: string, email: string, phone: string, password: string) => Promise<string | null>;
    logout: () => void;
}

// ─── Context ──────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Rehydrate session from localStorage on mount
    useEffect(() => {
        const token = localStorage.getItem("km_token");
        if (!token) {
            setLoading(false);
            return;
        }
        fetch(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data) setUser({ name: data.name, role: data.role, email: data.email });
                else localStorage.removeItem("km_token");
            })
            .catch(() => localStorage.removeItem("km_token"))
            .finally(() => setLoading(false));
    }, []);

    // Login
    const login = useCallback(async (email: string, password: string): Promise<string | null> => {
        try {
            const res = await fetch(`${API}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) return data.detail || "Login failed.";
            localStorage.setItem("km_token", data.token);
            setUser({ name: data.name, role: data.role, email });
            return null; // null = success
        } catch {
            return "Network error. Please try again.";
        }
    }, []);

    // Register (auto-login after success)
    const register = useCallback(
        async (name: string, email: string, phone: string, password: string): Promise<string | null> => {
            try {
                const res = await fetch(`${API}/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, phone, password }),
                });
                const data = await res.json();
                if (!res.ok) return data.detail || "Registration failed.";
                localStorage.setItem("km_token", data.token);
                setUser({ name: data.name, role: data.role, email });
                return null;
            } catch {
                return "Network error. Please try again.";
            }
        },
        []
    );

    // Logout
    const logout = useCallback(() => {
        localStorage.removeItem("km_token");
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
