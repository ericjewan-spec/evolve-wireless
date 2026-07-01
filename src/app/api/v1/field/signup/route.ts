import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-service";
import { provisionInstalledClient } from "@/lib/uisp-sync";
import { slackNewSignup } from "@/lib/slack";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/field/signup
 *
 * Called by the public field-tech install form (/install) when an
 * installation is completed. Access is gated by the shared install code
 * (x-install-code header), not a staff login. Flow:
 *   1. Validate the shared install code
 *   2. Provision the client in UISP CRM (client + service + account number)
 *   3. Persist the install as a field_signups row
 *   4. Return { token, accountNumber, contractUrl } for WhatsApp delivery
 */
export async function POST(req: NextRequest) {
  const svc = createServiceClient();

  // 1) Gate on the shared install code (defense-in-depth; the form checks too).
  const provided = req.headers.get("x-install-code")?.trim() || "";
  const { data: codeRow } = await svc
    .from("app_settings")
    .select("value")
    .eq("key", "field_install_code")
    .maybeSingle();
  const expected = codeRow?.value || null;
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "invalid_code" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    fullName, phone, email, region, village, address,
    planId, planName, monthlyGyd, baseMbps, installFeeGyd,
    equipment, wifiName, wifiPassword, landlordName,
    subscriberSignature, technicianName, installDate,
  } = body;

  if (!fullName || !phone || !address || !planId) {
    return NextResponse.json(
      { error: "missing_fields", detail: "fullName, phone, address and planId are required." },
      { status: 400 },
    );
  }

  const [firstName, ...rest] = String(fullName).trim().split(" ");
  const lastName = rest.join(" ") || firstName;

  // 2) Provision in UISP (graceful if the CRM App Key isn't set yet).
  let uispClientId: string | null = null;
  let uispServiceId: string | null = null;
  let accountNumber: string | null = null;
  let uispError: string | null = null;

  try {
    const provisioned = await provisionInstalledClient({
      firstName,
      lastName,
      phone,
      email,
      address: `${address}${village ? ", " + village : ""}`,
      region,
      city: region === "region1" ? "Port Kaituma" : "Georgetown",
      planId,
    });
    if (provisioned) {
      uispClientId = provisioned.uispClientId;
      uispServiceId = provisioned.uispServiceId;
      accountNumber = provisioned.accountNumber;
    }
  } catch (err) {
    uispError = (err as Error).message;
    console.error("field/signup UISP provision error:", uispError);
  }

  // 3) Persist the install.
  const { data: row, error: insErr } = await svc
    .from("field_signups")
    .insert({
      full_name: fullName,
      phone,
      email: email || null,
      region: region || "ecd",
      village: village || null,
      address,
      plan_id: planId,
      plan_name: planName,
      monthly_gyd: Number(monthlyGyd) || 0,
      base_mbps: Number(baseMbps) || 0,
      install_fee_gyd: Number(installFeeGyd) || 20000,
      equipment: equipment || "Ubiquiti LiteBeam AC Gen2",
      wifi_name: wifiName || null,
      wifi_password: wifiPassword || null,
      landlord_name: landlordName || null,
      subscriber_signature: subscriberSignature || null,
      technician_name: technicianName || null,
      install_date: installDate || undefined,
      uisp_client_id: uispClientId,
      uisp_service_id: uispServiceId,
      account_number: accountNumber,
      uisp_synced_at: uispClientId ? new Date().toISOString() : null,
      uisp_error: uispError,
      status: uispClientId ? "active" : "pending_sync",
      created_by: null,
    })
    .select("id, public_token, account_number")
    .single();

  if (insErr) {
    console.error("field/signup insert error:", insErr);
    return NextResponse.json(
      { error: "db_error", detail: insErr.message, uisp_client_id: uispClientId, account_number: accountNumber },
      { status: 500 },
    );
  }

  // 4) Fire-and-forget internal notification (best effort).
  try {
    await slackNewSignup({
      name: fullName,
      email: email || "—",
      phone,
      plan: `${planName}${accountNumber ? " · " + accountNumber : ""}`,
      region: region === "region1" ? "Region 1" : "East Coast Demerara",
      address: `${address}${village ? ", " + village : ""}`,
    });
  } catch { /* non-blocking */ }

  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.evolvewireless.gy";
  const contractUrl = `${base}/contract/${row.public_token}`;

  return NextResponse.json({
    success: true,
    id: row.id,
    token: row.public_token,
    accountNumber: row.account_number, // null if UISP not yet connected
    contractUrl,
    uispConnected: Boolean(uispClientId),
    uispError,
  });
}
