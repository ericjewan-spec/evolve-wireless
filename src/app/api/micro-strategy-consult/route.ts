import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/email";

const ADMIN_EMAIL = process.env.NOTIFICATION_EMAIL || "ericjewan@gmail.com";
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_CONTACT || process.env.SLACK_WEBHOOK_GENERAL || process.env.SLACK_LEADS_WEBHOOK_URL || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, business_name, business_type, service_interest, budget, timeline, message } = body;

    if (!name || !phone || !service_interest) {
      return NextResponse.json({ error: "Name, phone, and service interest are required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase.from("leads").insert({
      first_name: name.split(" ")[0],
      last_name: name.split(" ").slice(1).join(" ") || "",
      phone,
      email: email || null,
      subject: "Micro Strategy Consultation",
      message: `Business: ${business_name || "N/A"} | Type: ${business_type || "N/A"} | Interest: ${service_interest} | Budget: ${budget || "N/A"} | Timeline: ${timeline || "N/A"} | Details: ${message || "None"}`,
      source: "micro_strategy_consultation",
    });

    if (error) console.error("Supabase error:", error.message);

    // Customer confirmation email
    if (email) {
      sendEmail({
        to: email,
        subject: `We received your consultation request — Micro Strategy by Evolve`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;color:#2C1810;"><div style="text-align:center;padding-bottom:24px;margin-bottom:24px;border-bottom:2px solid #2A9D8F;"><strong style="font-size:20px;">💡 Micro Strategy by Evolve</strong></div><h2 style="font-size:20px;margin-bottom:8px;">Thanks for reaching out, ${name.split(" ")[0]}!</h2><p style="color:#4A3728;line-height:1.7;">We received your consultation request for <strong>${service_interest.replace(/_/g, " ")}</strong>. Our team will review your details and get back to you within <strong>24 hours</strong> to schedule your free consultation.</p><div style="background:#F8F6F2;padding:16px;border-radius:8px;margin:20px 0;font-size:14px;color:#666;">${business_name ? `Business: ${business_name}<br>` : ""}Service: ${service_interest.replace(/_/g, " ")}<br>${budget ? `Budget: ${budget.replace(/_/g, " ")}<br>` : ""}${timeline ? `Timeline: ${timeline.replace(/_/g, " ")}` : ""}</div><p style="color:#4A3728;line-height:1.7;">For faster response, WhatsApp us at <strong>+592 609-2487</strong>.</p><div style="margin-top:32px;padding-top:20px;border-top:1px solid #eee;font-size:13px;color:#8B7355;text-align:center;"><p>Evolve Wireless & Solar Solutions · Georgetown, Guyana</p></div></div>`,
      }).catch((e) => console.error("Customer email error:", e));
    }

    // Admin notification email
    sendEmail({
      to: ADMIN_EMAIL,
      subject: `💡 Micro Strategy Lead: ${name} — ${service_interest.replace(/_/g, " ")}`,
      html: `<div style="font-family:sans-serif;max-width:500px;"><h2 style="color:#2A9D8F;">💡 Micro Strategy Consultation</h2><table style="width:100%;font-size:14px;"><tr><td style="padding:6px 0;color:#888;width:110px;">Name</td><td style="font-weight:bold;">${name}</td></tr><tr><td style="padding:6px 0;color:#888;">Phone</td><td style="font-weight:bold;">${phone}</td></tr><tr><td style="padding:6px 0;color:#888;">Email</td><td>${email || "N/A"}</td></tr><tr><td style="padding:6px 0;color:#888;">Business</td><td>${business_name || "N/A"}</td></tr><tr><td style="padding:6px 0;color:#888;">Type</td><td>${business_type || "N/A"}</td></tr><tr><td style="padding:6px 0;color:#888;">Interest</td><td style="font-weight:bold;">${service_interest.replace(/_/g, " ")}</td></tr><tr><td style="padding:6px 0;color:#888;">Budget</td><td>${budget ? budget.replace(/_/g, " ") : "N/A"}</td></tr><tr><td style="padding:6px 0;color:#888;">Timeline</td><td>${timeline ? timeline.replace(/_/g, " ") : "N/A"}</td></tr></table>${message ? `<div style="margin-top:12px;padding:12px;background:#f5f5f5;border-radius:8px;font-size:14px;">${message}</div>` : ""}<div style="margin-top:16px;"><a href="https://wa.me/${phone.replace(/[^0-9]/g, "")}" style="padding:10px 20px;background:#25D366;color:white;border-radius:20px;text-decoration:none;font-weight:bold;">💬 WhatsApp ${name.split(" ")[0]}</a></div></div>`,
    }).catch((e) => console.error("Admin email error:", e));

    // Slack notification
    if (SLACK_WEBHOOK) {
      fetch(SLACK_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `💡 Micro Strategy Lead: ${name} — ${service_interest.replace(/_/g, " ")}`,
          blocks: [
            { type: "header", text: { type: "plain_text", text: "💡 Micro Strategy Consultation", emoji: true } },
            { type: "section", fields: [
              { type: "mrkdwn", text: `*Name:*\n${name}` },
              { type: "mrkdwn", text: `*Phone:*\n${phone}` },
              { type: "mrkdwn", text: `*Service:*\n${service_interest.replace(/_/g, " ")}` },
              { type: "mrkdwn", text: `*Business:*\n${business_name || "N/A"}` },
              { type: "mrkdwn", text: `*Budget:*\n${budget ? budget.replace(/_/g, " ") : "N/A"}` },
              { type: "mrkdwn", text: `*Timeline:*\n${timeline ? timeline.replace(/_/g, " ") : "N/A"}` },
            ]},
            ...(message ? [{ type: "section", text: { type: "mrkdwn", text: `*Details:*\n> ${message.substring(0, 300)}` } }] : []),
            { type: "context", elements: [{ type: "mrkdwn", text: `Via evolvewireless.gy · ${new Date().toLocaleString("en-GY", { timeZone: "America/Guyana" })} GYT` }] },
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
