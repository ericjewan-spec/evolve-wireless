"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "evolve_admin_authed";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAuthed(window.sessionStorage.getItem(STORAGE_KEY) === "1");
    }
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";
    if (!expected) {
      setError("Admin password not configured. Set NEXT_PUBLIC_ADMIN_PASSWORD in Vercel.");
      return;
    }
    if (input === expected) {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
      setAuthed(true);
      setError("");
    } else {
      setError("Incorrect password.");
      setInput("");
    }
  };

  if (authed === null) {
    return <div style={{ minHeight: "100vh", background: "#0a0d10" }} />;
  }

  if (!authed) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0a0d10",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "system-ui, sans-serif",
      }}>
        <form onSubmit={submit} style={{
          background: "#10141a",
          border: "1px solid rgba(245,241,232,0.08)",
          borderRadius: 12,
          padding: 32,
          maxWidth: 380,
          width: "100%",
        }}>
          <div style={{ fontSize: 12, letterSpacing: "0.15em", color: "#a8a39a", marginBottom: 8 }}>EVOLVE — STAFF AREA</div>
          <h1 style={{ color: "#f5f1e8", fontSize: 22, fontWeight: 700, margin: "0 0 8px 0" }}>Admin Login</h1>
          <p style={{ color: "#a8a39a", fontSize: 14, margin: "0 0 24px 0" }}>This area is for Evolve staff only.</p>
          <input
            type="password"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Password"
            style={{
              width: "100%",
              padding: "12px 14px",
              fontSize: 16,
              background: "#0a0d10",
              border: "1px solid rgba(245,241,232,0.18)",
              borderRadius: 8,
              color: "#f5f1e8",
              outline: "none",
              marginBottom: 12,
              boxSizing: "border-box",
            }}
          />
          {error && (
            <div style={{ color: "#ff5e3a", fontSize: 13, marginBottom: 12 }}>{error}</div>
          )}
          <button type="submit" style={{
            width: "100%",
            padding: "12px",
            fontSize: 15,
            fontWeight: 600,
            background: "#ff5e3a",
            color: "#0a0d10",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}>
            Sign In
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
