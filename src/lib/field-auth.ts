import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-service";

/**
 * Personal-code auth for the field tools (/install, /payments, /day).
 *
 * One code per technician (field_techs table). The code alone identifies the
 * tech — same single-box unlock as before, but a leaver's code can be
 * deactivated individually (Supabase → field_techs → active=false) without
 * touching anyone else. Requests keep the existing x-install-code header,
 * now carrying the tech's personal code. Failed attempts are logged and
 * rate-limited per IP (field_auth_log) against brute force.
 */

const MAX_FAILS = 8;
const WINDOW_MIN = 10;

export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function recentFailures(svc: ReturnType<typeof createServiceClient>, ip: string): Promise<number> {
  const since = new Date(Date.now() - WINDOW_MIN * 60 * 1000).toISOString();
  const { count } = await svc
    .from("field_auth_log")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .eq("success", false)
    .gte("created_at", since);
  return count || 0;
}

export async function logAttempt(
  svc: ReturnType<typeof createServiceClient>,
  data: { tech: string | null; success: boolean; deviceId: string | null; ip: string },
): Promise<void> {
  await svc.from("field_auth_log").insert({
    tech_name: data.tech,
    success: data.success,
    device_id: data.deviceId,
    ip: data.ip,
  });
}

export type AuthedTech = { name: string } | null;

/** Validate the personal code on a field API request (x-install-code header). */
export async function verifyTech(req: NextRequest): Promise<{ tech: AuthedTech; limited: boolean }> {
  const svc = createServiceClient();
  const pin = req.headers.get("x-install-code")?.trim() || "";
  if (!pin) return { tech: null, limited: false };

  const ip = clientIp(req);
  if ((await recentFailures(svc, ip)) >= MAX_FAILS) return { tech: null, limited: true };

  const { data } = await svc
    .from("field_techs")
    .select("name")
    .eq("pin", pin)
    .eq("active", true)
    .maybeSingle();

  if (!data) {
    await logAttempt(svc, { tech: null, success: false, deviceId: null, ip });
    return { tech: null, limited: false };
  }
  return { tech: { name: data.name }, limited: false };
}
