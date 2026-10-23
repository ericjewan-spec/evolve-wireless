import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-service";
import { verifyTech } from "@/lib/field-auth";

/** Shared PIN gate for the day-sheet endpoints. */
export async function gate(req: NextRequest) {
  const svc = createServiceClient();
  const { tech, limited } = await verifyTech(req);
  if (limited) return { svc, tech: null, fail: NextResponse.json({ error: "too_many_attempts" }, { status: 429 }) };
  if (!tech) return { svc, tech: null, fail: NextResponse.json({ error: "invalid_code" }, { status: 403 }) };
  return { svc, tech, fail: null };
}

/** Guyana (UTC-4) calendar date. */
export const guyanaDate = () => new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 10);
