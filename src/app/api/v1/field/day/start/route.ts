import { NextRequest, NextResponse } from "next/server";
import { gate, guyanaDate } from "../_shared";
import { slackDayStart } from "@/lib/slack";

export const dynamic = "force-dynamic";

/** POST — open a day sheet: cash advance + equipment checked out. */
export async function POST(req: NextRequest) {
  const { svc, fail } = await gate(req);
  if (fail) return fail;

  const body = await req.json().catch(() => ({}));
  const tech = String(body.technicianName || "").trim();
  if (!tech) return NextResponse.json({ error: "missing_tech", detail: "Technician name is required." }, { status: 400 });

  const cash = Math.max(0, Math.round(Number(body.cashAdvanceGyd) || 0));
  const purpose = String(body.cashPurpose || "").slice(0, 200).trim() || null;
  const equipment = (Array.isArray(body.equipment) ? body.equipment : [])
    .slice(0, 20)
    .map((e: { item?: unknown; qty?: unknown }) => ({
      item: String(e.item || "").slice(0, 60).trim(),
      qty: Math.max(1, Math.round(Number(e.qty) || 1)),
    }))
    .filter((e: { item: string }) => e.item);

  if (!cash && !equipment.length) {
    return NextResponse.json({ error: "empty", detail: "Add cash and/or equipment." }, { status: 400 });
  }

  const { data: row, error } = await svc
    .from("tech_day_sheets")
    .insert({
      sheet_date: guyanaDate(),
      technician_name: tech,
      cash_advance_gyd: cash,
      cash_purpose: purpose,
      equipment_taken: equipment,
    })
    .select("id, sheet_date")
    .single();
  if (error) return NextResponse.json({ error: "db_error", detail: error.message }, { status: 500 });

  try { await slackDayStart({ technicianName: tech, cashAdvanceGyd: cash, cashPurpose: purpose, equipment }); } catch { /* best effort */ }

  return NextResponse.json({ ok: true, id: row.id, sheetDate: row.sheet_date });
}
