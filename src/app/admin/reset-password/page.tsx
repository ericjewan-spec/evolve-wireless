"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

/**
 * Reset-password page.
 *
 * Flow:
 *   1. User clicks the link in their email (e.g. .../admin/reset-password#access_token=...&refresh_token=...&type=recovery)
 *   2. Supabase JS picks up the tokens from the URL hash and establishes a recovery session
 *      via the auth.onAuthStateChange "PASSWORD_RECOVERY" event.
 *   3. We show a form to set a new password.
 *   4. updateUser({ password }) persists the new password.
 *   5. We sign the user out (recovery sessions are short-lived) and redirect to /admin/login.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [ready, setReady] = useState(false);
  const [authedEmail, setAuthedEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Listen for the PASSWORD_RECOVERY event Supabase fires after reading the URL hash.
  // Also check if a recovery session is already active when the page mounts.
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (user) {
        setAuthedEmail(user.email ?? null);
        setReady(true);
      } else {
        // Still might land in a moment via the auth state change event below
        setTimeout(() => {
          if (!cancelled && !ready) setReady(true); // show form regardless; submit will error if no session
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

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message || "Could not update password. The link may have expired.");
      setSubmitting(false);
      return;
    }

    // Sign the recovery session out, then redirect to login
    await supabase.auth.signOut();
    setDone(true);
    setSubmitting(false);

    setTimeout(() => {
      router.push("/admin/login");
      router.refresh();
    }, 2000);
  }

  if (!ready) {
    return (
      <div style={shellStyle}>
        <div style={{ color: "#8B7355", fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  if (done) {
    return (
      <div style={shellStyle}>
        <div style={cardStyle}>
          <div style={tagStyle}>EVOLVE — STAFF AREA</div>
          <h1 style={h1Style}>Password updated</h1>
          <p style={subText}>Your password has been changed. Redirecting you to sign in…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <form onSubmit={submit} style={cardStyle}>
        <div style={tagStyle}>EVOLVE — STAFF AREA</div>
        <h1 style={h1Style}>Set a new password</h1>
        <p style={subText}>
          {authedEmail
            ? <>Setting a new password for <strong style={{ color: "#F5F0EB" }}>{authedEmail}</strong>.</>
            : <>Choose a new password for your Evolve admin account.</>}
        </p>

        <label style={labelStyle}>New password</label>
        <input
          type="password"
          autoFocus
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 10 characters"
          style={inputStyle}
        />

        <label style={{ ...labelStyle, marginTop: 14 }}>Confirm new password</label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          style={inputStyle}
        />

        {error && (
          <div style={errStyle}>{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            ...btnStyle,
            background: submitting ? "#8B5640" : "#D4654A",
            cursor: submitting ? "wait" : "pointer",
          }}
        >
          {submitting ? "Updating…" : "Update password"}
        </button>

        <div style={{ marginTop: 18, textAlign: "center" }}>
          <Link href="/admin/login" style={{ color: "#8B7355", fontSize: 13, textDecoration: "none" }}>
            ← Back to sign in
          </Link>
        </div>
      </form>
    </div>
  );
}

// ---- styles ----
const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0C0A09",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  fontFamily: "'Nunito', system-ui, sans-serif",
  color: "#F5F0EB",
};
const cardStyle: React.CSSProperties = {
  background: "#141210",
  border: "1px solid #2a2420",
  borderRadius: 16,
  padding: 36,
  maxWidth: 420,
  width: "100%",
  boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
};
const tagStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.18em",
  color: "#8B7355",
  marginBottom: 8,
  fontWeight: 700,
};
const h1Style: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 800,
  margin: "0 0 8px 0",
  letterSpacing: "-0.01em",
  color: "#F5F0EB",
};
const subText: React.CSSProperties = {
  color: "#8B7355",
  fontSize: 14,
  margin: "0 0 24px 0",
  lineHeight: 1.5,
};
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#8B7355",
  fontWeight: 600,
  marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  fontSize: 15,
  background: "#0C0A09",
  border: "1px solid #2a2420",
  borderRadius: 8,
  color: "#F5F0EB",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};
const errStyle: React.CSSProperties = {
  color: "#ff8a7a",
  fontSize: 13,
  margin: "14px 0 0 0",
  padding: "10px 12px",
  background: "rgba(255,107,94,0.08)",
  borderRadius: 6,
  border: "1px solid rgba(255,107,94,0.18)",
};
const btnStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  fontSize: 15,
  fontWeight: 700,
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontFamily: "inherit",
  marginTop: 20,
  transition: "background 0.2s",
};
