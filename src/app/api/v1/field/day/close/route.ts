import { NextRequest, NextResponse } from "next/server";
import { gate } from "../_shared";
import { slackDayClose } from "@/lib/slack";

export const dynamic = "force-dynamic";

/** POST — close a day sheet with returns, purchase receipts, and reconciliation. */
export async function POST(req: NextRequest) {
  const { svc, fail } = await gate(req);
  if (fail) return fail;

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const { data: sheet } = await svc.from("tech_day_sheets").select("*").eq("id", id).maybeSingle();
  if (!sheet) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (sheet.status !== "open") return NextResponse.json({ error: "already_closed" }, { status: 409 });

  const returned = (Array.isArray(body.equipmentReturned) ? body.equipmentReturned : [])
    .slice(0, 20)
    .map((e: { item?: unknown; qty?: unknown }) => ({
      item: String(e.item || "").slice(0, 60).trim(),
      qty: Math.max(0, Math.round(Number(e.qty) || 0)),
    }))
    .filter((e: { item: string }) => e.item);
  const purchases = Math.max(0, Math.round(Number(body.purchasesGyd) || 0));
  const cashBack = Math.max(0, Math.round(Number(body.cashReturnedGyd) || 0));
  const notes = String(body.notes || "").slice(0, 400).trim() || null;

  // Snapshot the tech's field payments since the sheet opened.
  const { data: pays } = await svc
    .from("field_payments")
    .select("total_gyd")
    .gte("created_at", sheet.created_at)
    .ilike("technician_name", String(sheet.technician_name).trim());
  const collectionsTotal = (pays || []).reduce((s, p) => s + Number(p.total_gyd || 0), 0);
  const collectionsCount = (pays || []).length;

  const { error } = await svc
    .from("tech_day_sheets")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
      equipment_returned: returned,
      purchases_gyd: purchases,
      cash_returned_gyd: cashBack,
      close_notes: notes,
      collections_total_gyd: collectionsTotal,
      collections_count: collectionsCount,
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: "db_error", detail: error.message }, { status: 500 });

  // Equipment summary: taken vs returned per item.
  const taken: { item: string; qty: number }[] = Array.isArray(sheet.equipment_taken) ? sheet.equipment_taken : [];
  const equipmentSummary = taken
    .map((t) => {
      const r = returned.find((x: { item: string }) => x.item.toLowerCase() === t.item.toLowerCase())?.qty ?? 0;
      return `${t.item}: ${t.qty} out / ${r} back${t.qty - r > 0 ? ` / ${t.qty - r} used` : ""}`;
    })
    .join("\n");

  try {
    await slackDayClose({
      technicianName: sheet.technician_name,
      cashAdvanceGyd: Number(sheet.cash_advance_gyd || 0),
      purchasesGyd: purchases,
      cashReturnedGyd: cashBack,
      equipmentSummary,
      collectionsTotalGyd: collectionsTotal,
      collectionsCount,
      notes,
    });
  } catch { /* best effort */ }

  return NextResponse.json({
    ok: true,
    collectionsTotal,
    collectionsCount,
    cashDiff: Math.round(Number(sheet.cash_advance_gyd || 0) - purchases - cashBack),
  });
}
