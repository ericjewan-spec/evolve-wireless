"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { useCurrentEmployee } from "@/lib/staff-auth";

type Snapshot = {
  hoursThisPeriod: number;
  pendingLeaveCount: number;
  lastPayslip: {
    period_end: string;
    net_pay: number;
  } | null;
  onboarding: {
    total: number;
    done: number;
    pendingRequired: number;
    percent: number;
  } | null;
  openGoals: number;
};

const fmtGyd = (n: number) => "GYD " + Math.round(n).toLocaleString("en-GY");
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-GY", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function StaffDashboard() {
  const { employee, loading } = useCurrentEmployee();
  const [snap, setSnap] = useState<Snapshot | null>(null);

  useEffect(() => {
    if (!employee) return;
    const supabase = createClient();

    async function load() {
      if (!employee) return;
      // Current pay period: rough heuristic — last 14 days for fortnightly, last 30 for monthly
      const days = employee.pay_cycle === "monthly" ? 30 : 14;
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceStr = since.toISOString().split("T")[0];

      const [{ data: attRows }, { data: leaveRows }, { data: payslipRow }, { data: onboardingRows }, { data: goalRows }] = await Promise.all([
        supabase.from("attendance").select("hours_worked").gte("date", sinceStr),
        supabase.from("leave_requests").select("id").eq("status", "pending"),
        supabase.from("payroll_items")
          .select("net_pay, payroll_runs(period_end)")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("employee_onboarding_items").select("status, required"),
        supabase.from("employee_events").select("id").eq("category", "goal").in("status", ["open", "in_progress"]),
      ]);

      const hours = (attRows || []).reduce((sum, a) => sum + (a.hours_worked || 0), 0);

      let lastPayslip: Snapshot["lastPayslip"] = null;
      if (payslipRow) {
        const run = (payslipRow as { payroll_runs?: { period_end?: string } }).payroll_runs;
        lastPayslip = {
          period_end: run?.period_end ?? "",
          net_pay: payslipRow.net_pay ?? 0,
        };
      }

      let onboarding: Snapshot["onboarding"] = null;
      if (onboardingRows && onboardingRows.length > 0) {
        const total = onboardingRows.length;
        const done = onboardingRows.filter((r: { status: string }) => r.status === "done" || r.status === "waived" || r.status === "na").length;
        const pendingRequired = onboardingRows.filter((r: { status: string; required: boolean }) => r.status === "pending" && r.required).length;
        onboarding = {
          total,
          done,
          pendingRequired,
          percent: total ? Math.round((done / total) * 100) : 0,
        };
      }

      setSnap({
        hoursThisPeriod: Math.round(hours * 10) / 10,
        pendingLeaveCount: (leaveRows || []).length,
        lastPayslip,
        onboarding,
        openGoals: (goalRows || []).length,
      });
    }

    load();
  }, [employee]);

  if (loading || !employee) {
    return <div style={{ padding: 80, textAlign: "center", color: "#8B7355" }}>Loading…</div>;
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.01em", color: "#F5F0EB" }}>
          Welcome, {employee.first_name}
        </h1>
        <p style={{ color: "#8B7355", margin: "4px 0 0 0", fontSize: 14 }}>
          {employee.role}{employee.department ? ` · ${employee.department}` : ""}
        </p>
      </div>

      {/* Onboarding banner — only shows while onboarding is incomplete */}
      {snap?.onboarding && snap.onboarding.percent < 100 && (
        <div style={{
          background: "linear-gradient(135deg, rgba(212,101,74,0.10) 0%, rgba(233,180,76,0.06) 100%)",
          border: "1px solid rgba(212,101,74,0.25)",
          borderRadius: 12,
          padding: "18px 20px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 11, color: "#D4654A", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Onboarding in progress</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#F5F0EB", marginBottom: 2 }}>
              {snap.onboarding.done} of {snap.onboarding.total} items complete
            </div>
            {snap.onboarding.pendingRequired > 0 && (
              <div style={{ fontSize: 12, color: "#E9B44C" }}>
                {snap.onboarding.pendingRequired} required item{snap.onboarding.pendingRequired === 1 ? "" : "s"} still pending — speak to HR
              </div>
            )}
          </div>
          <div style={{ minWidth: 200 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "#8B7355", fontWeight: 700 }}>{snap.onboarding.percent}%</span>
            </div>
            <div style={{ height: 6, background: "#0C0A09", borderRadius: 100, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${snap.onboarding.percent}%`, background: "#D4654A", transition: "width 0.3s" }} />
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 28 }}>
        <Card label="Vacation balance" value={`${employee.leave_balance_vacation ?? 0}`} unit="days" color="#E9B44C" href="/staff/leave" />
        <Card label="Sick balance" value={`${employee.leave_balance_sick ?? 0}`} unit="days" color="#4CAF50" href="/staff/leave" />
        <Card label={`Hours · last ${employee.pay_cycle === "monthly" ? "30" : "14"} days`} value={snap ? snap.hoursThisPeriod.toString() : "—"} unit="hrs" color="#D4654A" href="/staff/hours" />
        <Card label="Pending leave" value={snap ? snap.pendingLeaveCount.toString() : "—"} unit={snap?.pendingLeaveCount === 1 ? "request" : "requests"} color="#8B7355" href="/staff/leave" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        <Panel title="Latest payslip">
          {snap?.lastPayslip ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#F5F0EB" }}>{fmtGyd(snap.lastPayslip.net_pay)}</div>
              <div style={{ color: "#8B7355", fontSize: 13, marginTop: 4 }}>Net pay · period ending {fmtDate(snap.lastPayslip.period_end)}</div>
              <Link href="/staff/payslips" style={linkStyle}>View all payslips →</Link>
            </>
          ) : (
            <>
              <div style={{ color: "#8B7355", fontSize: 14 }}>No payslips yet. Your first payslip will appear after your first pay run.</div>
            </>
          )}
        </Panel>

        <Panel title="Quick links">
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
            <Link href="/staff/install" style={{ ...qlLink, background: "rgba(31,111,61,0.10)", color: "#1F6F3D", fontWeight: 700 }}>🛠 New install sign-up</Link>
            <Link href="/staff/leave" style={qlLink}>📅 Request leave</Link>
            <Link href="/staff/documents" style={qlLink}>📎 Upload a sick note</Link>
            <Link href="/staff/development" style={qlLink}>
              🎯 My development
              {snap && snap.openGoals > 0 && (
                <span style={{ marginLeft: 8, padding: "1px 8px", background: "rgba(233,180,76,0.14)", color: "#E9B44C", borderRadius: 100, fontSize: 11, fontWeight: 700 }}>{snap.openGoals} open</span>
              )}
            </Link>
            <Link href="/staff/profile" style={qlLink}>👤 Update my profile</Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Card({ label, value, unit, color, href }: { label: string; value: string; unit: string; color: string; href: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{
        background: "#141210",
        border: "1px solid #1e1a17",
        borderRadius: 12,
        padding: 18,
        transition: "border-color 0.15s",
        cursor: "pointer",
      }}>
        <div style={{ fontSize: 11, color: "#8B7355", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 30, fontWeight: 800, color, letterSpacing: "-0.02em" }}>{value}</span>
          <span style={{ fontSize: 13, color: "#8B7355" }}>{unit}</span>
        </div>
      </div>
    </Link>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#141210", border: "1px solid #1e1a17", borderRadius: 12, padding: 22 }}>
      <div style={{ fontSize: 11, color: "#8B7355", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  display: "inline-block",
  marginTop: 14,
  color: "#D4654A",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
};
const qlLink: React.CSSProperties = {
  display: "block",
  padding: "10px 12px",
  background: "#0C0A09",
  border: "1px solid #1e1a17",
  borderRadius: 8,
  color: "#F5F0EB",
  fontSize: 14,
  textDecoration: "none",
  transition: "background 0.15s",
};
