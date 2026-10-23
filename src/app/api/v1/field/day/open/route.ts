import { NextRequest, NextResponse } from "next/server";
import { gate } from "../_shared";

export const dynamic = "force-dynamic";

/**
 * GET — open day sheets, each with the tech's field payments made since the
 * sheet was opened (count, total, item labels) for close-out reconciliation.
 */
export async function GET(req: NextRequest) {
  const { svc, fail } = await gate(req);
  if (fail) return fail;

  const { data: sheets, error } = await svc
    .from("tech_day_sheets")
    .select("id, created_at, sheet_date, technician_name, cash_advance_gyd, cash_purpose, equipment_taken")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) return NextResponse.json({ error: "db_error", detail: error.message }, { status: 500 });

  const out = await Promise.all(
    (sheets || []).map(async (s) => {
      const { data: pays } = await svc
        .from("field_payments")
        .select("total_gyd, items, technician_name, created_at")
        .gte("created_at", s.created_at)
        .ilike("technician_name", s.technician_name.trim());
      const paymentsTotal = (pays || []).reduce((sum, p) => sum + Number(p.total_gyd || 0), 0);
      const paymentsItems = (pays || []).flatMap((p) => (Array.isArray(p.items) ? p.items : []));
      return { ...s, paymentsCount: (pays || []).length, paymentsTotal, paymentsItems };
    }),
  );

  return NextResponse.json({ sheets: out });
}
