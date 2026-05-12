import { createClient } from "@/lib/supabase-browser";

export type AuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "status_changed"
  | "document_uploaded"
  | "document_deleted"
  | "pin_reset"
  | "leave_balance_adjusted";

type AuditEntry = {
  employee_id: string | null;
  action: AuditAction;
  field_name?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  metadata?: Record<string, unknown> | null;
};

/**
 * Write a single audit log entry. Called from the browser; the audit table's
 * INSERT policy requires authenticated admin so this is safe.
 *
 * We also stamp admin_email + admin_name into the row (denormalised) so the
 * audit trail remains readable even if the admin is later deleted.
 */
export async function logAudit(entry: AuditEntry) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Fetch admin name/email for denormalised stamping
  const { data: adminRow } = await supabase
    .from("admins")
    .select("email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  await supabase.from("employee_audit_log").insert({
    employee_id: entry.employee_id,
    admin_id: user.id,
    admin_email: adminRow?.email ?? user.email ?? null,
    admin_name: adminRow?.full_name ?? null,
    action: entry.action,
    field_name: entry.field_name ?? null,
    old_value: entry.old_value ?? null,
    new_value: entry.new_value ?? null,
    metadata: entry.metadata ?? null,
  });
}

/**
 * Compare two objects and write one audit entry per changed field.
 * Skips fields whose value is unchanged or both null/undefined/empty.
 */
export async function logFieldChanges<T extends Record<string, unknown>>(
  employeeId: string,
  before: T,
  after: T,
  fields: (keyof T)[],
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: adminRow } = await supabase
    .from("admins")
    .select("email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const entries: Array<Record<string, unknown>> = [];
  for (const field of fields) {
    const oldV = before[field];
    const newV = after[field];
    const oldStr = oldV == null ? null : String(oldV);
    const newStr = newV == null ? null : String(newV);
    if (oldStr === newStr) continue;
    entries.push({
      employee_id: employeeId,
      admin_id: user.id,
      admin_email: adminRow?.email ?? user.email ?? null,
      admin_name: adminRow?.full_name ?? null,
      action: "updated",
      field_name: String(field),
      old_value: oldStr,
      new_value: newStr,
    });
  }

  if (entries.length > 0) {
    await supabase.from("employee_audit_log").insert(entries);
  }
}
