"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/AdminGate";
import { createClient } from "@/lib/supabase-browser";

type Headcount = {
  active_count: number;
  inactive_count: number;
  starting_soon_count: number;
  new_hires_90d: number;
  active_departments: number;
  hourly_active: number;
  salary_active: number;
};

type TrendRow = {
  year: number;
  month: number;
  label: string;
  employees_paid: number;
  total_gross: number;
  total_nis_employee: number;
  total_nis_employer: number;
  total_paye: number;
  total_net: number;
};

type LateRow = {
  employee_id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string | null;
  late_count: number;
  total_minutes_late: number;
  days_recorded: number;
};

type UpcomingLeave = {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  role: string;
  leave_type: "vacation" | "sick" | "unpaid" | "bereavement" | "other";
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string | null;
};

type OnboardingRow = {
  employee_id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string | null;
  start_date: string;
  total_items: number;
  items_done: number;
  items_pending_required: number;
  percent_complete: number;
  state: "not_initialised" | "in_progress" | "complete";
};

type GoalRow = {
  id: string;
  employee_id: string;
  title: string;
  event_date: string;
  status: "open" | "in_progress" | "complete" | "cancelled";
  employees: { first_name: string; last_name: string } | null;
};

type WarningRow = {
  id: string;
  employee_id: string;
  title: string;
  event_date: string;
  employees: { first_name: string; last_name: string } | null;
};

const fmtGyd = (n: number | null | undefined) =>
  n == null ? "—" : `GYD ${Math.round(Number(n)).toLocaleString("en-GY")}`;

const fmtDate = (d: string | null) =>
  d ? new Date(d + "T12:00:00").toLocaleDateString("en-GY", { day: "numeric", month: "short" }) : "—";

const daysFromNow = (d: string) => {
  const dt = new Date(d + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((dt.getTime() - today.getTime()) / 86400000);
};

function DashboardContent() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [headcount, setHeadcount] = useState<Headcount | null>(null);
  const [trend, setTrend] = useState<TrendRow[]>([]);
  const [lateRows, setLateRows] = useState<LateRow[]>([]);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [upcomingLeave, setUpcomingLeave] = useState<UpcomingLeave[]>([]);
  const [onboarding, setOnboarding] = useState<OnboardingRow[]>([]);
  const [openGoals, setOpenGoals] = useState<GoalRow[]>([]);
  const [recentWarnings, setRecentWarnings] = useState<WarningRow[]>([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState<{ id: string; date: string; name: string }[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyStr = ninetyDaysAgo.toISOString().slice(0, 10);

    const [
      hcRes, trendRes, lateRes, pendingLvRes, upcomingLvRes, onbRes, goalsRes, warningsRes, holRes,
    ] = await Promise.all([
      supabase.from("headcount_snapshot").select("*").maybeSingle(),
      supabase.from("payroll_monthly_trend").select("*").limit(12),
      supabase.from("late_arrivals_this_month").select("*").limit(5),
      supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("upcoming_approved_leave").select("*").limit(8),
      supabase.from("onboarding_pipeline").select("*").neq("state", "complete").order("percent_complete", { ascending: true }).limit(6),
      supabase
        .from("employee_events")
        .select("id, employee_id, title, event_date, status, employees(first_name, last_name)")
        .eq("category", "goal")
        .in("status", ["open", "in_progress"])
        .order("event_date", { ascending: false })
        .limit(6),
      supabase
        .from("employee_events")
        .select("id, employee_id, title, event_date, employees(first_name, last_name)")
        .eq("category", "warning")
        .gte("event_date", ninetyStr)
        .order("event_date", { ascending: false })
        .limit(5),
      supabase.from("public_holidays").select("id, date, name").gte("date", today).order("date", { ascending: true }).limit(3),
    ]);

    setHeadcount(hcRes.data as Headcount | null);
    setTrend((trendRes.data as TrendRow[]) || []);
    setLateRows((lateRes.data as LateRow[]) || []);
    setPendingLeaveCount(pendingLvRes.count || 0);
    setUpcomingLeave((upcomingLvRes.data as UpcomingLeave[]) || []);
    setOnboarding((onbRes.data as OnboardingRow[]) || []);
    setOpenGoals((goalsRes.data as unknown as GoalRow[]) || []);
    setRecentWarnings((warningsRes.data as unknown as WarningRow[]) || []);
    setUpcomingHolidays((holRes.data as { id: string; date: string; name: string }[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return <div style={{ paddingTop: 80, textAlign: "center", color: "#8B7355" }}>Loading dashboard…</div>;
  }

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 80px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "#F5F0EB", letterSpacing: "-0.01em" }}>Dashboard</h1>
        <p style={{ color: "#8B7355", margin: "4px 0 0 0", fontSize: 14 }}>
          A quick look at the company right now. Updated live.
        </p>
      </div>

      {/* Top stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 22 }}>
        <StatCard
          label="Active employees"
          value={String(headcount?.active_count ?? 0)}
          sub={headcount?.starting_soon_count
            ? `+${headcount.starting_soon_count} starting soon`
            : `${headcount?.active_departments ?? 0} departments`}
          href="/admin/payroll"
        />
        <StatCard
          label="New hires · 90d"
          value={String(headcount?.new_hires_90d ?? 0)}
          sub={`${headcount?.hourly_active ?? 0} hourly · ${headcount?.salary_active ?? 0} salaried`}
        />
        <StatCard
          label="Pending leave"
          value={String(pendingLeaveCount)}
          sub={pendingLeaveCount > 0 ? "needs your decision" : "all clear"}
          href="/admin/leave"
          tone={pendingLeaveCount > 0 ? "warn" : undefined}
        />
        <StatCard
          label="Onboarding in progress"
          value={String(onboarding.length)}
          sub={onboarding.length > 0 ? "click for details" : "everyone caught up"}
          href="/admin/payroll"
          tone={onboarding.some(o => o.items_pending_required > 0) ? "warn" : undefined}
        />
      </div>

      {/* Two-column main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)", gap: 16, alignItems: "start" }}>
        {/* LEFT column: payroll trend, attendance, onboarding pipeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Payroll trend */}
          <Panel
            title="Payroll trend"
            sub="Last 12 paid runs. NIS and PAYE shown alongside net."
            cta={{ href: "/admin/reports", label: "View full report →" }}
          >
            {trend.length === 0 ? (
              <EmptyState>
                No paid payroll runs yet. Once you run payroll and lock it, monthly totals appear here.
              </EmptyState>
            ) : (
              <PayrollTrendChart rows={[...trend].reverse()} />
            )}
          </Panel>

          {/* Onboarding pipeline */}
          <Panel
            title="Onboarding pipeline"
            sub={onboarding.length === 0 ? "All active staff are fully onboarded." : `${onboarding.length} active hire${onboarding.length === 1 ? "" : "s"} still in progress.`}
            cta={{ href: "/admin/onboarding", label: "Edit template →" }}
          >
            {onboarding.length === 0 ? (
              <EmptyState>
                Every active employee has a complete onboarding checklist. Nice.
              </EmptyState>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {onboarding.map(o => (
                  <Link
                    key={o.employee_id}
                    href={`/admin/payroll/employees/${o.employee_id}?tab=onboarding`}
                    style={{ textDecoration: "none" }}
                  >
                    <div style={onboardingRowStyle}>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#F5F0EB" }}>
                          {o.first_name} {o.last_name}
                        </div>
                        <div style={{ color: "#8B7355", fontSize: 11, marginTop: 1 }}>
                          {o.role}{o.department ? ` · ${o.department}` : ""}
                          {o.state === "not_initialised" && (
                            <span style={{ marginLeft: 8, color: "#ff8a7a" }}>· not initialised</span>
                          )}
                        </div>
                      </div>
                      <div style={{ minWidth: 100, textAlign: "right" }}>
                        <div style={{ color: o.items_pending_required > 0 ? "#ff8a7a" : "#8B7355", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                          {o.items_pending_required > 0 ? `${o.items_pending_required} required pending` : `${o.items_done} of ${o.total_items} done`}
                        </div>
                        <div style={{ height: 4, width: 100, marginLeft: "auto", background: "#0C0A09", borderRadius: 100, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${o.percent_complete}%`, background: o.percent_complete === 100 ? "#4CAF50" : "#D4654A" }} />
                        </div>
                      </div>
                      <div style={{ minWidth: 36, color: "#F5F0EB", fontWeight: 800, fontSize: 14, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {o.percent_complete}%
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          {/* Late arrivals + Goals side-by-side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Panel title="Late arrivals · this month" sub="5-minute grace, by schedule">
              {lateRows.length === 0 ? (
                <EmptyState compact>No late arrivals so far this month.</EmptyState>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {lateRows.map(r => (
                    <Link
                      key={r.employee_id}
                      href={`/admin/payroll/employees/${r.employee_id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <div style={lateRowStyle}>
                        <div style={{ flex: 1, minWidth: 100 }}>
                          <div style={{ fontWeight: 700, fontSize: 12, color: "#F5F0EB" }}>{r.first_name} {r.last_name}</div>
                          <div style={{ color: "#8B7355", fontSize: 10, marginTop: 1 }}>{r.role}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: "#ff8a7a", fontWeight: 700, fontSize: 13 }}>
                            {r.late_count}×
                          </div>
                          <div style={{ color: "#8B7355", fontSize: 10 }}>
                            {Math.round(r.total_minutes_late)} min total
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Open goals" sub="Across the company">
              {openGoals.length === 0 ? (
                <EmptyState compact>No open goals right now.</EmptyState>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {openGoals.map(g => (
                    <Link
                      key={g.id}
                      href={`/admin/payroll/employees/${g.employee_id}?tab=performance`}
                      style={{ textDecoration: "none" }}
                    >
                      <div style={goalRowStyle}>
                        <div style={{ flex: 1, minWidth: 100 }}>
                          <div style={{ fontWeight: 700, fontSize: 12, color: "#F5F0EB" }}>{g.title}</div>
                          <div style={{ color: "#8B7355", fontSize: 10, marginTop: 1 }}>
                            {g.employees?.first_name} {g.employees?.last_name} · {fmtDate(g.event_date)}
                          </div>
                        </div>
                        <span style={{
                          padding: "1px 7px",
                          borderRadius: 100,
                          fontSize: 8,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          background: g.status === "in_progress" ? "rgba(212,101,74,0.14)" : "rgba(233,180,76,0.14)",
                          color: g.status === "in_progress" ? "#D4654A" : "#E9B44C",
                          whiteSpace: "nowrap",
                        }}>
                          {g.status === "in_progress" ? "IN PROGRESS" : "OPEN"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </div>

        {/* RIGHT column: upcoming leave, holidays, warnings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Upcoming approved leave" sub="Next 30 days">
            {upcomingLeave.length === 0 ? (
              <EmptyState compact>No approved leave coming up.</EmptyState>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {upcomingLeave.map(l => {
                  const days = daysFromNow(l.start_date);
                  return (
                    <Link key={l.id} href={`/admin/payroll/employees/${l.employee_id}?tab=portal`} style={{ textDecoration: "none" }}>
                      <div style={upcomingLeaveRowStyle}>
                        <div style={{ flex: 1, minWidth: 100 }}>
                          <div style={{ fontWeight: 700, fontSize: 12, color: "#F5F0EB" }}>
                            {l.first_name} {l.last_name}
                          </div>
                          <div style={{ color: "#8B7355", fontSize: 10, marginTop: 1, textTransform: "capitalize" }}>
                            {l.leave_type} · {l.days_count} day{l.days_count === 1 ? "" : "s"}
                          </div>
                          <div style={{ color: "#E8DECE", fontSize: 10, marginTop: 1 }}>
                            {fmtDate(l.start_date)} → {fmtDate(l.end_date)}
                          </div>
                        </div>
                        <span style={{
                          padding: "1px 7px",
                          borderRadius: 100,
                          fontSize: 8,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          background: days <= 7 ? "rgba(212,101,74,0.14)" : "rgba(139,115,85,0.12)",
                          color: days <= 7 ? "#D4654A" : "#8B7355",
                          whiteSpace: "nowrap",
                        }}>
                          {days === 0 ? "TODAY" : days === 1 ? "TOMORROW" : `IN ${days}D`}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel title="Upcoming holidays" cta={{ href: "/admin/holidays", label: "View all →" }}>
            {upcomingHolidays.length === 0 ? (
              <EmptyState compact>No holidays scheduled in the near future.</EmptyState>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {upcomingHolidays.map(h => {
                  const days = daysFromNow(h.date);
                  return (
                    <div key={h.id} style={holidayRowStyle}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: "#F5F0EB" }}>{h.name}</div>
                        <div style={{ color: "#8B7355", fontSize: 10, marginTop: 1 }}>
                          {new Date(h.date + "T12:00:00").toLocaleDateString("en-GY", { weekday: "short", day: "numeric", month: "short" })}
                        </div>
                      </div>
                      <span style={{ color: days <= 14 ? "#E9B44C" : "#8B7355", fontSize: 10, fontWeight: 700 }}>
                        {days === 0 ? "TODAY" : days === 1 ? "TOMORROW" : `IN ${days}D`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          {recentWarnings.length > 0 && (
            <Panel title="Recent warnings · last 90 days" sub="HR-only. Bodies in the employee's Performance tab." dim>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {recentWarnings.map(w => (
                  <Link key={w.id} href={`/admin/payroll/employees/${w.employee_id}?tab=performance`} style={{ textDecoration: "none" }}>
                    <div style={warningRowStyle}>
                      <div style={{ flex: 1, minWidth: 100 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: "#F5F0EB" }}>{w.title}</div>
                        <div style={{ color: "#8B7355", fontSize: 10, marginTop: 1 }}>
                          {w.employees?.first_name} {w.employees?.last_name} · {fmtDate(w.event_date)}
                        </div>
                      </div>
                      <span style={{
                        padding: "1px 7px", borderRadius: 100, fontSize: 8, fontWeight: 700,
                        letterSpacing: "0.06em", background: "rgba(255,107,94,0.12)", color: "#ff8a7a", whiteSpace: "nowrap",
                      }}>WARNING</span>
                    </div>
                  </Link>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminGate>
      <DashboardContent />
    </AdminGate>
  );
}

/* ============================================================
   Inline payroll-trend chart — SVG bars, no chart library
============================================================ */
function PayrollTrendChart({ rows }: { rows: TrendRow[] }) {
  if (rows.length === 0) return null;

  const maxNet = Math.max(...rows.map(r => Number(r.total_net)), 1);
  const W = 800;
  const H = 220;
  const padLeft = 60;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 36;
  const innerW = W - padLeft - padRight;
  const innerH = H - padTop - padBottom;
  const barGap = 6;
  const barW = (innerW - barGap * (rows.length - 1)) / rows.length;

  // Y-axis gridlines at 0%, 50%, 100%
  const gridY = [0, 0.5, 1];

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", minWidth: 500 }}>
        {/* Gridlines */}
        {gridY.map(g => {
          const y = padTop + (1 - g) * innerH;
          return (
            <g key={g}>
              <line x1={padLeft} y1={y} x2={W - padRight} y2={y} stroke="#1e1a17" strokeWidth="0.5" />
              <text x={padLeft - 8} y={y + 3} textAnchor="end" fill="#7A7068" fontSize="9" fontFamily="ui-monospace, monospace">
                {g === 0 ? "0" : `${Math.round((maxNet * g) / 1000).toLocaleString("en-GY")}k`}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {rows.map((r, i) => {
          const x = padLeft + i * (barW + barGap);
          const netH = (Number(r.total_net) / maxNet) * innerH;
          const grossH = (Number(r.total_gross) / maxNet) * innerH;
          return (
            <g key={`${r.year}-${r.month}`}>
              {/* Gross (ghost background) */}
              <rect
                x={x}
                y={padTop + innerH - grossH}
                width={barW}
                height={grossH}
                fill="#1e1a17"
                rx="2"
              />
              {/* Net (foreground) */}
              <rect
                x={x}
                y={padTop + innerH - netH}
                width={barW}
                height={netH}
                fill="#D4654A"
                rx="2"
              >
                <title>{r.label}{"\n"}Gross: GYD {Math.round(Number(r.total_gross)).toLocaleString("en-GY")}{"\n"}Net: GYD {Math.round(Number(r.total_net)).toLocaleString("en-GY")}</title>
              </rect>
              {/* Month label */}
              <text
                x={x + barW / 2}
                y={H - 18}
                textAnchor="middle"
                fill="#8B7355"
                fontSize="9"
                fontWeight="600"
              >
                {r.label.split(" ")[0]}
              </text>
              <text
                x={x + barW / 2}
                y={H - 6}
                textAnchor="middle"
                fill="#5a504a"
                fontSize="8"
              >
                {r.label.split(" ")[1]}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${padLeft}, ${padTop - 4})`}>
          <rect width="10" height="10" y="-7" fill="#1e1a17" rx="2" />
          <text x="16" y="2" fill="#8B7355" fontSize="10">Gross</text>
          <rect width="10" height="10" x="64" y="-7" fill="#D4654A" rx="2" />
          <text x="80" y="2" fill="#8B7355" fontSize="10">Net</text>
        </g>
      </svg>
    </div>
  );
}

/* ============================================================
   Small components
============================================================ */
function StatCard({ label, value, sub, href, tone }: { label: string; value: string; sub: string; href?: string; tone?: "warn" }) {
  const content = (
    <div style={{
      padding: "16px 18px",
      background: "#141210",
      border: "1px solid #1e1a17",
      borderRadius: 12,
      transition: "border-color 0.15s",
      cursor: href ? "pointer" : "default",
    }}>
      <div style={{ color: "#8B7355", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6, color: tone === "warn" ? "#E9B44C" : "#F5F0EB", letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ color: tone === "warn" ? "#E9B44C" : "#8B7355", fontSize: 11, marginTop: 3, fontWeight: 600 }}>{sub}</div>
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: "none" }}>{content}</Link> : content;
}

function Panel({ title, sub, children, cta, dim }: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  cta?: { href: string; label: string };
  dim?: boolean;
}) {
  return (
    <div style={{
      background: "#141210",
      border: "1px solid #1e1a17",
      borderRadius: 12,
      padding: 20,
      opacity: dim ? 0.85 : 1,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#F5F0EB", margin: 0, letterSpacing: "0.02em" }}>{title}</h3>
          {sub && <div style={{ color: "#8B7355", fontSize: 11, marginTop: 2 }}>{sub}</div>}
        </div>
        {cta && (
          <Link href={cta.href} style={{ color: "#D4654A", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
            {cta.label}
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div style={{
      padding: compact ? "16px 12px" : "28px 16px",
      textAlign: "center",
      color: "#8B7355",
      fontSize: 12,
      background: "#0C0A09",
      borderRadius: 8,
      border: "1px dashed #1e1a17",
    }}>{children}</div>
  );
}

/* row styles */
const onboardingRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto 50px",
  gap: 12,
  alignItems: "center",
  padding: "10px 12px",
  background: "#100E0C",
  border: "1px solid #1a1513",
  borderRadius: 8,
  transition: "border-color 0.15s",
};

const lateRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "8px 10px",
  background: "#100E0C",
  border: "1px solid #1a1513",
  borderRadius: 6,
};

const goalRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "8px 10px",
  background: "#100E0C",
  border: "1px solid #1a1513",
  borderRadius: 6,
};

const upcomingLeaveRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "10px 12px",
  background: "#100E0C",
  border: "1px solid #1a1513",
  borderRadius: 8,
};

const holidayRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "8px 10px",
  background: "#100E0C",
  border: "1px solid #1a1513",
  borderRadius: 6,
};

const warningRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "8px 10px",
  background: "#100E0C",
  border: "1px solid rgba(255,107,94,0.12)",
  borderRadius: 6,
};
