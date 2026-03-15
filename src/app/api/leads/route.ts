import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/email";

const ADMIN_EMAIL = process.env.NOTIFICATION_EMAIL || "ericjewan@gmail.com"; // Resend account owner until domain verified
const SLACK_WEBHOOK = process.env.SLACK_LEADS_WEBHOOK_URL || process.env.SLACK_WEBHOOK_GENERAL || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { first_name, last_name, phone, email, source, plan_interest } = body;

    if (!first_name || !last_name || !phone) {
      return NextResponse.json({ error: "First name, last name, and phone are required" }, { status: 400 });
    }

    if (!/^\+592\d{7}$/.test(phone)) {
      return NextResponse.json({ error: "Phone must be a valid Guyanese number (+592 followed by 7 digits)" }, { status: 400 });
    }

    const name = `${first_name.trim()} ${last_name.trim()}`;
    const supabase = await createClient();

    // Save to Supabase — use only columns that exist on the leads table
    const { error } = await supabase.from("leads").insert({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone,
      email: email?.trim() || null,
      subject: plan_interest || "Internet Service Inquiry",
      message: `Source: ${source || "website"} | Interest: ${plan_interest || "General"}`,
      source: source || "website",
    });

    if (error) {
      console.error("Lead insert error:", error.message);
      // Continue to send notifications even if DB fails
    }

    // Admin notification email
    sendEmail({
      to: ADMIN_EMAIL,
      subject: `🔔 New Lead: ${name} — ${phone}`,
      html: `<div style="font-family:sans-serif;max-width:500px;"><h2 style="color:#D4654A;">🔔 New Potential Customer</h2><table style="width:100%;font-size:14px;"><tr><td style="padding:6px 0;color:#888;width:100px;">Name</td><td style="font-weight:bold;">${name}</td></tr><tr><td style="padding:6px 0;color:#888;">Phone</td><td style="font-weight:bold;">${phone}</td></tr><tr><td style="padding:6px 0;color:#888;">Email</td><td>${email || "N/A"}</td></tr><tr><td style="padding:6px 0;color:#888;">Source</td><td>${source || "website"}</td></tr><tr><td style="padding:6px 0;color:#888;">Interest</td><td>${plan_interest || "General"}</td></tr></table><div style="margin-top:16px;"><a href="https://wa.me/${phone.replace(/[^0-9]/g, "")}" style="padding:10px 20px;background:#25D366;color:white;border-radius:20px;text-decoration:none;font-weight:bold;">💬 WhatsApp ${first_name}</a></div><p style="margin-top:12px;color:#999;font-size:12px;">Via evolvewireless.gy</p></div>`,
    }).catch((e) => console.error("Admin email error:", e));

    // Slack notification
    if (SLACK_WEBHOOK) {
      fetch(SLACK_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🔔 New Lead: ${name} — ${phone}`,
          blocks: [
            { type: "header", text: { type: "plain_text", text: "🔔 New Potential Customer", emoji: true } },
            { type: "section", fields: [
              { type: "mrkdwn", text: `*Name:*\n${name}` },
              { type: "mrkdwn", text: `*Phone:*\n${phone}` },
              { type: "mrkdwn", text: `*Email:*\n${email || "N/A"}` },
              { type: "mrkdwn", text: `*Source:*\n${source || "website"}` },
            ]},
            { type: "context", elements: [{ type: "mrkdwn", text: `Via evolvewireless.gy · ${new Date().toLocaleString("en-GY", { timeZone: "America/Guyana" })} GYT` }] },
          ],
        }),
      }).catch((e) => console.error("Slack error:", e));
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    console.error("API error:", e);
    return NextResponse.json({ error: "Server error. Please try WhatsApp instead." }, { status: 500 });
  }
}
