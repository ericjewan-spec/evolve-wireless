import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check for any recent open critical/high priority tickets (network-wide indicator)
    const { data: incidents } = await supabase
      .from("support_tickets")
      .select("id, type, priority, status, created_at")
      .in("priority", ["critical", "high"])
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(10);

    // Check for active outages from service_outages table (if exists)
    const { data: outages } = await supabase
      .from("service_outages")
      .select("*")
      .eq("is_active", true)
      .order("started_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      status: (outages && outages.length > 0) ? "degraded" : "operational",
      incidents: outages || [],
      open_tickets_high: incidents?.length || 0,
      last_updated: new Date().toISOString(),
    }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch {
    // If tables don't exist yet, return operational
    return NextResponse.json({
      status: "operational",
      incidents: [],
      open_tickets_high: 0,
      last_updated: new Date().toISOString(),
    });
  }
}
