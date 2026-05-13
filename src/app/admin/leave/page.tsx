"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { logAudit } from "@/lib/audit";

type LeaveRow = {
  id: string;
  employee_id: string;
  leave_type: "vacation" | "sick" | "unpaid" | "bereavement" | "other";
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string | null;
  status: "pending" | "approved" | "declined" | "cancelled";
  decision_notes: string | null;
  approved_at: string | null;
  submitted_by_employee: boolean;
  created_at: string;
  employees: { first_name: string; last_name: string; role: string; leave_balance_vacation: number | null; leave_balance_sick: number | null } | null;
};

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-GY", { day: "numeric", month: "short", year: "numeric" });

type Tab = "pending" | "approved" | "declined" | "all";

export default function AdminLeavePage() {
  const supabase = createClient();
  const [rows, setRows] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("leave_requests")
      .select("*, employees(first_name, last_name, role, leave_balance_vacation, leave_balance_sick)")
      .order("created_at", { ascending: false })
      .limit(200);
    setRows((data as unknown as LeaveRow[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetch(); }, [fetch]);

  async function decide(req: LeaveRow, decision: "approved" | "declined") {
    const verb = decision === "approved" ? "Approve" : "Decline";
    const empName = `${req.employees?.first_name} ${req.employees?.last_name}`;
    const note = prompt(
      `${verb} ${empName}'s ${req.leave_type} leave for ${req.days_count} day${req.days_count === 1 ? "" : "s"} (${fmtDate(req.start_date)} → ${fmtDate(req.end_date)})?\n\nOptional note for the employee:`,
      ""
    );
    if (note === null) return;
    setBusyId(req.id);
    const { data: { user } } = await supabase.auth.getUser();
    const { error: e } = await supabase
      .from("leave_requests")
      .update({
        status: decision,
        decision_notes: note || null,
        approved_at: new Date().toISOString(),
        approved_by_id: user?.id ?? null,
      })
      .eq("id", req.id);
    if (e) { alert(e.message); setBusyId(null); return; }
    await logAudit({
      employee_id: req.employee_id,
      action: "updated",
      field_name: `leave_request:${req.id}`,
      old_value: req.status,
      new_value: decision,
      metadata: {
        leave_type: req.leave_type,
        days_count: req.days_count,
        start_date: req.start_date,
        end_date: req.end_date,
        decision_notes: note || null,
      },
    });
    setBusyId(null);
    fetch();
  }

  const filtered =
    tab === "pending" ? rows.filter(r => r.status === "pending") :
    tab === "approved" ? rows.filter(r => r.status === "approved") :
    tab === "declined" ? rows.filter(r => r.status === "declined" || r.status === "cancelled") :
    rows;

  const counts = {
    pending: rows.filter(r => r.status === "pending").length,
    approved: rows.filter(r => r.status === "approved").length,
    declined: rows.filter(r => r.status === "declined" || r.status === "cancelled").length,
    all: rows.length,
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "#F5F0EB", letterSpacing: "-0.01em" }}>Leave management</h1>
      <p style={{ color: "#8B7355", margin: "4px 0 24px 0", fontSize: 14 }}>
        All leave requests across the company. Approved leave automatically decrements the relevant balance.
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #1e1a17", marginBottom: 20, flexWrap: "wrap" }}>
        {(["pending", "approved", "declined", "all"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom: tab === t ? "2px solid #D4654A" : "2px solid transparent",
              color: tab === t ? "#F5F0EB" : "#8B7355",
              fontWeight: tab === t ? 700 : 500,
              fontSize: 13,
              fontFamily: "inherit",
              cursor: "pointer",
              marginBottom: -1,
              textTransform: "capitalize",
            }}
          >
            {t}{counts[t] > 0 && <span style={{ marginLeft: 6, color: tab === t ? "#D4654A" : "#8B7355" }}>({counts[t]})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#8B7355", padding: 30 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 30, textAlign: "center", color: "#8B7355", background: "#141210", border: "1px solid #1e1a17", borderRadius: 12 }}>
          No {tab === "all" ? "" : tab} leave requests.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(r => (
            <div key={r.id} style={{
              padding: 16,
              background: "#141210",
              border: "1px solid #1e1a17",
              borderRadius: 12,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <Link
                      href={`/admin/payroll/employees/${r.employee_id}`}
                      style={{ fontWeight: 700, color: "#F5F0EB", textDecoration: "none", fontSize: 15 }}
                    >
                      {r.employees?.first_name} {r.employees?.last_name}
                    </Link>
                    <span style={{ color: "#8B7355", fontSize: 12 }}>· {r.employees?.role}</span>
                  </div>
                  <div style={{ color: "#E8DECE", fontSize: 13 }}>
                    <strong style={{ color: "#F5F0EB", textTransform: "capitalize" }}>{r.leave_type}</strong>
                    {" · "}
                    {r.days_count} day{r.days_count === 1 ? "" : "s"}
                    {" · "}
                    {fmtDate(r.start_date)} → {fmtDate(r.end_date)}
                  </div>
                  {r.reason && (
                    <div style={{ color: "#8B7355", fontSize: 12, marginTop: 6, fontStyle: "italic" }}>
                      &quot;{r.reason}&quot;
                    </div>
                  )}
                  {r.decision_notes && (
                    <div style={{ color: "#8B7355", fontSize: 12, marginTop: 6 }}>
                      HR note: <span style={{ color: "#E8DECE" }}>{r.decision_notes}</span>
                    </div>
                  )}
                  <div style={{ color: "#7A7068", fontSize: 11, marginTop: 8 }}>
                    Submitted {new Date(r.created_at).toLocaleString("en-GY")}
                    {r.approved_at && <> · Decided {new Date(r.approved_at).toLocaleString("en-GY")}</>}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, minWidth: 160 }}>
                  <StatusBadge status={r.status} />
                  {r.leave_type === "vacation" && (
                    <div style={{ fontSize: 11, color: "#8B7355" }}>
                      Balance: <strong style={{ color: "#F5F0EB" }}>{r.employees?.leave_balance_vacation ?? 0}d</strong>
                    </div>
                  )}
                  {r.leave_type === "sick" && (
                    <div style={{ fontSize: 11, color: "#8B7355" }}>
                      Balance: <strong style={{ color: "#F5F0EB" }}>{r.employees?.leave_balance_sick ?? 0}d</strong>
                    </div>
                  )}
                  {r.status === "pending" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => decide(r, "approved")}
                        disabled={busyId === r.id}
                        style={{ ...btnSmall, background: "#4CAF50", color: "#fff" }}
                      >
                        {busyId === r.id ? "…" : "Approve"}
                      </button>
                      <button
                        onClick={() => decide(r, "declined")}
                        disabled={busyId === r.id}
                        style={{ ...btnSmall, background: "transparent", color: "#ff8a7a", border: "1px solid #2a2420" }}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: LeaveRow["status"] }) {
  const palette: Record<LeaveRow["status"], { bg: string; fg: string; label: string }> = {
    pending: { bg: "rgba(233,180,76,0.14)", fg: "#E9B44C", label: "PENDING" },
    approved: { bg: "rgba(76,175,80,0.14)", fg: "#4CAF50", label: "APPROVED" },
    declined: { bg: "rgba(255,107,94,0.12)", fg: "#ff8a7a", label: "DECLINED" },
    cancelled: { bg: "rgba(139,115,85,0.08)", fg: "#7A7068", label: "CANCELLED" },
  };
  const p = palette[status];
  return (
    <span style={{
      padding: "4px 12px",
      borderRadius: 100,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.08em",
      background: p.bg,
      color: p.fg,
    }}>{p.label}</span>
  );
}

const btnSmall: React.CSSProperties = {
  padding: "6px 14px",
  border: "none",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};
