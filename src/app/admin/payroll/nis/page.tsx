"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

type Schedule = {
  id: string;
  period_year: number;
  period_month: number;
  period_label: string;
  status: "generated" | "paid" | "cancelled";
  total_employees: number;
  total_insurable: number;
  total_employee_5_6: number;
  total_employer_8_4: number;
  total_payable: number;
  pdf_path: string | null;
  generated_at: string;
  generated_by: string | null;
  paid_at: string | null;
  paid_by: string | null;
  payment_ref: string | null;
};

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : `GYD ${Math.round(Number(n)).toLocaleString("en-GY")}`;

const fmtDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-GY", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

function statusBadge(status: Schedule["status"]) {
  const palette: Record<
    Schedule["status"],
    { bg: string; fg: string; label: string }
  > = {
    generated: { bg: "rgba(212,101,74,0.14)", fg: "#D4654A", label: "DUE" },
    paid: { bg: "rgba(76,175,80,0.14)", fg: "#4CAF50", label: "PAID" },
    cancelled: { bg: "rgba(139,115,85,0.08)", fg: "#7A7068", label: "CANCELLED" },
  };
  const p = palette[status];
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 100,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        background: p.bg,
        color: p.fg,
      }}
    >
      {p.label}
    </span>
  );
}

function daysUntilDue(sched: Schedule): number {
  const now = new Date();
  const due = new Date(sched.period_year, sched.period_month, 15);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function NisSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const supabase = createClient();

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    const { data, error: e } = await supabase
      .from("nis_schedules")
      .select("*")
      .order("period_year", { ascending: false })
      .order("period_month", { ascending: false })
      .limit(36);
    if (e) setError(e.message);
    setSchedules((data as Schedule[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  async function regenerateCurrent() {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const res = await fetch("/api/v1/nis/generate", { method: "POST" });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Generation failed");
      } else {
        setInfo(
          `Generated NIS schedule for ${j.period} · ${j.employees} employees · ${
            j.missing_nis ? `${j.missing_nis} missing NIS number` : "all NIS numbers present"
          }`,
        );
        await fetchSchedules();
      }
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  async function downloadPdf(s: Schedule) {
    if (!s.pdf_path) return;
    const filename = s.pdf_path.split("/").pop() ?? "";
    const { data, error: e } = await supabase.storage
      .from("nis-schedules")
      .createSignedUrl(filename, 60 * 5);
    if (e || !data?.signedUrl) {
      setError("Could not create download link");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function markPaid(s: Schedule) {
    const ref = prompt(
      `Mark ${s.period_label} NIS as paid?\n\nOptional: NIS receipt number`,
      "",
    );
    if (ref === null) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/nis/${s.id}/paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_ref: ref || null }),
      });
      const j = await res.json();
      if (!res.ok) setError(j.error || "Failed");
      else {
        setInfo(`${s.period_label} marked as paid.`);
        await fetchSchedules();
      }
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  const urgent = schedules.find((s) => s.status === "generated");

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <Link
            href="/admin/payroll"
            style={{ color: "#D4654A", fontSize: 13, textDecoration: "none" }}
          >
            ← Back to payroll
          </Link>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              margin: "6px 0 4px 0",
              letterSpacing: "-0.01em",
              color: "#F5F0EB",
            }}
          >
            NIS schedules
          </h1>
          <p style={{ color: "#8B7355", margin: 0, fontSize: 14 }}>
            Auto-generated on the 10th of every month from the prior month&apos;s locked payroll. Due at NIS Brickdam by the 15th.
          </p>
        </div>
        <button
          onClick={regenerateCurrent}
          disabled={busy}
          style={{
            padding: "11px 22px",
            background: "#D4654A",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontWeight: 700,
            cursor: busy ? "wait" : "pointer",
            fontFamily: "inherit",
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? "Generating…" : "Generate now"}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: 14,
            background: "rgba(255,107,94,0.08)",
            color: "#ff8a7a",
            borderRadius: 8,
            marginBottom: 18,
            fontSize: 13,
            border: "1px solid rgba(255,107,94,0.2)",
          }}
        >
          {error}
        </div>
      )}
      {info && (
        <div
          style={{
            padding: 14,
            background: "rgba(76,175,80,0.08)",
            color: "#4CAF50",
            borderRadius: 8,
            marginBottom: 18,
            fontSize: 13,
            border: "1px solid rgba(76,175,80,0.2)",
          }}
        >
          {info}
        </div>
      )}

      {urgent && (
        <div
          style={{
            padding: 18,
            background:
              "linear-gradient(135deg, rgba(212,101,74,0.08), rgba(233,180,76,0.04))",
            border: "1px solid rgba(212,101,74,0.3)",
            borderRadius: 12,
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                color: "#E9B44C",
                fontWeight: 700,
                letterSpacing: "0.06em",
                marginBottom: 4,
              }}
            >
              📋 NIS DUE
            </div>
            <div style={{ fontSize: 16, color: "#F5F0EB", fontWeight: 600 }}>
              {urgent.period_label} schedule ready —{" "}
              {(() => {
                const d = daysUntilDue(urgent);
                if (d < 0) return <span style={{ color: "#ff8a7a" }}>{Math.abs(d)} days overdue</span>;
                if (d === 0) return <span style={{ color: "#ff8a7a" }}>due today</span>;
                return `due in ${d} days`;
              })()}
            </div>
            <div style={{ color: "#8B7355", fontSize: 12, marginTop: 4 }}>
              {urgent.total_employees} employees · {fmt(urgent.total_payable)} payable
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {urgent.pdf_path && (
              <button onClick={() => downloadPdf(urgent)} style={btnSecondary}>
                Download PDF
              </button>
            )}
            <button onClick={() => markPaid(urgent)} style={btnPrimary}>
              Mark as paid
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ paddingTop: 40, textAlign: "center", color: "#8B7355" }}>
          Loading…
        </div>
      ) : schedules.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "#8B7355",
            background: "#141210",
            border: "1px solid #1e1a17",
            borderRadius: 12,
          }}
        >
          No NIS schedules yet. The first one will auto-generate on the 10th of next month after you lock a payroll run.
          <br />
          <button
            onClick={regenerateCurrent}
            disabled={busy}
            style={{
              marginTop: 18,
              padding: "10px 22px",
              background: "transparent",
              color: "#D4654A",
              border: "1px solid #D4654A",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 13,
              cursor: busy ? "wait" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {busy ? "Generating…" : "Generate now (from latest locked payroll)"}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {schedules.map((s) => (
            <div
              key={s.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto auto auto auto",
                gap: 20,
                alignItems: "center",
                padding: 16,
                background: "#141210",
                border: "1px solid #1e1a17",
                borderRadius: 10,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#F5F0EB" }}>
                  {s.period_label}
                </div>
                <div style={{ color: "#8B7355", fontSize: 12, marginTop: 2 }}>
                  {s.total_employees} employees · generated {fmtDate(s.generated_at)}
                  {s.paid_at && ` · paid ${fmtDate(s.paid_at)}`}
                  {s.payment_ref && ` · ref ${s.payment_ref}`}
                </div>
              </div>
              <div style={{ textAlign: "right", minWidth: 110 }}>
                <div style={{ color: "#8B7355", fontSize: 11, fontWeight: 600 }}>
                  INSURABLE
                </div>
                <div
                  style={{
                    color: "#F5F0EB",
                    fontSize: 13,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {fmt(s.total_insurable)}
                </div>
              </div>
              <div style={{ textAlign: "right", minWidth: 110 }}>
                <div style={{ color: "#8B7355", fontSize: 11, fontWeight: 600 }}>
                  PAYABLE
                </div>
                <div
                  style={{
                    color: "#E9B44C",
                    fontSize: 14,
                    fontWeight: 800,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {fmt(s.total_payable)}
                </div>
              </div>
              <div>{statusBadge(s.status)}</div>
              {s.pdf_path && (
                <button onClick={() => downloadPdf(s)} style={btnIcon} title="Download PDF">
                  ⬇
                </button>
              )}
              {s.status === "generated" && (
                <button onClick={() => markPaid(s)} style={btnIcon} title="Mark as paid">
                  ✓
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 40,
          padding: 20,
          background: "#0F0D0B",
          border: "1px dashed #2a2420",
          borderRadius: 12,
          color: "#8B7355",
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        <div
          style={{ color: "#F5F0EB", fontWeight: 700, marginBottom: 10, fontSize: 14 }}
        >
          How NIS auto-generation works
        </div>
        On the 10th of every month at 8:00 AM (Guyana time), the system pulls the most recently locked
        payroll run that covers the prior month, builds the NIS schedule (employee 5.6% + employer 8.4% =
        14% on insurable earnings, capped at GYD 280,000/month per employee), renders the official PDF,
        and posts a privacy-safe reminder to <strong style={{ color: "#F5F0EB" }}>#hr-payroll</strong>.
        Hourly workers and anyone marked &quot;Exclude from NIS&quot; on their profile are skipped. You can
        regenerate manually any time using the button above.
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: "10px 18px",
  background: "#D4654A",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
};
const btnSecondary: React.CSSProperties = {
  padding: "10px 16px",
  background: "transparent",
  color: "#F5F0EB",
  border: "1px solid #2a2420",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
};
const btnIcon: React.CSSProperties = {
  width: 36,
  height: 36,
  background: "transparent",
  color: "#F5F0EB",
  border: "1px solid #2a2420",
  borderRadius: 8,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 14,
};
