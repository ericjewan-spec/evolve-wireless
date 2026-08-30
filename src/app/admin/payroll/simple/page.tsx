"use client";

// =====================================================================
// SIMPLE FORTNIGHT PAYROLL - /admin/payroll/simple
// One screen: mark each day Full / Half / Absent / Off per employee,
// tick out-of-town days, and the page computes gross, travel allowance,
// NIS and net. "Save & lock" creates a paid payroll run so staff can
// download their payslip PDFs immediately.
// =====================================================================

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

type Employee = {
  id: string; first_name: string; last_name: string;
  pay_type: string; pay_rate: number; pay_cycle: string; status: string;
  nis_number: string | null; tin_number: string | null;
};
type DayStatus = "full" | "half" | "absent" | "off";
type DayMark = { status: DayStatus; travel: boolean };

const supabase = createClient();
const fmt = (n: number) => "GYD " + Math.round(n).toLocaleString("en-GY");
const iso = (d: Date) => d.toISOString().split("T")[0];
const parseLocal = (s: string) => new Date(s + "T00:00:00");

function defaultPeriod() {
  // Period = the 14 days ending today; pay date = next Saturday.
  const end = new Date(); end.setHours(0, 0, 0, 0);
  const start = new Date(end); start.setDate(start.getDate() - 13);
  const pay = new Date(end);
  while (pay.getDay() !== 6) pay.setDate(pay.getDate() + 1);
  return { start: iso(start), end: iso(end), pay: iso(pay) };
}

function datesBetween(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  const d = parseLocal(startIso);
  const end = parseLocal(endIso);
  while (d <= end && out.length <= 31) { out.push(iso(d)); d.setDate(d.getDate() + 1); }
  return out;
}

function defaultMarks(days: string[]): Record<string, DayMark> {
  const m: Record<string, DayMark> = {};
  for (const day of days) {
    const dow = parseLocal(day).getDay();
    m[day] = { status: dow === 0 ? "off" : "full", travel: false };
  }
  return m;
}

const STATUS_CYCLE: DayStatus[] = ["full", "half", "absent", "off"];
const STATUS_LABEL: Record<DayStatus, string> = { full: "Full", half: "Half", absent: "Abs", off: "Off" };
const STATUS_COLOR: Record<DayStatus, { bg: string; fg: string }> = {
  full: { bg: "rgba(76,175,80,0.15)", fg: "#4CAF50" },
  half: { bg: "rgba(233,180,76,0.15)", fg: "#E9B44C" },
  absent: { bg: "rgba(255,107,94,0.15)", fg: "#ff6b5e" },
  off: { bg: "rgba(139,115,85,0.10)", fg: "#8B7355" },
};

export default function SimplePayrollPage() {
  const [{ start, end, pay }, setPeriod] = useState(defaultPeriod());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [marks, setMarks] = useState<Record<string, Record<string, DayMark>>>({});
  const [settings, setSettings] = useState<{ id: string | null; nisRate: number; nisEmployerRate: number; nisCeilingMonthly: number; travelRate: number }>({
    id: null, nisRate: 0.056, nisEmployerRate: 0.084, nisCeilingMonthly: 280000, travelRate: 10000,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedRunId, setSavedRunId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const days = useMemo(() => datesBetween(start, end), [start, end]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [empRes, setRes] = await Promise.all([
        supabase.from("employees").select("id, first_name, last_name, pay_type, pay_rate, pay_cycle, status, nis_number, tin_number")
          .eq("status", "active").eq("pay_cycle", "fortnightly").gt("pay_rate", 0).order("first_name"),
        supabase.from("payroll_settings").select("id, nis_employee_rate, nis_employer_rate, nis_monthly_ceiling").eq("active", true).maybeSingle(),
      ]);
      if (empRes.data) setEmployees(empRes.data as Employee[]);
      if (setRes.data) {
        setSettings(s => ({
          ...s,
          id: setRes.data.id,
          nisRate: Number(setRes.data.nis_employee_rate) || 0.056,
          nisEmployerRate: Number(setRes.data.nis_employer_rate) || 0.084,
          nisCeilingMonthly: Number(setRes.data.nis_monthly_ceiling) || 280000,
        }));
      }
      setLoading(false);
    })();
  }, []);

  // (Re)seed day marks whenever the period or employee list changes.
  useEffect(() => {
    setMarks(prev => {
      const next: Record<string, Record<string, DayMark>> = {};
      for (const e of employees) {
        const seeded = defaultMarks(days);
        const existing = prev[e.id];
        if (existing) for (const d of days) if (existing[d]) seeded[d] = existing[d];
        next[e.id] = seeded;
      }
      return next;
    });
  }, [employees, days]);

  function cycleStatus(empId: string, day: string) {
    setMarks(prev => {
      const cur = prev[empId]?.[day];
      if (!cur) return prev;
      const idx = STATUS_CYCLE.indexOf(cur.status);
      const nextStatus = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      return { ...prev, [empId]: { ...prev[empId], [day]: { ...cur, status: nextStatus } } };
    });
  }

  function toggleTravel(empId: string, day: string) {
    setMarks(prev => {
      const cur = prev[empId]?.[day];
      if (!cur) return prev;
      return { ...prev, [empId]: { ...prev[empId], [day]: { ...cur, travel: !cur.travel } } };
    });
  }

  const rows = useMemo(() => {
    const nisCeilingFortnight = settings.nisCeilingMonthly / 2;
    return employees.map(e => {
      const m = marks[e.id] || {};
      let full = 0, half = 0, absent = 0, off = 0, travelDays = 0;
      for (const d of days) {
        const mk = m[d]; if (!mk) continue;
        if (mk.status === "full") full++;
        else if (mk.status === "half") half++;
        else if (mk.status === "absent") absent++;
        else off++;
        if (mk.travel && (mk.status === "full" || mk.status === "half")) travelDays++;
      }
      const scheduled = full + half + absent; // working days in this fortnight
      const workedEq = full + 0.5 * half;
      const dailyRate = scheduled > 0 ? Number(e.pay_rate) / scheduled : 0;
      const gross = Math.round(dailyRate * workedEq);
      const nisBase = Math.min(gross, nisCeilingFortnight);
      const nis = Math.round(nisBase * settings.nisRate);
      const nisEmployer = Math.round(nisBase * settings.nisEmployerRate);
      const travel = travelDays * settings.travelRate;
      const net = gross - nis + travel;
      return { e, full, half, absent, off, travelDays, scheduled, workedEq, gross, nis, nisEmployer, travel, net };
    });
  }, [employees, marks, days, settings]);

  const totals = useMemo(() => rows.reduce((t, r) => ({
    gross: t.gross + r.gross, nis: t.nis + r.nis, nisEmployer: t.nisEmployer + r.nisEmployer,
    travel: t.travel + r.travel, travelDays: t.travelDays + r.travelDays, net: t.net + r.net,
  }), { gross: 0, nis: 0, nisEmployer: 0, travel: 0, travelDays: 0, net: 0 }), [rows]);

  async function saveAndLock() {
    setErrorMsg("");
    if (rows.length === 0) { setErrorMsg("No fortnightly employees to pay."); return; }
    if (!confirm(`Lock this fortnight as PAID?\n\nTotal net: ${fmt(totals.net)} for ${rows.length} employees.\nStaff will be able to download payslips immediately.`)) return;
    setSaving(true);

    const label = `Fortnight ${start} to ${end}`;
    const { data: run, error: runErr } = await supabase.from("payroll_runs").insert({
      period_start: start,
      period_end: end,
      period_label: label,
      pay_cycle: "fortnightly",
      pay_date: pay,
      status: "paid",
      is_manual: true,
      settings_id: settings.id,
      paid_at: new Date().toISOString(),
      calculated_at: new Date().toISOString(),
      total_gross: totals.gross,
      total_nis_employee: totals.nis,
      total_nis_employer: totals.nisEmployer,
      total_paye: 0,
      total_other_deductions: 0,
      total_net: totals.net,
      total_travel_allowance: totals.travel,
      total_travel_days: totals.travelDays,
      total_amount: totals.net,
      notes: "Created via Simple Fortnight Payroll",
    }).select().single();

    if (runErr || !run) { setErrorMsg(`Could not create run: ${runErr?.message ?? "unknown"}`); setSaving(false); return; }

    const items = rows.map(r => ({
      payroll_run_id: run.id,
      employee_id: r.e.id,
      days_worked: r.full + r.half,
      days_absent: r.absent,
      days_leave: 0,
      gross_pay: r.gross + r.travel,
      nis_deduction: r.nis,
      paye_deduction: 0,
      other_deductions: 0,
      personal_allowance: 0,
      chargeable_income: 0,
      nis_employer_amount: r.nisEmployer,
      net_pay: r.net,
      travel_allowance: r.travel,
      travel_days: r.travelDays,
      travel_day_rate: settings.travelRate,
      pay_rate_snapshot: r.e.pay_rate,
      pay_type_snapshot: r.e.pay_type,
      first_name_snapshot: r.e.first_name,
      last_name_snapshot: r.e.last_name,
      nis_number_snapshot: r.e.nis_number,
      tin_number_snapshot: r.e.tin_number,
      notes: r.half > 0 ? `${r.half} half day${r.half === 1 ? "" : "s"}` : null,
    }));

    const { error: itemErr } = await supabase.from("payroll_items").insert(items);
    if (itemErr) { setErrorMsg(`Run created but items failed: ${itemErr.message}. Delete the run in Payroll Runs and retry.`); setSaving(false); return; }

    setSavedRunId(run.id);
    setSaving(false);
  }

  const th: React.CSSProperties = { padding: "8px 10px", textAlign: "left", color: "#7A7068", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" };
  const td: React.CSSProperties = { padding: "8px 10px", fontSize: 13, whiteSpace: "nowrap" };

  if (loading) return <div style={{ paddingTop: 100, textAlign: "center", color: "#8B7355" }}>Loading simple payroll...</div>;

  if (savedRunId) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>&#9989;</div>
        <h1 style={{ color: "#F5F0EB", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Fortnight locked & paid</h1>
        <p style={{ color: "#8B7355", fontSize: 14, marginBottom: 24 }}>
          Total net {fmt(totals.net)} for {rows.length} employees. Staff can now open the staff portal and download their payslip PDFs.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href={`/admin/payroll/runs/${savedRunId}`} style={{ padding: "10px 18px", background: "#D4654A", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>View the run</Link>
          <button onClick={() => { setSavedRunId(null); setPeriod(defaultPeriod()); }} style={{ padding: "10px 18px", background: "transparent", color: "#F5F0EB", border: "1px solid #2a2420", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Start another</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 20px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "#F5F0EB" }}>&#9889; Simple Fortnight Payroll</h1>
          <p style={{ color: "#8B7355", fontSize: 13, margin: "4px 0 0 0" }}>
            Tap a day to cycle Full &rarr; Half &rarr; Absent &rarr; Off. Tick &#128652; for out-of-town days ({fmt(settings.travelRate)}/day, tax-free).
          </p>
        </div>
        <Link href="/admin/payroll/runs" style={{ color: "#D4654A", fontSize: 13, fontWeight: 700, textDecoration: "none", marginTop: 6 }}>Full payroll runs &rarr;</Link>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "end", flexWrap: "wrap" }}>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#8B7355", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Period start</label>
          <input type="date" value={start} onChange={e => setPeriod(p => ({ ...p, start: e.target.value }))} style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #2a2420", background: "#141210", color: "#F5F0EB", fontFamily: "inherit", fontSize: 13, colorScheme: "dark" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#8B7355", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Period end</label>
          <input type="date" value={end} onChange={e => setPeriod(p => ({ ...p, end: e.target.value }))} style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #2a2420", background: "#141210", color: "#F5F0EB", fontFamily: "inherit", fontSize: 13, colorScheme: "dark" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#8B7355", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Pay date</label>
          <input type="date" value={pay} onChange={e => setPeriod(p => ({ ...p, pay: e.target.value }))} style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #2a2420", background: "#141210", color: "#F5F0EB", fontFamily: "inherit", fontSize: 13, colorScheme: "dark" }} />
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: 12, background: "rgba(255,107,94,0.08)", color: "#ff8a7a", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{errorMsg}</div>
      )}

      {rows.map(r => (
        <div key={r.e.id} style={{ background: "#141210", border: "1px solid #1e1a17", borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <div style={{ fontWeight: 800, color: "#F5F0EB", fontSize: 15 }}>{r.e.first_name} {r.e.last_name}
              <span style={{ color: "#8B7355", fontWeight: 600, fontSize: 12, marginLeft: 10 }}>{fmt(r.e.pay_rate)} / fortnight</span>
            </div>
            <div style={{ fontWeight: 800, color: "#4CAF50", fontSize: 15 }}>Net {fmt(r.net)}</div>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {days.map(d => {
              const mk = marks[r.e.id]?.[d];
              if (!mk) return null;
              const dt = parseLocal(d);
              const c = STATUS_COLOR[mk.status];
              return (
                <div key={d} style={{ width: 66, borderRadius: 8, border: "1px solid #241f1b", overflow: "hidden", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#7A7068", padding: "3px 0 1px", background: "#0f0d0b", letterSpacing: "0.04em" }}>
                    {dt.toLocaleDateString("en-GY", { weekday: "short" }).toUpperCase()} {dt.getDate()}
                  </div>
                  <button onClick={() => cycleStatus(r.e.id, d)} style={{ width: "100%", padding: "6px 0", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 11, background: c.bg, color: c.fg }}>
                    {STATUS_LABEL[mk.status]}
                  </button>
                  <button onClick={() => toggleTravel(r.e.id, d)} disabled={mk.status === "off" || mk.status === "absent"} title="Out of town" style={{ width: "100%", padding: "4px 0", border: "none", borderTop: "1px solid #241f1b", cursor: mk.status === "off" || mk.status === "absent" ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: 11, background: mk.travel && (mk.status === "full" || mk.status === "half") ? "rgba(212,101,74,0.25)" : "#0f0d0b", color: mk.travel ? "#D4654A" : "#4a4038", opacity: mk.status === "off" || mk.status === "absent" ? 0.4 : 1 }}>
                    &#128652;
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 12, color: "#8B7355" }}>
            <span>Worked: <b style={{ color: "#F5F0EB" }}>{r.workedEq}</b> of {r.scheduled} days</span>
            <span>Half days: <b style={{ color: "#E9B44C" }}>{r.half}</b></span>
            <span>Absent: <b style={{ color: "#ff6b5e" }}>{r.absent}</b></span>
            <span>Out of town: <b style={{ color: "#D4654A" }}>{r.travelDays}d = {fmt(r.travel)}</b></span>
            <span>Gross: <b style={{ color: "#F5F0EB" }}>{fmt(r.gross)}</b></span>
            <span>NIS ({(settings.nisRate * 100).toFixed(1)}%): <b style={{ color: "#ff8a7a" }}>-{fmt(r.nis)}</b></span>
          </div>
        </div>
      ))}

      {rows.length === 0 && (
        <div style={{ padding: 30, textAlign: "center", color: "#7A7068", background: "#141210", borderRadius: 12, border: "1px solid #1e1a17", fontSize: 13 }}>
          No active fortnightly employees with pay set. Check the Employees tab.
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ background: "#141210", border: "1px solid #2a2420", borderRadius: 12, padding: 18, marginTop: 6 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: "1px solid #2a2420" }}>
                <th style={th}>Employee</th><th style={th}>Absent</th><th style={th}>Half</th><th style={th}>Out of town</th><th style={th}>Gross</th><th style={th}>NIS</th><th style={th}>Travel</th><th style={th}>Net</th>
              </tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.e.id} style={{ borderBottom: "1px solid #1e1a17" }}>
                    <td style={{ ...td, fontWeight: 700 }}>{r.e.first_name} {r.e.last_name}</td>
                    <td style={{ ...td, color: r.absent > 0 ? "#ff6b5e" : "#7A7068" }}>{r.absent}</td>
                    <td style={{ ...td, color: r.half > 0 ? "#E9B44C" : "#7A7068" }}>{r.half}</td>
                    <td style={td}>{r.travelDays}d</td>
                    <td style={td}>{fmt(r.gross)}</td>
                    <td style={{ ...td, color: "#ff8a7a" }}>-{fmt(r.nis)}</td>
                    <td style={{ ...td, color: "#D4654A" }}>+{fmt(r.travel)}</td>
                    <td style={{ ...td, fontWeight: 800, color: "#4CAF50" }}>{fmt(r.net)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #2a2420" }}>
                  <td style={{ ...td, fontWeight: 800 }}>TOTAL</td>
                  <td style={td}></td><td style={td}></td>
                  <td style={td}>{totals.travelDays}d</td>
                  <td style={{ ...td, fontWeight: 800 }}>{fmt(totals.gross)}</td>
                  <td style={{ ...td, fontWeight: 800, color: "#ff8a7a" }}>-{fmt(totals.nis)}</td>
                  <td style={{ ...td, fontWeight: 800, color: "#D4654A" }}>+{fmt(totals.travel)}</td>
                  <td style={{ ...td, fontWeight: 800, color: "#4CAF50", fontSize: 15 }}>{fmt(totals.net)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button onClick={saveAndLock} disabled={saving} style={{ padding: "12px 26px", background: "#D4654A", color: "#fff", border: "none", borderRadius: 8, fontWeight: 800, fontSize: 14, cursor: saving ? "wait" : "pointer", fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving..." : "Save & lock as PAID"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
