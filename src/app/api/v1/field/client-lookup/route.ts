import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-service";
import { findClientByAccount } from "@/lib/uisp-sync";

export const dynamic = "force-dynamic";

/** POST { accountNumber } → { name, phone } — gated by the field install code. */
export async function POST(req: NextRequest) {
  const svc = createServiceClient();
  const provided = req.headers.get("x-install-code")?.trim() || "";
  const { data: codeRow } = await svc.from("app_settings").select("value").eq("key", "field_install_code").maybeSingle();
  if (!codeRow?.value || provided !== codeRow.value) {
    return NextResponse.json({ error: "invalid_code" }, { status: 403 });
  }
  const { accountNumber } = await req.json().catch(() => ({}));
  if (!accountNumber || typeof accountNumber !== "string") {
    return NextResponse.json({ error: "missing_account" }, { status: 400 });
  }
  const client = await findClientByAccount(accountNumber);
  if (!client) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ name: client.name, phone: client.phone });
}
