"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useCurrentEmployee } from "@/lib/staff-auth";

type LeaveRequest = {
  id: string;
  leave_type: "vacation" | "sick" | "unpaid" | "bereavement" | "other";
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string | null;
  status: "pending" | "approved" | "declined" | "cancelled";
  decision_notes: string | null;
  approved_at: string | null;
  created_at: string;
};

const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-GY", { day: "numeric", month: "short", year: "numeric" });

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending: { bg: "rgba(233,180,76,0.12)", color: "#E9B44C" },
  approved: { bg: "rgba(76,175,80,0.12)", color: "#4CAF50" },
  declined: { bg: "rgba(255,107,94,0.12)", color: "#ff6b5e" },
  cancelled: { bg: "rgba(139,115,85,0.12)", color: "#8B7355" },
};

function diffDaysInclusive(start: string, end: string): number {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export default function StaffLeavePage() {
  const { employee, loading } = useCurrentEmployee();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [draft, setDraft] = useState({
    leave_type: "vacation" as LeaveRequest["leave_type"],
    start_date: "",
    end_date: "",
    reason: "",
  });

  const fetchRequests = useCallback(async () => {
    if (!employee) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("leave_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setRequests((data as LeaveRequest[]) || []);
  }, [employee]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function submitLeave() {
    setError("");
    if (!employee) return;
    if (!draft.start_date || !draft.end_date) { setError("Pick a start and end date."); return; }
    const days = diffDaysInclusive(draft.start_date, draft.end_date);
    if (days <= 0) { setError("End date must be on or after start date."); return; }

    // Balance check (client-side warning; HR can still override)
    if (draft.leave_type === "vacation" && days > (employee.leave_balance_vacation ?? 0)) {
      if (!confirm(`You're requesting ${days} days but only have ${employee.leave_balance_vacation} vacation days. Submit anyway?`)) return;
    }
    if (draft.leave_type === "sick" && days > (employee.leave_balance_sick ?? 0)) {
      if (!confirm(`You're requesting ${days} days but only have ${employee.leave_balance_sick} sick days. Submit anyway?`)) return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("leave_requests").insert({
      employee_id: employee.id,
      leave_type: draft.leave_type,
      start_date: draft.start_date,
      end_date: draft.end_date,
      days_count: days,
      reason: draft.reason || null,
      status: "pending",
      submitted_by_employee: true,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setDraft({ leave_type: "vacation", start_date: "", end_date: "", reason: "" });
    setShowForm(false);
    setSubmitting(false);
    fetchRequests();
  }

  async function cancelRequest(req: LeaveRequest) {
    if (req.status !== "pending") return;
    if (!confirm(`Cancel your ${req.leave_type} leave request for ${fmtDate(req.start_date)} – ${fmtDate(req.end_date)}?`)) return;
    const supabase = createClient();
    const { error: e } = await supabase.from("leave_requests")
      .update({ status: "cancelled" })
      .eq("id", req.id);
    if (e) { alert(e.message); return; }
    fetchRequests();
  }

  if (loading || !employee) return <div style={{ padding: 80, textAlign: "center", color: "#8B7355" }}>Loading…</div>;

  const draftDays = (draft.start_date && draft.end_date) ? diffDaysInclusive(draft.start_date, draft.end_date) : 0;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "#F5F0EB", letterSpacing: "-0.01em" }}>Leave</h1>
          <p style={{ color: "#8B7355", margin: "4px 0 0 0", fontSize: 14 }}>
            Your leave balances and request history. To request leave, please contact your manager.
          </p>
        </div>
        {/* VIEW-ONLY: Apply button removed — employees view balances/history only. */}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
        <BalanceCard label="Vacation balance" value={employee.leave_balance_vacation ?? 0} color="#E9B44C" />
        <BalanceCard label="Sick balance" value={employee.leave_balance_sick ?? 0} color="#4CAF50" />
      </div>

      {showForm && (
        <div style={{ background: "#141210", border: "1px solid #2a2420", borderRadius: 12, padding: 22, marginBottom: 22 }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#F5F0EB" }}>Apply for leave</h3>

          {error && (
            <div style={{ padding: 10, background: "rgba(255,107,94,0.08)", color: "#ff8a7a", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Type of leave</label>
              <select value={draft.leave_type} onChange={(e) => setDraft({ ...draft, leave_type: e.target.value as LeaveRequest["leave_type"] })} style={inputStyle}>
                <option value="vacation">Vacation</option>
                <option value="sick">Sick</option>
                <option value="unpaid">Unpaid</option>
                <option value="bereavement">Bereavement</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Days requested</label>
              <div style={{ ...inputStyle, color: draftDays > 0 ? "#F5F0EB" : "#8B7355", display: "flex", alignItems: "center", height: "100%", boxSizing: "border-box" }}>
                {draftDays > 0 ? `${draftDays} day${draftDays === 1 ? "" : "s"}` : "—"}
              </div>
            </div>
            <div>
              <label style={labelStyle}>From</label>
              <input type="date" value={draft.start_date} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>To</label>
              <input type="date" value={draft.end_date} onChange={(e) => setDraft({ ...draft, end_date: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Reason (optional)</label>
            <textarea
              value={draft.reason}
              onChange={(e) => setDraft({ ...draft, reason: e.target.value })}
              placeholder="Optional — anything HR should know"
              rows={3}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
            <button onClick={() => { setShowForm(false); setError(""); }} style={btnSecondary}>Cancel</button>
            <button onClick={submitLeave} disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }}>
              {submitting ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: 16, color: "#F5F0EB", margin: "0 0 12px 0", fontWeight: 700 }}>My requests</h2>
      {requests.length === 0 ? (
        <div style={{ padding: 30, textAlign: "center", color: "#8B7355", fontSize: 13, background: "#141210", borderRadius: 12, border: "1px solid #1e1a17" }}>
          No leave requests yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {requests.map((r) => (
            <div key={r.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap",
              gap: 14, padding: 16, background: "#141210", border: "1px solid #1e1a17", borderRadius: 10,
            }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, color: "#F5F0EB", textTransform: "capitalize" }}>{r.leave_type}</span>
                  <span style={{
                    padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    background: STATUS_STYLES[r.status].bg, color: STATUS_STYLES[r.status].color,
                  }}>{r.status}</span>
                </div>
                <div style={{ color: "#8B7355", fontSize: 13, marginTop: 4 }}>
                  {fmtDate(r.start_date)} – {fmtDate(r.end_date)} · {r.days_count} day{r.days_count === 1 ? "" : "s"}
                </div>
                {r.reason && <div style={{ color: "#7A7068", fontSize: 12, marginTop: 4 }}>{r.reason}</div>}
                {r.decision_notes && <div style={{ color: "#7A7068", fontSize: 12, marginTop: 4, fontStyle: "italic" }}>HR: {r.decision_notes}</div>}
              </div>
              {/* VIEW-ONLY: cancel button removed. Contact HR to cancel a pending request. */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BalanceCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: "#141210", border: "1px solid #1e1a17", borderRadius: 12, padding: 18 }}>
      <div style={{ fontSize: 11, color: "#8B7355", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: 30, fontWeight: 800, color, letterSpacing: "-0.02em" }}>{value}</span>
        <span style={{ fontSize: 13, color: "#8B7355" }}>days remaining</span>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, color: "#8B7355", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", fontSize: 14, background: "#0C0A09",
  border: "1px solid #2a2420", borderRadius: 8, color: "#F5F0EB",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit", colorScheme: "dark",
};
const btnPrimary: React.CSSProperties = {
  padding: "10px 18px", background: "#D4654A", color: "#fff",
  border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13,
  cursor: "pointer", fontFamily: "inherit",
};
const btnSecondary: React.CSSProperties = {
  padding: "8px 14px", background: "transparent", color: "#F5F0EB",
  border: "1px solid #2a2420", borderRadius: 8, fontWeight: 600, fontSize: 12,
  cursor: "pointer", fontFamily: "inherit",
};
