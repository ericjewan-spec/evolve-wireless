"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";

interface Ticket {
  id: string;
  ticket_number: string;
  type: string;
  priority: string;
  status: string;
  description: string;
  created_at: string;
  resolved_at: string | null;
}

const TICKET_TYPES = [
  { value: "no_connection", label: "No Connection" },
  { value: "slow_speed", label: "Slow Speed" },
  { value: "intermittent", label: "Intermittent Connection" },
  { value: "billing", label: "Billing Question" },
  { value: "equipment", label: "Equipment Issue" },
  { value: "upgrade", label: "Plan Upgrade" },
  { value: "other", label: "Other" },
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formType, setFormType] = useState("no_connection");
  const [formDesc, setFormDesc] = useState("");
  const [success, setSuccess] = useState("");

  const supabase = createClient();

  async function loadTickets() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }

    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    setTickets(data || []);
    setLoading(false);
  }

  useEffect(() => { loadTickets(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Generate ticket number
    const ticketNum = "TKT-" + Math.floor(1000 + Math.random() * 9000);

    const { error } = await supabase.from("support_tickets").insert({
      ticket_number: ticketNum,
      customer_id: user.id,
      type: formType,
      priority: "medium",
      status: "open",
      description: formDesc,
    });

    if (error) {
      alert("Failed to create ticket: " + error.message);
    } else {
      setSuccess(`Ticket ${ticketNum} created! We'll respond within 1 hour.`);
      setShowForm(false);
      setFormDesc("");
      await loadTickets();
    }
    setSubmitting(false);
  }

  const statusColor: Record<string, { bg: string; text: string }> = {
    open: { bg: "rgba(212,101,74,0.1)", text: "#D4654A" },
    in_progress: { bg: "rgba(42,157,143,0.1)", text: "#2A9D8F" },
    waiting_customer: { bg: "rgba(233,180,76,0.1)", text: "#E9B44C" },
    resolved: { bg: "rgba(76,175,80,0.1)", text: "#4CAF50" },
    closed: { bg: "rgba(139,115,85,0.1)", text: "#8B7355" },
  };

  const typeLabel: Record<string, string> = Object.fromEntries(TICKET_TYPES.map((t) => [t.value, t.label]));

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>
      <nav className="px-6 py-4 flex items-center justify-between" style={{ background: "white", borderBottom: "1px solid rgba(44,24,16,0.06)" }}>
        <Link href="/portal"><img src="/logo.svg" alt="Evolve Wireless" className="h-9" /></Link>
        <div className="flex items-center gap-4">
          <Link href="/portal" className="text-sm" style={{ color: "var(--teal)" }}>← Dashboard</Link>
        </div>
      </nav>

      <div className="container py-10" style={{ maxWidth: 800 }}>
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Support</h1>
            <p className="text-sm" style={{ color: "var(--text3)" }}>Create and track support tickets. We respond within 1 hour.</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setSuccess(""); }} className="btn btn-primary">
            {showForm ? "Cancel" : "New Ticket"}
          </button>
        </div>

        {success && (
          <div className="p-4 rounded-xl mb-6" style={{ background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.2)", color: "#4CAF50" }}>
            <div className="text-sm font-semibold">{success}</div>
          </div>
        )}

        {/* New ticket form */}
        {showForm && (
          <div className="card p-6 mb-8">
            <h3 className="font-bold mb-4" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Report an Issue</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>Issue Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                  style={{ background: "var(--soft-bg)", border: "1.5px solid rgba(44,24,16,0.1)" }}
                >
                  {TICKET_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  required
                  rows={4}
                  placeholder="Describe what's happening — the more detail, the faster we can help..."
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-y"
                  style={{ background: "var(--soft-bg)", border: "1.5px solid rgba(44,24,16,0.1)" }}
                />
              </div>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? "Submitting..." : "Submit Ticket"}
              </button>
            </form>
          </div>
        )}

        {/* Ticket list */}
        {loading ? (
          <div className="card p-8 text-center"><p style={{ color: "var(--text3)" }}>Loading tickets...</p></div>
        ) : tickets.length === 0 && !showForm ? (
          <div className="card p-8 text-center">
            <div className="text-3xl mb-3">🎫</div>
            <h3 className="font-bold mb-2" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>No support tickets</h3>
            <p className="text-sm mb-4" style={{ color: "var(--text3)" }}>Everything looking good! If you need help, create a ticket or WhatsApp us.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => setShowForm(true)} className="btn btn-primary">Create Ticket</button>
              <a href="https://wa.me/5926092487" target="_blank" rel="noopener" className="btn btn-cyan">💬 WhatsApp</a>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => {
              const sc = statusColor[t.status] || statusColor.open;
              return (
                <div key={t.id} className="card p-5">
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold" style={{ fontFamily: "'Bricolage Grotesque', serif", color: "var(--text)" }}>{t.ticket_number}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(42,157,143,0.08)", color: "var(--teal)" }}>
                        {typeLabel[t.type] || t.type}
                      </span>
                    </div>
                    <span className="text-xs font-bold uppercase px-3 py-1 rounded-full" style={{ background: sc.bg, color: sc.text }}>
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm mb-2" style={{ color: "var(--text2)" }}>{t.description}</p>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Created: {new Date(t.created_at).toLocaleDateString("en-GY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {t.resolved_at && ` · Resolved: ${new Date(t.resolved_at).toLocaleDateString("en-GY", { day: "numeric", month: "short" })}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick contact */}
        <div className="card p-6 mt-8" style={{ background: "rgba(42,157,143,0.04)", borderColor: "rgba(42,157,143,0.15)" }}>
          <h3 className="font-bold mb-2" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Need immediate help?</h3>
          <p className="text-sm mb-3" style={{ color: "var(--text3)" }}>For urgent issues, WhatsApp us directly. We respond within the hour — 24/7.</p>
          <a href="https://wa.me/5926092487?text=Hi%2C%20I%20need%20urgent%20support%20for%20my%20internet%20connection" target="_blank" rel="noopener" className="btn btn-cyan">
            💬 WhatsApp Support — +592 609-2487
          </a>
        </div>
      </div>
    </div>
  );
}
