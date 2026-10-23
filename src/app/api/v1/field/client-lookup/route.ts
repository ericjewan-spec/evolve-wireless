import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-service";
import { verifyTech } from "@/lib/field-auth";
import { findClientByAccount } from "@/lib/uisp-sync";

export const dynamic = "force-dynamic";

/** POST { accountNumber } → { name, phone } — gated by the field install code. */
export async function POST(req: NextRequest) {
  const svc = createServiceClient();
  const { tech: authedTech, limited } = await verifyTech(req);
  if (limited) return NextResponse.json({ error: "too_many_attempts" }, { status: 429 });
  if (!authedTech) return NextResponse.json({ error: "invalid_code" }, { status: 403 });
  const { accountNumber } = await req.json().catch(() => ({}));
  if (!accountNumber || typeof accountNumber !== "string") {
    return NextResponse.json({ error: "missing_account" }, { status: 400 });
  }
  const client = await findClientByAccount(accountNumber);
  if (!client) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ name: client.name, phone: client.phone });
}
