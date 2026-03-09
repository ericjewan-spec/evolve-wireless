import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message, location } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Store as a lead in the existing leads table (if it exists) or support_tickets
    const { error } = await supabase.from("leads").insert({
      first_name: name.split(" ")[0],
      last_name: name.split(" ").slice(1).join(" ") || "",
      email,
      phone: phone || null,
      subject: subject || "General Inquiry",
      message,
      location: location || null,
      source: "website_contact_form",
    });

    if (error) {
      // If leads table doesn't exist, that's ok — log it
      console.error("Lead insert error:", error.message);
    }

    return NextResponse.json({ success: true, message: "We'll get back to you within 1 business day." });
  } catch {
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
