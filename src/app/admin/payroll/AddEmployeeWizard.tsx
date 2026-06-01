// =============================================================================
// AddEmployeeWizard.tsx
// Place at: src/app/admin/payroll/AddEmployeeWizard.tsx
// =============================================================================
// Multi-step employee onboarding wizard. Replaces the 10-field inline form.
// Steps: 1) Identity  2) Contact  3) Pay  4) Review
// Self-contained: performs its own insert + audit log, calls onCreated when done.
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { logAudit } from "@/lib/audit";

const supabase = createClient();

const today = () => new Date().toISOString().split("T")[0];

const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 8,
  border: "1px solid #2a2420",
  background: "#0e0c0a",
  color: "#F5F0EB",
  fontFamily: "inherit",
  fontSize: "0.92rem",
};

const labelStyle = {
  display: "block" as const,
  fontSize: 11,
  color: "#8B7355",
  fontWeight: 600,
  marginBottom: 6,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
};

type Form = {
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  pay_type: "hourly" | "salary";
  pay_rate: string;
  pay_cycle: "fortnightly" | "monthly";
  pin_code: string;
};

const INITIAL: Form = {
  first_name: "",
  last_name: "",
  role: "Technician",
  department: "Operations",
  phone: "",
  email: "",
  pay_type: "hourly",
  pay_rate: "",
  pay_cycle: "fortnightly",
  pin_code: "",
};

const STEPS = ["Identity", "Contact", "Pay", "Review"] as const;

export default function AddEmployeeWizard({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset when re-opened
  useEffect(() => {
    if (open) {
      setStep(0);
      setForm(INITIAL);
      setError(null);
    }
  }, [open]);

  // Close on Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  if (!open) return null;

  function update<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Per-step validation -> returns null if valid, else error message
  function validate(s: number): string | null {
    if (s === 0) {
      if (!form.first_name.trim()) return "First name is required.";
      if (!form.last_name.trim()) return "Last name is required.";
    }
    if (s === 2) {
      const n = parseFloat(form.pay_rate);
      if (!form.pay_rate || isNaN(n) || n < 0) {
        return "Enter a valid pay rate (use 0 for owner / unpaid).";
      }
      if (form.pin_code && !/^\d{4}$/.test(form.pin_code)) {
        return "PIN must be exactly 4 digits, or leave blank to auto-generate.";
      }
    }
    return null;
  }

  function next() {
    const err = validate(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function save() {
    // Validate all steps one more time
    for (let i = 0; i < STEPS.length - 1; i++) {
      const err = validate(i);
      if (err) {
        setError(`Step ${i + 1}: ${err}`);
        setStep(i);
        return;
      }
    }

    setSaving(true);
    setError(null);

    const pin = form.pin_code || String(Math.floor(1000 + Math.random() * 9000));
    const payRate = parseFloat(form.pay_rate);

    const { data: created, error: insErr } = await supabase
      .from("employees")
      .insert({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        role: form.role.trim() || "Staff",
        department: form.department,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        pay_type: form.pay_type,
        pay_rate: payRate,
        pay_cycle: form.pay_cycle,
        pin_code: pin,
        start_date: today(),
        status: "active",
        // Owners (pay_rate=0) auto-excluded from NIS
        exclude_from_nis: payRate === 0,
      })
      .select()
      .single();

    if (insErr || !created) {
      setSaving(false);
      setError(insErr?.message || "Failed to create employee. Please try again.");
      return;
    }

    await logAudit({
      employee_id: created.id,
      action: "created",
      metadata: {
        name: `${created.first_name} ${created.last_name}`,
        role: created.role,
        pay_rate: created.pay_rate,
        pay_type: created.pay_type,
        pay_cycle: created.pay_cycle,
        via: "wizard",
      },
    });

    setSaving(false);
    onCreated();
    onClose();
  }

  // Compute review pay summary
  const payDisplay = (() => {
    const n = parseFloat(form.pay_rate);
    if (isNaN(n)) return "â";
    if (n === 0) return "Unpaid (owner / no payroll)";
    if (form.pay_type === "hourly") return `GYD ${n.toLocaleString("en-GY")}/hr`;
    return `GYD ${n.toLocaleString("en-GY")} per ${form.pay_cycle === "fortnightly" ? "fortnight" : "month"}`;
  })();

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          background: "#141210",
          border: "1px solid #2a2420",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          padding: 24,
        }}
      >
        {/* Header + progress dots */}
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "#7A7068",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: 600,
                }}
              >
                Step {step + 1} of {STEPS.length} Â· {STEPS[step]}
              </div>
              <h2
                style={{
                  fontFamily: "'Bricolage Grotesque', serif",
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  color: "#F5F0EB",
                  margin: "4px 0 0 0",
                }}
              >
                Add new employee
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={saving}
              aria-label="Close"
              style={{
                background: "transparent",
                border: "none",
                color: "#7A7068",
                fontSize: 22,
                cursor: "pointer",
                padding: 4,
                lineHeight: 1,
              }}
            >
              Ã
            </button>
          </div>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 6 }}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 100,
                  background: i <= step ? "#E9B44C" : "#2a2420",
                  transition: "background 0.2s",
                }}
              />
            ))}
          </div>
        </div>

        {/* Step body */}
        <div style={{ minHeight: 260 }}>
          {step === 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{ color: "#8B7355", fontSize: 12, margin: 0, marginBottom: 6 }}>
                  Who's joining? You can fix any of this later from the employee profile.
                </p>
              </div>
              <div>
                <label style={labelStyle}>First name *</label>
                <input
                  autoFocus
                  value={form.first_name}
                  onChange={(e) => update("first_name", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Last name *</label>
                <input
                  value={form.last_name}
                  onChange={(e) => update("last_name", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Role / Title</label>
                <input
                  value={form.role}
                  onChange={(e) => update("role", e.target.value)}
                  placeholder="e.g. Field Technician"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Department</label>
                <select
                  value={form.department}
                  onChange={(e) => update("department", e.target.value)}
                  style={inputStyle}
                >
                  <option value="Operations">Operations</option>
                  <option value="Sales">Sales</option>
                  <option value="Technical">Technical</option>
                  <option value="Admin">Admin</option>
                  <option value="Management">Management</option>
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
              <p style={{ color: "#8B7355", fontSize: 12, margin: 0 }}>
                Optional but helpful for payslips, leave notices, and contact during outages.
              </p>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+592 â¦"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="name@example.com"
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{ color: "#8B7355", fontSize: 12, margin: 0 }}>
                  Set rate to <strong style={{ color: "#E9B44C" }}>0</strong> for owners or anyone
                  not on the payroll run.
                </p>
              </div>
              <div>
                <label style={labelStyle}>Pay type *</label>
                <select
                  value={form.pay_type}
                  onChange={(e) => update("pay_type", e.target.value as Form["pay_type"])}
                  style={inputStyle}
                >
                  <option value="hourly">Hourly</option>
                  <option value="salary">Salary (fixed)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Pay cycle *</label>
                <select
                  value={form.pay_cycle}
                  onChange={(e) => update("pay_cycle", e.target.value as Form["pay_cycle"])}
                  style={inputStyle}
                >
                  <option value="fortnightly">Fortnightly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>
                  {form.pay_type === "hourly" ? "Hourly rate (GYD) *" : "Period salary (GYD) *"}
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.pay_rate}
                  onChange={(e) => update("pay_rate", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>4-digit PIN</label>
                <input
                  value={form.pin_code}
                  onChange={(e) => update("pin_code", e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="auto-generate if blank"
                  maxLength={4}
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ color: "#8B7355", fontSize: 12, margin: 0, marginBottom: 4 }}>
                Review and save. You can edit anything afterwards from the employee profile.
              </p>
              <ReviewRow label="Name" value={`${form.first_name} ${form.last_name}`.trim() || "â"} />
              <ReviewRow label="Role" value={form.role || "Staff"} />
              <ReviewRow label="Department" value={form.department} />
              <ReviewRow label="Phone" value={form.phone || "â"} />
              <ReviewRow label="Email" value={form.email || "â"} />
              <ReviewRow label="Pay" value={payDisplay} />
              <ReviewRow
                label="Cycle"
                value={`${form.pay_cycle} Â· PIN ${form.pin_code || "(auto-generate)"}`}
              />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            style={{
              marginTop: 14,
              padding: "9px 12px",
              borderRadius: 8,
              background: "rgba(231,76,60,0.1)",
              border: "1px solid rgba(231,76,60,0.3)",
              color: "#E74C3C",
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        {/* Footer actions */}
        <div
          style={{
            marginTop: 22,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <button
            onClick={step === 0 ? onClose : back}
            disabled={saving}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              background: "transparent",
              color: "#8B7355",
              border: "1px solid #2a2420",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {step === 0 ? "Cancel" : "â Back"}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={next}
              style={{
                padding: "10px 22px",
                borderRadius: 8,
                background: "#D4654A",
                color: "#fff",
                border: "none",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Continue â
            </button>
          ) : (
            <button
              onClick={save}
              disabled={saving}
              style={{
                padding: "10px 22px",
                borderRadius: 8,
                background: saving ? "#7A4A38" : "#D4654A",
                color: "#fff",
                border: "none",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {saving ? "Savingâ¦" : "Save employee"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "9px 0",
        borderBottom: "1px solid #1e1a17",
        gap: 16,
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: "#7A7068",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span style={{ color: "#F5F0EB", fontSize: 13, fontWeight: 500, textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}
