import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, property_type, location, region, monthly_bill, roof_type, has_generator, battery_interest, timeline, message } = body;

    if (!name || !phone || !property_type) {
      return NextResponse.json({ error: "Name, phone, and property type are required" }, { status: 400 });
    }

    const { error } = await supabase.from("leads").insert({
      name,
      email: email || null,
      phone,
      subject: "solar",
      message: JSON.stringify({ property_type, location, region, monthly_bill, roof_type, has_generator, battery_interest, timeline, additional_info: message }),
      source: "solar_quote_form",
    });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
