import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-service";
import { clientIp, logAttempt, recentFailures } from "@/lib/field-auth";
import { slackNewDeviceUnlock } from "@/lib/slack";

export const dynamic = "force-dynamic";

/**
 * POST { code, deviceId? } — validates a technician's PERSONAL code and
 * returns who they are. One code per tech (field_techs). Rate-limited per
 * IP, every attempt audited, Slack alert when a code unlocks a new device.
 */
export async function POST(req: NextRequest) {
  const svc = createServiceClient();
  const body = await req.json().catch(() => ({}));
  const pin = String(body.code || "").trim();
  const deviceId = String(body.deviceId || "").slice(0, 64) || null;
  const ip = clientIp(req);

  if ((await recentFailures(svc, ip)) >= 8) {
    return NextResponse.json(
      { ok: false, error: "too_many_attempts", detail: "Too many wrong attempts — wait 10 minutes." },
      { status: 429 },
    );
  }
  if (!pin) return NextResponse.json({ ok: false });

  const { data: tech } = await svc
    .from("field_techs")
    .select("name")
    .eq("pin", pin)
    .eq("active", true)
    .maybeSingle();

  if (!tech) {
    await logAttempt(svc, { tech: null, success: false, deviceId, ip });
    return NextResponse.json({ ok: false });
  }

  let newDevice = false;
  if (deviceId) {
    const { count } = await svc
      .from("field_auth_log")
      .select("id", { count: "exact", head: true })
      .eq("tech_name", tech.name)
      .eq("device_id", deviceId)
      .eq("success", true);
    newDevice = (count || 0) === 0;
  }
  await logAttempt(svc, { tech: tech.name, success: true, deviceId, ip });
  if (newDevice) { try { await slackNewDeviceUnlock(tech.name, ip); } catch { /* best effort */ } }

  return NextResponse.json({ ok: true, techName: tech.name });
}
