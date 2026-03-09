import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { address, lat, lng } = await req.json();

    const supabase = await createClient();

    // Get all live coverage zones
    const { data: zones } = await supabase
      .from("coverage_zones")
      .select("*")
      .eq("status", "live");

    // Simple address-based matching (can be enhanced with GeoJSON polygon checks)
    const addressLower = (address || "").toLowerCase();
    const matchedZone = zones?.find((z) => {
      const areas = (z.areas || []).map((a: string) => a.toLowerCase());
      return areas.some((a: string) => addressLower.includes(a) || a.includes(addressLower));
    });

    if (matchedZone) {
      // Get available plans for this zone's region
      const region = matchedZone.region === "Region 1" ? "region1" : "ecd";
      const { data: plans } = await supabase
        .from("plans")
        .select("*")
        .eq("region", region)
        .eq("is_active", true)
        .order("sort_order");

      return NextResponse.json({
        covered: true,
        zone_id: matchedZone.id,
        zone_name: matchedZone.name,
        available_plans: plans || [],
        estimated_install_days: region === "ecd" ? 2 : 7,
      });
    }

    return NextResponse.json({
      covered: false,
      zone_id: null,
      available_plans: [],
      message: "Your area is not yet covered. Join our waitlist to be notified when we expand to your area.",
    });
  } catch {
    return NextResponse.json({ error: "Failed to check coverage" }, { status: 500 });
  }
}
