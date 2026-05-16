"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

interface Props {
  employeeId: string;
  initial: {
    nis_number?: string | null;
    tin_number?: string | null;
    address?: string | null;
    date_of_birth?: string | null;
    exclude_from_nis?: boolean | null;
  };
}

/**
 * Drop-in component for the employee detail page.
 * Captures the four fields needed for the NIS schedule.
 *
 * Usage in /admin/payroll/employees/[id]/page.tsx:
 *   import EmployeeNisFields from "@/components/EmployeeNisFields";
 *   <EmployeeNisFields employeeId={employee.id} initial={employee} />
 */
export default function EmployeeNisFields({ employeeId, initial }: Props) {
  const supabase = createClient();
  const [nis, setNis] = useState(initial.nis_number ?? "");
  const [tin, setTin] = useState(initial.tin_number ?? "");
  const [addr, setAddr] = useState(initial.address ?? "");
  const [dob, setDob] = useState(initial.date_of_birth ?? "");
  const [excl, setExcl] = useState(!!initial.exclude_from_nis);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"" | "saved" | "error">("");
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true);
    setStatus("");
    setErr("");

    if (nis && !/^[A-Z]\d{8}$/i.test(nis.trim())) {
      setErr("NIS number should look like A12345678 or B12345678.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("employees")
      .update({
        nis_number: nis.trim() || null,
        tin_number: tin.trim() || null,
        address: addr.trim() || null,
        date_of_birth: dob || null,
        exclude_from_nis: excl,
      })
      .eq("id", employeeId);

    setSaving(false);
    if (error) {
      setErr(error.message);
      setStatus("error");
    } else {
      setStatus("saved");
      setTimeout(() => setStatus(""), 2000);
    }
  }

  return (
    <div
      style={{
        marginTop: 24,
        padding: 20,
        background: "#141210",
        border: "1px solid #1e1a17",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 14,
        }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: "#F5F0EB",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          NIS &amp; statutory details
        </h3>
        <span style={{ fontSize: 11, color: "#8B7355" }}>
          Required for the monthly NIS schedule
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        <Field label="NIS number" hint="e.g. B20780466">
          <input
            value={nis}
            onChange={(e) => setNis(e.target.value.toUpperCase())}
            placeholder="A12345678"
            style={inputStyle}
          />
        </Field>
        <Field label="TIN" hint="GRA Taxpayer Identification Number">
          <input
            value={tin}
            onChange={(e) => setTin(e.target.value)}
            placeholder="123456789"
            style={inputStyle}
          />
        </Field>
        <Field label="Date of birth">
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Address">
          <input
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            placeholder="Lot, street, village, region"
            style={inputStyle}
          />
        </Field>
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 16,
          fontSize: 13,
          color: "#8B7355",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={excl}
          onChange={(e) => setExcl(e.target.checked)}
          style={{ width: 16, height: 16, accentColor: "#D4654A" }}
        />
        Exclude from NIS schedule (e.g. casual/hourly worker)
      </label>

      {err && (
        <div
          style={{
            padding: 10,
            background: "rgba(255,107,94,0.08)",
            color: "#ff8a7a",
            borderRadius: 6,
            marginTop: 14,
            fontSize: 12,
          }}
        >
          {err}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 16,
          alignItems: "center",
        }}
      >
        {status === "saved" && (
          <span style={{ color: "#4CAF50", fontSize: 12, fontWeight: 600 }}>
            ✓ Saved
          </span>
        )}
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: "10px 18px",
            background: "#D4654A",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            cursor: saving ? "wait" : "pointer",
            fontFamily: "inherit",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving…" : "Save NIS details"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          color: "#8B7355",
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {label}
        {hint && (
          <span
            style={{
              color: "#5c4f3f",
              fontWeight: 400,
              marginLeft: 6,
            }}
          >
            · {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 6,
  border: "1px solid #2a2420",
  background: "#0C0A09",
  color: "#F5F0EB",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};
