"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { logAudit } from "@/lib/audit";

type Run = {
  id: string;
  period_start: string;
  period_end: string;
  period_label: string | null;
  pay_cycle: string;
  pay_date: string | null;
  status: "draft" | "calculated" | "paid" | "cancelled";
  is_manual: boolean | null;
  calculated_at: string | null;
  paid_at: string | null;
  total_gross: number | null;
  total_nis_employee: number | null;
  total_nis_employer: number | null;
  total_paye: number | null;
  total_other_deductions: number | null;
  total_travel_allowance: number | null;
  total_travel_days: number | null;
  total_net: number | null;
  notes: string | null;
  settings_id: string | null;
};

type Item = {
  id: string;
  employee_id: string;
  regular_hours: number;
  overtime_hours: number;
  days_worked: number;
  days_absent: number;
  gross_pay: number;
  manual_gross: number | null;
  exact_payment: boolean;
  travel_allowance: number;
  travel_days: number;
  nis_deduction: number;
  paye_deduction: number;
  other_deductions: number;
  personal_allowance: number;
  chargeable_income: number;
  nis_employer_amount: number;
  deductions: number;
  net_pay: number;
  pdf_path: string | null;
  pdf_generated_at: string | null;
  payslip_sent_at: string | null;
  payslip_sent_to: string | null;
  first_name_snapshot: string | null;
  last_name_snapshot: string | null;
  employees?: { first_name: string; last_name: string; email: string | null; pay_type: string; pay_rate: number; pay_cycle: string };
};

const TRAVEL_DAY_RATE = 10000;

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : Math.round(Number(n)).toLocaleString("en-GY");
const fmtGyd = (n: number | null | undefined) =>
  n == null ? "—" : `GYD ${Math.round(Number(n)).toLocaleString("en-GY")}`;
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GY", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function PayrollRunDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [run, setRun] = useState<Run | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  // local edits keyed by item id: { gross, travelDays, exact }
  const [edits, setEdits] = useState<Record<string, { gross: string; travelDays: string; exact: boolean }>>({});

  const supabase = createClient();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [runRes, itemsRes] = await Promise.all([
      supabase.from("payroll_runs").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("payroll_items")
        .select("*, employees(first_name, last_name, email, pay_type, pay_rate, pay_cycle)")
        .eq("payroll_run_id", id)
        .order("created_at", { ascending: true }),
    ]);
    setRun(runRes.data as Run | null);
    const its = (itemsRes.data as Item[]) || [];
    setItems(its);
    const seed: Record<string, { gross: string; travelDays: string; exact: boolean }> = {};
    for (const it of its) {
      seed[it.id] = {
        gross: String(Math.round(Number(it.manual_gross ?? it.gross_pay ?? 0))),
        travelDays: String(Math.round(Number(it.travel_days ?? 0))),
        exact: !!it.exact_payment,
      };
    }
    setEdits(seed);
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  const isPaid = run?.status === "paid";
  const isCalc = run?.status === "calculated";
  const isManual = !!run?.is_manual;

  function setEdit(itemId: string, patch: Partial<{ gross: string; travelDays: string; exact: boolean }>) {
    setEdits((prev) => ({ ...prev, [itemId]: { ...prev[itemId], ...patch } }));
  }

  async function regenerate() {
    const msg = isManual
      ? "Seed an empty line for every active employee on this manual run? Existing typed amounts are kept."
      : "Regenerate payroll items from attendance? Any manual edits to gross pay will be overwritten.";
    if (!confirm(msg)) return;
    setError(""); setInfo(""); setBusy("regenerate");
    const { error: e, data } = await supabase.rpc("generate_payroll_items_for_run", { p_run_id: id });
    setBusy(null);
    if (e) { setError(e.message); return; }
    setInfo(`Generated ${data ?? 0} payroll lines.`);
    await fetchAll();
  }

  // Persist all per-line edits (manual gross / travel / exact) before calculating
  async function saveEdits(): Promise<boolean> {
    for (const it of items) {
      const ed = edits[it.id];
      if (!ed) continue;
      const grossNum = Math.max(0, Math.round(Number(ed.gross) || 0));
      const travelDaysNum = Math.max(0, Math.round(Number(ed.travelDays) || 0));
      const { error: e } = await supabase
        .from("payroll_items")
        .update({
          manual_gross: grossNum,
          gross_pay: grossNum,
          travel_days: travelDaysNum,
          travel_allowance: travelDaysNum * TRAVEL_DAY_RATE,
          exact_payment: ed.exact,
        })
        .eq("id", it.id);
      if (e) { setError(`Saving ${it.first_name_snapshot || ""}: ${e.message}`); return false; }
    }
    return true;
  }

  async function calculate() {
    setError(""); setInfo(""); setBusy("calculate");
    const ok = await saveEdits();
    if (!ok) { setBusy(null); return; }
    const { error: e } = await supabase.rpc("calculate_payroll_for_run", { p_run_id: id });
    setBusy(null);
    if (e) { setError(e.message); return; }
    setInfo("Calculation complete. Review the numbers below, then send payslips when ready.");
    await fetchAll();
  }

  async function sendOne(itemId: string, sendEmail: boolean) {
    setError(""); setInfo(""); setBusy(`send:${itemId}`);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Not signed in"); setBusy(null); return; }
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-payslip`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body: JSON.stringify({ payroll_item_id: itemId, send_email: sendEmail }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(`Payslip generation failed: ${json?.error || res.statusText}`); setBusy(null); return; }
      setInfo(sendEmail ? `Payslip sent to ${json.emailed_to || "employee"}` : "Payslip PDF generated.");
    } catch (e) {
      setError(`Network error: ${(e as Error).message}`);
    }
    setBusy(null);
    await fetchAll();
  }

  async function sendAll() {
    if (!confirm("Generate and email a payslip to every employee in this run?")) return;
    setError(""); setInfo(""); setBusy("sendAll");
    for (const it of items) { await sendOne(it.id, true); }
    setBusy(null);
    setInfo("Done — all payslips emailed.");
  }

  async function downloadPdf(it: Item) {
    if (!it.pdf_path) return;
    const { data, error: e } = await supabase.storage.from("payslips").createSignedUrl(it.pdf_path, 60);
    if (e || !data?.signedUrl) { alert("Could not get download link: " + (e?.message || "no url")); return; }
    window.open(data.signedUrl, "_blank");
  }

  async function lockRun() {
    if (!confirm("Lock this run as PAID? No further changes allowed.")) return;
    setError(""); setInfo(""); setBusy("lock");
    const { error: e } = await supabase.rpc("lock_payroll_run", { p_run_id: id });
    setBusy(null);
    if (e) { setError(e.message); return; }
    await logAudit({
      employee_id: null,
      action: "updated",
      field_name: `payroll_run:${id}`,
      old_value: "calculated",
      new_value: "paid",
      metadata: { run_label: run?.period_label, total_net: run?.total_net },
    });
    setInfo("Run locked.");
    await fetchAll();
  }

  if (loading) return <div style={{ paddingTop: 80, textAlign: "center", color: "#8B7355" }}>Loading…</div>;
  if (!run) return <div style={{ paddingTop: 80, textAlign: "center", color: "#8B7355" }}>Run not found.</div>;

  const editable = !isPaid && !isCalc;

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 80px" }}>
      <Link href="/admin/payroll/runs" style={{ color: "#D4654A", fontSize: 13, textDecoration: "none" }}>
        ← All payroll runs
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 8, marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "8px 0 4px 0", letterSpacing: "-0.01em", color: "#F5F0EB" }}>
            {run.period_label || `${fmtDate(run.period_start)} → ${fmtDate(run.period_end)}`}
            {isManual && (
              <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#E9B44C", background: "rgba(233,180,76,0.12)", padding: "3px 9px", borderRadius: 100, verticalAlign: "middle" }}>MANUAL</span>
            )}
          </h1>
          <p style={{ color: "#8B7355", margin: 0, fontSize: 14 }}>
            {run.pay_cycle} · pay date <strong style={{ color: "#F5F0EB" }}>{fmtDate(run.pay_date)}</strong>
            {run.calculated_at && <> · calculated {new Date(run.calculated_at).toLocaleString("en-GY")}</>}
            {run.paid_at && <> · paid {new Date(run.paid_at).toLocaleString("en-GY")}</>}
          </p>
        </div>
        <StatusBadge status={run.status} />
      </div>

      {isManual && editable && (
        <div style={{ padding: 14, background: "rgba(233,180,76,0.06)", border: "1px solid rgba(233,180,76,0.25)", borderRadius: 10, marginBottom: 18, fontSize: 13, color: "#E9B44C", lineHeight: 1.6 }}>
          <strong>Manual run.</strong> Type each person&apos;s gross below. By default these are paid <strong>exactly as typed with no NIS/PAYE</strong> (one-off payments). Untick &quot;exact&quot; on any line that is a normal wage and NIS/PAYE will be calculated for that person. Enter <strong>out-of-town days</strong> to add a non-taxable travel allowance ({fmtGyd(TRAVEL_DAY_RATE)} per day — e.g. 5 days = {fmtGyd(5 * TRAVEL_DAY_RATE)}).
        </div>
      )}

      {error && <Banner kind="error">{error}</Banner>}
      {info && <Banner kind="info">{info}</Banner>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
        {!isPaid && (
          <button onClick={regenerate} disabled={!!busy} style={btn(false)}>
            {busy === "regenerate" ? "Working…" : isManual ? "1. Seed employee lines" : "1. Regenerate items from attendance"}
          </button>
        )}
        {!isPaid && items.length > 0 && (
          <button onClick={calculate} disabled={!!busy} style={btn(false)}>
            {busy === "calculate" ? "Saving & calculating…" : "2. Save & calculate"}
          </button>
        )}
        {isCalc && (
          <>
            <button onClick={sendAll} disabled={!!busy} style={btn(true)}>
              {busy === "sendAll" ? "Sending all…" : "3. Send payslips to everyone"}
            </button>
            <button onClick={lockRun} disabled={!!busy} style={btn(false)}>
              {busy === "lock" ? "Locking…" : "4. Lock as PAID"}
            </button>
          </>
        )}
      </div>

      {(isCalc || isPaid) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 28 }}>
          <Stat label="Gross" value={fmtGyd(run.total_gross)} />
          <Stat label="NIS (employees)" value={fmtGyd(run.total_nis_employee)} tone="warn" />
          <Stat label="NIS (employer)" value={fmtGyd(run.total_nis_employer)} tone="warn" />
          <Stat label="PAYE" value={fmtGyd(run.total_paye)} tone="warn" />
          <Stat label="Travel (non-tax)" value={fmtGyd(run.total_travel_allowance)} tone="good" />
          <Stat label="Net to pay" value={fmtGyd(run.total_net)} tone="good" />
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#8B7355", background: "#141210", border: "1px solid #1e1a17", borderRadius: 12 }}>
          <p style={{ margin: "0 0 8px 0", color: "#F5F0EB", fontWeight: 700 }}>No payroll lines yet.</p>
          Click <strong style={{ color: "#D4654A" }}>{isManual ? "Seed employee lines" : "Regenerate items from attendance"}</strong> above to populate this run.
        </div>
      ) : (
        <div style={{ overflowX: "auto", border: "1px solid #1e1a17", borderRadius: 12, background: "#141210" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#100E0C" }}>
                <Th>Employee</Th>
                <Th align="right">Gross</Th>
                <Th>Out-of-town days</Th>
                <Th>NIS/PAYE</Th>
                <Th align="right">NIS</Th>
                <Th align="right">PAYE</Th>
                <Th align="right">Net</Th>
                <Th>Payslip</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const ed = edits[it.id] || { gross: "0", travelDays: "0", exact: isManual };
                const tDays = Math.max(0, Math.round(Number(ed.travelDays) || 0));
                const tAmount = tDays * TRAVEL_DAY_RATE;
                return (
                  <tr key={it.id} style={{ borderTop: "1px solid #1e1a17" }}>
                    <Td>
                      <div style={{ fontWeight: 700, color: "#F5F0EB" }}>
                        {(it.first_name_snapshot || it.employees?.first_name)} {(it.last_name_snapshot || it.employees?.last_name)}
                      </div>
                      <div style={{ color: "#8B7355", fontSize: 11, marginTop: 1 }}>
                        {it.employees?.pay_type === "hourly" ? `${fmt(it.employees?.pay_rate)}/hr` : "salaried"}
                        {!isManual && it.days_absent > 0 && <span style={{ color: "#ff8a7a" }}> · {it.days_absent} absent</span>}
                      </div>
                    </Td>
                    <Td align="right">
                      {editable ? (
                        <input
                          type="number"
                          value={ed.gross}
                          onChange={(e) => setEdit(it.id, { gross: e.target.value })}
                          style={cellInput}
                        />
                      ) : (
                        <span style={{ fontVariantNumeric: "tabular-nums", color: "#F5F0EB", fontWeight: 700 }}>{fmt(it.gross_pay)}</span>
                      )}
                    </Td>
                    <Td>
                      {editable ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input
                            type="number"
                            min={0}
                            value={ed.travelDays}
                            onChange={(e) => setEdit(it.id, { travelDays: e.target.value })}
                            style={{ ...cellInput, width: 64, textAlign: "center" }}
                            title="Days worked out of town this run"
                          />
                          <span style={{ fontSize: 11, color: tDays > 0 ? "#4CAF50" : "#7A7068", whiteSpace: "nowrap" }}>
                            {tDays > 0 ? `× ${fmtGyd(TRAVEL_DAY_RATE)} = ${fmtGyd(tAmount)}` : "days"}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: it.travel_allowance > 0 ? "#4CAF50" : "#7A7068", fontVariantNumeric: "tabular-nums" }}>
                          {it.travel_days > 0 ? `${it.travel_days}d = ${fmt(it.travel_allowance)}` : "—"}
                        </span>
                      )}
                    </Td>
                    <Td>
                      {editable ? (
                        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 11, color: ed.exact ? "#E9B44C" : "#8B7355" }}>
                          <input
                            type="checkbox"
                            checked={!ed.exact}
                            onChange={(e) => setEdit(it.id, { exact: !e.target.checked })}
                            style={{ width: 15, height: 15, accentColor: "#D4654A" }}
                          />
                          {ed.exact ? "exact (no deductions)" : "deduct NIS+PAYE"}
                        </label>
                      ) : (
                        <span style={{ fontSize: 11, color: it.exact_payment ? "#E9B44C" : "#8B7355" }}>
                          {it.exact_payment ? "exact" : "NIS+PAYE"}
                        </span>
                      )}
                    </Td>
                    <Td align="right" mono tone="warn">{fmt(it.nis_deduction)}</Td>
                    <Td align="right" mono tone="warn">{fmt(it.paye_deduction)}</Td>
                    <Td align="right" mono tone="good"><strong>{fmt(it.net_pay)}</strong></Td>
                    <Td>
                      {it.pdf_path ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <button onClick={() => downloadPdf(it)} style={linkBtn}>↓ PDF</button>
                          {it.payslip_sent_at ? (
                            <span style={{ fontSize: 10, color: "#4CAF50" }}>✓ sent {new Date(it.payslip_sent_at).toLocaleDateString("en-GY")}</span>
                          ) : (
                            <button onClick={() => sendOne(it.id, true)} disabled={!!busy} style={linkBtn}>email</button>
                          )}
                        </div>
                      ) : isCalc ? (
                        <button onClick={() => sendOne(it.id, true)} disabled={!!busy} style={linkBtn}>
                          {busy === `send:${it.id}` ? "…" : "Generate & email"}
                        </button>
                      ) : (
                        <span style={{ color: "#7A7068", fontSize: 11 }}>—</span>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Run["status"] }) {
  const palette: Record<Run["status"], { bg: string; fg: string; label: string }> = {
    draft: { bg: "rgba(139,115,85,0.12)", fg: "#8B7355", label: "DRAFT" },
    calculated: { bg: "rgba(212,101,74,0.14)", fg: "#D4654A", label: "CALCULATED" },
    paid: { bg: "rgba(76,175,80,0.14)", fg: "#4CAF50", label: "PAID" },
    cancelled: { bg: "rgba(139,115,85,0.08)", fg: "#7A7068", label: "CANCELLED" },
  };
  const p = palette[status];
  return (
    <span style={{ padding: "5px 14px", borderRadius: 100, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", background: p.bg, color: p.fg }}>{p.label}</span>
  );
}

function Banner({ kind, children }: { kind: "error" | "info"; children: React.ReactNode }) {
  const palette = kind === "error"
    ? { fg: "#ff8a7a", bg: "rgba(255,107,94,0.08)", border: "rgba(255,107,94,0.18)" }
    : { fg: "#E9B44C", bg: "rgba(233,180,76,0.08)", border: "rgba(233,180,76,0.18)" };
  return (
    <div style={{ padding: "10px 14px", background: palette.bg, color: palette.fg, borderRadius: 8, border: `1px solid ${palette.border}`, marginBottom: 16, fontSize: 13 }}>{children}</div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  const color = tone === "good" ? "#4CAF50" : tone === "warn" ? "#ff8a7a" : "#F5F0EB";
  return (
    <div style={{ padding: "14px 16px", background: "#141210", border: "1px solid #1e1a17", borderRadius: 10 }}>
      <div style={{ color: "#8B7355", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}>{label.toUpperCase()}</div>
      <div style={{ color, fontSize: 16, fontWeight: 800, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th style={{ textAlign: align || "left", padding: "12px 14px", color: "#8B7355", fontWeight: 700, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</th>
  );
}

function Td({ children, align, mono, tone }: { children: React.ReactNode; align?: "right"; mono?: boolean; tone?: "good" | "warn" | "dim" }) {
  const color = tone === "good" ? "#4CAF50" : tone === "warn" ? "#ff8a7a" : tone === "dim" ? "#8B7355" : "#F5F0EB";
  return (
    <td style={{ padding: "10px 14px", textAlign: align || "left", color, fontFamily: mono ? "ui-monospace, monospace" : undefined, fontVariantNumeric: mono ? "tabular-nums" : undefined, verticalAlign: "middle", whiteSpace: "nowrap" }}>{children}</td>
  );
}

const cellInput: React.CSSProperties = {
  width: 110,
  padding: "7px 9px",
  borderRadius: 6,
  border: "1px solid #2a2420",
  background: "#0C0A09",
  color: "#F5F0EB",
  fontSize: 13,
  fontFamily: "inherit",
  fontVariantNumeric: "tabular-nums",
  textAlign: "right",
  outline: "none",
  boxSizing: "border-box",
};

const btn = (primary: boolean): React.CSSProperties => ({
  padding: "10px 18px",
  background: primary ? "#D4654A" : "#1a1513",
  color: "#fff",
  border: primary ? "none" : "1px solid #2a2420",
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
});

const linkBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 0,
  color: "#D4654A",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "left",
};
