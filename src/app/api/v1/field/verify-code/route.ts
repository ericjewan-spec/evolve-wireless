import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/field/verify-code
 * Body: { code: string }
 *
 * Validates the shared field-install access code against app_settings
 * (server-only). Used to gate the public /install form so only techs who
 * know the code can reach it — no individual staff login required.
 */
export async function POST(req: NextRequest) {
  const { code } = await req.json().catch(() => ({ code: "" }));
  const svc = createServiceClient();
  const { data } = await svc
    .from("app_settings")
    .select("value")
    .eq("key", "field_install_code")
    .maybeSingle();

  const expected = data?.value || null;
  const ok = Boolean(expected) && String(code).trim() === expected;
  return NextResponse.json({ ok });
}
