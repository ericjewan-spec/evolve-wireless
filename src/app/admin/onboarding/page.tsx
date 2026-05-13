"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";

type TemplateItem = {
  id: string;
  template_id: string;
  ord: number;
  title: string;
  description: string | null;
  category: "admin" | "documents" | "equipment" | "training" | "accounts" | "other";
  required: boolean;
};

type Template = {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
};

const CATEGORY_LABEL: Record<TemplateItem["category"], string> = {
  admin: "Admin",
  documents: "Documents",
  equipment: "Equipment",
  training: "Training",
  accounts: "Accounts",
  other: "Other",
};

const CATEGORY_COLOR: Record<TemplateItem["category"], string> = {
  admin: "#8B7355",
  documents: "#D4654A",
  equipment: "#E9B44C",
  training: "#4CAF50",
  accounts: "#9c7bd4",
  other: "#7A7068",
};

export default function OnboardingTemplatePage() {
  const supabase = createClient();
  const [template, setTemplate] = useState<Template | null>(null);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<TemplateItem>>({});
  const [adding, setAdding] = useState(false);
  const [newDraft, setNewDraft] = useState<Partial<TemplateItem>>({
    title: "", description: "", category: "admin", required: true,
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data: tpl } = await supabase
      .from("onboarding_templates")
      .select("*")
      .eq("is_default", true)
      .maybeSingle();
    if (!tpl) { setLoading(false); return; }
    setTemplate(tpl as Template);
    const { data: rows } = await supabase
      .from("onboarding_template_items")
      .select("*")
      .eq("template_id", (tpl as Template).id)
      .order("ord", { ascending: true });
    setItems((rows as TemplateItem[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function startEdit(it: TemplateItem) {
    setEditingId(it.id);
    setEditDraft({ ...it });
    setError(""); setInfo("");
  }

  async function saveEdit() {
    if (!editingId) return;
    setError("");
    const { error: e } = await supabase
      .from("onboarding_template_items")
      .update({
        title: editDraft.title,
        description: editDraft.description || null,
        category: editDraft.category,
        required: editDraft.required,
      })
      .eq("id", editingId);
    if (e) { setError(e.message); return; }
    setEditingId(null);
    setInfo("Saved.");
    fetchAll();
  }

  async function deleteItem(it: TemplateItem) {
    if (!confirm(`Delete "${it.title}" from the template? Existing employees' checklists are unaffected.`)) return;
    const { error: e } = await supabase.from("onboarding_template_items").delete().eq("id", it.id);
    if (e) { alert(e.message); return; }
    fetchAll();
  }

  async function move(it: TemplateItem, direction: -1 | 1) {
    const idx = items.findIndex(x => x.id === it.id);
    const other = items[idx + direction];
    if (!other) return;
    // Swap ord values; constraint is UNIQUE(template_id, ord) so do it via a temporary placeholder
    const tmpOrd = -Math.abs(Date.now() % 100000) - 1; // negative, unlikely to collide
    const { error: e1 } = await supabase.from("onboarding_template_items").update({ ord: tmpOrd }).eq("id", it.id);
    if (e1) { alert(e1.message); return; }
    const { error: e2 } = await supabase.from("onboarding_template_items").update({ ord: it.ord }).eq("id", other.id);
    if (e2) { alert(e2.message); return; }
    const { error: e3 } = await supabase.from("onboarding_template_items").update({ ord: other.ord }).eq("id", it.id);
    if (e3) { alert(e3.message); return; }
    fetchAll();
  }

  async function addNew() {
    setError("");
    if (!newDraft.title?.trim()) { setError("Title is required."); return; }
    const nextOrd = items.length > 0 ? Math.max(...items.map(i => i.ord)) + 10 : 10;
    const { error: e } = await supabase.from("onboarding_template_items").insert({
      template_id: template?.id,
      ord: nextOrd,
      title: newDraft.title.trim(),
      description: newDraft.description?.trim() || null,
      category: newDraft.category,
      required: newDraft.required,
    });
    if (e) { setError(e.message); return; }
    setAdding(false);
    setNewDraft({ title: "", description: "", category: "admin", required: true });
    setInfo("Item added.");
    fetchAll();
  }

  if (loading) {
    return <div style={{ paddingTop: 80, textAlign: "center", color: "#8B7355" }}>Loading…</div>;
  }

  if (!template) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: 40, color: "#8B7355" }}>
        No default onboarding template configured. Run the migration to seed one.
      </div>
    );
  }

  const byCategory = items.reduce((acc, it) => {
    (acc[it.category] = acc[it.category] || []).push(it);
    return acc;
  }, {} as Record<TemplateItem["category"], TemplateItem[]>);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px 80px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "#F5F0EB", letterSpacing: "-0.01em" }}>Onboarding template</h1>
      <p style={{ color: "#8B7355", margin: "4px 0 24px 0", fontSize: 14, lineHeight: 1.5 }}>
        Editable checklist applied to every new hire when you click <strong style={{ color: "#F5F0EB" }}>Initialize onboarding</strong> on their profile. Changes here don&apos;t alter checklists for existing hires.
      </p>

      {error && <Banner kind="error">{error}</Banner>}
      {info && <Banner kind="info">{info}</Banner>}

      <div style={{ padding: 16, background: "#141210", border: "1px solid #1e1a17", borderRadius: 12, marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#F5F0EB" }}>{template.name}</div>
            <div style={{ color: "#8B7355", fontSize: 12, marginTop: 2 }}>{template.description}</div>
          </div>
          <div style={{ display: "flex", gap: 16, color: "#8B7355", fontSize: 12, alignItems: "center" }}>
            <span><strong style={{ color: "#F5F0EB" }}>{items.length}</strong> items</span>
            <span><strong style={{ color: "#F5F0EB" }}>{items.filter(i => i.required).length}</strong> required</span>
          </div>
        </div>
      </div>

      {(["documents", "accounts", "equipment", "training", "admin", "other"] as TemplateItem["category"][]).map(cat => {
        const catItems = byCategory[cat] || [];
        if (catItems.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: 24 }}>
            <h2 style={{
              fontSize: 11, fontWeight: 700, color: CATEGORY_COLOR[cat],
              letterSpacing: "0.08em", margin: "0 0 10px 0", textTransform: "uppercase",
            }}>{CATEGORY_LABEL[cat]} ({catItems.length})</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {catItems.map(it => editingId === it.id ? (
                <EditCard
                  key={it.id}
                  draft={editDraft}
                  setDraft={setEditDraft}
                  onSave={saveEdit}
                  onCancel={() => { setEditingId(null); setError(""); }}
                />
              ) : (
                <ItemRow
                  key={it.id}
                  item={it}
                  onEdit={() => startEdit(it)}
                  onDelete={() => deleteItem(it)}
                  onMoveUp={() => move(it, -1)}
                  onMoveDown={() => move(it, 1)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {adding ? (
        <div style={{ padding: 16, background: "#141210", border: "1px dashed #2a2420", borderRadius: 12, marginTop: 12 }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 14, color: "#F5F0EB" }}>New template item</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Title">
              <input value={newDraft.title || ""} onChange={(e) => setNewDraft({ ...newDraft, title: e.target.value })} placeholder="e.g. Issue safety harness" style={inputStyle} autoFocus />
            </Field>
            <Field label="Category">
              <select value={newDraft.category} onChange={(e) => setNewDraft({ ...newDraft, category: e.target.value as TemplateItem["category"] })} style={inputStyle}>
                {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Description (optional)">
              <input value={newDraft.description || ""} onChange={(e) => setNewDraft({ ...newDraft, description: e.target.value })} placeholder="Helper text shown under the item" style={inputStyle} />
            </Field>
            <Field label="Required">
              <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#F5F0EB", fontSize: 13, marginTop: 8 }}>
                <input type="checkbox" checked={newDraft.required !== false} onChange={(e) => setNewDraft({ ...newDraft, required: e.target.checked })} />
                Required for onboarding to be considered complete
              </label>
            </Field>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
            <button onClick={() => { setAdding(false); setError(""); }} style={btnSecondary}>Cancel</button>
            <button onClick={addNew} style={btnPrimary}>Add item</button>
          </div>
        </div>
      ) : (
        <button onClick={() => { setAdding(true); setInfo(""); }} style={{ ...btnSecondary, width: "100%", padding: "12px", marginTop: 16, border: "1px dashed #2a2420" }}>
          + Add new template item
        </button>
      )}
    </div>
  );
}

function ItemRow({ item, onEdit, onDelete, onMoveUp, onMoveDown }: {
  item: TemplateItem;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "auto 1fr auto auto auto",
      gap: 14,
      alignItems: "center",
      padding: "12px 14px",
      background: "#141210",
      border: "1px solid #1e1a17",
      borderRadius: 8,
    }}>
      <div style={{ color: "#7A7068", fontFamily: "ui-monospace, monospace", fontSize: 11, minWidth: 32 }}>#{item.ord}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#F5F0EB" }}>{item.title}</div>
        {item.description && <div style={{ color: "#8B7355", fontSize: 11, marginTop: 2 }}>{item.description}</div>}
      </div>
      <span style={{
        padding: "2px 9px",
        borderRadius: 100,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.06em",
        background: item.required ? "rgba(212,101,74,0.12)" : "rgba(139,115,85,0.08)",
        color: item.required ? "#D4654A" : "#8B7355",
      }}>{item.required ? "REQUIRED" : "OPTIONAL"}</span>
      <div style={{ display: "flex", gap: 4 }}>
        <button onClick={onMoveUp} style={iconBtn} title="Move up">▲</button>
        <button onClick={onMoveDown} style={iconBtn} title="Move down">▼</button>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={onEdit} style={iconBtn}>Edit</button>
        <button onClick={onDelete} style={{ ...iconBtn, color: "#ff8a7a" }}>Delete</button>
      </div>
    </div>
  );
}

function EditCard({ draft, setDraft, onSave, onCancel }: {
  draft: Partial<TemplateItem>;
  setDraft: (d: Partial<TemplateItem>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={{ padding: 14, background: "#100E0C", border: "1px solid #D4654A", borderRadius: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <Field label="Title">
          <input value={draft.title || ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} style={inputStyle} />
        </Field>
        <Field label="Category">
          <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as TemplateItem["category"] })} style={inputStyle}>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Description (optional)">
          <input value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} style={inputStyle} />
        </Field>
        <Field label="Required">
          <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#F5F0EB", fontSize: 13, marginTop: 8 }}>
            <input type="checkbox" checked={draft.required !== false} onChange={(e) => setDraft({ ...draft, required: e.target.checked })} />
            Required
          </label>
        </Field>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={btnSecondary}>Cancel</button>
        <button onClick={onSave} style={btnPrimary}>Save</button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div style={{ fontSize: 11, color: "#8B7355", fontWeight: 600, marginBottom: 4 }}>{label}</div>{children}</div>;
}

function Banner({ kind, children }: { kind: "error" | "info"; children: React.ReactNode }) {
  const palette = kind === "error"
    ? { fg: "#ff8a7a", bg: "rgba(255,107,94,0.08)", border: "rgba(255,107,94,0.18)" }
    : { fg: "#4CAF50", bg: "rgba(76,175,80,0.08)", border: "rgba(76,175,80,0.18)" };
  return <div style={{ padding: "10px 14px", background: palette.bg, color: palette.fg, borderRadius: 8, border: `1px solid ${palette.border}`, marginBottom: 16, fontSize: 13 }}>{children}</div>;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #2a2420",
  background: "#0C0A09", color: "#F5F0EB", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};
const btnPrimary: React.CSSProperties = {
  padding: "8px 16px", background: "#D4654A", color: "#fff", border: "none",
  borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
};
const btnSecondary: React.CSSProperties = {
  padding: "6px 12px", background: "transparent", color: "#F5F0EB", border: "1px solid #2a2420",
  borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
};
const iconBtn: React.CSSProperties = {
  background: "transparent", border: "1px solid #2a2420", borderRadius: 4,
  color: "#F5F0EB", padding: "3px 8px", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
};
