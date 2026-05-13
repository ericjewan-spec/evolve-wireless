"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useCurrentEmployee } from "@/lib/staff-auth";

type PayslipRow = {
  id: string;
  payroll_run_id: string;
  regular_hours: number | null;
  overtime_hours: number | null;
  days_worked: number | null;
  days_absent: number | null;
  days_leave: number | null;
  gross_pay: number;
  nis_deduction: number;
  paye_deduction: number;
  other_deductions: number;
  net_pay: number;
  personal_allowance: number | null;
  chargeable_income: number | null;
  pdf_path: string | null;
  payslip_sent_at: string | null;
  notes: string | null;
  payroll_runs: {
    period_start: string;
    period_end: string;
    period_label: string | null;
    pay_cycle: string;
    pay_date: string | null;
    status: string;
  } | null;
};

const fmtGyd = (n: number) => "GYD " + Math.round(n).toLocaleString("en-GY");
const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-GY", { day: "numeric", month: "short", year: "numeric" });

export default function StaffPayslipsPage() {
  const { employee, loading } = useCurrentEmployee();
  const [rows, setRows] = useState<PayslipRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    if (!employee) return;
    setLoadingRows(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("payroll_items")
      .select("*, payroll_runs(period_start, period_end, period_label, pay_cycle, pay_date, status)")
      .eq("payroll_runs.status", "paid")
      .order("created_at", { ascending: false });
    setRows((data as unknown as PayslipRow[]) || []);
    setLoadingRows(false);
  }, [employee]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  if (loading || !employee) return <div style={{ padding: 80, textAlign: "center", color: "#8B7355" }}>Loading…</div>;

  // YTD totals (current year)
  const thisYear = new Date().getFullYear();
  const ytd = rows.filter(r => {
    const end = r.payroll_runs?.period_end;
    return end ? new Date(end + "T00:00:00").getFullYear() === thisYear : false;
  });
  const ytdGross = ytd.reduce((s, r) => s + (r.gross_pay || 0), 0);
  const ytdNis = ytd.reduce((s, r) => s + (r.nis_deduction || 0), 0);
  const ytdPaye = ytd.reduce((s, r) => s + (r.paye_deduction || 0), 0);
  const ytdOther = ytd.reduce((s, r) => s + (r.other_deductions || 0), 0);
  const ytdNet = ytd.reduce((s, r) => s + (r.net_pay || 0), 0);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px 80px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "#F5F0EB", letterSpacing: "-0.01em" }}>Payslips</h1>
      <p style={{ color: "#8B7355", margin: "4px 0 24px 0", fontSize: 14 }}>
        Your pay history. Tap a row to expand the full breakdown.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        <Stat label={`YTD gross · ${thisYear}`} value={fmtGyd(ytdGross)} />
        <Stat label="YTD NIS contributions" value={fmtGyd(ytdNis)} color="#4CAF50" />
        <Stat label="YTD PAYE income tax" value={fmtGyd(ytdPaye)} color="#E9B44C" />
        <Stat label="YTD net pay" value={fmtGyd(ytdNet)} color="#D4654A" />
      </div>

      {loadingRows ? (
        <div style={{ padding: 30, textAlign: "center", color: "#8B7355", fontSize: 13 }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={{ padding: 30, textAlign: "center", color: "#8B7355", fontSize: 13, background: "#141210", borderRadius: 12, border: "1px solid #1e1a17" }}>
          You don&apos;t have any payslips yet. Your first one will appear after the first pay run that includes you.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((r) => {
            const isOpen = openId === r.id;
            const run = r.payroll_runs;
            return (
              <div key={r.id} style={{ background: "#141210", border: "1px solid #1e1a17", borderRadius: 10, overflow: "hidden" }}>
                <button
                  onClick={() => setOpenId(isOpen ? null : r.id)}
                  style={{
                    width: "100%", padding: 16, background: "transparent", border: "none",
                    color: "#F5F0EB", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                    display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {run ? `${fmtDate(run.period_start)} – ${fmtDate(run.period_end)}` : "Pay period"}
                    </div>
                    <div style={{ color: "#8B7355", fontSize: 12, marginTop: 2 }}>
                      {run?.pay_cycle ? run.pay_cycle.charAt(0).toUpperCase() + run.pay_cycle.slice(1) : ""}
                      {run?.status ? ` · ${run.status}` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {r.pdf_path && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const supabase = createClient();
                          const { data, error } = await supabase.storage
                            .from("payslips")
                            .createSignedUrl(r.pdf_path!, 60);
                          if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                          else alert("Could not get download link: " + (error?.message || "unknown"));
                        }}
                        style={{
                          padding: "6px 12px",
                          background: "rgba(212,101,74,0.12)",
                          color: "#D4654A",
                          border: "1px solid rgba(212,101,74,0.25)",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        ↓ PDF
                      </button>
                    )}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#F5F0EB" }}>{fmtGyd(r.net_pay)}</div>
                      <div style={{ color: "#8B7355", fontSize: 11 }}>net</div>
                    </div>
                    <span style={{ color: "#8B7355" }}>{isOpen ? "▴" : "▾"}</span>
                  </div>
                </button>
                {isOpen && (
                  <div style={{ borderTop: "1px solid #1a1513", padding: 18, background: "#100E0C" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                      <Field label="Regular hours" value={r.regular_hours?.toString() ?? "—"} />
                      <Field label="Overtime hours" value={r.overtime_hours?.toString() ?? "—"} />
                      <Field label="Days worked" value={r.days_worked?.toString() ?? "—"} />
                      <Field label="Days absent" value={r.days_absent?.toString() ?? "—"} />
                    </div>
                    <hr style={{ border: "none", borderTop: "1px solid #1e1a17", margin: "18px 0" }} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <Row label="Gross pay" value={fmtGyd(r.gross_pay)} />
                      <Row label="NIS deduction (5.6%)" value={`− ${fmtGyd(r.nis_deduction)}`} color="#ff8a7a" />
                      <Row label="PAYE income tax" value={`− ${fmtGyd(r.paye_deduction)}`} color="#ff8a7a" />
                      <Row label="Other deductions" value={`− ${fmtGyd(r.other_deductions)}`} color="#ff8a7a" />
                      <div style={{ gridColumn: "1 / -1", borderTop: "1px solid #1e1a17", marginTop: 6, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#F5F0EB", fontWeight: 700 }}>Net pay</span>
                        <span style={{ color: "#D4654A", fontWeight: 800, fontSize: 18 }}>{fmtGyd(r.net_pay)}</span>
                      </div>
                    </div>
                    {r.notes && (
                      <div style={{ marginTop: 14, padding: 10, background: "#1a1513", borderRadius: 6, color: "#8B7355", fontSize: 13 }}>
                        {r.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color = "#F5F0EB" }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: "#141210", border: "1px solid #1e1a17", borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 10, color: "#8B7355", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 800, color, letterSpacing: "-0.01em" }}>{value}</div>
    </div>
  );
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#8B7355", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div style={{ color: "#F5F0EB", fontWeight: 600 }}>{value}</div>
    </div>
  );
}
function Row({ label, value, color = "#F5F0EB" }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
      <span style={{ color: "#8B7355", fontSize: 13 }}>{label}</span>
      <span style={{ color, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
