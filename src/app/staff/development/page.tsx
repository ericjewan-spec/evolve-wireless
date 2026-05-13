"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useCurrentEmployee } from "@/lib/staff-auth";

type Event = {
  id: string;
  category: "review" | "goal" | "kudos" | "training" | "certification";
  title: string;
  body: string | null;
  event_date: string;
  status: "open" | "in_progress" | "complete" | "cancelled";
  rating: number | null;
  attachment_path: string | null;
  attachment_filename: string | null;
};

const CAT_LABEL: Record<Event["category"], string> = {
  review: "Performance review",
  goal: "Goal",
  kudos: "Kudos",
  training: "Training",
  certification: "Certification",
};

const CAT_COLOR: Record<Event["category"], string> = {
  review: "#9c7bd4",
  goal: "#E9B44C",
  kudos: "#4CAF50",
  training: "#D4654A",
  certification: "#4CAF50",
};

type Filter = "all" | "goals" | "achievements" | "reviews";

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-GY", { day: "numeric", month: "short", year: "numeric" });

export default function StaffDevelopmentPage() {
  const { employee, loading: empLoading } = useCurrentEmployee();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const fetchEvents = useCallback(async () => {
    if (!employee) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("employee_events")
      .select("id, category, title, body, event_date, status, rating, attachment_path, attachment_filename")
      .order("event_date", { ascending: false });
    setEvents((data as Event[]) || []);
    setLoading(false);
  }, [employee]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  async function downloadAttachment(ev: Event) {
    if (!ev.attachment_path) return;
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("performance-attachments")
      .createSignedUrl(ev.attachment_path, 60);
    if (error || !data?.signedUrl) {
      alert("Could not get download link: " + (error?.message || "unknown error"));
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  const filtered =
    filter === "all" ? events
    : filter === "goals" ? events.filter(e => e.category === "goal")
    : filter === "achievements" ? events.filter(e => e.category === "kudos" || e.category === "training" || e.category === "certification")
    : events.filter(e => e.category === "review");

  const openGoals = events.filter(e => e.category === "goal" && (e.status === "open" || e.status === "in_progress")).length;
  const completedGoals = events.filter(e => e.category === "goal" && e.status === "complete").length;
  const trainings = events.filter(e => e.category === "training" || e.category === "certification").length;
  const reviews = events.filter(e => e.category === "review").length;

  if (empLoading) return null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "#F5F0EB", letterSpacing: "-0.01em" }}>Development</h1>
      <p style={{ color: "#8B7355", margin: "4px 0 24px 0", fontSize: 14 }}>
        Your goals, training, certifications, and reviews that HR has shared with you.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        <Stat label="Open goals" value={openGoals} tone={openGoals > 0 ? "warn" : "neutral"} />
        <Stat label="Completed goals" value={completedGoals} tone="good" />
        <Stat label="Training/Certs" value={trainings} />
        <Stat label="Reviews" value={reviews} />
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        <FilterPill label="All" active={filter === "all"} onClick={() => setFilter("all")} />
        <FilterPill label="Goals" active={filter === "goals"} onClick={() => setFilter("goals")} />
        <FilterPill label="Training & Kudos" active={filter === "achievements"} onClick={() => setFilter("achievements")} />
        <FilterPill label="Reviews" active={filter === "reviews"} onClick={() => setFilter("reviews")} />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#8B7355", padding: 30 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 30, textAlign: "center", color: "#8B7355", background: "#141210", border: "1px solid #1e1a17", borderRadius: 12 }}>
          {events.length === 0
            ? "Nothing here yet. As HR shares goals, training records, or feedback with you, they'll appear here."
            : `No items in "${filter}".`}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(ev => (
            <div
              key={ev.id}
              style={{
                padding: 16,
                background: "#141210",
                border: "1px solid #1e1a17",
                borderLeftWidth: 3,
                borderLeftColor: CAT_COLOR[ev.category],
                borderRadius: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                <span style={{
                  padding: "2px 9px",
                  borderRadius: 100,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  background: `${CAT_COLOR[ev.category]}1a`,
                  color: CAT_COLOR[ev.category],
                  textTransform: "uppercase",
                }}>{CAT_LABEL[ev.category]}</span>
                <span style={{ color: "#8B7355", fontSize: 12 }}>{fmtDate(ev.event_date)}</span>
                {ev.category === "goal" && (
                  <GoalStatusBadge status={ev.status} />
                )}
                {ev.rating && (
                  <span style={{ color: "#E9B44C", fontSize: 12, fontWeight: 700 }}>★ {ev.rating}/5</span>
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#F5F0EB", marginBottom: ev.body ? 8 : 0 }}>{ev.title}</div>
              {ev.body && (
                <div style={{ color: "#E8DECE", fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{ev.body}</div>
              )}
              {ev.attachment_path && (
                <button
                  onClick={() => downloadAttachment(ev)}
                  style={{
                    marginTop: 10, padding: "6px 12px",
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
                  ↓ {ev.attachment_filename || "Attachment"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "good" | "warn" | "neutral" }) {
  const color = tone === "good" ? "#4CAF50" : tone === "warn" ? "#E9B44C" : "#F5F0EB";
  return (
    <div style={{ padding: "14px 16px", background: "#141210", border: "1px solid #1e1a17", borderRadius: 10 }}>
      <div style={{ color: "#8B7355", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ color, fontSize: 22, fontWeight: 800, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 14px",
      borderRadius: 100,
      border: `1px solid ${active ? "#D4654A" : "#2a2420"}`,
      background: active ? "rgba(212,101,74,0.12)" : "transparent",
      color: active ? "#D4654A" : "#8B7355",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
    }}>{label}</button>
  );
}

function GoalStatusBadge({ status }: { status: Event["status"] }) {
  const palette: Record<Event["status"], { bg: string; fg: string; label: string }> = {
    open: { bg: "rgba(233,180,76,0.12)", fg: "#E9B44C", label: "OPEN" },
    in_progress: { bg: "rgba(212,101,74,0.12)", fg: "#D4654A", label: "IN PROGRESS" },
    complete: { bg: "rgba(76,175,80,0.12)", fg: "#4CAF50", label: "COMPLETE" },
    cancelled: { bg: "rgba(139,115,85,0.08)", fg: "#7A7068", label: "CANCELLED" },
  };
  const p = palette[status];
  return (
    <span style={{
      padding: "2px 8px",
      borderRadius: 100,
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: "0.06em",
      background: p.bg,
      color: p.fg,
    }}>{p.label}</span>
  );
}
