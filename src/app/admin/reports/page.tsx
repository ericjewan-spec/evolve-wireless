"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

type TrendRow = {
  year: number;
  month: number;
  label: string;
  employees_paid: number;
  runs: number;
  total_gross: number;
  total_nis_employee: number;
  total_nis_employer: number;
  total_paye: number;
  total_other_deductions: number;
  total_net: number;
};

type DeptCount = {
  department: string;
  count: number;
};

type AttendanceSummary = {
  total_hours: number;
  total_days_present: number;
  total_days_absent: number;
  total_late_arrivals: number;
};

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : Math.round(Number(n)).toLocaleString("en-GY");

const fmtGyd = (n: number | null | undefined) =>
  n == null ? "—" : `GYD ${fmt(n)}`;

export default function ReportsPage() {
  const supabase = createClient();
  const [trend, setTrend] = useState<TrendRow[]>([]);
  const [deptCounts, setDeptCounts] = useState<DeptCount[]>([]);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    // Trend (24 months max for the chart)
    const trendRes = await supabase
      .from("payroll_monthly_trend")
      .select("*")
      .limit(24);

    // Department breakdown — active employees grouped by department
    const empRes = await supabase
      .from("employees")
      .select("department")
      .eq("status", "active");

    const deptMap = new Map<string, number>();
    for (const row of (empRes.data || [])) {
      const d = (row as { department: string | null }).department || "Unassigned";
      deptMap.set(d, (deptMap.get(d) || 0) + 1);
    }
    const deptArr = Array.from(deptMap.entries())
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);

    // Attendance summary — current month
    const attRes = await supabase
      .from("attendance_with_schedule")
      .select("hours_worked, status, is_late_arrival")
      .gte("date", firstOfMonth)
      .lte("date", today);

    const summary: AttendanceSummary = {
      total_hours: 0,
      total_days_present: 0,
      total_days_absent: 0,
      total_late_arrivals: 0,
    };
    for (const r of (attRes.data || [])) {
      const row = r as { hours_worked: number | null; status: string | null; is_late_arrival: boolean | null };
      summary.total_hours += Number(row.hours_worked || 0);
      if (row.status === "present" || row.status === "half_day" || row.status === "late") summary.total_days_present++;
      if (row.status === "absent") summary.total_days_absent++;
      if (row.is_late_arrival) summary.total_late_arrivals++;
    }

    setTrend((trendRes.data as TrendRow[]) || []);
    setDeptCounts(deptArr);
    setAttendance(summary);
    setLoading(false);
  }, [supabase, firstOfMonth, today]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Order trend ascending (oldest to newest) for chart
  const trendChrono = [...trend].reverse();

  function exportTrendCsv() {
    if (trend.length === 0) return;
    const headers = ["Period", "Employees paid", "Runs", "Gross", "NIS (employee)", "NIS (employer)", "PAYE", "Other deductions", "Net"];
    const rows = trend.map(r => [
      r.label, r.employees_paid, r.runs,
      r.total_gross, r.total_nis_employee, r.total_nis_employer,
      r.total_paye, r.total_other_deductions, r.total_net,
    ]);
    const csv = [headers, ...rows]
      .map(line => line.map(c => {
        const s = String(c);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evolve-payroll-trend.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Roll-up totals across the visible trend
  const totals = trend.reduce((acc, r) => ({
    gross: acc.gross + Number(r.total_gross),
    nisE: acc.nisE + Number(r.total_nis_employee),
    nisR: acc.nisR + Number(r.total_nis_employer),
    paye: acc.paye + Number(r.total_paye),
    net: acc.net + Number(r.total_net),
  }), { gross: 0, nisE: 0, nisR: 0, paye: 0, net: 0 });

  if (loading) {
    return <div style={{ paddingTop: 80, textAlign: "center", color: "#8B7355" }}>Loading reports…</div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px" }}>
      <Link href="/admin" style={{ color: "#D4654A", fontSize: 13, textDecoration: "none" }}>← Back to dashboard</Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 8, marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "8px 0 4px 0", color: "#F5F0EB", letterSpacing: "-0.01em" }}>Reports</h1>
          <p style={{ color: "#8B7355", margin: 0, fontSize: 14 }}>
            Monthly payroll trend, headcount by department, current-month attendance.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/admin/payroll/year-end" style={{
            padding: "9px 16px", background: "transparent", color: "#E9B44C",
            border: "1px solid #2a2420", borderRadius: 8, fontWeight: 600,
            fontSize: 13, textDecoration: "none",
          }}>📋 Year-end 7B</Link>
          <button onClick={exportTrendCsv} disabled={trend.length === 0} style={{
            padding: "9px 16px", background: "#D4654A", color: "#fff",
            border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13,
            cursor: trend.length === 0 ? "not-allowed" : "pointer",
            opacity: trend.length === 0 ? 0.5 : 1, fontFamily: "inherit",
          }}>↓ Export trend CSV</button>
        </div>
      </div>

      {/* Section: payroll trend */}
      <Section title="Payroll trend" subtitle="Last 24 paid months (most recent first in table, chronological in chart)">
        {trend.length === 0 ? (
          <EmptyBlock>
            No paid payroll runs yet. Run and lock payroll to see monthly trends here.
          </EmptyBlock>
        ) : (
          <>
            {/* Roll-up totals */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
              <Tally label="Periods" value={String(trend.length)} />
              <Tally label="Total gross" value={fmtGyd(totals.gross)} />
              <Tally label="Total NIS (employee)" value={fmtGyd(totals.nisE)} tone="warn" />
              <Tally label="Total PAYE" value={fmtGyd(totals.paye)} tone="warn" />
              <Tally label="Total net paid" value={fmtGyd(totals.net)} tone="good" />
            </div>

            {/* Big chart */}
            <div style={{ background: "#141210", border: "1px solid #1e1a17", borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <BigPayrollChart rows={trendChrono} />
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto", background: "#141210", border: "1px solid #1e1a17", borderRadius: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#100E0C" }}>
                    <Th>Period</Th>
                    <Th align="right">Employees</Th>
                    <Th align="right">Runs</Th>
                    <Th align="right">Gross</Th>
                    <Th align="right">NIS · employee</Th>
                    <Th align="right">NIS · employer</Th>
                    <Th align="right">PAYE</Th>
                    <Th align="right">Net</Th>
                  </tr>
                </thead>
                <tbody>
                  {trend.map(r => (
                    <tr key={`${r.year}-${r.month}`} style={{ borderTop: "1px solid #1e1a17" }}>
                      <Td><strong>{r.label}</strong></Td>
                      <Td align="right">{r.employees_paid}</Td>
                      <Td align="right" tone="dim">{r.runs}</Td>
                      <Td align="right" mono>{fmt(r.total_gross)}</Td>
                      <Td align="right" mono tone="warn">{fmt(r.total_nis_employee)}</Td>
                      <Td align="right" mono tone="warn">{fmt(r.total_nis_employer)}</Td>
                      <Td align="right" mono tone="warn">{fmt(r.total_paye)}</Td>
                      <Td align="right" mono tone="good"><strong>{fmt(r.total_net)}</strong></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Section>

      {/* Two-column: Department breakdown + Attendance */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 16, marginTop: 32 }}>
        <Section title="Headcount by department" subtitle="Active employees only">
          {deptCounts.length === 0 ? (
            <EmptyBlock compact>No active employees.</EmptyBlock>
          ) : (
            <div style={{ background: "#141210", border: "1px solid #1e1a17", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {deptCounts.map(d => {
                  const total = deptCounts.reduce((s, x) => s + x.count, 0);
                  const pct = total ? Math.round((d.count / total) * 100) : 0;
                  return (
                    <div key={d.department}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#F5F0EB" }}>{d.department}</div>
                        <div style={{ color: "#8B7355", fontSize: 12 }}><strong style={{ color: "#F5F0EB" }}>{d.count}</strong> · {pct}%</div>
                      </div>
                      <div style={{ height: 6, background: "#0C0A09", borderRadius: 100, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "#D4654A" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Section>

        <Section title="Attendance · this month" subtitle="Across all active employees">
          {!attendance ? (
            <EmptyBlock compact>Loading…</EmptyBlock>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Tally label="Total hours" value={attendance.total_hours.toFixed(1)} unit="hrs" />
              <Tally label="Days present" value={String(attendance.total_days_present)} tone="good" />
              <Tally label="Days absent" value={String(attendance.total_days_absent)} tone={attendance.total_days_absent > 0 ? "warn" : undefined} />
              <Tally label="Late arrivals" value={String(attendance.total_late_arrivals)} tone={attendance.total_late_arrivals > 0 ? "warn" : undefined} />
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function BigPayrollChart({ rows }: { rows: TrendRow[] }) {
  if (rows.length === 0) return null;

  const maxNet = Math.max(...rows.map(r => Number(r.total_gross)), 1);
  const W = 1100;
  const H = 320;
  const padLeft = 70;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 50;
  const innerW = W - padLeft - padRight;
  const innerH = H - padTop - padBottom;
  const barGap = 10;
  const barW = (innerW - barGap * (rows.length - 1)) / rows.length;

  const gridY = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", minWidth: 700, display: "block" }}>
        {gridY.map(g => {
          const y = padTop + (1 - g) * innerH;
          return (
            <g key={g}>
              <line x1={padLeft} y1={y} x2={W - padRight} y2={y} stroke="#1e1a17" strokeWidth="0.5" />
              <text x={padLeft - 10} y={y + 4} textAnchor="end" fill="#7A7068" fontSize="10" fontFamily="ui-monospace, monospace">
                {g === 0 ? "0" : `${Math.round((maxNet * g) / 1000).toLocaleString("en-GY")}k`}
              </text>
            </g>
          );
        })}

        {rows.map((r, i) => {
          const x = padLeft + i * (barW + barGap);
          const netH = (Number(r.total_net) / maxNet) * innerH;
          const grossH = (Number(r.total_gross) / maxNet) * innerH;
          const nisH = (Number(r.total_nis_employee) / maxNet) * innerH;
          const payeH = (Number(r.total_paye) / maxNet) * innerH;
          // Stacked deductions sit on top of net within the gross box
          return (
            <g key={`${r.year}-${r.month}`}>
              {/* Gross outline */}
              <rect x={x} y={padTop + innerH - grossH} width={barW} height={grossH} fill="#1e1a17" rx="3" />
              {/* PAYE (on top of net) */}
              <rect x={x} y={padTop + innerH - netH - nisH - payeH} width={barW} height={payeH} fill="#E9B44C" />
              {/* NIS (between net and PAYE) */}
              <rect x={x} y={padTop + innerH - netH - nisH} width={barW} height={nisH} fill="#ff8a7a" />
              {/* Net (bottom) */}
              <rect x={x} y={padTop + innerH - netH} width={barW} height={netH} fill="#D4654A" rx="3" />
              <title>{r.label}{"\n"}Gross: GYD {Math.round(Number(r.total_gross)).toLocaleString("en-GY")}{"\n"}NIS: GYD {Math.round(Number(r.total_nis_employee)).toLocaleString("en-GY")}{"\n"}PAYE: GYD {Math.round(Number(r.total_paye)).toLocaleString("en-GY")}{"\n"}Net: GYD {Math.round(Number(r.total_net)).toLocaleString("en-GY")}</title>
              {/* Labels */}
              <text x={x + barW / 2} y={H - 26} textAnchor="middle" fill="#8B7355" fontSize="10" fontWeight="600">
                {r.label.split(" ")[0]}
              </text>
              <text x={x + barW / 2} y={H - 12} textAnchor="middle" fill="#5a504a" fontSize="9">
                {r.label.split(" ")[1]}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${padLeft}, ${padTop - 12})`}>
          <rect width="10" height="10" y="-8" fill="#D4654A" rx="2" />
          <text x="16" y="1" fill="#8B7355" fontSize="10">Net</text>
          <rect width="10" height="10" x="60" y="-8" fill="#ff8a7a" rx="2" />
          <text x="76" y="1" fill="#8B7355" fontSize="10">NIS</text>
          <rect width="10" height="10" x="120" y="-8" fill="#E9B44C" rx="2" />
          <text x="136" y="1" fill="#8B7355" fontSize="10">PAYE</text>
          <rect width="10" height="10" x="190" y="-8" fill="#1e1a17" rx="2" />
          <text x="206" y="1" fill="#8B7355" fontSize="10">Gross outline</text>
        </g>
      </svg>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#F5F0EB" }}>{title}</h2>
        {subtitle && <div style={{ color: "#8B7355", fontSize: 12, marginTop: 3 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function Tally({ label, value, unit, tone }: { label: string; value: string; unit?: string; tone?: "good" | "warn" }) {
  const color = tone === "good" ? "#4CAF50" : tone === "warn" ? "#ff8a7a" : "#F5F0EB";
  return (
    <div style={{ padding: "12px 14px", background: "#141210", border: "1px solid #1e1a17", borderRadius: 10 }}>
      <div style={{ color: "#8B7355", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ color, fontSize: 18, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{value}</span>
        {unit && <span style={{ color: "#8B7355", fontSize: 11 }}>{unit}</span>}
      </div>
    </div>
  );
}

function EmptyBlock({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div style={{
      padding: compact ? 20 : 40,
      textAlign: "center",
      color: "#8B7355",
      fontSize: 13,
      background: "#141210",
      border: "1px solid #1e1a17",
      borderRadius: 12,
    }}>{children}</div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return <th style={{ textAlign: align || "left", padding: "12px 14px", color: "#8B7355", fontWeight: 700, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</th>;
}
function Td({ children, align, mono, tone }: { children: React.ReactNode; align?: "right"; mono?: boolean; tone?: "good" | "warn" | "dim" }) {
  const color = tone === "good" ? "#4CAF50" : tone === "warn" ? "#ff8a7a" : tone === "dim" ? "#8B7355" : "#F5F0EB";
  return <td style={{ padding: "10px 14px", textAlign: align || "left", color, fontFamily: mono ? "ui-monospace, monospace" : undefined, fontVariantNumeric: mono ? "tabular-nums" : undefined, whiteSpace: "nowrap" }}>{children}</td>;
}
