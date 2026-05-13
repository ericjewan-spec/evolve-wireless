"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

type Mode = "signin" | "forgot";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";
  const initialError = params.get("error") === "not_authorized"
    ? "Your account is not authorised for admin access."
    : "";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);
  const [submitting, setSubmitting] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  async function submitSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError || !data.user) {
      setError(signInError?.message ?? "Sign in failed.");
      setSubmitting(false);
      return;
    }

    const { data: admin } = await supabase
      .from("admins")
      .select("id, active")
      .eq("id", data.user.id)
      .maybeSingle();

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

  async function submitForgot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Enter your email so we can send you a reset link.");
      return;
    }
    setSubmitting(true);

    const supabase = createClient();
    // Always claim success even if email doesn't exist — don't leak which emails are valid admins.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/admin/reset-password` },
    );

    // Supabase still 200s when the email doesn't exist; only surface real errors (rate limit etc).
    if (resetError) {
      // Rate-limit and similar errors are still worth showing
      setError(resetError.message);
      setSubmitting(false);
      return;
    }

    setForgotSent(true);
    setSubmitting(false);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setForgotSent(false);
    setPassword("");
  }

  // ------- FORGOT mode (success state) -------
  if (mode === "forgot" && forgotSent) {
    return (
      <div style={shellStyle}>
        <div style={cardStyle}>
          <div style={tagStyle}>EVOLVE — STAFF AREA</div>
          <h1 style={h1Style}>Check your email</h1>
          <p style={pStyle}>
            If an admin account exists for <strong style={{ color: "#F5F0EB" }}>{email}</strong>,
            we&apos;ve sent a password reset link to that address. The link expires in 1 hour.
          </p>
          <p style={{ ...pStyle, color: "#7A7068" }}>
            Don&apos;t see it within a minute or two? Check your spam folder.
          </p>
          <button
            type="button"
            onClick={() => switchMode("signin")}
            style={btnSecondary}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  // ------- FORGOT mode (form) -------
  if (mode === "forgot") {
    return (
      <div style={shellStyle}>
        <form onSubmit={submitForgot} style={cardStyle}>
          <div style={tagStyle}>EVOLVE — STAFF AREA</div>
          <h1 style={h1Style}>Reset your password</h1>
          <p style={pStyle}>
            Enter the email tied to your admin account. We&apos;ll send a reset link if it matches.
          </p>

          <label style={labelStyle}>Email</label>
          <input
            type="email"
            autoFocus
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          {error && <div style={errStyle}>{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            style={{
              ...btnPrimary,
              background: submitting ? "#8B5640" : "#D4654A",
              cursor: submitting ? "wait" : "pointer",
            }}
          >
            {submitting ? "Sending…" : "Send reset link"}
          </button>

          <div style={{ marginTop: 18, textAlign: "center" }}>
            <button
              type="button"
              onClick={() => switchMode("signin")}
              style={linkBtn}
            >
              ← Back to sign in
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ------- SIGN IN mode -------
  return (
    <div style={shellStyle}>
      <form onSubmit={submitSignIn} style={cardStyle}>
        <div style={tagStyle}>EVOLVE — STAFF AREA</div>
        <h1 style={h1Style}>Sign in to admin</h1>
        <p style={pStyle}>This area is for Evolve staff with admin access.</p>

        <label style={labelStyle}>Email</label>
        <input
          type="email"
          autoFocus
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ ...inputStyle, marginBottom: 16 }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <label style={labelStyle}>Password</label>
          <button
            type="button"
            onClick={() => switchMode("forgot")}
            style={linkBtn}
          >
            Forgot password?
          </button>
        </div>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        {error && <div style={errStyle}>{error}</div>}

        <button
          type="submit"
          disabled={submitting}
          style={{
            ...btnPrimary,
            background: submitting ? "#8B5640" : "#D4654A",
            cursor: submitting ? "wait" : "pointer",
          }}
        >
          {submitting ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0C0A09" }} />}>
      <LoginForm />
    </Suspense>
  );
}

// ---- shared styles ----
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
  // Explicit colour — fixes the dim-orange-on-dark heading bug
  color: "#F5F0EB",
  fontSize: 26,
  fontWeight: 800,
  margin: "0 0 8px 0",
  letterSpacing: "-0.01em",
};
const pStyle: React.CSSProperties = {
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
const btnPrimary: React.CSSProperties = {
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
const btnSecondary: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  fontSize: 14,
  fontWeight: 600,
  background: "transparent",
  color: "#F5F0EB",
  border: "1px solid #2a2420",
  borderRadius: 8,
  fontFamily: "inherit",
  marginTop: 24,
  cursor: "pointer",
};
const linkBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 0,
  color: "#D4654A",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};
