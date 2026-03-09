import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: zones, error } = await supabase
      .from("coverage_zones")
      .select("*")
      .order("name");

    if (error) throw error;

    return NextResponse.json(zones, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch coverage zones" }, { status: 500 });
  }
}
