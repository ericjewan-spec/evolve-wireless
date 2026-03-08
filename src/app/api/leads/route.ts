import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { first_name, last_name, phone, email, plan_interest } = body;

    if (!first_name || !last_name || !phone) {
      return NextResponse.json(
        { error: "First name, last name, and phone are required" },
        { status: 400 }
      );
    }

    // Validate Guyanese phone
    if (!/^\+592\d{7}$/.test(phone)) {
      return NextResponse.json(
        { error: "Phone must be a valid Guyanese number (+592 followed by 7 digits)" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.from("leads").insert({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone,
      email: email?.trim() || null,
      plan_interest: plan_interest || null,
      source: "website-api",
    }).select().single();

    if (error) {
      console.error("Lead insert error:", error);
      return NextResponse.json(
        { error: "Failed to save. Please try WhatsApp instead." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Server error. Please try WhatsApp instead." },
      { status: 500 }
    );
  }
}
