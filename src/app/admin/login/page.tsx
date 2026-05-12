"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin/payroll";
  const initialError = params.get("error") === "not_authorized" ? "Your account is not authorised for admin access." : "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (signInError || !data.user) {
      setError(signInError?.message ?? "Sign in failed.");
      setSubmitting(false);
      return;
    }
    const { data: admin } = await supabase.from("admins").select("id, active").eq("id", data.user.id).maybeSingle();
    if (!admin || !admin.active) {
      await supabase.auth.signOut();
      setError("Your account is not authorised for admin access.");
      setSubmitting(false);
      return;
    }
    supabase.rpc("touch_admin_last_login").then(() => {});
    router.push(next);
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0C0A09", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Nunito', system-ui, sans-serif", color: "#F5F0EB" }}>
      <form onSubmit={submit} style={{ background: "#141210", border: "1px solid #2a2420", borderRadius: 16, padding: 36, maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "#8B7355", marginBottom: 8, fontWeight: 700 }}>EVOLVE — STAFF AREA</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px 0", letterSpacing: "-0.01em" }}>Sign in to admin</h1>
        <p style={{ color: "#8B7355", fontSize: 14, margin: "0 0 28px 0", lineHeight: 1.5 }}>This area is for Evolve staff with admin access.</p>
        <label style={{ display: "block", fontSize: 12, color: "#8B7355", fontWeight: 600, marginBottom: 6 }}>Email</label>
        <input type="email" autoFocus autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: "12px 14px", fontSize: 15, background: "#0C0A09", border: "1px solid #2a2420", borderRadius: 8, color: "#F5F0EB", outline: "none", marginBottom: 16, boxSizing: "border-box", fontFamily: "inherit" }} />
        <label style={{ display: "block", fontSize: 12, color: "#8B7355", fontWeight: 600, marginBottom: 6 }}>Password</label>
        <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: "12px 14px", fontSize: 15, background: "#0C0A09", border: "1px solid #2a2420", borderRadius: 8, color: "#F5F0EB", outline: "none", marginBottom: 8, boxSizing: "border-box", fontFamily: "inherit" }} />
        {error && (<div style={{ color: "#ff6b5e", fontSize: 13, margin: "12px 0 0 0", padding: "10px 12px", background: "rgba(255,107,94,0.08)", borderRadius: 6, border: "1px solid rgba(255,107,94,0.18)" }}>{error}</div>)}
        <button type="submit" disabled={submitting} style={{ width: "100%", padding: "14px", fontSize: 15, fontWeight: 700, background: submitting ? "#8B5640" : "#D4654A", color: "#fff", border: "none", borderRadius: 8, cursor: submitting ? "wait" : "pointer", fontFamily: "inherit", marginTop: 20, transition: "background 0.2s" }}>{submitting ? "Signing in…" : "Sign In"}</button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (<Suspense fallback={<div style={{ minHeight: "100vh", background: "#0C0A09" }} />}><LoginForm /></Suspense>);
}
