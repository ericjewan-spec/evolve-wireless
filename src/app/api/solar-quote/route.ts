import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/email";

const ADMIN_EMAIL = process.env.NOTIFICATION_EMAIL || "evolveenterprise592@gmail.com";
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_CONTACT || process.env.SLACK_WEBHOOK_GENERAL || process.env.SLACK_LEADS_WEBHOOK_URL || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, property_type, location, region, monthly_bill, roof_type, has_generator, battery_interest, timeline, message } = body;

    if (!name || !phone || !property_type) {
      return NextResponse.json({ error: "Name, phone, and property type are required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase.from("leads").insert({
      first_name: name.split(" ")[0],
      last_name: name.split(" ").slice(1).join(" ") || "",
      phone,
      email: email || null,
      subject: "Solar Quote",
      message: `Property: ${property_type} | Region: ${region || "N/A"} | Location: ${location || "N/A"} | GPL Bill: ${monthly_bill || "N/A"} | Roof: ${roof_type || "N/A"} | Generator: ${has_generator || "N/A"} | Battery: ${battery_interest || "N/A"} | Timeline: ${timeline || "N/A"} | Info: ${message || "None"}`,
      source: "solar_quote_form",
    });

    if (error) console.error("Supabase error:", error.message);

    // Customer confirmation
    if (email) {
      sendEmail({
        to: email,
        subject: `We received your solar quote request — Evolve Solar Solutions`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;color:#2C1810;"><div style="text-align:center;padding-bottom:24px;margin-bottom:24px;border-bottom:2px solid #E9B44C;"><strong style="font-size:20px;">☀️ Evolve Solar Solutions</strong></div><h2 style="font-size:20px;margin-bottom:8px;">Thanks for your interest, ${name.split(" ")[0]}!</h2><p style="color:#4A3728;line-height:1.7;">We received your solar quote request. Our team will review your property details and prepare a customised proposal within <strong>24 hours</strong>.</p><div style="background:#FFFBF0;padding:16px;border-radius:8px;margin:20px 0;font-size:14px;color:#666;">Property: ${property_type.replace(/_/g, " ")}<br>${region ? `Region: ${region}<br>` : ""}${monthly_bill ? `GPL Bill: ${monthly_bill.replace(/_/g, " ")}<br>` : ""}${timeline ? `Timeline: ${timeline.replace(/_/g, " ")}` : ""}</div><p style="color:#4A3728;line-height:1.7;">For faster response, WhatsApp us at <strong>+592 609-2487</strong>.</p><div style="margin-top:32px;padding-top:20px;border-top:1px solid #eee;font-size:13px;color:#8B7355;text-align:center;"><p>Evolve Wireless & Solar Solutions · Georgetown, Guyana</p></div></div>`,
      }).catch((e) => console.error("Customer email error:", e));
    }

    // Admin notification
    sendEmail({
      to: ADMIN_EMAIL,
      subject: `☀️ Solar Quote Lead: ${name} — ${property_type.replace(/_/g, " ")}`,
      html: `<div style="font-family:sans-serif;max-width:500px;"><h2 style="color:#E9B44C;">☀️ Solar Quote Request</h2><table style="width:100%;font-size:14px;"><tr><td style="padding:6px 0;color:#888;width:110px;">Name</td><td style="font-weight:bold;">${name}</td></tr><tr><td style="padding:6px 0;color:#888;">Phone</td><td style="font-weight:bold;">${phone}</td></tr><tr><td style="padding:6px 0;color:#888;">Email</td><td>${email || "N/A"}</td></tr><tr><td style="padding:6px 0;color:#888;">Property</td><td>${property_type.replace(/_/g, " ")}</td></tr><tr><td style="padding:6px 0;color:#888;">Region</td><td>${region || "N/A"}</td></tr><tr><td style="padding:6px 0;color:#888;">Location</td><td>${location || "N/A"}</td></tr><tr><td style="padding:6px 0;color:#888;">GPL Bill</td><td>${monthly_bill ? monthly_bill.replace(/_/g, " ") : "N/A"}</td></tr><tr><td style="padding:6px 0;color:#888;">Roof</td><td>${roof_type || "N/A"}</td></tr><tr><td style="padding:6px 0;color:#888;">Generator</td><td>${has_generator || "N/A"}</td></tr><tr><td style="padding:6px 0;color:#888;">Battery</td><td>${battery_interest || "N/A"}</td></tr><tr><td style="padding:6px 0;color:#888;">Timeline</td><td>${timeline ? timeline.replace(/_/g, " ") : "N/A"}</td></tr></table>${message ? `<div style="margin-top:12px;padding:12px;background:#f5f5f5;border-radius:8px;font-size:14px;">${message}</div>` : ""}<div style="margin-top:16px;"><a href="https://wa.me/${phone.replace(/[^0-9]/g, "")}" style="padding:10px 20px;background:#25D366;color:white;border-radius:20px;text-decoration:none;font-weight:bold;">💬 WhatsApp ${name.split(" ")[0]}</a></div></div>`,
    }).catch((e) => console.error("Admin email error:", e));

    // Slack
    if (SLACK_WEBHOOK) {
      fetch(SLACK_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `☀️ Solar Quote Lead: ${name} — ${property_type.replace(/_/g, " ")}`,
          blocks: [
            { type: "header", text: { type: "plain_text", text: "☀️ Solar Quote Request", emoji: true } },
            { type: "section", fields: [
              { type: "mrkdwn", text: `*Name:*\n${name}` },
              { type: "mrkdwn", text: `*Phone:*\n${phone}` },
              { type: "mrkdwn", text: `*Property:*\n${property_type.replace(/_/g, " ")}` },
              { type: "mrkdwn", text: `*Region:*\n${region || "N/A"}` },
              { type: "mrkdwn", text: `*GPL Bill:*\n${monthly_bill ? monthly_bill.replace(/_/g, " ") : "N/A"}` },
              { type: "mrkdwn", text: `*Timeline:*\n${timeline ? timeline.replace(/_/g, " ") : "N/A"}` },
            ]},
            { type: "context", elements: [{ type: "mrkdwn", text: `Via evolvewireless.gy/solar/quote · ${new Date().toLocaleString("en-GY", { timeZone: "America/Guyana" })} GYT` }] },
          ],
        }),
      }).catch((e) => console.error("Slack error:", e));
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("API error:", e);
    return NextResponse.json({ error: "Server error. Please try WhatsApp instead." }, { status: 500 });
  }
}
