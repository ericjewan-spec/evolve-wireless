"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { logFieldChanges, logAudit } from "@/lib/audit";

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  department: string | null;
  pay_type: string;
  pay_rate: number;
  pay_cycle: string;
  start_date: string;
  status: string;
  pin_code: string | null;
  leave_balance_vacation: number | null;
  leave_balance_sick: number | null;
  date_of_birth: string | null;
  gender: string | null;
  marital_status: string | null;
  address: string | null;
  nis_number: string | null;
  tin_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  photo_url: string | null;
  notes: string | null;
  bank_name: string | null;
  bank_account: string | null;
  auth_user_id: string | null;
  portal_enabled: boolean;
  created_at: string;
  updated_at: string;
};

type EmployeeDocument = {
  id: string;
  employee_id: string;
  category: string;
  filename: string;
  storage_path: string;
  file_size: number | null;
  mime_type: string | null;
  expiry_date: string | null;
  notes: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
};

type LeaveRequestRow = {
  id: string;
  employee_id: string;
  leave_type: "vacation" | "sick" | "unpaid" | "bereavement" | "other";
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string | null;
  status: "pending" | "approved" | "declined" | "cancelled";
  decision_notes: string | null;
  approved_at: string | null;
  submitted_by_employee: boolean;
  created_at: string;
};

type AuditEntry = {
  id: string;
  employee_id: string | null;
  admin_id: string | null;
  admin_email: string | null;
  admin_name: string | null;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const DOC_CATEGORIES = [
  { value: "contract", label: "Contract / Offer Letter" },
  { value: "id_passport", label: "ID / Passport" },
  { value: "nis_card", label: "NIS Card" },
  { value: "tin_certificate", label: "TIN Certificate" },
  { value: "police_clearance", label: "Police Clearance" },
  { value: "medical_certificate", label: "Medical Certificate" },
  { value: "certification", label: "Certification / Training" },
  { value: "performance_review", label: "Performance Review" },
  { value: "warning_letter", label: "Warning Letter" },
  { value: "photo", label: "Photo" },
  { value: "other", label: "Other" },
];

const EDITABLE_FIELDS: (keyof Employee)[] = [
  "first_name", "last_name", "email", "phone", "role", "department",
  "pay_type", "pay_rate", "pay_cycle", "start_date", "status", "pin_code",
  "leave_balance_vacation", "leave_balance_sick",
  "date_of_birth", "gender", "marital_status", "address",
  "nis_number", "tin_number",
  "emergency_contact_name", "emergency_contact_phone", "emergency_contact_relationship",
  "notes", "bank_name", "bank_account",
];

const fmtGYD = (n: number) => "GYD " + n.toLocaleString("en-GY");
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-GY", { year: "numeric", month: "short", day: "numeric" }) : "—";
const fmtDateTime = (d: string) => new Date(d).toLocaleString("en-GY", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
const fmtBytes = (n: number | null) => {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

type Tab = "profile" | "documents" | "history" | "portal" | "schedule";

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("profile");
  const [docs, setDocs] = useState<EmployeeDocument[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequestRow[]>([]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Employee>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [empRes, docsRes, auditRes, leaveRes] = await Promise.all([
      supabase.from("employees").select("*").eq("id", id).maybeSingle(),
      supabase.from("employee_documents").select("*").eq("employee_id", id).order("uploaded_at", { ascending: false }),
      supabase.from("employee_audit_log").select("*").eq("employee_id", id).order("created_at", { ascending: false }).limit(200),
      supabase.from("leave_requests").select("*").eq("employee_id", id).order("created_at", { ascending: false }),
    ]);
    setEmployee(empRes.data as Employee | null);
    setDocs((docsRes.data as EmployeeDocument[]) || []);
    setAudit((auditRes.data as AuditEntry[]) || []);
    setLeaves((leaveRes.data as LeaveRequestRow[]) || []);
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function startEdit() {
    if (!employee) return;
    setDraft({ ...employee });
    setEditing(true);
    setError("");
  }

  function cancelEdit() {
    setDraft({});
    setEditing(false);
    setError("");
  }

  async function saveEdit() {
    if (!employee) return;
    if (!draft.first_name || !draft.last_name) {
      setError("First and last name are required.");
      return;
    }
    setSaving(true);
    setError("");

    // Build update payload — only fields that changed
    const update: Partial<Employee> = {};
    for (const field of EDITABLE_FIELDS) {
      const before = (employee as Record<string, unknown>)[field];
      const after = (draft as Record<string, unknown>)[field];
      // Convert empty strings to null for nullable text fields
      const cleanedAfter = after === "" ? null : after;
      if (cleanedAfter !== before) {
        (update as Record<string, unknown>)[field] = cleanedAfter;
      }
    }

    if (Object.keys(update).length === 0) {
      setEditing(false);
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("employees")
      .update(update)
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    // Write audit entries — one per changed field
    await logFieldChanges(
      id,
      employee as unknown as Record<string, unknown>,
      { ...employee, ...update } as unknown as Record<string, unknown>,
      EDITABLE_FIELDS,
    );

    setEditing(false);
    setSaving(false);
    fetchAll();
  }

  async function deleteEmployee() {
    if (!employee) return;
    if (!confirm(`Permanently delete ${employee.first_name} ${employee.last_name}? This cannot be undone.\n\nIf you just want to deactivate them, set Status to 'inactive' instead.`)) return;

    await logAudit({
      employee_id: id,
      action: "deleted",
      metadata: { name: `${employee.first_name} ${employee.last_name}`, role: employee.role },
    });

    const { error: delError } = await supabase.from("employees").delete().eq("id", id);
    if (delError) {
      setError(delError.message);
      return;
    }
    router.push("/admin/payroll");
  }

  if (loading) {
    return <div style={{ paddingTop: 80, textAlign: "center", color: "#8B7355" }}>Loading…</div>;
  }
  if (!employee) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
        <Link href="/admin/payroll" style={{ color: "#D4654A", fontSize: 14, fontWeight: 600 }}>← Back to staff list</Link>
        <h1 style={{ marginTop: 20 }}>Employee not found</h1>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>
      <Link href="/admin/payroll" style={{ color: "#D4654A", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
        ← Back to staff list
      </Link>

      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        marginTop: 16,
        marginBottom: 28,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, #D4654A 0%, #E9B44C 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: 22,
          }}>
            {employee.first_name[0]}{employee.last_name[0]}
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.01em", color: "#F5F0EB" }}>
              {employee.first_name} {employee.last_name}
            </h1>
            <p style={{ color: "#8B7355", margin: "4px 0 0 0", fontSize: 14 }}>
              {employee.role} {employee.department && `· ${employee.department}`} · PIN {employee.pin_code || "—"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{
            padding: "6px 12px",
            background: employee.status === "active" ? "rgba(76,175,80,0.12)" : "rgba(139,115,85,0.12)",
            color: employee.status === "active" ? "#4CAF50" : "#8B7355",
            borderRadius: 100,
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}>{employee.status}</span>
          {!editing && (
            <button onClick={startEdit} style={btnPrimary()}>Edit</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #1e1a17", marginBottom: 24, flexWrap: "wrap" }}>
        {(["profile", "documents", "history", "portal", "schedule"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "12px 18px",
              background: "transparent",
              border: "none",
              borderBottom: tab === t ? "2px solid #D4654A" : "2px solid transparent",
              color: tab === t ? "#F5F0EB" : "#8B7355",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 600,
              marginBottom: -1,
            }}
          >
            {t === "profile" ? "Profile"
              : t === "documents" ? `Documents (${docs.length})`
              : t === "history" ? `History (${audit.length})`
              : t === "schedule" ? "Schedule"
              : `Portal & Leave${leaves.filter(l => l.status === "pending").length ? ` (${leaves.filter(l => l.status === "pending").length})` : ""}`}
          </button>
        ))}
      </div>

      {error && (
        <div style={{
          padding: 14,
          background: "rgba(255,107,94,0.08)",
          border: "1px solid rgba(255,107,94,0.2)",
          color: "#ff8a7a",
          borderRadius: 8,
          marginBottom: 20,
          fontSize: 14,
        }}>{error}</div>
      )}

      {tab === "profile" && (
        <ProfilePanel
          employee={employee}
          editing={editing}
          draft={draft}
          setDraft={setDraft}
          saveEdit={saveEdit}
          cancelEdit={cancelEdit}
          saving={saving}
          deleteEmployee={deleteEmployee}
        />
      )}

      {tab === "documents" && (
        <DocumentsPanel
          employeeId={id}
          docs={docs}
          onChange={fetchAll}
        />
      )}

      {tab === "history" && <HistoryPanel audit={audit} />}

      {tab === "portal" && (
        <PortalPanel
          employee={employee}
          leaves={leaves}
          onChange={fetchAll}
        />
      )}

      {tab === "schedule" && <SchedulePanel employeeId={employee.id} firstName={employee.first_name} />}
    </div>
  );
}

/* ============================================================
   PROFILE PANEL
============================================================ */
function ProfilePanel({
  employee, editing, draft, setDraft, saveEdit, cancelEdit, saving, deleteEmployee,
}: {
  employee: Employee;
  editing: boolean;
  draft: Partial<Employee>;
  setDraft: (d: Partial<Employee>) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  saving: boolean;
  deleteEmployee: () => void;
}) {
  const v = editing ? draft : employee;
  const set = <K extends keyof Employee>(key: K, value: Employee[K] | null | string) => {
    setDraft({ ...draft, [key]: value });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      <Card title="Personal">
        <Row label="First name">
          {editing ? <Input value={v.first_name ?? ""} onChange={(x) => set("first_name", x)} /> : <Val>{v.first_name}</Val>}
        </Row>
        <Row label="Last name">
          {editing ? <Input value={v.last_name ?? ""} onChange={(x) => set("last_name", x)} /> : <Val>{v.last_name}</Val>}
        </Row>
        <Row label="Phone">
          {editing
            ? <Input value={v.phone ?? ""} onChange={(x) => set("phone", x)} placeholder="+592..." />
            : <Val>{v.phone || "—"}</Val>}
        </Row>
        <Row label="Email">
          {editing
            ? <Input type="email" value={v.email ?? ""} onChange={(x) => set("email", x)} />
            : <Val>{v.email || "—"}</Val>}
        </Row>
        <Row label="Date of birth">
          {editing
            ? <Input type="date" value={v.date_of_birth ?? ""} onChange={(x) => set("date_of_birth", x || null)} />
            : <Val>{fmtDate(v.date_of_birth ?? null)}</Val>}
        </Row>
        <Row label="Gender">
          {editing
            ? <Select value={v.gender ?? ""} onChange={(x) => set("gender", x || null)} options={[
                { value: "", label: "—" },
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
                { value: "prefer_not_to_say", label: "Prefer not to say" },
              ]} />
            : <Val>{v.gender ? v.gender.replace(/_/g, " ") : "—"}</Val>}
        </Row>
        <Row label="Marital status">
          {editing
            ? <Select value={v.marital_status ?? ""} onChange={(x) => set("marital_status", x || null)} options={[
                { value: "", label: "—" },
                { value: "single", label: "Single" },
                { value: "married", label: "Married" },
                { value: "divorced", label: "Divorced" },
                { value: "widowed", label: "Widowed" },
                { value: "other", label: "Other" },
              ]} />
            : <Val>{v.marital_status || "—"}</Val>}
        </Row>
        <Row label="Address">
          {editing
            ? <Textarea value={v.address ?? ""} onChange={(x) => set("address", x)} />
            : <Val>{v.address || "—"}</Val>}
        </Row>
      </Card>

      <Card title="Employment">
        <Row label="Role">
          {editing ? <Input value={v.role ?? ""} onChange={(x) => set("role", x)} /> : <Val>{v.role}</Val>}
        </Row>
        <Row label="Department">
          {editing
            ? <Select value={v.department ?? ""} onChange={(x) => set("department", x)} options={[
                { value: "Operations", label: "Operations" },
                { value: "Sales", label: "Sales" },
                { value: "Technical", label: "Technical" },
                { value: "Admin", label: "Admin" },
              ]} />
            : <Val>{v.department || "—"}</Val>}
        </Row>
        <Row label="Status">
          {editing
            ? <Select value={v.status ?? "active"} onChange={(x) => set("status", x)} options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "on_leave", label: "On leave" },
                { value: "terminated", label: "Terminated" },
              ]} />
            : <Val>{v.status}</Val>}
        </Row>
        <Row label="Start date">
          {editing
            ? <Input type="date" value={v.start_date ?? ""} onChange={(x) => set("start_date", x)} />
            : <Val>{fmtDate(v.start_date ?? null)}</Val>}
        </Row>
        <Row label="Pay type">
          {editing
            ? <Select value={v.pay_type ?? "hourly"} onChange={(x) => set("pay_type", x)} options={[
                { value: "hourly", label: "Hourly" },
                { value: "salary", label: "Salary" },
              ]} />
            : <Val>{v.pay_type}</Val>}
        </Row>
        <Row label="Pay rate (GYD)">
          {editing
            ? <Input type="number" value={String(v.pay_rate ?? "")} onChange={(x) => set("pay_rate", parseFloat(x) as Employee["pay_rate"])} />
            : <Val>{fmtGYD(v.pay_rate ?? 0)}{v.pay_type === "hourly" ? "/hr" : ""}</Val>}
        </Row>
        <Row label="Pay cycle">
          {editing
            ? <Select value={v.pay_cycle ?? "fortnightly"} onChange={(x) => set("pay_cycle", x)} options={[
                { value: "fortnightly", label: "Fortnightly" },
                { value: "monthly", label: "Monthly" },
              ]} />
            : <Val>{v.pay_cycle}</Val>}
        </Row>
        <Row label="Clock-in PIN">
          {editing
            ? <Input value={v.pin_code ?? ""} onChange={(x) => set("pin_code", x)} maxLength={4} />
            : <Val style={{ fontFamily: "monospace", fontSize: 16 }}>{v.pin_code || "—"}</Val>}
        </Row>
      </Card>

      <Card title="Statutory & Bank">
        <Row label="NIS number">
          {editing
            ? <Input value={v.nis_number ?? ""} onChange={(x) => set("nis_number", x)} />
            : <Val>{v.nis_number || "—"}</Val>}
        </Row>
        <Row label="TIN number">
          {editing
            ? <Input value={v.tin_number ?? ""} onChange={(x) => set("tin_number", x)} />
            : <Val>{v.tin_number || "—"}</Val>}
        </Row>
        <Row label="Bank name">
          {editing
            ? <Input value={v.bank_name ?? ""} onChange={(x) => set("bank_name", x)} />
            : <Val>{v.bank_name || "—"}</Val>}
        </Row>
        <Row label="Bank account">
          {editing
            ? <Input value={v.bank_account ?? ""} onChange={(x) => set("bank_account", x)} />
            : <Val>{v.bank_account || "—"}</Val>}
        </Row>
        <Row label="Vacation balance">
          {editing
            ? <Input type="number" value={String(v.leave_balance_vacation ?? "")} onChange={(x) => set("leave_balance_vacation", parseFloat(x) as Employee["leave_balance_vacation"])} />
            : <Val>{v.leave_balance_vacation ?? 0} days</Val>}
        </Row>
        <Row label="Sick balance">
          {editing
            ? <Input type="number" value={String(v.leave_balance_sick ?? "")} onChange={(x) => set("leave_balance_sick", parseFloat(x) as Employee["leave_balance_sick"])} />
            : <Val>{v.leave_balance_sick ?? 0} days</Val>}
        </Row>
      </Card>

      <Card title="Emergency Contact & Notes">
        <Row label="Contact name">
          {editing
            ? <Input value={v.emergency_contact_name ?? ""} onChange={(x) => set("emergency_contact_name", x)} />
            : <Val>{v.emergency_contact_name || "—"}</Val>}
        </Row>
        <Row label="Contact phone">
          {editing
            ? <Input value={v.emergency_contact_phone ?? ""} onChange={(x) => set("emergency_contact_phone", x)} />
            : <Val>{v.emergency_contact_phone || "—"}</Val>}
        </Row>
        <Row label="Relationship">
          {editing
            ? <Input value={v.emergency_contact_relationship ?? ""} onChange={(x) => set("emergency_contact_relationship", x)} placeholder="e.g. mother, spouse" />
            : <Val>{v.emergency_contact_relationship || "—"}</Val>}
        </Row>
        <Row label="Notes">
          {editing
            ? <Textarea value={v.notes ?? ""} onChange={(x) => set("notes", x)} rows={4} />
            : <Val style={{ whiteSpace: "pre-wrap" }}>{v.notes || "—"}</Val>}
        </Row>
      </Card>

      {editing && (
        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", gap: 12, marginTop: 8 }}>
          <button onClick={deleteEmployee} style={btnDanger()}>Delete employee</button>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={cancelEdit} style={btnSecondary()}>Cancel</button>
            <button onClick={saveEdit} disabled={saving} style={btnPrimary()}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   DOCUMENTS PANEL
============================================================ */
function DocumentsPanel({ employeeId, docs, onChange }: { employeeId: string; docs: EmployeeDocument[]; onChange: () => void }) {
  const [showUpload, setShowUpload] = useState(false);
  const [category, setCategory] = useState("contract");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  async function upload() {
    if (!file) { setError("Pick a file first."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("File too large (max 10 MB)."); return; }
    setUploading(true);
    setError("");

    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${employeeId}/${Date.now()}_${safe}`;
    const { error: uploadError } = await supabase.storage
      .from("employee-documents")
      .upload(path, file, { upsert: false, contentType: file.type });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { error: insertError } = await supabase.from("employee_documents").insert({
      employee_id: employeeId,
      category,
      filename: file.name,
      storage_path: path,
      file_size: file.size,
      mime_type: file.type,
      expiry_date: expiryDate || null,
      notes: notes || null,
    });

    if (insertError) {
      // Cleanup the orphaned file
      await supabase.storage.from("employee-documents").remove([path]);
      setError(insertError.message);
      setUploading(false);
      return;
    }

    await logAudit({
      employee_id: employeeId,
      action: "document_uploaded",
      metadata: { filename: file.name, category, file_size: file.size },
    });

    // Reset & refresh
    setFile(null);
    setExpiryDate("");
    setNotes("");
    setCategory("contract");
    setShowUpload(false);
    setUploading(false);
    onChange();
  }

  async function downloadDoc(d: EmployeeDocument) {
    const { data, error: signedError } = await supabase.storage
      .from("employee-documents")
      .createSignedUrl(d.storage_path, 60);
    if (signedError || !data?.signedUrl) {
      alert("Could not generate download link: " + (signedError?.message ?? "unknown error"));
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function deleteDoc(d: EmployeeDocument) {
    if (!confirm(`Delete "${d.filename}"? This cannot be undone.`)) return;
    const { error: storageError } = await supabase.storage
      .from("employee-documents")
      .remove([d.storage_path]);
    if (storageError) { alert(storageError.message); return; }

    const { error: deleteError } = await supabase
      .from("employee_documents")
      .delete()
      .eq("id", d.id);
    if (deleteError) { alert(deleteError.message); return; }

    await logAudit({
      employee_id: employeeId,
      action: "document_deleted",
      metadata: { filename: d.filename, category: d.category },
    });

    onChange();
  }

  const isExpiringSoon = (d: string | null) => {
    if (!d) return false;
    const days = Math.round((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 30;
  };
  const isExpired = (d: string | null) => {
    if (!d) return false;
    return new Date(d).getTime() < Date.now();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Documents</h2>
        {!showUpload && (
          <button onClick={() => setShowUpload(true)} style={btnPrimary()}>+ Upload document</button>
        )}
      </div>

      {showUpload && (
        <div style={{ ...cardStyle(), marginBottom: 18 }}>
          <h3 style={{ margin: "0 0 14px 0", fontSize: 15 }}>Upload new document</h3>
          {error && (
            <div style={{
              padding: 10, background: "rgba(255,107,94,0.08)", color: "#ff8a7a",
              borderRadius: 6, marginBottom: 12, fontSize: 13,
            }}>{error}</div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle()}>Category</label>
              <Select value={category} onChange={setCategory} options={DOC_CATEGORIES} />
            </div>
            <div>
              <label style={labelStyle()}>Expiry date (optional)</label>
              <Input type="date" value={expiryDate} onChange={setExpiryDate} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle()}>File (max 10 MB · PDF, image, or Word/Excel)</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx"
                style={{ ...inputStyle(), padding: 10 }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle()}>Notes (optional)</label>
              <Textarea value={notes} onChange={setNotes} rows={2} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
            <button onClick={() => { setShowUpload(false); setFile(null); setError(""); }} style={btnSecondary()}>Cancel</button>
            <button onClick={upload} disabled={uploading || !file} style={btnPrimary()}>
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </div>
      )}

      {docs.length === 0 ? (
        <div style={{ ...cardStyle(), textAlign: "center", padding: 40, color: "#8B7355" }}>
          No documents uploaded yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {docs.map((d) => {
            const expired = isExpired(d.expiry_date);
            const expiring = !expired && isExpiringSoon(d.expiry_date);
            const catLabel = DOC_CATEGORIES.find((c) => c.value === d.category)?.label ?? d.category;
            return (
              <div key={d.id} style={{
                padding: 14,
                background: "#141210",
                border: `1px solid ${expired ? "rgba(255,107,94,0.4)" : "#1e1a17"}`,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                gap: 14,
                flexWrap: "wrap",
              }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{d.filename}</div>
                  <div style={{ fontSize: 12, color: "#8B7355", display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span>{catLabel}</span>
                    <span>·</span>
                    <span>{fmtBytes(d.file_size)}</span>
                    <span>·</span>
                    <span>{fmtDateTime(d.uploaded_at)}</span>
                  </div>
                  {d.notes && <div style={{ fontSize: 12, color: "#8B7355", marginTop: 4 }}>{d.notes}</div>}
                </div>
                {d.expiry_date && (
                  <div style={{
                    padding: "4px 10px",
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 100,
                    background: expired ? "rgba(255,107,94,0.15)" : expiring ? "rgba(233,180,76,0.15)" : "rgba(139,115,85,0.12)",
                    color: expired ? "#ff8a7a" : expiring ? "#E9B44C" : "#8B7355",
                  }}>
                    {expired ? "EXPIRED" : `EXPIRES ${fmtDate(d.expiry_date)}`}
                  </div>
                )}
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => downloadDoc(d)} style={btnSecondary()}>View</button>
                  <button onClick={() => deleteDoc(d)} style={btnDanger()}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   HISTORY PANEL
============================================================ */
function HistoryPanel({ audit }: { audit: AuditEntry[] }) {
  if (audit.length === 0) {
    return (
      <div style={{ ...cardStyle(), textAlign: "center", padding: 40, color: "#8B7355" }}>
        No history yet. All future edits will be logged here.
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {audit.map((a) => (
        <div key={a.id} style={{
          padding: "12px 16px",
          background: "#141210",
          border: "1px solid #1e1a17",
          borderRadius: 8,
          fontSize: 13,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
            <div>
              <span style={{ fontWeight: 700 }}>{a.admin_name || a.admin_email || "Unknown"}</span>
              <span style={{ color: "#8B7355" }}> {actionLabel(a)}</span>
            </div>
            <div style={{ color: "#7A7068", fontSize: 11 }}>{fmtDateTime(a.created_at)}</div>
          </div>
          {a.field_name && a.action === "updated" && (
            <div style={{ marginTop: 4, color: "#8B7355", fontSize: 12 }}>
              <code style={{ background: "#1a1513", padding: "1px 6px", borderRadius: 4, color: "#E9B44C" }}>{a.field_name}</code>
              {": "}
              <span style={{ color: "#8B7355" }}>{a.old_value || "(empty)"}</span>
              {" → "}
              <span style={{ color: "#F5F0EB" }}>{a.new_value || "(empty)"}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function actionLabel(a: AuditEntry): string {
  switch (a.action) {
    case "created": return "created this employee";
    case "deleted": return "deleted this employee";
    case "updated": return `updated ${a.field_name ?? "a field"}`;
    case "document_uploaded": {
      const meta = a.metadata as { filename?: string } | null;
      return `uploaded document${meta?.filename ? ` "${meta.filename}"` : ""}`;
    }
    case "document_deleted": {
      const meta = a.metadata as { filename?: string } | null;
      return `deleted document${meta?.filename ? ` "${meta.filename}"` : ""}`;
    }
    case "pin_reset": return "reset the clock-in PIN";
    case "status_changed": return "changed status";
    case "leave_balance_adjusted": return "adjusted leave balance";
    default: return a.action;
  }
}

/* ============================================================
   UI PRIMITIVES
============================================================ */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={cardStyle()}>
      <h2 style={{ margin: "0 0 14px 0", fontSize: 14, fontWeight: 700, color: "#E9B44C", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(140px, 36%) 1fr", gap: 12, alignItems: "center" }}>
      <div style={{ fontSize: 12, color: "#8B7355", fontWeight: 600 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

function Val({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ color: "#F5F0EB", fontSize: 14, ...style }}>{children}</div>;
}

function Input({ type = "text", value, onChange, placeholder, maxLength }: {
  type?: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      style={inputStyle()}
    />
  );
}

function Textarea({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      style={{ ...inputStyle(), resize: "vertical", fontFamily: "inherit" }}
    />
  );
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }>;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle()}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

const cardStyle = (): React.CSSProperties => ({
  padding: 20,
  background: "#141210",
  border: "1px solid #1e1a17",
  borderRadius: 12,
});

const inputStyle = (): React.CSSProperties => ({
  width: "100%",
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #2a2420",
  background: "#0C0A09",
  color: "#F5F0EB",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
});

const labelStyle = (): React.CSSProperties => ({
  display: "block",
  fontSize: 12,
  color: "#8B7355",
  fontWeight: 600,
  marginBottom: 6,
});

const btnPrimary = (): React.CSSProperties => ({
  padding: "9px 18px",
  background: "#D4654A",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
});

const btnSecondary = (): React.CSSProperties => ({
  padding: "9px 18px",
  background: "transparent",
  color: "#F5F0EB",
  border: "1px solid #2a2420",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
});

const btnDanger = (): React.CSSProperties => ({
  padding: "9px 18px",
  background: "transparent",
  color: "#ff8a7a",
  border: "1px solid rgba(255,107,94,0.3)",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
});

/* ============================================================
   PORTAL & LEAVE PANEL
   ============================================================ */
function PortalPanel({ employee, leaves, onChange }: {
  employee: Employee;
  leaves: LeaveRequestRow[];
  onChange: () => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function createLogin() {
    setError("");
    if (newPassword.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }
    setBusy(true);
    const { error: e } = await supabase.rpc("create_staff_login", {
      p_employee_id: employee.id,
      p_password: newPassword,
    });
    if (e) { setError(e.message); setBusy(false); return; }
    await logAudit({
      employee_id: employee.id,
      action: "updated",
      field_name: "portal_enabled",
      old_value: "false",
      new_value: "true",
      metadata: { description: "Staff portal login created" },
    });
    setNewPassword("");
    setShowCreate(false);
    setBusy(false);
    onChange();
  }

  async function sendReset() {
    if (!employee.email) { alert("Employee has no email address."); return; }
    if (!confirm(`Send a password reset email to ${employee.first_name} at ${employee.email}? The link expires in 1 hour.`)) return;
    const { error: e } = await supabase.auth.resetPasswordForEmail(employee.email, {
      redirectTo: `${window.location.origin}/staff/reset-password`,
    });
    if (e) { alert(`Could not send reset: ${e.message}`); return; }
    alert(`Reset email sent to ${employee.email}.`);
  }

  async function disableLogin() {
    if (!confirm(`Disable the staff portal login for ${employee.first_name} ${employee.last_name}?\n\nThey won't be able to sign in until you re-enable it. Their data (leave requests, attendance, etc.) is preserved.`)) return;
    setBusy(true);
    const { error: e } = await supabase.rpc("disable_staff_login", { p_employee_id: employee.id });
    if (e) { alert(e.message); setBusy(false); return; }
    await logAudit({
      employee_id: employee.id,
      action: "updated",
      field_name: "portal_enabled",
      old_value: "true",
      new_value: "false",
      metadata: { description: "Staff portal login disabled" },
    });
    setBusy(false);
    onChange();
  }

  async function decideLeave(req: LeaveRequestRow, decision: "approved" | "declined") {
    const notes = prompt(
      `${decision === "approved" ? "Approve" : "Decline"} ${employee.first_name}'s ${req.leave_type} leave for ${req.days_count} day${req.days_count === 1 ? "" : "s"} (${req.start_date} → ${req.end_date})?\n\nOptional note for the employee:`,
      ""
    );
    if (notes === null) return; // cancelled prompt

    const { data: { user } } = await supabase.auth.getUser();
    const { error: e } = await supabase.from("leave_requests")
      .update({
        status: decision,
        decision_notes: notes || null,
        approved_at: new Date().toISOString(),
        approved_by_id: user?.id ?? null,
      })
      .eq("id", req.id);
    if (e) { alert(e.message); return; }

    await logAudit({
      employee_id: employee.id,
      action: "updated",
      field_name: `leave_request:${req.id}`,
      old_value: req.status,
      new_value: decision,
      metadata: {
        leave_type: req.leave_type,
        days_count: req.days_count,
        start_date: req.start_date,
        end_date: req.end_date,
        decision_notes: notes || null,
      },
    });

    onChange();
  }

  const pending = leaves.filter(l => l.status === "pending");
  const past = leaves.filter(l => l.status !== "pending");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Portal login section */}
      <div style={{ background: "#141210", border: "1px solid #1e1a17", borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 11, color: "#D4654A", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
          Staff portal login
        </div>

        {error && (
          <div style={{ padding: 10, background: "rgba(255,107,94,0.08)", color: "#ff8a7a", borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
            {error}
          </div>
        )}

        {!employee.auth_user_id ? (
          <>
            <p style={{ color: "#8B7355", fontSize: 14, margin: "0 0 14px 0" }}>
              {employee.first_name} doesn&apos;t have portal access yet. Set an initial password — they&apos;ll sign in at <code style={{ color: "#E9B44C" }}>/staff/login</code> with their email and this password, and can change it themselves.
            </p>
            {!employee.email ? (
              <div style={{ padding: 10, background: "rgba(233,180,76,0.08)", color: "#E9B44C", borderRadius: 6, fontSize: 13 }}>
                Set an email address for this employee first (in the Profile tab).
              </div>
            ) : !showCreate ? (
              <button onClick={() => setShowCreate(true)} style={btnPrimary()}>Create staff login</button>
            ) : (
              <div>
                <div style={{ fontSize: 12, color: "#8B7355", marginBottom: 8 }}>
                  They&apos;ll sign in with: <strong style={{ color: "#F5F0EB" }}>{employee.email}</strong>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Initial password (10+ characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ ...inputStyle(), flex: 1, minWidth: 240 }}
                  />
                  <button onClick={createLogin} disabled={busy} style={btnPrimary()}>
                    {busy ? "Creating…" : "Create"}
                  </button>
                  <button onClick={() => { setShowCreate(false); setError(""); setNewPassword(""); }} style={btnSecondary()}>Cancel</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <span style={{
                padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                background: employee.portal_enabled ? "rgba(76,175,80,0.12)" : "rgba(139,115,85,0.12)",
                color: employee.portal_enabled ? "#4CAF50" : "#8B7355",
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}>{employee.portal_enabled ? "Portal access active" : "Portal access disabled"}</span>
              <span style={{ color: "#8B7355", fontSize: 13 }}>Signs in as {employee.email}</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={sendReset} style={btnSecondary()}>Send password reset email</button>
              {employee.portal_enabled && (
                <button onClick={disableLogin} disabled={busy} style={{ ...btnSecondary(), color: "#ff8a7a", borderColor: "rgba(255,107,94,0.3)" }}>
                  Disable portal access
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Pending leave requests */}
      <div style={{ background: "#141210", border: "1px solid #1e1a17", borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 11, color: "#D4654A", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
          Pending leave requests ({pending.length})
        </div>
        {pending.length === 0 ? (
          <div style={{ color: "#8B7355", fontSize: 13 }}>No pending requests. Approved leave automatically decrements the relevant balance.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pending.map((req) => (
              <div key={req.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
                padding: 14, background: "#0C0A09", border: "1px solid #2a2420", borderRadius: 10,
              }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontWeight: 700, color: "#F5F0EB", textTransform: "capitalize" }}>
                    {req.leave_type} · {req.days_count} day{req.days_count === 1 ? "" : "s"}
                  </div>
                  <div style={{ color: "#8B7355", fontSize: 13, marginTop: 4 }}>
                    {fmtDate(req.start_date)} – {fmtDate(req.end_date)} · requested {fmtDateTime(req.created_at)}
                  </div>
                  {req.reason && <div style={{ color: "#7A7068", fontSize: 12, marginTop: 4 }}>{req.reason}</div>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => decideLeave(req, "declined")} style={{ ...btnSecondary(), color: "#ff8a7a", borderColor: "rgba(255,107,94,0.3)" }}>Decline</button>
                  <button onClick={() => decideLeave(req, "approved")} style={btnPrimary()}>Approve</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past leave requests */}
      <div style={{ background: "#141210", border: "1px solid #1e1a17", borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 11, color: "#D4654A", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
          Leave history ({past.length})
        </div>
        {past.length === 0 ? (
          <div style={{ color: "#8B7355", fontSize: 13 }}>No past leave requests.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {past.map((req) => (
              <div key={req.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
                padding: "10px 14px", background: "#0C0A09", borderRadius: 8, fontSize: 13,
              }}>
                <div>
                  <span style={{ color: "#F5F0EB", fontWeight: 600, textTransform: "capitalize" }}>{req.leave_type}</span>
                  <span style={{ color: "#8B7355", marginLeft: 10 }}>
                    {fmtDate(req.start_date)} – {fmtDate(req.end_date)} · {req.days_count}d
                  </span>
                </div>
                <span style={{
                  padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  background: req.status === "approved" ? "rgba(76,175,80,0.12)" :
                              req.status === "declined" ? "rgba(255,107,94,0.12)" :
                              "rgba(139,115,85,0.12)",
                  color: req.status === "approved" ? "#4CAF50" :
                         req.status === "declined" ? "#ff8a7a" : "#8B7355",
                }}>{req.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SCHEDULE PANEL — weekly shift template
============================================================ */
type Schedule = {
  id: string;
  employee_id: string;
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  is_working_day: boolean;
  notes: string | null;
};

const DOW_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function SchedulePanel({ employeeId, firstName }: { employeeId: string; firstName: string }) {
  const supabase = createClient();
  const [rows, setRows] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("shift_schedules")
      .select("*")
      .eq("employee_id", employeeId)
      .order("day_of_week", { ascending: true });
    setRows((data as Schedule[]) || []);
    setLoading(false);
  }, [supabase, employeeId]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  // Build a 7-row local view, filling gaps with default off rows
  const byDow: Record<number, Schedule | null> = { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
  for (const r of rows) byDow[r.day_of_week] = r;

  function update(dow: number, patch: Partial<Schedule>) {
    setRows(prev => {
      const found = prev.find(r => r.day_of_week === dow);
      if (found) return prev.map(r => r.day_of_week === dow ? { ...r, ...patch } : r);
      return [...prev, {
        id: `new-${dow}`,
        employee_id: employeeId,
        day_of_week: dow,
        start_time: null,
        end_time: null,
        is_working_day: true,
        notes: null,
        ...patch,
      }];
    });
  }

  async function applyMonFri9to5() {
    setRows(prev => {
      const map = new Map(prev.map(r => [r.day_of_week, r]));
      for (let d = 1; d <= 5; d++) {
        map.set(d, {
          ...(map.get(d) || { id: `new-${d}`, employee_id: employeeId, day_of_week: d, notes: null }),
          day_of_week: d,
          is_working_day: true,
          start_time: "09:00",
          end_time: "17:00",
        } as Schedule);
      }
      for (const d of [0, 6]) {
        map.set(d, {
          ...(map.get(d) || { id: `new-${d}`, employee_id: employeeId, day_of_week: d, notes: null }),
          day_of_week: d,
          is_working_day: false,
          start_time: null,
          end_time: null,
        } as Schedule);
      }
      return Array.from(map.values()).sort((a, b) => a.day_of_week - b.day_of_week);
    });
  }

  async function save() {
    setError(""); setInfo(""); setSaving(true);
    // Upsert all 7 days
    const payload = Object.entries(byDow).map(([dowStr, row]) => {
      const dow = Number(dowStr);
      const r = row || { day_of_week: dow, is_working_day: false, start_time: null, end_time: null, notes: null };
      return {
        employee_id: employeeId,
        day_of_week: dow,
        is_working_day: r.is_working_day,
        start_time: r.is_working_day ? r.start_time : null,
        end_time: r.is_working_day ? r.end_time : null,
        notes: r.notes,
      };
    });
    // Validate
    for (const p of payload) {
      if (p.is_working_day && (!p.start_time || !p.end_time)) {
        setError(`Day ${DOW_LABELS[p.day_of_week]} is marked working but missing start/end time.`);
        setSaving(false);
        return;
      }
    }
    const { error: e } = await supabase
      .from("shift_schedules")
      .upsert(payload, { onConflict: "employee_id,day_of_week" });
    setSaving(false);
    if (e) { setError(e.message); return; }
    setInfo("Schedule saved.");
    await fetchSchedule();
  }

  if (loading) return <div style={{ color: "#8B7355", padding: 20 }}>Loading…</div>;

  return (
    <div style={{ background: "#141210", border: "1px solid #1e1a17", borderRadius: 12, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: "#F5F0EB" }}>Weekly shift template</h3>
          <p style={{ color: "#8B7355", fontSize: 12, margin: "4px 0 0 0" }}>
            {firstName}&apos;s scheduled work week. Late arrivals are flagged against these times (5-min grace).
          </p>
        </div>
        <button onClick={applyMonFri9to5} style={{
          padding: "6px 12px", background: "transparent", color: "#D4654A",
          border: "1px solid #2a2420", borderRadius: 6, fontSize: 12,
          fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        }}>Apply Mon–Fri 9–5</button>
      </div>

      {error && <div style={{ padding: 10, background: "rgba(255,107,94,0.08)", color: "#ff8a7a", borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{error}</div>}
      {info && <div style={{ padding: 10, background: "rgba(76,175,80,0.08)", color: "#4CAF50", borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{info}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[1, 2, 3, 4, 5, 6, 0].map(dow => {
          const r = byDow[dow];
          const working = r?.is_working_day ?? false;
          return (
            <div key={dow} style={{
              display: "grid",
              gridTemplateColumns: "110px auto 1fr 1fr",
              alignItems: "center",
              gap: 14,
              padding: "12px 14px",
              background: working ? "#100E0C" : "rgba(16,14,12,0.5)",
              border: "1px solid #1e1a17",
              borderRadius: 8,
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#F5F0EB" }}>{DOW_LABELS[dow]}</div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, color: working ? "#F5F0EB" : "#8B7355", fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={working}
                  onChange={(e) => update(dow, { is_working_day: e.target.checked })}
                />
                {working ? "Working" : "Off"}
              </label>
              <input
                type="time"
                value={r?.start_time?.slice(0, 5) ?? ""}
                disabled={!working}
                onChange={(e) => update(dow, { start_time: e.target.value || null })}
                style={{
                  padding: "8px 10px", borderRadius: 6, border: "1px solid #2a2420",
                  background: "#0C0A09", color: working ? "#F5F0EB" : "#5a504a", fontSize: 13,
                  fontFamily: "inherit", outline: "none", opacity: working ? 1 : 0.5,
                }}
              />
              <input
                type="time"
                value={r?.end_time?.slice(0, 5) ?? ""}
                disabled={!working}
                onChange={(e) => update(dow, { end_time: e.target.value || null })}
                style={{
                  padding: "8px 10px", borderRadius: 6, border: "1px solid #2a2420",
                  background: "#0C0A09", color: working ? "#F5F0EB" : "#5a504a", fontSize: 13,
                  fontFamily: "inherit", outline: "none", opacity: working ? 1 : 0.5,
                }}
              />
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
        <button onClick={save} disabled={saving} style={{
          padding: "10px 22px", background: "#D4654A", color: "#fff",
          border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13,
          cursor: saving ? "wait" : "pointer", fontFamily: "inherit",
        }}>{saving ? "Saving…" : "Save schedule"}</button>
      </div>
    </div>
  );
}
