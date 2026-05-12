"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { useCurrentAdmin } from "@/lib/auth";

type Admin = {
  id: string;
  email: string;
  full_name: string;
  role: "owner" | "hr" | "finance" | "admin";
  active: boolean;
  last_login_at: string | null;
  created_at: string;
};

const fmt = (d: string | null) => d ? new Date(d).toLocaleString("en-GY", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "never";

export default function AdminsPage() {
  const router = useRouter();
  const { admin, loading: adminLoading } = useCurrentAdmin();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ email: "", full_name: "", role: "admin" as Admin["role"], password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  const fetchAdmins = useCallback(async () => {
    const { data, error: e } = await supabase.from("admins").select("*").order("created_at");
    if (e) { setError(e.message); return; }
    setAdmins((data as Admin[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!adminLoading && admin?.role !== "owner") {
      router.push("/admin/payroll");
      return;
    }
    if (admin?.role === "owner") fetchAdmins();
  }, [admin, adminLoading, router, fetchAdmins]);

  async function createAdmin() {
    setError("");
    if (!draft.email || !draft.full_name || !draft.password) {
      setError("All fields are required.");
      return;
    }
    if (draft.password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }
    setSubmitting(true);
    const { error: rpcError } = await supabase.rpc("create_admin", {
      p_email: draft.email.trim().toLowerCase(),
      p_password: draft.password,
      p_full_name: draft.full_name.trim(),
      p_role: draft.role,
    });
    if (rpcError) {
      setError(rpcError.message);
      setSubmitting(false);
      return;
    }
    setDraft({ email: "", full_name: "", role: "admin", password: "" });
    setShowAdd(false);
    setSubmitting(false);
    fetchAdmins();
  }

  async function toggleActive(a: Admin) {
    if (a.id === admin?.id) {
      alert("You cannot deactivate yourself.");
      return;
    }
    if (!confirm(`${a.active ? "Deactivate" : "Reactivate"} ${a.full_name}?`)) return;
    const { error: e } = await supabase
      .from("admins")
      .update({ active: !a.active })
      .eq("id", a.id);
    if (e) { alert(e.message); return; }
    fetchAdmins();
  }

  async function sendPasswordReset(a: Admin) {
    if (!confirm(`Send a password reset email to ${a.full_name} at ${a.email}?\n\nThe link will expire in 1 hour.`)) return;
    const { error: e } = await supabase.auth.resetPasswordForEmail(a.email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    if (e) {
      alert(`Could not send reset email: ${e.message}`);
      return;
    }
    alert(`Reset link sent to ${a.email}.`);
  }

  if (adminLoading || loading) {
    return <div style={{ paddingTop: 80, textAlign: "center", color: "#8B7355" }}>Loading…</div>;
  }
  if (admin?.role !== "owner") {
    return null;
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.01em", color: "#F5F0EB" }}>Admin users</h1>
          <p style={{ color: "#8B7355", margin: "4px 0 0 0", fontSize: 14 }}>
            Manage who can sign in to the admin area. Owner only.
          </p>
        </div>
        {!showAdd && (
          <button onClick={() => setShowAdd(true)} style={{
            padding: "11px 22px", background: "#D4654A", color: "#fff",
            border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>+ Add admin</button>
        )}
      </div>

      {showAdd && (
        <div style={{
          padding: 24, background: "#141210", border: "1px solid #2a2420",
          borderRadius: 12, marginBottom: 24,
        }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 16 }}>Add a new admin</h3>
          {error && (
            <div style={{
              padding: 10, background: "rgba(255,107,94,0.08)", color: "#ff8a7a",
              borderRadius: 6, marginBottom: 14, fontSize: 13,
            }}>{error}</div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Full name">
              <Input value={draft.full_name} onChange={(x) => setDraft({ ...draft, full_name: x })} />
            </Field>
            <Field label="Email">
              <Input type="email" value={draft.email} onChange={(x) => setDraft({ ...draft, email: x })} />
            </Field>
            <Field label="Role">
              <select
                value={draft.role}
                onChange={(e) => setDraft({ ...draft, role: e.target.value as Admin["role"] })}
                style={inputStyle()}
              >
                <option value="admin">Admin (full access)</option>
                <option value="hr">HR (full access)</option>
                <option value="finance">Finance (full access)</option>
                <option value="owner">Owner (can also manage admins)</option>
              </select>
            </Field>
            <Field label="Initial password (10+ chars)">
              <Input type="password" value={draft.password} onChange={(x) => setDraft({ ...draft, password: x })} />
            </Field>
          </div>
          <p style={{ color: "#8B7355", fontSize: 12, marginTop: 14, marginBottom: 0 }}>
            They&apos;ll sign in at <code style={{ color: "#E9B44C" }}>/admin/login</code> with this email and password. They can change the password themselves later.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
            <button onClick={() => { setShowAdd(false); setError(""); }} style={btnSecondary()}>Cancel</button>
            <button onClick={createAdmin} disabled={submitting} style={btnPrimary()}>
              {submitting ? "Creating…" : "Create admin"}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {admins.map((a) => (
          <div key={a.id} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: 16, background: "#141210", border: "1px solid #1e1a17", borderRadius: 10,
            gap: 16, flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 240 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: a.role === "owner" ? "linear-gradient(135deg, #D4654A 0%, #E9B44C 100%)" : "#1a1513",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 800, fontSize: 14,
              }}>
                {a.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{a.full_name} {a.id === admin?.id && <span style={{ color: "#8B7355", fontWeight: 400, fontSize: 12 }}>(you)</span>}</div>
                <div style={{ color: "#8B7355", fontSize: 13 }}>{a.email}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{
                padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.06em",
                background: "rgba(212,101,74,0.12)", color: "#D4654A",
              }}>{a.role}</span>
              <span style={{
                padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                background: a.active ? "rgba(76,175,80,0.12)" : "rgba(139,115,85,0.12)",
                color: a.active ? "#4CAF50" : "#8B7355",
              }}>{a.active ? "ACTIVE" : "DEACTIVATED"}</span>
              <span style={{ fontSize: 12, color: "#8B7355" }}>last login: {fmt(a.last_login_at)}</span>
              <button onClick={() => sendPasswordReset(a)} style={btnSecondary()} title={`Send password reset email to ${a.email}`}>
                Send reset email
              </button>
              {a.id !== admin?.id && (
                <button onClick={() => toggleActive(a)} style={btnSecondary()}>
                  {a.active ? "Deactivate" : "Reactivate"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#8B7355", fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function Input({ type = "text", value, onChange }: { type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle()}
    />
  );
}

const inputStyle = (): React.CSSProperties => ({
  width: "100%",
  padding: "10px 12px",
  borderRadius: 6,
  border: "1px solid #2a2420",
  background: "#0C0A09",
  color: "#F5F0EB",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
});

const btnPrimary = (): React.CSSProperties => ({
  padding: "10px 18px", background: "#D4654A", color: "#fff",
  border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13,
  cursor: "pointer", fontFamily: "inherit",
});
const btnSecondary = (): React.CSSProperties => ({
  padding: "8px 14px", background: "transparent", color: "#F5F0EB",
  border: "1px solid #2a2420", borderRadius: 8, fontWeight: 600, fontSize: 12,
  cursor: "pointer", fontFamily: "inherit",
});
