"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

export default function StaffResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [ready, setReady] = useState(false);
  const [authedEmail, setAuthedEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (user) {
        setAuthedEmail(user.email ?? null);
        setReady(true);
      } else {
        setTimeout(() => {
          if (!cancelled && !ready) setReady(true);
        }, 1500);
      }
    }
    checkSession();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setAuthedEmail(session?.user?.email ?? null);
        setReady(true);
      }
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 10) { setError("Password must be at least 10 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message || "Could not update password. The link may have expired.");
      setSubmitting(false);
      return;
    }
    await supabase.auth.signOut();
    setDone(true);
    setSubmitting(false);
    setTimeout(() => { router.push("/staff/login"); router.refresh(); }, 2000);
  }

  if (!ready) return <div style={shell}><div style={{ color: "#8B7355", fontSize: 14 }}>Loading…</div></div>;

  if (done) {
    return (
      <div style={shell}>
        <div style={card}>
          <div style={tag}>EVOLVE STAFF PORTAL</div>
          <h1 style={h1}>Password updated</h1>
          <p style={p}>Your password has been changed. Redirecting you to sign in…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={shell}>
      <form onSubmit={submit} style={card}>
        <div style={tag}>EVOLVE STAFF PORTAL</div>
        <h1 style={h1}>Set a new password</h1>
        <p style={p}>
          {authedEmail
            ? <>Setting a new password for <strong style={{ color: "#F5F0EB" }}>{authedEmail}</strong>.</>
            : <>Choose a new password for your staff portal account.</>}
        </p>

        <label style={label}>New password</label>
        <input type="password" autoFocus required autoComplete="new-password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 10 characters" style={input} />

        <label style={{ ...label, marginTop: 14 }}>Confirm new password</label>
        <input type="password" required autoComplete="new-password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} style={input} />

        {error && <div style={err}>{error}</div>}

        <button type="submit" disabled={submitting} style={{
          ...btn,
          background: submitting ? "#8B5640" : "#D4654A",
          cursor: submitting ? "wait" : "pointer",
        }}>
          {submitting ? "Updating…" : "Update password"}
        </button>

        <div style={{ marginTop: 18, textAlign: "center" }}>
          <Link href="/staff/login" style={{ color: "#8B7355", fontSize: 13, textDecoration: "none" }}>
            ← Back to sign in
          </Link>
        </div>
      </form>
    </div>
  );
}

const shell: React.CSSProperties = {
  minHeight: "100vh", background: "#0C0A09", display: "flex",
  alignItems: "center", justifyContent: "center", padding: 20,
  fontFamily: "'Nunito', system-ui, sans-serif", color: "#F5F0EB",
};
const card: React.CSSProperties = {
  background: "#141210", border: "1px solid #2a2420", borderRadius: 16,
  padding: 36, maxWidth: 420, width: "100%",
  boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
};
const tag: React.CSSProperties = {
  fontSize: 11, letterSpacing: "0.18em", color: "#8B7355",
  marginBottom: 8, fontWeight: 700,
};
const h1: React.CSSProperties = {
  color: "#F5F0EB", fontSize: 26, fontWeight: 800,
  margin: "0 0 8px 0", letterSpacing: "-0.01em",
};
const p: React.CSSProperties = {
  color: "#8B7355", fontSize: 14, margin: "0 0 24px 0", lineHeight: 1.5,
};
const label: React.CSSProperties = {
  display: "block", fontSize: 12, color: "#8B7355", fontWeight: 600, marginBottom: 6,
};
const input: React.CSSProperties = {
  width: "100%", padding: "12px 14px", fontSize: 15,
  background: "#0C0A09", border: "1px solid #2a2420", borderRadius: 8,
  color: "#F5F0EB", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};
const err: React.CSSProperties = {
  color: "#ff8a7a", fontSize: 13, margin: "14px 0 0 0",
  padding: "10px 12px", background: "rgba(255,107,94,0.08)",
  borderRadius: 6, border: "1px solid rgba(255,107,94,0.18)",
};
const btn: React.CSSProperties = {
  width: "100%", padding: "14px", fontSize: 15, fontWeight: 700,
  color: "#fff", border: "none", borderRadius: 8,
  fontFamily: "inherit", marginTop: 20, transition: "background 0.2s",
};
