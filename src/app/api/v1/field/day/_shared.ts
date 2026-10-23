import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-service";

/** Shared field-code gate for the day-sheet endpoints. */
export async function gate(req: NextRequest) {
  const svc = createServiceClient();
  const provided = req.headers.get("x-install-code")?.trim() || "";
  const { data: codeRow } = await svc.from("app_settings").select("value").eq("key", "field_install_code").maybeSingle();
  if (!codeRow?.value || provided !== codeRow.value) {
    return { svc, fail: NextResponse.json({ error: "invalid_code" }, { status: 403 }) };
  }
  return { svc, fail: null };
}

/** Guyana (UTC-4) calendar date. */
export const guyanaDate = () => new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 10);
