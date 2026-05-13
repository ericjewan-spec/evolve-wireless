"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useCurrentEmployee } from "@/lib/staff-auth";

export default function StaffProfilePage() {
  const { employee, loading } = useCurrentEmployee();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    phone: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
  });

  useEffect(() => {
    if (!employee) return;
    setDraft({
      phone: employee.phone ?? "",
      address: employee.address ?? "",
      emergency_contact_name: employee.emergency_contact_name ?? "",
      emergency_contact_phone: employee.emergency_contact_phone ?? "",
      emergency_contact_relationship: employee.emergency_contact_relationship ?? "",
    });
  }, [employee]);

  async function save() {
    if (!employee) return;
    setError("");
    setSaving(true);
    const supabase = createClient();
    const { error: e } = await supabase.from("employees")
      .update({
        phone: draft.phone || null,
        address: draft.address || null,
        emergency_contact_name: draft.emergency_contact_name || null,
        emergency_contact_phone: draft.emergency_contact_phone || null,
        emergency_contact_relationship: draft.emergency_contact_relationship || null,
      })
      .eq("id", employee.id);

    if (e) { setError(e.message); setSaving(false); return; }
    setSavedAt(new Date().toLocaleTimeString());
    setSaving(false);
    setEditing(false);
  }

  if (loading || !employee) return <div style={{ padding: 80, textAlign: "center", color: "#8B7355" }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "#F5F0EB", letterSpacing: "-0.01em" }}>My profile</h1>
          <p style={{ color: "#8B7355", margin: "4px 0 0 0", fontSize: 14 }}>
            Anything HR-controlled is read-only here — speak to HR if it needs updating.
          </p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} style={btnPrimary}>Edit contact info</button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setEditing(false); setError(""); }} style={btnSecondary}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        )}
      </div>

      {savedAt && !editing && (
        <div style={{ padding: 10, background: "rgba(76,175,80,0.08)", color: "#4CAF50", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
          Saved at {savedAt}.
        </div>
      )}
      {error && (
        <div style={{ padding: 10, background: "rgba(255,107,94,0.08)", color: "#ff8a7a", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
        <Section title="Personal">
          <RO label="First name" value={employee.first_name} />
          <RO label="Last name" value={employee.last_name} />
          <RO label="Date of birth" value={employee.date_of_birth ?? "—"} />
          <RO label="Gender" value={employee.gender ?? "—"} />
          <RO label="Marital status" value={employee.marital_status ?? "—"} />
        </Section>

        <Section title="Employment">
          <RO label="Role" value={employee.role} />
          <RO label="Department" value={employee.department ?? "—"} />
          <RO label="Start date" value={employee.start_date} />
          <RO label="Pay type" value={employee.pay_type} />
          <RO label="Pay cycle" value={employee.pay_cycle} />
          <RO label="Clock-in PIN" value={employee.pin_code ?? "—"} mono />
        </Section>

        <Section title="Contact (you can edit)">
          {editing ? (
            <>
              <Field label="Phone">
                <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} style={inputStyle} placeholder="+592…" />
              </Field>
              <Field label="Email">
                <input value={employee.email ?? ""} disabled style={{ ...inputStyle, opacity: 0.6 }} />
                <div style={{ fontSize: 11, color: "#7A7068", marginTop: 4 }}>Email is managed by HR.</div>
              </Field>
              <Field label="Address">
                <textarea value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} rows={2} />
              </Field>
            </>
          ) : (
            <>
              <RO label="Phone" value={employee.phone ?? "—"} />
              <RO label="Email" value={employee.email ?? "—"} />
              <RO label="Address" value={employee.address ?? "—"} />
            </>
          )}
        </Section>

        <Section title="Emergency contact">
          {editing ? (
            <>
              <Field label="Name">
                <input value={draft.emergency_contact_name} onChange={(e) => setDraft({ ...draft, emergency_contact_name: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="Phone">
                <input value={draft.emergency_contact_phone} onChange={(e) => setDraft({ ...draft, emergency_contact_phone: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="Relationship">
                <input value={draft.emergency_contact_relationship} onChange={(e) => setDraft({ ...draft, emergency_contact_relationship: e.target.value })} style={inputStyle} placeholder="e.g. spouse, sibling, parent" />
              </Field>
            </>
          ) : (
            <>
              <RO label="Name" value={employee.emergency_contact_name ?? "—"} />
              <RO label="Phone" value={employee.emergency_contact_phone ?? "—"} />
              <RO label="Relationship" value={employee.emergency_contact_relationship ?? "—"} />
            </>
          )}
        </Section>

        <Section title="Statutory & bank">
          <RO label="NIS number" value={employee.nis_number ?? "—"} mono />
          <RO label="TIN number" value={employee.tin_number ?? "—"} mono />
          <RO label="Bank" value={employee.bank_name ?? "—"} />
          <RO label="Account" value={employee.bank_account ?? "—"} mono />
          <p style={{ color: "#7A7068", fontSize: 11, margin: "10px 0 0 0" }}>
            Statutory and banking info is managed by HR. If anything is wrong here, contact HR directly.
          </p>
        </Section>

        <Section title="Leave balances">
          <RO label="Vacation balance" value={`${employee.leave_balance_vacation ?? 0} days`} />
          <RO label="Sick balance" value={`${employee.leave_balance_sick ?? 0} days`} />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#141210", border: "1px solid #1e1a17", borderRadius: 12, padding: 22 }}>
      <div style={{ fontSize: 11, color: "#D4654A", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}
function RO({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 8, fontSize: 13 }}>
      <span style={{ color: "#8B7355" }}>{label}</span>
      <span style={{ color: "#F5F0EB", fontWeight: 600, fontFamily: mono ? "monospace" : undefined }}>{value}</span>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#8B7355", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", fontSize: 14, background: "#0C0A09",
  border: "1px solid #2a2420", borderRadius: 8, color: "#F5F0EB",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};
const btnPrimary: React.CSSProperties = {
  padding: "10px 18px", background: "#D4654A", color: "#fff",
  border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13,
  cursor: "pointer", fontFamily: "inherit",
};
const btnSecondary: React.CSSProperties = {
  padding: "10px 16px", background: "transparent", color: "#F5F0EB",
  border: "1px solid #2a2420", borderRadius: 8, fontWeight: 600, fontSize: 13,
  cursor: "pointer", fontFamily: "inherit",
};
