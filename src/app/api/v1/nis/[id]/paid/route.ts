import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/nis/[id]/paid
 *
 * Marks an NIS schedule as paid. Records the actor (logged-in admin)
 * and an optional payment reference (NIS receipt #).
 *
 * Body:
 *   { payment_ref?: string }
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const paymentRef = (body.payment_ref ?? null) as string | null;

  const actor = user.email ?? user.id;

  const { error } = await supabase.rpc("mark_nis_schedule_paid", {
    p_schedule_id: id,
    p_actor: actor,
    p_ref: paymentRef,
  });

  if (error) {
    return NextResponse.json(
      { error: "mark_paid_failed", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ status: "ok", id });
}
