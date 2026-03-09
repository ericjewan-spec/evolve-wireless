"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = "/portal";
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Link href="/">
            <img src="/logo.svg" alt="Evolve Wireless" className="h-12 mx-auto mb-6" />
          </Link>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Customer Portal</h1>
          <p className="text-sm mt-2" style={{ color: "var(--text3)" }}>Sign in to manage your account, pay bills, and get support.</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: "white", border: "1px solid rgba(44, 24, 16, 0.06)", boxShadow: "0 4px 24px rgba(44, 24, 16, 0.08)" }}>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(212, 101, 74, 0.08)", color: "var(--terracotta)", border: "1px solid rgba(212, 101, 74, 0.2)" }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                style={{ background: "var(--soft-bg)", border: "1.5px solid rgba(44, 24, 16, 0.1)" }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                style={{ background: "var(--soft-bg)", border: "1.5px solid rgba(44, 24, 16, 0.1)" }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center"
              style={{ padding: "14px" }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <a href="https://wa.me/5926092487?text=Hi%2C%20I%20need%20help%20logging%20in" target="_blank" rel="noopener" className="block text-sm" style={{ color: "var(--teal)" }}>
              Need help? WhatsApp us at +592 609-2487
            </a>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm" style={{ color: "var(--text3)" }}>← Back to website</Link>
        </div>
      </div>
    </div>
  );
}
