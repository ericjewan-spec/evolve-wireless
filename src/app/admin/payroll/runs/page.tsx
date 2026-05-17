"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

type Run = {
  id: string;
  period_start: string;
  period_end: string;
  period_label: string | null;
  pay_cycle: string;
  pay_date: string | null;
  status: "draft" | "calculated" | "paid" | "cancelled";
  total_gross: number | null;
  total_nis_employee: number | null;
  total_paye: number | null;
  total_net: number | null;
  is_manual: boolean | null;
  calculated_at: string | null;
  paid_at: string | null;
  created_at: string;
};

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : `GYD ${Math.round(Number(n)).toLocaleString("en-GY")}`;

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GY", { day: "numeric", month: "short", year: "numeric" }) : "—";

function statusBadge(status: Run["status"]) {
  const palette: Record<Run["status"], { bg: string; fg: string; label: string }> = {
    draft: { bg: "rgba(139,115,85,0.12)", fg: "#8B7355", label: "DRAFT" },
    calculated: { bg: "rgba(212,101,74,0.14)", fg: "#D4654A", label: "CALCULATED" },
    paid: { bg: "rgba(76,175,80,0.14)", fg: "#4CAF50", label: "PAID" },
    cancelled: { bg: "rgba(139,115,85,0.08)", fg: "#7A7068", label: "CANCELLED" },
  };
  const p = palette[status];
  return (
    <span style={{
      padding: "3px 10px",
      borderRadius: 100,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.06em",
      background: p.bg,
      color: p.fg,
    }}>{p.label}</span>
  );
}

export default function PayrollRunsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  const fetchRuns = useCallback(async () => {
    const { data } = await supabase
      .from("payroll_runs")
      .select("*")
      .order("period_end", { ascending: false })
      .limit(50);
    setRuns((data as Run[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchRuns(); }, [fetchRuns]);

  const today = new Date();

  // Build a list of selectable pay months: 3 months back through 9 months ahead.
  const monthOptions = (() => {
    const opts: { value: string; label: string; year: number; month: number }[] = [];
    for (let off = -3; off <= 9; off++) {
      const d = new Date(today.getFullYear(), today.getMonth() + off, 1);
      const y = d.getFullYear();
      const m = d.getMonth(); // 0-indexed
      opts.push({
        value: `${y}-${String(m + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("en-GY", { month: "long", year: "numeric" }),
        year: y,
        month: m,
      });
    }
    return opts;
  })();

  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const [draft, setDraft] = useState({
    pay_month: defaultMonth,        // "YYYY-MM" of the pay period
    pay_day: 25,                    // day of month wages hit accounts (default 25th)
    pay_cycle: "monthly" as "monthly" | "fortnightly",
    period_label: today.toLocaleDateString("en-GY", { month: "long", year: "numeric" }),
    is_manual: false,
  });

  // Derive period start/end and the actual pay date from the picked month + day.
  function derivedDates(pay_month: string, pay_day: number) {
    const [yStr, mStr] = pay_month.split("-");
    const y = Number(yStr);
    const m = Number(mStr) - 1; // back to 0-indexed
    const lastDay = new Date(y, m + 1, 0).getDate();
    const day = Math.min(Math.max(1, pay_day), lastDay);
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
      period_start: `${y}-${pad(m + 1)}-01`,
      period_end: `${y}-${pad(m + 1)}-${pad(lastDay)}`,
      pay_date: `${y}-${pad(m + 1)}-${pad(day)}`,
    };
  }

  async function createRun() {
    setError("");
    setBusy(true);
    const d = derivedDates(draft.pay_month, draft.pay_day);
    const payload = {
      period_label: draft.period_label,
      pay_cycle: draft.pay_cycle,
      is_manual: draft.is_manual,
      period_start: d.period_start,
      period_end: d.period_end,
      pay_date: d.pay_date,
      status: "draft" as const,
    };
    const { error: e, data } = await supabase
      .from("payroll_runs")
      .insert(payload)
      .select("id")
      .single();
    setBusy(false);
    if (e) { setError(e.message); return; }
    setShowCreate(false);
    if (data?.id) window.location.href = `/admin/payroll/runs/${data.id}`;
  }

  if (loading) {
    return <div style={{ paddingTop: 80, textAlign: "center", color: "#8B7355" }}>Loading…</div>;
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <Link href="/admin/payroll" style={{ color: "#D4654A", fontSize: 13, textDecoration: "none" }}>
            ← Back to payroll
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "6px 0 4px 0", letterSpacing: "-0.01em", color: "#F5F0EB" }}>
            Payroll runs
          </h1>
          <p style={{ color: "#8B7355", margin: 0, fontSize: 14 }}>
            Run payroll for a pay period. NIS &amp; PAYE are calculated using the current GRA rules.
          </p>
        </div>
        {!showCreate && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link href="/admin/payroll/nis" style={{
              padding: "10px 16px", background: "transparent", color: "#D4654A",
              border: "1px solid #2a2420", borderRadius: 10, fontWeight: 600,
              fontSize: 13, textDecoration: "none",
            }}>NIS schedules</Link>
            <Link href="/admin/payroll/year-end" style={{
              padding: "10px 16px", background: "transparent", color: "#E9B44C",
              border: "1px solid #2a2420", borderRadius: 10, fontWeight: 600,
              fontSize: 13, textDecoration: "none",
            }}>📋 Year-end 7B</Link>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                padding: "11px 22px",
                background: "#D4654A",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              + New run
            </button>
          </div>
        )}
      </div>

      {showCreate && (
        <div style={{ padding: 24, background: "#141210", border: "1px solid #2a2420", borderRadius: 12, marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#F5F0EB" }}>New payroll run</h3>
          {error && (
            <div style={{ padding: 10, background: "rgba(255,107,94,0.08)", color: "#ff8a7a", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{error}</div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Period label (shown on payslips)">
              <input value={draft.period_label} onChange={(e) => setDraft({ ...draft, period_label: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Pay cycle">
              <select value={draft.pay_cycle} onChange={(e) => setDraft({ ...draft, pay_cycle: e.target.value as "monthly" | "fortnightly" })} style={inputStyle}>
                <option value="monthly">Monthly</option>
                <option value="fortnightly">Fortnightly</option>
              </select>
            </Field>
            <Field label="Pay month (period)">
              <select
                value={draft.pay_month}
                onChange={(e) => {
                  const opt = monthOptions.find((o) => o.value === e.target.value);
                  setDraft({
                    ...draft,
                    pay_month: e.target.value,
                    period_label: opt ? opt.label : draft.period_label,
                  });
                }}
                style={inputStyle}
              >
                {monthOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Pay day (when net pay hits accounts)">
              <select
                value={draft.pay_day}
                onChange={(e) => setDraft({ ...draft, pay_day: Number(e.target.value) })}
                style={inputStyle}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}{d === 25 ? "  (default)" : ""}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <p style={{ color: "#8B7355", fontSize: 12, margin: "12px 2px 0 2px" }}>
            This run covers <strong style={{ color: "#F5F0EB" }}>
            {(() => { const d = derivedDates(draft.pay_month, draft.pay_day); return `${fmtDate(d.period_start)} \u2192 ${fmtDate(d.period_end)}`; })()}
            </strong>, paid on <strong style={{ color: "#F5F0EB" }}>
            {(() => { const d = derivedDates(draft.pay_month, draft.pay_day); return fmtDate(d.pay_date); })()}
            </strong>.
          </p>

          <label style={{
            display: "flex", alignItems: "flex-start", gap: 10, marginTop: 18,
            padding: 14, borderRadius: 8,
            background: draft.is_manual ? "rgba(212,101,74,0.08)" : "transparent",
            border: `1px solid ${draft.is_manual ? "rgba(212,101,74,0.3)" : "#2a2420"}`,
            cursor: "pointer",
          }}>
            <input
              type="checkbox"
              checked={draft.is_manual}
              onChange={(e) => setDraft({ ...draft, is_manual: e.target.checked })}
              style={{ width: 16, height: 16, marginTop: 2, accentColor: "#D4654A" }}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#F5F0EB" }}>
                Manual run — don&apos;t use attendance
              </div>
              <div style={{ fontSize: 12, color: "#8B7355", marginTop: 3, lineHeight: 1.5 }}>
                Seeds an empty line for every active {draft.pay_cycle} employee. You type each
                person&apos;s gross by hand on the next screen — no clock-ins required. NIS &amp; PAYE
                still calculate on what you type (toggle &quot;exact&quot; per person for one-off payments).
              </div>
            </div>
          </label>

          <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
            <button onClick={() => { setShowCreate(false); setError(""); }} style={btnSecondary}>Cancel</button>
            <button onClick={createRun} disabled={busy} style={btnPrimary}>{busy ? "Creating…" : "Create run"}</button>
          </div>
        </div>
      )}

      {runs.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#8B7355", background: "#141210", border: "1px solid #1e1a17", borderRadius: 12 }}>
          No payroll runs yet. Create your first run for the current month.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {runs.map((r) => (
            <Link key={r.id} href={`/admin/payroll/runs/${r.id}`} style={{ textDecoration: "none" }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto auto auto auto",
                gap: 20,
                alignItems: "center",
                padding: 16,
                background: "#141210",
                border: "1px solid #1e1a17",
                borderRadius: 10,
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#2a2420"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1e1a17"; }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#F5F0EB" }}>
                    {r.period_label || `${fmtDate(r.period_start)} → ${fmtDate(r.period_end)}`}
                    {r.is_manual && (
                      <span style={{
                        marginLeft: 8, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                        color: "#E9B44C", background: "rgba(233,180,76,0.12)",
                        padding: "2px 7px", borderRadius: 100, verticalAlign: "middle",
                      }}>MANUAL</span>
                    )}
                  </div>
                  <div style={{ color: "#8B7355", fontSize: 12, marginTop: 2 }}>
                    {r.pay_cycle} · pay date {fmtDate(r.pay_date)}
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 120 }}>
                  <div style={{ color: "#8B7355", fontSize: 11, fontWeight: 600 }}>GROSS</div>
                  <div style={{ color: "#F5F0EB", fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(r.total_gross)}</div>
                </div>
                <div style={{ textAlign: "right", minWidth: 100 }}>
                  <div style={{ color: "#8B7355", fontSize: 11, fontWeight: 600 }}>NIS</div>
                  <div style={{ color: "#ff8a7a", fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(r.total_nis_employee)}</div>
                </div>
                <div style={{ textAlign: "right", minWidth: 100 }}>
                  <div style={{ color: "#8B7355", fontSize: 11, fontWeight: 600 }}>PAYE</div>
                  <div style={{ color: "#ff8a7a", fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(r.total_paye)}</div>
                </div>
                <div style={{ textAlign: "right", minWidth: 130 }}>
                  <div style={{ color: "#8B7355", fontSize: 11, fontWeight: 600 }}>NET</div>
                  <div style={{ color: "#4CAF50", fontSize: 14, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmt(r.total_net)}</div>
                </div>
                <div>{statusBadge(r.status)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
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

const inputStyle: React.CSSProperties = {
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
};
const btnPrimary: React.CSSProperties = {
  padding: "10px 18px",
  background: "#D4654A",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
};
const btnSecondary: React.CSSProperties = {
  padding: "8px 14px",
  background: "transparent",
  color: "#F5F0EB",
  border: "1px solid #2a2420",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "inherit",
};
