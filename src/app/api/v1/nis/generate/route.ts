import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/nis/generate
 *
 * Triggers the Supabase Edge Function `nis-generate` to (re)build
 * the NIS schedule for the prior calendar month and render the PDF.
 *
 * Body (optional):
 *   { year: 2026, month: 6 }   // override target period
 *
 * Authenticated admins only.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "config_missing", detail: "Supabase env vars not configured" },
      { status: 500 },
    );
  }

  const url = `${supabaseUrl}/functions/v1/nis-generate`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      trigger: "manual",
      year: body.year,
      month: body.month,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { error: data.error || "generation_failed", detail: data.detail },
      { status: res.status },
    );
  }

  return NextResponse.json(data);
}
