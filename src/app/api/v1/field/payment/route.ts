import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-service";
import { findClientByAccount, createFieldPayment } from "@/lib/uisp-sync";
import { slackFieldPayment } from "@/lib/slack";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/field/payment — record a field cash collection.
 *
 * Gated by the field install code. Looks the customer up in UISP by account
 * number, records a Cash payment there with a note of what was paid for and
 * which tech collected it, saves the collection (with the customer's
 * signature) in field_payments, and notifies #billing-payments with the
 * amount the tech must remit to the office. Returns what the success screen
 * needs for the WhatsApp receipt.
 */
export async function POST(req: NextRequest) {
  const svc = createServiceClient();
  const provided = req.headers.get("x-install-code")?.trim() || "";
  const { data: codeRow } = await svc.from("app_settings").select("value").eq("key", "field_install_code").maybeSingle();
  if (!codeRow?.value || provided !== codeRow.value) {
    return NextResponse.json({ error: "invalid_code" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { accountNumber, items, technicianName, subscriberSignature } = body;

  if (!accountNumber || typeof accountNumber !== "string") {
    return NextResponse.json({ error: "missing_account" }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "no_items", detail: "Add at least one item." }, { status: 400 });
  }
  const clean = items
    .slice(0, 15)
    .map((i: { label?: unknown; amountGyd?: unknown }) => ({
      label: String(i.label || "").slice(0, 80).trim(),
      amountGyd: Math.round(Number(i.amountGyd) || 0),
    }))
    .filter((i) => i.label && i.amountGyd > 0);
  if (!clean.length) {
    return NextResponse.json({ error: "no_items", detail: "Each item needs a name and an amount." }, { status: 400 });
  }
  const total = clean.reduce((s, i) => s + i.amountGyd, 0);
  const tech = String(technicianName || "").trim();
  if (!tech) return NextResponse.json({ error: "missing_tech", detail: "Technician name is required." }, { status: 400 });

  // 1) Find the customer in UISP.
  const client = await findClientByAccount(accountNumber);
  if (!client) {
    return NextResponse.json({ error: "account_not_found", detail: `No UISP client with account ${accountNumber}.` }, { status: 404 });
  }

  // 2) Record the payment on their UISP account with a note of what it's for.
  const itemsSummary = clean.map((i) => `${i.label} — GYD ${i.amountGyd.toLocaleString("en-US")}`).join(", ");
  const note = `Field collection: ${itemsSummary}. Collected in cash by ${tech} (to remit to office).`;
  const { paymentId, error: payError } = await createFieldPayment(client.clientId, total, note);

  // 3) Save the collection record.
  const { data: row, error: dbError } = await svc
    .from("field_payments")
    .insert({
      account_number: accountNumber.trim().toUpperCase(),
      uisp_client_id: String(client.clientId),
      uisp_payment_id: paymentId,
      customer_name: client.name,
      customer_phone: client.phone,
      items: clean,
      total_gyd: total,
      technician_name: tech,
      subscriber_signature: typeof subscriberSignature === "string" ? subscriberSignature : null,
      status: paymentId ? "recorded" : "pending_uisp",
      uisp_error: payError,
    })
    .select("id")
    .single();
  if (dbError) {
    console.error("field_payments insert error:", dbError);
    return NextResponse.json({ error: "db_error", detail: dbError.message }, { status: 500 });
  }

  // 4) Notify #billing-payments (best effort).
  try {
    await slackFieldPayment({
      accountNumber: accountNumber.trim().toUpperCase(),
      customerName: client.name,
      itemsSummary,
      totalGyd: total,
      technicianName: tech,
      uispPaymentId: paymentId,
    });
  } catch { /* non-blocking */ }

  return NextResponse.json({
    ok: true,
    id: row.id,
    customerName: client.name,
    customerPhone: client.phone,
    totalGyd: total,
    items: clean,
    uispRecorded: Boolean(paymentId),
  });
}
