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
      }).catch((err) => console.error("Customer email failed:", err));
    }


    // Admin notification
    sendEmail({
      to: ADMIN_EMAIL,
      subject: `☀️ New Solar Quote: ${name} — ${phone}`,
      html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;color:#2C1810;"><h2 style="font-size:20px;color:#E9B44C;margin-bottom:16px;">☀️ New Solar Quote Request</h2><table style="width:100%;font-size:14px;color:#4A3728;"><tr><td style="padding:8px 0;font-weight:600;width:120px;">Name</td><td>${name}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Phone</td><td>${phone}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Email</td><td>${email || "Not provided"}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Property</td><td>${property_type.replace(/_/g, " ")}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Region</td><td>${region || "N/A"}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Location</td><td>${location || "N/A"}</td></tr><tr><td style="padding:8px 0;font-weight:600;">GPL Bill</td><td>${monthly_bill || "N/A"}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Roof Type</td><td>${roof_type || "N/A"}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Generator</td><td>${has_generator || "N/A"}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Battery</td><td>${battery_interest || "N/A"}</td></tr><tr><td style="padding:8px 0;font-weight:600;">Timeline</td><td>${timeline || "N/A"}</td></tr></table>${message ? `<div style="margin-top:16px;padding:16px;background:#FFFBF0;border-radius:8px;color:#4A3728;line-height:1.7;">${message}</div>` : ""}<div style="margin-top:20px;"><a href="https://wa.me/${phone.replace("+", "")}?text=${encodeURIComponent("Hi " + name.split(" ")[0] + "! Thanks for your interest in Evolve Solar Solutions. We'd love to discuss your solar needs.")}" style="display:inline-block;padding:10px 20px;background:#25D366;color:white;border-radius:20px;text-decoration:none;font-weight:bold;">💬 WhatsApp ${name.split(" ")[0]}</a></div></div>`,
    }).catch((err) => console.error("Admin email failed:", err));


    // Slack notification
    if (SLACK_WEBHOOK) {
      fetch(SLACK_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `☀️ New Solar Quote from ${name}`,
          blocks: [
            { type: "header", text: { type: "plain_text", text: "☀️ New Solar Quote Request", emoji: true } },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Name:*\n${name}` },
                { type: "mrkdwn", text: `*Phone:*\n<tel:${phone}|${phone}>` },
                { type: "mrkdwn", text: `*Email:*\n${email || "Not provided"}` },
                { type: "mrkdwn", text: `*Property:*\n${property_type.replace(/_/g, " ")}` },
                { type: "mrkdwn", text: `*Region:*\n${region || "N/A"}` },
                { type: "mrkdwn", text: `*GPL Bill:*\n${monthly_bill || "N/A"}` },
              ],
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: { type: "plain_text", text: "💬 WhatsApp Customer", emoji: true },
                  url: `https://wa.me/${phone.replace("+", "")}?text=${encodeURIComponent("Hi " + name.split(" ")[0] + "! Thanks for your interest in Evolve Solar Solutions.")}`,
                  style: "primary",
                },
              ],
            },
          ],
        }),
      }).catch((err) => console.error("Slack notification failed:", err));
    }


    return NextResponse.json({ success: true, message: "Solar quote request received" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error. Please try WhatsApp instead." }, { status: 500 });
  }
}
