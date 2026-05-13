"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";

type Holiday = {
  id: string;
  date: string;
  name: string;
  notes: string | null;
  is_paid: boolean;
  created_at: string;
};

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-GY", { weekday: "short", day: "numeric", month: "long", year: "numeric" });

const dayBadge = (d: string) => {
  const dt = new Date(d + "T12:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((dt.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return { label: "TODAY", color: "#E9B44C" };
  if (diff === 1) return { label: "TOMORROW", color: "#D4654A" };
  if (diff > 0 && diff < 30) return { label: `IN ${diff}D`, color: "#8B7355" };
  if (diff < 0) return { label: "PAST", color: "#5a504a" };
  return null;
};

export default function HolidaysPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ date: "", name: "", notes: "", is_paid: true });
  const [error, setError] = useState("");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  const fetch = useCallback(async () => {
    const start = `${yearFilter}-01-01`;
    const end = `${yearFilter}-12-31`;
    const { data } = await supabase
      .from("public_holidays")
      .select("*")
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: true });
    setRows((data as Holiday[]) || []);
    setLoading(false);
  }, [supabase, yearFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  function startCreate() {
    setEditingId(null);
    setDraft({ date: "", name: "", notes: "", is_paid: true });
    setError("");
    setShowForm(true);
  }
  function startEdit(h: Holiday) {
    setEditingId(h.id);
    setDraft({ date: h.date, name: h.name, notes: h.notes ?? "", is_paid: h.is_paid });
    setError("");
    setShowForm(true);
  }

  async function save() {
    setError("");
    if (!draft.date || !draft.name.trim()) { setError("Date and name are required."); return; }
    const payload = { date: draft.date, name: draft.name.trim(), notes: draft.notes.trim() || null, is_paid: draft.is_paid };
    const op = editingId
      ? supabase.from("public_holidays").update(payload).eq("id", editingId)
      : supabase.from("public_holidays").insert(payload);
    const { error: e } = await op;
    if (e) { setError(e.message); return; }
    setShowForm(false);
    fetch();
  }

  async function del(h: Holiday) {
    if (!confirm(`Delete ${h.name} (${fmtDate(h.date)})?`)) return;
    const { error: e } = await supabase.from("public_holidays").delete().eq("id", h.id);
    if (e) { alert(e.message); return; }
    fetch();
  }

  const now = new Date();
  const upcoming = rows.filter(r => new Date(r.date + "T23:59:59") >= now);
  const past = rows.filter(r => new Date(r.date + "T23:59:59") < now);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "#F5F0EB", letterSpacing: "-0.01em" }}>Public holidays</h1>
          <p style={{ color: "#8B7355", margin: "4px 0 0 0", fontSize: 14 }}>Guyana statutory holidays. Used for payroll, scheduling, and the staff calendar.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select value={yearFilter} onChange={(e) => setYearFilter(Number(e.target.value))} style={{ ...inputStyle, width: 120 }}>
            {[2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {!showForm && (
            <button onClick={startCreate} style={btnPrimary}>+ Add holiday</button>
          )}
        </div>
      </div>

      {showForm && (
        <div style={{ padding: 20, background: "#141210", border: "1px solid #2a2420", borderRadius: 12, marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 14px 0", fontSize: 15, color: "#F5F0EB" }}>{editingId ? "Edit holiday" : "Add holiday"}</h3>
          {error && <div style={errBanner}>{error}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Date">
              <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Name">
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Republic Day" style={inputStyle} />
            </Field>
            <Field label="Notes (optional)">
              <input value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="e.g. Date varies — confirm annually" style={inputStyle} />
            </Field>
            <Field label="Paid holiday?">
              <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#F5F0EB", fontSize: 13, marginTop: 8 }}>
                <input type="checkbox" checked={draft.is_paid} onChange={(e) => setDraft({ ...draft, is_paid: e.target.checked })} />
                <span>Employees are paid for this day</span>
              </label>
            </Field>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
            <button onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
            <button onClick={save} style={btnPrimary}>{editingId ? "Save changes" : "Add holiday"}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", color: "#8B7355", padding: 30 }}>Loading…</div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <Section title={`Upcoming (${upcoming.length})`}>
              {upcoming.map(h => <Row key={h.id} h={h} onEdit={startEdit} onDelete={del} />)}
            </Section>
          )}
          {past.length > 0 && (
            <Section title={`Past in ${yearFilter} (${past.length})`} dim>
              {past.map(h => <Row key={h.id} h={h} onEdit={startEdit} onDelete={del} dim />)}
            </Section>
          )}
          {rows.length === 0 && (
            <div style={{ textAlign: "center", color: "#8B7355", padding: 30, background: "#141210", border: "1px solid #1e1a17", borderRadius: 12 }}>
              No holidays defined for {yearFilter}. Click <strong style={{ color: "#D4654A" }}>+ Add holiday</strong> to start.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, children, dim }: { title: string; children: React.ReactNode; dim?: boolean }) {
  return (
    <div style={{ marginBottom: 28, opacity: dim ? 0.7 : 1 }}>
      <h2 style={{ fontSize: 11, fontWeight: 700, color: "#8B7355", letterSpacing: "0.08em", margin: "0 0 10px 0", textTransform: "uppercase" }}>{title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>
    </div>
  );
}

function Row({ h, onEdit, onDelete, dim }: { h: Holiday; onEdit: (h: Holiday) => void; onDelete: (h: Holiday) => void; dim?: boolean }) {
  const badge = dayBadge(h.date);
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr auto auto auto",
      gap: 16,
      alignItems: "center",
      padding: "14px 16px",
      background: "#141210",
      border: "1px solid #1e1a17",
      borderRadius: 10,
      opacity: dim ? 0.6 : 1,
    }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#F5F0EB" }}>{h.name}</div>
        <div style={{ color: "#8B7355", fontSize: 12, marginTop: 2 }}>
          {fmtDate(h.date)}{h.notes ? <> · {h.notes}</> : null}
        </div>
      </div>
      {badge && (
        <span style={{
          padding: "3px 10px",
          borderRadius: 100,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.06em",
          color: badge.color,
          background: `${badge.color}1a`,
        }}>{badge.label}</span>
      )}
      <span style={{
        padding: "3px 10px",
        borderRadius: 100,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        color: h.is_paid ? "#4CAF50" : "#8B7355",
        background: h.is_paid ? "rgba(76,175,80,0.12)" : "rgba(139,115,85,0.08)",
      }}>{h.is_paid ? "PAID" : "UNPAID"}</span>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onEdit(h)} style={iconBtn}>Edit</button>
        <button onClick={() => onDelete(h)} style={{ ...iconBtn, color: "#ff8a7a" }}>Delete</button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div style={{ fontSize: 12, color: "#8B7355", fontWeight: 600, marginBottom: 6 }}>{label}</div>{children}</div>;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #2a2420",
  background: "#0C0A09", color: "#F5F0EB", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};
const btnPrimary: React.CSSProperties = {
  padding: "10px 18px", background: "#D4654A", color: "#fff", border: "none",
  borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
};
const btnSecondary: React.CSSProperties = {
  padding: "8px 14px", background: "transparent", color: "#F5F0EB", border: "1px solid #2a2420",
  borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
};
const iconBtn: React.CSSProperties = {
  background: "transparent", border: "1px solid #2a2420", borderRadius: 6,
  color: "#F5F0EB", padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
};
const errBanner: React.CSSProperties = {
  padding: 10, background: "rgba(255,107,94,0.08)", color: "#ff8a7a", borderRadius: 6, marginBottom: 14, fontSize: 13,
};
