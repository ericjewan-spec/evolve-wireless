import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createUISPClient } from "@/lib/uisp-sync";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { first_name, last_name, phone, email, plan_interest, source, utm_source } = body;

    if (!first_name || !last_name || !phone) {
      return NextResponse.json(
        { error: "First name, last name, and phone are required" },
        { status: 400 }
      );
    }

    if (!/^\+592\d{7}$/.test(phone)) {
      return NextResponse.json(
        { error: "Phone must be a valid Guyanese number (+592 followed by 7 digits)" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Save to Supabase leads table
    const { data, error } = await supabase.from("leads").insert({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone,
      email: email?.trim() || null,
      plan_interest: plan_interest || null,
      source: source || "website",
      utm_source: utm_source || null,
    }).select().single();

    if (error) {
      console.error("Lead insert error:", error);
      return NextResponse.json(
        { error: "Failed to save. Please try WhatsApp instead." },
        { status: 500 }
      );
    }

    // 2. Sync to UISP CRM (non-blocking — don't fail the request if UISP is down)
    try {
      await createUISPClient({
        firstName: first_name.trim(),
        lastName: last_name.trim(),
        phone,
        email: email?.trim() || undefined,
      });
      console.log(`UISP: Created client for ${first_name} ${last_name}`);
    } catch (uispErr) {
      console.error("UISP sync failed (non-blocking):", uispErr);
      // Don't fail the request — lead is saved in Supabase
    }

    // 3. Send WhatsApp notification to Evolve team (non-blocking)
    try {
      await sendLeadNotification({
        name: `${first_name} ${last_name}`,
        phone,
        email: email || "Not provided",
        source: source || "website",
      });
    } catch (notifyErr) {
      console.error("Notification failed (non-blocking):", notifyErr);
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Server error. Please try WhatsApp instead." },
      { status: 500 }
    );
  }
}

// Send notification to Evolve team about new lead
async function sendLeadNotification(lead: { name: string; phone: string; email: string; source: string }) {
  const evolvePhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5926092487";
  const message = `🔔 New Lead from evolvewireless.gy\n\nName: ${lead.name}\nPhone: ${lead.phone}\nEmail: ${lead.email}\nSource: ${lead.source}\n\nRespond within 1 hour!`;

  // Option 1: WhatsApp Business API (if configured)
  const waApiKey = process.env.WHATSAPP_API_KEY;
  const waPhoneId = process.env.WHATSAPP_PHONE_ID;

  if (waApiKey && waPhoneId) {
    await fetch(`https://graph.facebook.com/v18.0/${waPhoneId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${waApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: evolvePhone,
        type: "text",
        text: { body: message },
      }),
    });
    return;
  }

  // Option 2: Send email notification via Supabase Edge Function or webhook
  const webhookUrl = process.env.LEAD_NOTIFICATION_WEBHOOK;
  if (webhookUrl) {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message, lead }),
    });
    return;
  }

  // Fallback: just log it
  console.log("📩 NEW LEAD:", message);
}
