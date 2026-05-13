"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

type EarningsRow = {
  employee_id: string;
  tax_year: number;
  pay_periods: number;
  total_gross: number;
  total_nis_employee: number;
  total_nis_employer: number;
  total_paye: number;
  total_other_deductions: number;
  total_net: number;
  earliest_period_start: string;
  latest_period_end: string;
  employees?: {
    first_name: string;
    last_name: string;
    nis_number: string | null;
    tin_number: string | null;
    email: string | null;
  };
};

const fmt = (n: number | null | undefined) =>
  n == null ? "0" : Math.round(Number(n)).toLocaleString("en-GY");
const fmtGyd = (n: number | null | undefined) =>
  `GYD ${fmt(n)}`;

export default function YearEndPage() {
  const supabase = createClient();
  const [year, setYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState<EarningsRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEarnings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("employee_annual_earnings")
      .select("*, employees(first_name, last_name, nis_number, tin_number, email)")
      .eq("tax_year", year)
      .order("total_gross", { ascending: false });
    setRows((data as unknown as EarningsRow[]) || []);
    setLoading(false);
  }, [supabase, year]);

  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);

  const totals = rows.reduce((acc, r) => ({
    gross: acc.gross + Number(r.total_gross),
    nisE: acc.nisE + Number(r.total_nis_employee),
    nisR: acc.nisR + Number(r.total_nis_employer),
    paye: acc.paye + Number(r.total_paye),
    other: acc.other + Number(r.total_other_deductions),
    net: acc.net + Number(r.total_net),
  }), { gross: 0, nisE: 0, nisR: 0, paye: 0, other: 0, net: 0 });

  function downloadCsv() {
    const headers = ["Employee", "NIS Number", "TIN", "Periods", "Gross", "NIS (employee)", "NIS (employer)", "PAYE", "Other deductions", "Net"];
    const rowsCsv = rows.map(r => [
      `${r.employees?.first_name ?? ""} ${r.employees?.last_name ?? ""}`,
      r.employees?.nis_number ?? "",
      r.employees?.tin_number ?? "",
      r.pay_periods,
      r.total_gross,
      r.total_nis_employee,
      r.total_nis_employer,
      r.total_paye,
      r.total_other_deductions,
      r.total_net,
    ]);
    const csv = [headers, ...rowsCsv]
      .map(line => line.map(c => {
        const s = String(c);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evolve-7b-summary-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px" }}>
      <Link href="/admin/payroll" style={{ color: "#D4654A", fontSize: 13, textDecoration: "none" }}>
        ← Back to payroll
      </Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 8, marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "8px 0 4px 0", letterSpacing: "-0.01em", color: "#F5F0EB" }}>
            Year-end earnings — {year}
          </h1>
          <p style={{ color: "#8B7355", margin: 0, fontSize: 14 }}>
            Aggregated from <strong style={{ color: "#F5F0EB" }}>paid</strong> payroll runs only.
            Use this to file GRA Form 7B for each employee.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={selectStyle}>
            {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={downloadCsv} disabled={rows.length === 0} style={btnPrimary}>↓ Export CSV</button>
        </div>
      </div>

      {/* Totals strip */}
      {rows.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
          <Stat label="Employees" value={String(rows.length)} />
          <Stat label="Total gross" value={fmtGyd(totals.gross)} />
          <Stat label="NIS (employee)" value={fmtGyd(totals.nisE)} tone="warn" />
          <Stat label="NIS (employer)" value={fmtGyd(totals.nisR)} tone="warn" />
          <Stat label="PAYE" value={fmtGyd(totals.paye)} tone="warn" />
          <Stat label="Net paid" value={fmtGyd(totals.net)} tone="good" />
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", color: "#8B7355", padding: 30 }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#8B7355", background: "#141210", border: "1px solid #1e1a17", borderRadius: 12 }}>
          No paid payroll for {year} yet. Once you run and lock payroll, totals appear here.
        </div>
      ) : (
        <div style={{ overflowX: "auto", border: "1px solid #1e1a17", borderRadius: 12, background: "#141210" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#100E0C" }}>
                <Th>Employee</Th>
                <Th>NIS / TIN</Th>
                <Th align="right">Periods</Th>
                <Th align="right">Gross</Th>
                <Th align="right">NIS (employee)</Th>
                <Th align="right">PAYE</Th>
                <Th align="right">Other</Th>
                <Th align="right">Net</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.employee_id} style={{ borderTop: "1px solid #1e1a17" }}>
                  <Td>
                    <Link href={`/admin/payroll/employees/${r.employee_id}`} style={{ color: "#F5F0EB", fontWeight: 700, textDecoration: "none" }}>
                      {r.employees?.first_name} {r.employees?.last_name}
                    </Link>
                    {r.employees?.email && <div style={{ color: "#8B7355", fontSize: 11, marginTop: 1 }}>{r.employees.email}</div>}
                  </Td>
                  <Td>
                    <div style={{ color: "#E8DECE", fontFamily: "ui-monospace, monospace", fontSize: 12 }}>
                      {r.employees?.nis_number || <span style={{ color: "#7A7068" }}>no NIS</span>}
                    </div>
                    <div style={{ color: "#8B7355", fontFamily: "ui-monospace, monospace", fontSize: 11 }}>
                      {r.employees?.tin_number || "no TIN"}
                    </div>
                  </Td>
                  <Td align="right">{r.pay_periods}</Td>
                  <Td align="right" mono>{fmt(r.total_gross)}</Td>
                  <Td align="right" mono tone="warn">{fmt(r.total_nis_employee)}</Td>
                  <Td align="right" mono tone="warn">{fmt(r.total_paye)}</Td>
                  <Td align="right" mono tone="dim">{fmt(r.total_other_deductions)}</Td>
                  <Td align="right" mono tone="good"><strong>{fmt(r.total_net)}</strong></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 32, padding: 16, background: "#141210", border: "1px solid #1e1a17", borderRadius: 10, color: "#8B7355", fontSize: 12, lineHeight: 1.6 }}>
        <strong style={{ color: "#E9B44C" }}>Note on GRA Form 7B filing:</strong> the CSV above gives you the totals for each employee that you&apos;ll need to populate the official Form 7B (download from <span style={{ color: "#E8DECE" }}>gra.gov.gy/forms</span>). Form 7B must be issued to every employee by January 31 of the following year and includes their name, address, NIS number, TIN, period covered, gross earnings, NIS deduction, and PAYE deducted.
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  const color = tone === "good" ? "#4CAF50" : tone === "warn" ? "#ff8a7a" : "#F5F0EB";
  return (
    <div style={{ padding: "14px 16px", background: "#141210", border: "1px solid #1e1a17", borderRadius: 10 }}>
      <div style={{ color: "#8B7355", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ color, fontSize: 15, fontWeight: 800, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return <th style={{ textAlign: align || "left", padding: "12px 14px", color: "#8B7355", fontWeight: 700, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</th>;
}
function Td({ children, align, mono, tone }: { children: React.ReactNode; align?: "right"; mono?: boolean; tone?: "good" | "warn" | "dim" }) {
  const color = tone === "good" ? "#4CAF50" : tone === "warn" ? "#ff8a7a" : tone === "dim" ? "#8B7355" : "#F5F0EB";
  return <td style={{ padding: "12px 14px", textAlign: align || "left", color, fontFamily: mono ? "ui-monospace, monospace" : undefined, fontVariantNumeric: mono ? "tabular-nums" : undefined, verticalAlign: "top", whiteSpace: "nowrap" }}>{children}</td>;
}

const selectStyle: React.CSSProperties = {
  padding: "8px 12px", borderRadius: 6, border: "1px solid #2a2420",
  background: "#0C0A09", color: "#F5F0EB", fontSize: 13, fontFamily: "inherit", outline: "none",
};
const btnPrimary: React.CSSProperties = {
  padding: "9px 16px", background: "#D4654A", color: "#fff",
  border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
};
