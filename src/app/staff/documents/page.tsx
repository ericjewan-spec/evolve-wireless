"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useCurrentEmployee } from "@/lib/staff-auth";

type DocRow = {
  id: string;
  employee_id: string;
  category: string;
  filename: string;
  storage_path: string;
  file_size: number | null;
  mime_type: string | null;
  expiry_date: string | null;
  notes: string | null;
  uploaded_by_employee: boolean;
  created_at: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  contract: "Contract",
  id_passport: "ID / Passport",
  nis_card: "NIS card",
  tin_certificate: "TIN certificate",
  police_clearance: "Police clearance",
  medical_certificate: "Medical certificate",
  sick_note: "Sick note",
  certification: "Certification / training",
  performance_review: "Performance review",
  warning_letter: "Warning letter",
  photo: "Photo",
  other: "Other",
};

// Categories staff can self-upload
const STAFF_UPLOAD_CATEGORIES = ["medical_certificate", "sick_note", "certification", "other"] as const;

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GY", { day: "numeric", month: "short", year: "numeric" });
const fmtBytes = (n: number | null) => {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};
const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

export default function StaffDocumentsPage() {
  const { employee, loading } = useCurrentEmployee();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploadCat, setUploadCat] = useState<typeof STAFF_UPLOAD_CATEGORIES[number]>("sick_note");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchDocs = useCallback(async () => {
    if (!employee) return;
    setLoadingDocs(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("employee_documents")
      .select("*")
      .order("created_at", { ascending: false });
    setDocs((data as DocRow[]) || []);
    setLoadingDocs(false);
  }, [employee]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  async function downloadDoc(doc: DocRow) {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("employee-documents")
      .createSignedUrl(doc.storage_path, 60);
    if (error || !data) { alert(`Couldn't open file: ${error?.message ?? "unknown error"}`); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function handleFileChosen(file: File) {
    if (!employee) return;
    setUploadError("");
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File is too large (max 10 MB).");
      return;
    }
    setUploading(true);

    const supabase = createClient();
    const safeName = sanitize(file.name);
    const ts = Date.now();
    const path = `${employee.id}/${ts}_${safeName}`;

    const { error: upErr } = await supabase.storage
      .from("employee-documents")
      .upload(path, file, { contentType: file.type || "application/octet-stream" });

    if (upErr) {
      setUploadError(`Upload failed: ${upErr.message}`);
      setUploading(false);
      return;
    }

    const { error: insErr } = await supabase.from("employee_documents").insert({
      employee_id: employee.id,
      category: uploadCat,
      filename: file.name,
      storage_path: path,
      file_size: file.size,
      mime_type: file.type || null,
      notes: uploadNotes || null,
      uploaded_by_employee: true,
      staff_visible: true,
    });

    if (insErr) {
      setUploadError(`Database record failed: ${insErr.message}`);
      setUploading(false);
      return;
    }

    setUploadNotes("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(false);
    fetchDocs();
  }

  if (loading || !employee) return <div style={{ padding: 80, textAlign: "center", color: "#8B7355" }}>Loading…</div>;

  // Split HR-uploaded vs staff-uploaded
  const myUploads = docs.filter(d => d.uploaded_by_employee);
  const hrUploads = docs.filter(d => !d.uploaded_by_employee);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px 80px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "#F5F0EB", letterSpacing: "-0.01em" }}>Documents</h1>
      <p style={{ color: "#8B7355", margin: "4px 0 24px 0", fontSize: 14 }}>
        Files HR has shared with you, and a place to submit your own (sick notes, medical certificates, training certs).
      </p>

      <div style={{ background: "#141210", border: "1px solid #1e1a17", borderRadius: 12, padding: 18, marginBottom: 28, color: "#8B7355", fontSize: 13 }}>
        Documents below are shared with you by HR. To submit a sick note or other document, please send it to your manager directly.
      </div>

      <DocList title="From HR" docs={hrUploads} onDownload={downloadDoc} emptyText="HR hasn't shared any documents with you yet." />
      <div style={{ height: 28 }} />
      <DocList title="My submissions" docs={myUploads} onDownload={downloadDoc} emptyText="You haven't submitted anything yet." />

      {loadingDocs && <div style={{ marginTop: 14, color: "#8B7355", fontSize: 13 }}>Refreshing…</div>}
    </div>
  );
}

function DocList({ title, docs, onDownload, emptyText }: { title: string; docs: DocRow[]; onDownload: (d: DocRow) => void; emptyText: string }) {
  return (
    <div>
      <h2 style={{ fontSize: 14, color: "#F5F0EB", margin: "0 0 10px 0", fontWeight: 700 }}>{title}</h2>
      {docs.length === 0 ? (
        <div style={{ padding: 22, textAlign: "center", color: "#8B7355", fontSize: 13, background: "#141210", borderRadius: 12, border: "1px solid #1e1a17" }}>
          {emptyText}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {docs.map(d => (
            <div key={d.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap",
              gap: 14, padding: 14, background: "#141210", border: "1px solid #1e1a17", borderRadius: 10,
            }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, color: "#F5F0EB", fontSize: 14 }}>{d.filename}</span>
                  <span style={{
                    padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    background: "rgba(212,101,74,0.12)", color: "#D4654A",
                  }}>{CATEGORY_LABELS[d.category] || d.category}</span>
                </div>
                <div style={{ color: "#8B7355", fontSize: 12, marginTop: 4 }}>
                  {fmtDate(d.created_at)}{d.file_size ? ` · ${fmtBytes(d.file_size)}` : ""}
                  {d.expiry_date ? ` · expires ${fmtDate(d.expiry_date)}` : ""}
                </div>
                {d.notes && <div style={{ color: "#7A7068", fontSize: 12, marginTop: 4 }}>{d.notes}</div>}
              </div>
              <button onClick={() => onDownload(d)} style={btnSecondary}>Open</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, color: "#8B7355", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", fontSize: 14, background: "#0C0A09",
  border: "1px solid #2a2420", borderRadius: 8, color: "#F5F0EB",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};
const btnSecondary: React.CSSProperties = {
  padding: "8px 14px", background: "transparent", color: "#F5F0EB",
  border: "1px solid #2a2420", borderRadius: 8, fontWeight: 600, fontSize: 12,
  cursor: "pointer", fontFamily: "inherit",
};
