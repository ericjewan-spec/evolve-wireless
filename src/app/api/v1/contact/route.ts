import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { sendContactConfirmation, sendContactNotification } from "@/lib/email";
import { slackContactForm } from "@/lib/slack";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message, location } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Store in database
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
      console.error("Lead insert error:", error.message);
    }

    // Send email confirmation to customer + notification to team (fire-and-forget)
    Promise.all([
      sendContactConfirmation(email, name),
      sendContactNotification({ name, email, phone, subject, message }),
      slackContactForm({ name, email, phone, subject, message }),
    ]).catch((e) => console.error("Notification error:", e));

    return NextResponse.json({ success: true, message: "We'll get back to you within 1 business day." });
  } catch {
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
