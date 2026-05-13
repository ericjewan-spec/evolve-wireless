"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useCurrentEmployee } from "@/lib/staff-auth";

type AttendanceRow = {
  id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  hours_worked: number | null;
  status: string;
  notes: string | null;
  source: string;
};

const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-GY", { weekday: "short", day: "numeric", month: "short" });
const fmtTime = (t: string | null) => t ? new Date(t).toLocaleTimeString("en-GY", { hour: "numeric", minute: "2-digit" }) : "—";

const STATUS_COLORS: Record<string, string> = {
  present: "#4CAF50",
  half_day: "#E9B44C",
  late: "#E9B44C",
  absent: "#ff6b5e",
  leave: "#8B7355",
  holiday: "#D4654A",
};

export default function StaffHoursPage() {
  const { employee, loading } = useCurrentEmployee();
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

  const fetchRows = useCallback(async () => {
    if (!employee) return;
    setLoadingRows(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .gte("date", dateFrom)
      .lte("date", dateTo)
      .order("date", { ascending: false });
    setRows((data as AttendanceRow[]) || []);
    setLoadingRows(false);
  }, [employee, dateFrom, dateTo]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  if (loading || !employee) return <div style={{ padding: 80, textAlign: "center", color: "#8B7355" }}>Loading…</div>;

  const totalHours = rows.reduce((s, r) => s + (r.hours_worked || 0), 0);
  const daysPresent = rows.filter(r => ["present", "half_day", "late"].includes(r.status)).length;
  const daysAbsent = rows.filter(r => r.status === "absent").length;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "#F5F0EB", letterSpacing: "-0.01em" }}>Hours worked</h1>
      <p style={{ color: "#8B7355", margin: "4px 0 24px 0", fontSize: 14 }}>
        Your attendance records, sourced from the clock-in/out kiosk and manual entries by HR.
      </p>

      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <label style={labelStyle}>From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={dateInput} />
        </div>
        <div>
          <label style={labelStyle}>To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={dateInput} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
        <Stat label="Total hours" value={(Math.round(totalHours * 10) / 10).toString()} color="#D4654A" />
        <Stat label="Days present" value={daysPresent.toString()} color="#4CAF50" />
        <Stat label="Days absent" value={daysAbsent.toString()} color={daysAbsent > 0 ? "#ff6b5e" : "#8B7355"} />
        <Stat label="Records" value={rows.length.toString()} color="#E9B44C" />
      </div>

      <div style={{ background: "#141210", border: "1px solid #1e1a17", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #1e1a17", display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1.5fr", gap: 12, fontSize: 11, color: "#8B7355", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          <div>Date</div>
          <div>In</div>
          <div>Out</div>
          <div>Hours</div>
          <div>Status / Notes</div>
        </div>
        {loadingRows ? (
          <div style={{ padding: 30, textAlign: "center", color: "#8B7355", fontSize: 13 }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: "#8B7355", fontSize: 13 }}>No attendance records in this range.</div>
        ) : rows.map((r) => (
          <div key={r.id} style={{ padding: "12px 18px", borderTop: "1px solid #1a1513", display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1.5fr", gap: 12, alignItems: "center", fontSize: 13 }}>
            <div style={{ color: "#F5F0EB", fontWeight: 600 }}>{fmtDate(r.date)}</div>
            <div style={{ color: "#8B7355", fontFamily: "monospace" }}>{fmtTime(r.clock_in)}</div>
            <div style={{ color: "#8B7355", fontFamily: "monospace" }}>{fmtTime(r.clock_out)}</div>
            <div style={{ color: "#F5F0EB", fontWeight: 700 }}>{r.hours_worked ? r.hours_worked.toFixed(2) : "—"}</div>
            <div>
              <span style={{
                padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.06em",
                background: `${STATUS_COLORS[r.status] || "#8B7355"}1f`,
                color: STATUS_COLORS[r.status] || "#8B7355",
              }}>{r.status.replace("_", " ")}</span>
              {r.notes && <span style={{ color: "#8B7355", marginLeft: 8, fontSize: 12 }}>{r.notes}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "#141210", border: "1px solid #1e1a17", borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 11, color: "#8B7355", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: "-0.02em" }}>{value}</div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, color: "#8B7355", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
};
const dateInput: React.CSSProperties = {
  padding: "9px 12px", fontSize: 13, background: "#141210",
  border: "1px solid #2a2420", borderRadius: 8, color: "#F5F0EB",
  outline: "none", fontFamily: "inherit", colorScheme: "dark",
};
