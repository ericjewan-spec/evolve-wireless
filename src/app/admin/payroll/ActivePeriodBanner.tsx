// =============================================================================
// ActivePeriodBanner.tsx
// Place at: src/app/admin/payroll/ActivePeriodBanner.tsx
// =============================================================================
// Shows the currently-active payroll period at the top of the payroll page.
// Fetches the most recent draft payroll_run and bubbles its dates up to the
// parent so the rest of the page filters to the same window automatically.
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

type Run = {
  id: string;
  period_start: string;
  period_end: string;
  period_label: string | null;
  pay_date: string | null;
  pay_cycle: string;
  status: "draft" | "calculated" | "paid" | "cancelled";
};

const supabase = createClient();

// Parse YYYY-MM-DD as a LOCAL date so Guyana users don't see a one-day shift.
function parseLocalDate(s: string | null): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(s);
}

function fmtDate(s: string | null): string {
  const d = parseLocalDate(s);
  if (!d) return "â";
  return d.toLocaleDateString("en-GY", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

const STATUS_STYLES: Record<Run["status"], { bg: string; fg: string; label: string }> = {
  draft: { bg: "rgba(139,115,85,0.14)", fg: "#B89970", label: "DRAFT" },
  calculated: { bg: "rgba(212,101,74,0.16)", fg: "#D4654A", label: "READY TO PAY" },
  paid: { bg: "rgba(76,175,80,0.16)", fg: "#4CAF50", label: "PAID" },
  cancelled: { bg: "rgba(139,115,85,0.08)", fg: "#7A7068", label: "CANCELLED" },
};

export default function ActivePeriodBanner({
  onPeriodChange,
}: {
  onPeriodChange?: (period: { period_start: string; period_end: string; pay_date: string | null }) => void;
}) {
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffCount, setStaffCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      // Most recent open (draft/calculated) run â that's the "active" period
      supabase
        .from("payroll_runs")
        .select("id, period_start, period_end, period_label, pay_date, pay_cycle, status")
        .in("status", ["draft", "calculated"])
        .order("period_end", { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Active staff count for context
      supabase
        .from("employees")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
    ]).then(([runRes, empRes]) => {
      if (cancelled) return;
      const r = (runRes.data as Run | null) || null;
      setRun(r);
      setStaffCount(empRes.count ?? null);
      setLoading(false);
      if (r && onPeriodChange) {
        onPeriodChange({
          period_start: r.period_start,
          period_end: r.period_end,
          pay_date: r.pay_date,
        });
      }
    });

    return () => {
      cancelled = true;
    };
    // onPeriodChange intentionally not in deps â we only want to fire on initial fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- Loading skeleton -----
  if (loading) {
    return (
      <div
        style={{
          marginBottom: 20,
          padding: "16px 20px",
          borderRadius: 12,
          background: "linear-gradient(90deg, #141210 0%, #1a1613 50%, #141210 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s ease-in-out infinite",
          border: "1px solid #1e1a17",
          minHeight: 64,
        }}
      >
        <style>{`@keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }`}</style>
      </div>
    );
  }

  // ----- No active period â CTA to create one -----
  if (!run) {
    return (
      <div
        style={{
          marginBottom: 20,
          padding: "18px 20px",
          borderRadius: 12,
          background: "#141210",
          border: "1px dashed #3a3026",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Bricolage Grotesque', serif",
              fontWeight: 700,
              color: "#F5F0EB",
              fontSize: "1rem",
              marginBottom: 2,
            }}
          >
            No active pay period
          </div>
          <div style={{ color: "#7A7068", fontSize: 12 }}>
            Create a new fortnightly or monthly pay period to start tracking payroll.
          </div>
        </div>
        <Link
          href="/admin/payroll/runs"
          style={{
            padding: "9px 18px",
            borderRadius: 8,
            background: "#D4654A",
            color: "#fff",
            fontSize: "0.85rem",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Start a pay period â
        </Link>
      </div>
    );
  }

  // ----- Active period -----
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = parseLocalDate(run.period_start);
  const end = parseLocalDate(run.period_end);
  const payDay = parseLocalDate(run.pay_date);
  const totalDays = start && end ? daysBetween(start, end) + 1 : 0;
  const elapsedDays = start ? Math.max(0, Math.min(totalDays, daysBetween(start, today) + 1)) : 0;
  const pct = totalDays > 0 ? Math.min(100, Math.round((elapsedDays / totalDays) * 100)) : 0;
  const daysUntilPay = payDay ? daysBetween(today, payDay) : null;
  const status = STATUS_STYLES[run.status];

  const periodLabel = run.period_label
    || `${fmtDate(run.period_start)} â ${fmtDate(run.period_end)}`;

  let payDayText: string;
  if (daysUntilPay === null) {
    payDayText = "Pay date not set";
  } else if (daysUntilPay > 1) {
    payDayText = `Pay day in ${daysUntilPay} days Â· ${fmtDate(run.pay_date)}`;
  } else if (daysUntilPay === 1) {
    payDayText = `Pay day tomorrow Â· ${fmtDate(run.pay_date)}`;
  } else if (daysUntilPay === 0) {
    payDayText = `Pay day TODAY Â· ${fmtDate(run.pay_date)}`;
  } else {
    payDayText = `Pay day was ${-daysUntilPay} day${-daysUntilPay === 1 ? "" : "s"} ago Â· ${fmtDate(run.pay_date)}`;
  }

  return (
    <div
      style={{
        marginBottom: 20,
        padding: "16px 20px",
        borderRadius: 12,
        background: "#141210",
        border: "1px solid #1e1a17",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Progress bar (very subtle, runs along the top edge) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 2,
          width: `${pct}%`,
          background: run.status === "paid" ? "#4CAF50" : "#E9B44C",
          transition: "width 0.4s ease",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Left: pay period info */}
        <div style={{ minWidth: 0, flex: "1 1 280px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: "#7A7068",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 600,
              }}
            >
              Active Pay Period
            </span>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 100,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.06em",
                background: status.bg,
                color: status.fg,
              }}
            >
              {status.label}
            </span>
            <span
              style={{
                fontSize: 10,
                color: "#7A7068",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {run.pay_cycle}
            </span>
          </div>
          <div
            style={{
              fontFamily: "'Bricolage Grotesque', serif",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#F5F0EB",
              marginBottom: 4,
            }}
          >
            {periodLabel}
          </div>
          <div style={{ color: "#8B7355", fontSize: 12 }}>
            {payDayText}
            {staffCount !== null && (
              <>
                {" Â· "}
                {staffCount} staff
              </>
            )}
          </div>
        </div>

        {/* Right: action */}
        <Link
          href={`/admin/payroll/runs/${run.id}`}
          style={{
            padding: "9px 18px",
            borderRadius: 8,
            background: run.status === "draft" ? "#1a1513" : "#D4654A",
            color: run.status === "draft" ? "#E9B44C" : "#fff",
            fontSize: "0.82rem",
            fontWeight: 700,
            textDecoration: "none",
            whiteSpace: "nowrap",
            border: run.status === "draft" ? "1px solid #2a2420" : "none",
          }}
        >
          {run.status === "draft" ? "Open & calculate â" : "Process payroll â"}
        </Link>
      </div>
    </div>
  );
}
