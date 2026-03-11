import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, business_name, business_type, service_interest, budget, timeline, message } = body;

    if (!name || !phone || !service_interest) {
      return NextResponse.json({ error: "Name, phone, and service interest are required" }, { status: 400 });
    }

    const { error } = await supabase.from("leads").insert({
      name,
      email: email || null,
      phone,
      subject: "micro-strategy",
      message: JSON.stringify({ business_name, business_type, service_interest, budget, timeline, project_details: message }),
      source: "micro_strategy_consultation",
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
