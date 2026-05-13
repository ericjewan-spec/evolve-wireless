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

      const [{ data: attRows }, { data: leaveRows }, { data: payslipRow }] = await Promise.all([
        supabase.from("attendance").select("hours_worked").gte("date", sinceStr),
        supabase.from("leave_requests").select("id").eq("status", "pending"),
        supabase.from("payroll_items")
          .select("net_pay, payroll_runs(period_end)")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const hours = (attRows || []).reduce((sum, a) => sum + (a.hours_worked || 0), 0);

      let lastPayslip: Snapshot["lastPayslip"] = null;
      if (payslipRow) {
        // payroll_runs comes back as an object (single FK)
        const run = (payslipRow as { payroll_runs?: { period_end?: string } }).payroll_runs;
        lastPayslip = {
          period_end: run?.period_end ?? "",
          net_pay: payslipRow.net_pay ?? 0,
        };
      }

      setSnap({
        hoursThisPeriod: Math.round(hours * 10) / 10,
        pendingLeaveCount: (leaveRows || []).length,
        lastPayslip,
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
            <Link href="/staff/leave" style={qlLink}>📅 Request leave</Link>
            <Link href="/staff/documents" style={qlLink}>📎 Upload a sick note</Link>
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
