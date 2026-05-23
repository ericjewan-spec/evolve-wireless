// =====================================================================
// AttendanceSummaryPanel.tsx
// Place at: src/app/admin/payroll/AttendanceSummaryPanel.tsx
// =====================================================================
// Live attendance summary panel for the Payroll tab.
// Calls the public.payroll_attendance_summary() Postgres function.
// Always live â re-reads attendance every render, no caching.
// =====================================================================

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type Row = {
  employee_id: string;
  first_name: string;
  last_name: string;
  days_in_period: number;
  days_present: number;
  days_late: number;
  days_absent: number;
  days_leave: number;
  total_hours: number;
  avg_hours_per_day: number;
  first_clock_in: string | null;
  last_clock_out: string | null;
};

const supabase = createClient();

const fmtTime = (iso: string | null) => {
  if (!iso) return "â";
  return new Date(iso).toLocaleTimeString("en-GY", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fmtDate = (iso: string | null) => {
  if (!iso) return "â";
  return new Date(iso).toLocaleDateString("en-GY", {
    month: "short",
    day: "numeric",
  });
};

export default function AttendanceSummaryPanel({
  dateFrom,
  dateTo,
}: {
  dateFrom: string;
  dateTo: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .rpc("payroll_attendance_summary", {
        p_start: dateFrom,
        p_end: dateTo,
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("[AttendanceSummary] RPC error", error);
          setRows([]);
        } else {
          setRows((data || []) as Row[]);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dateFrom, dateTo]);

  const totalDays = rows.reduce((s, r) => s + r.days_present, 0);
  const totalHours = rows.reduce((s, r) => s + Number(r.total_hours || 0), 0);
  const totalLate = rows.reduce((s, r) => s + r.days_late, 0);

  return (
    <div
      style={{
        marginBottom: 24,
        padding: 20,
        borderRadius: 12,
        background: "#141210",
        border: "1px solid #1e1a17",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "'Bricolage Grotesque', serif",
              fontWeight: 700,
              color: "#F5F0EB",
              margin: 0,
              fontSize: "1.05rem",
            }}
          >
            ð Attendance Summary
          </h3>
          <p
            style={{
              color: "#7A7068",
              fontSize: 11,
              margin: "2px 0 0 0",
            }}
          >
            Live from biometric device + /clock Â· {dateFrom} â {dateTo}
          </p>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <Stat label="Days Worked" value={totalDays.toString()} />
          <Stat label="Total Hours" value={totalHours.toFixed(1)} accent="#E9B44C" />
          <Stat
            label="Late Arrivals"
            value={totalLate.toString()}
            accent={totalLate > 0 ? "#E74C3C" : "#7A7068"}
          />
        </div>
      </div>

      {loading ? (
        <p style={{ color: "#7A7068", textAlign: "center", padding: 20, fontSize: 13 }}>
          Loading attendanceâ¦
        </p>
      ) : rows.length === 0 ? (
        <p style={{ color: "#7A7068", textAlign: "center", padding: 20, fontSize: 13 }}>
          No active staff found.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2420" }}>
                {[
                  "Employee",
                  "Days Present",
                  "Days Late",
                  "Days Absent",
                  "Total Hours",
                  "Avg/Day",
                  "First In",
                  "Last Out",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      color: "#7A7068",
                      fontWeight: 600,
                      fontSize: "0.74rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.employee_id} style={{ borderBottom: "1px solid #1e1a17" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                    {r.first_name} {r.last_name}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ color: r.days_present > 0 ? "#4CAF50" : "#7A7068" }}>
                      {r.days_present}
                    </span>
                    <span style={{ color: "#4a443e", marginLeft: 4 }}>
                      / {r.days_in_period}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      color: r.days_late > 0 ? "#E74C3C" : "#7A7068",
                      fontWeight: r.days_late > 0 ? 700 : 400,
                    }}
                  >
                    {r.days_late}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      color: r.days_absent > 0 ? "#E74C3C" : "#7A7068",
                    }}
                  >
                    {r.days_absent}
                  </td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "#E9B44C" }}>
                    {Number(r.total_hours).toFixed(1)}h
                  </td>
                  <td style={{ padding: "10px 12px", color: "#8B7355" }}>
                    {Number(r.avg_hours_per_day).toFixed(1)}h
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      color: "#8B7355",
                      fontSize: "0.78rem",
                    }}
                  >
                    {fmtDate(r.first_clock_in)} {fmtTime(r.first_clock_in)}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      color: "#8B7355",
                      fontSize: "0.78rem",
                    }}
                  >
                    {fmtDate(r.last_clock_out)} {fmtTime(r.last_clock_out)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent = "#F5F0EB",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div style={{ textAlign: "right" }}>
      <div
        style={{
          fontSize: 10,
          color: "#7A7068",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Bricolage Grotesque', serif",
          fontWeight: 800,
          fontSize: "1.25rem",
          color: accent,
        }}
      >
        {value}
      </div>
    </div>
  );
}
