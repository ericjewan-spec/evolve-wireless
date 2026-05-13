"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

type Settings = {
  id: string;
  slack_webhook_url: string | null;
  slack_notifications_enabled: boolean;
  slack_quiet_hours_enabled: boolean;
  slack_quiet_start_hour: number;
  slack_quiet_end_hour: number;
};

type LogRow = {
  id: string;
  event_type: string;
  title: string;
  status: "pending" | "queued" | "sent" | "failed" | "suppressed";
  http_status_code: number | null;
  error_message: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string;
};

const STATUS_COLOR: Record<LogRow["status"], { bg: string; fg: string }> = {
  sent: { bg: "rgba(76,175,80,0.14)", fg: "#4CAF50" },
  queued: { bg: "rgba(233,180,76,0.14)", fg: "#E9B44C" },
  pending: { bg: "rgba(212,101,74,0.14)", fg: "#D4654A" },
  failed: { bg: "rgba(255,107,94,0.14)", fg: "#ff8a7a" },
  suppressed: { bg: "rgba(139,115,85,0.10)", fg: "#8B7355" },
};

const EVENT_LABEL: Record<string, string> = {
  leave_submitted: "Leave submitted",
  leave_idle_reminder: "Idle leave reminder",
  payroll_paid: "Payroll paid",
  new_employee: "New employee",
  warning_issued: "Warning issued",
  onboarding_stuck: "Onboarding stuck",
  test: "Test message",
  leave_idle_reminder_marker: "Idle marker",
  onboarding_stuck_marker: "Stuck marker",
};

export default function SettingsPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [log, setLog] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Editable draft (mirror of settings while editing)
  const [draft, setDraft] = useState<Partial<Settings>>({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [sRes, lRes] = await Promise.all([
      supabase.from("payroll_settings")
        .select("id, slack_webhook_url, slack_notifications_enabled, slack_quiet_hours_enabled, slack_quiet_start_hour, slack_quiet_end_hour")
        .eq("active", true)
        .order("effective_from", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("notification_log")
        .select("id, event_type, title, status, http_status_code, error_message, scheduled_for, sent_at, created_at")
        .not("event_type", "ilike", "%_marker")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
    if (sRes.data) {
      setSettings(sRes.data as Settings);
      setDraft(sRes.data as Settings);
    }
    setLog((lRes.data as LogRow[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function save() {
    if (!settings?.id) return;
    setError(""); setInfo(""); setSaving(true);
    const { error: e } = await supabase
      .from("payroll_settings")
      .update({
        slack_webhook_url: (draft.slack_webhook_url || "").trim() || null,
        slack_notifications_enabled: draft.slack_notifications_enabled || false,
        slack_quiet_hours_enabled: draft.slack_quiet_hours_enabled !== false,
        slack_quiet_start_hour: draft.slack_quiet_start_hour ?? 18,
        slack_quiet_end_hour: draft.slack_quiet_end_hour ?? 7,
      })
      .eq("id", settings.id);
    setSaving(false);
    if (e) { setError(e.message); return; }
    setInfo("Settings saved.");
    fetchAll();
  }

  async function sendTest() {
    setError(""); setInfo(""); setTesting(true);
    const { error: e } = await supabase.rpc("notify_slack_hr", {
      p_event_type: "test",
      p_title: "Test message from Evolve HR system",
      p_blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: "🧪 Slack notifications wired up" },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "If you can see this in *#hr-payroll*, your Slack webhook is connected to the Evolve HR system. Notifications will fire for:\n• New leave requests\n• Payroll runs locked as paid\n• New employees added\n• Warnings issued\n• Daily check for idle leave requests (>24hrs)\n• Weekly check for stuck onboarding checklists",
          },
        },
        {
          type: "context",
          elements: [{ type: "mrkdwn", text: `Sent ${new Date().toLocaleString("en-GY")} from the Settings page.` }],
        },
      ],
    });
    setTesting(false);
    if (e) { setError(`Test failed: ${e.message}`); return; }
    setInfo("Test message dispatched. Check #hr-payroll in Slack — it should arrive within a few seconds (unless we're in quiet hours, in which case it's queued).");
    setTimeout(fetchAll, 1500);
  }

  if (loading) {
    return <div style={{ paddingTop: 80, textAlign: "center", color: "#8B7355" }}>Loading…</div>;
  }

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "32px 24px 80px" }}>
      <Link href="/admin" style={{ color: "#D4654A", fontSize: 13, textDecoration: "none" }}>← Back to dashboard</Link>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: "8px 0 4px 0", color: "#F5F0EB", letterSpacing: "-0.01em" }}>Settings</h1>
      <p style={{ color: "#8B7355", margin: "0 0 28px 0", fontSize: 14 }}>
        Integration settings and the recent notification log.
      </p>

      {error && <Banner kind="error">{error}</Banner>}
      {info && <Banner kind="info">{info}</Banner>}

      {/* Slack panel */}
      <Section title="Slack notifications · #hr-payroll" subtitle="HR/payroll events get posted to the channel. Configure your Incoming Webhook here.">
        <div style={{ background: "#141210", border: "1px solid #1e1a17", borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Master enable */}
            <label style={toggleRow}>
              <div>
                <div style={toggleLabel}>Enable Slack notifications</div>
                <div style={toggleDesc}>
                  When off, events still log but nothing is sent. When on, both real-time triggers and scheduled reminders fire.
                </div>
              </div>
              <Toggle checked={draft.slack_notifications_enabled || false} onChange={(v) => setDraft({ ...draft, slack_notifications_enabled: v })} />
            </label>

            {/* Webhook URL */}
            <div>
              <div style={fieldLabel}>Incoming Webhook URL</div>
              <input
                type="text"
                value={draft.slack_webhook_url || ""}
                onChange={(e) => setDraft({ ...draft, slack_webhook_url: e.target.value })}
                placeholder="https://hooks.slack.com/services/T.../B.../..."
                style={{ ...inputStyle, fontFamily: "ui-monospace, monospace", fontSize: 12 }}
              />
              <div style={fieldHelp}>
                Get this from <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" style={{ color: "#D4654A" }}>api.slack.com/apps</a> → your app → Incoming Webhooks → Add New Webhook to Workspace → choose <strong>#hr-payroll</strong>.
                URL is stored encrypted at rest.
              </div>
            </div>

            {/* Quiet hours */}
            <label style={toggleRow}>
              <div>
                <div style={toggleLabel}>Quiet hours</div>
                <div style={toggleDesc}>
                  When on, notifications fired during quiet hours are queued and delivered the next morning. Bug-out window for the late-night kiosk pings.
                </div>
              </div>
              <Toggle checked={draft.slack_quiet_hours_enabled !== false} onChange={(v) => setDraft({ ...draft, slack_quiet_hours_enabled: v })} />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, opacity: draft.slack_quiet_hours_enabled === false ? 0.5 : 1 }}>
              <div>
                <div style={fieldLabel}>Quiet starts at (Guyana time)</div>
                <select
                  value={draft.slack_quiet_start_hour ?? 18}
                  onChange={(e) => setDraft({ ...draft, slack_quiet_start_hour: Number(e.target.value) })}
                  disabled={draft.slack_quiet_hours_enabled === false}
                  style={inputStyle}
                >
                  {Array.from({ length: 24 }, (_, i) => i).map(h => (
                    <option key={h} value={h}>{h.toString().padStart(2,"0")}:00 ({fmt12(h)})</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={fieldLabel}>Quiet ends at (Guyana time)</div>
                <select
                  value={draft.slack_quiet_end_hour ?? 7}
                  onChange={(e) => setDraft({ ...draft, slack_quiet_end_hour: Number(e.target.value) })}
                  disabled={draft.slack_quiet_hours_enabled === false}
                  style={inputStyle}
                >
                  {Array.from({ length: 24 }, (_, i) => i).map(h => (
                    <option key={h} value={h}>{h.toString().padStart(2,"0")}:00 ({fmt12(h)})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid #1e1a17" }}>
              <button onClick={sendTest} disabled={testing || !settings?.slack_webhook_url || !settings?.slack_notifications_enabled} style={btnSecondary}>
                {testing ? "Sending…" : "Send test message"}
              </button>
              <button onClick={save} disabled={saving} style={btnPrimary}>
                {saving ? "Saving…" : "Save settings"}
              </button>
            </div>

            {(!settings?.slack_webhook_url || !settings?.slack_notifications_enabled) && (
              <div style={{ fontSize: 11, color: "#8B7355", textAlign: "right" }}>
                Save with a URL and Slack enabled before sending a test.
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Notification log */}
      <Section title="Recent notifications" subtitle="Last 30 events. Use this to verify what's been sent and troubleshoot failures.">
        {log.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: "#8B7355", background: "#141210", border: "1px solid #1e1a17", borderRadius: 12 }}>
            No notifications yet. They&apos;ll appear here once you trigger an event (or click <strong style={{ color: "#D4654A" }}>Send test message</strong> above).
          </div>
        ) : (
          <div style={{ background: "#141210", border: "1px solid #1e1a17", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#100E0C" }}>
                  <Th>When</Th>
                  <Th>Event</Th>
                  <Th>Title</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {log.map(r => {
                  const palette = STATUS_COLOR[r.status] || STATUS_COLOR.suppressed;
                  return (
                    <tr key={r.id} style={{ borderTop: "1px solid #1e1a17" }}>
                      <Td><div style={{ color: "#E8DECE", fontSize: 12 }}>{new Date(r.created_at).toLocaleString("en-GY", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}</div></Td>
                      <Td><span style={{ color: "#8B7355", fontSize: 11, fontWeight: 600 }}>{EVENT_LABEL[r.event_type] || r.event_type}</span></Td>
                      <Td><div style={{ color: "#F5F0EB", maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                        {r.scheduled_for && r.status === "queued" && (
                          <div style={{ color: "#8B7355", fontSize: 11, marginTop: 2 }}>delivers {new Date(r.scheduled_for).toLocaleString("en-GY")}</div>
                        )}
                        {r.error_message && (
                          <div style={{ color: "#ff8a7a", fontSize: 11, marginTop: 2 }}>{r.error_message}</div>
                        )}
                      </Td>
                      <Td>
                        <span style={{
                          padding: "2px 9px",
                          borderRadius: 100,
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          background: palette.bg,
                          color: palette.fg,
                          textTransform: "uppercase",
                        }}>{r.status}</span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

function fmt12(h: number) {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#F5F0EB" }}>{title}</h2>
        {subtitle && <div style={{ color: "#8B7355", fontSize: 12, marginTop: 3 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function Banner({ kind, children }: { kind: "error" | "info"; children: React.ReactNode }) {
  const p = kind === "error"
    ? { fg: "#ff8a7a", bg: "rgba(255,107,94,0.08)", border: "rgba(255,107,94,0.18)" }
    : { fg: "#4CAF50", bg: "rgba(76,175,80,0.08)", border: "rgba(76,175,80,0.18)" };
  return <div style={{ padding: "10px 14px", background: p.bg, color: p.fg, borderRadius: 8, border: `1px solid ${p.border}`, marginBottom: 16, fontSize: 13 }}>{children}</div>;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, border: "none", borderRadius: 100, cursor: "pointer",
        background: checked ? "#4CAF50" : "#2a2420",
        position: "relative", transition: "background 0.15s",
      }}
    >
      <div style={{
        position: "absolute",
        top: 2, left: checked ? 22 : 2,
        width: 20, height: 20, borderRadius: "50%",
        background: "#F5F0EB",
        transition: "left 0.15s",
      }} />
    </button>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: "left", padding: "10px 14px", color: "#8B7355", fontWeight: 700, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "10px 14px", color: "#F5F0EB", verticalAlign: "top" }}>{children}</td>;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #2a2420",
  background: "#0C0A09", color: "#F5F0EB", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};
const btnPrimary: React.CSSProperties = {
  padding: "10px 18px", background: "#D4654A", color: "#fff", border: "none",
  borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
};
const btnSecondary: React.CSSProperties = {
  padding: "10px 18px", background: "transparent", color: "#F5F0EB", border: "1px solid #2a2420",
  borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
};
const toggleRow: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  gap: 20, cursor: "pointer",
};
const toggleLabel: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, color: "#F5F0EB",
};
const toggleDesc: React.CSSProperties = {
  fontSize: 12, color: "#8B7355", marginTop: 3, lineHeight: 1.5, maxWidth: 480,
};
const fieldLabel: React.CSSProperties = {
  fontSize: 12, color: "#8B7355", fontWeight: 600, marginBottom: 6,
};
const fieldHelp: React.CSSProperties = {
  fontSize: 11, color: "#8B7355", marginTop: 6, lineHeight: 1.5,
};
