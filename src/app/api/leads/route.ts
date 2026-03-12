import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

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

    // 1. Save to Supabase
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

    const leadInfo = {
      name: `${first_name.trim()} ${last_name.trim()}`,
      phone,
      email: email?.trim() || "Not provided",
      source: source || "website",
      plan_interest: plan_interest || "Not specified",
      timestamp: new Date().toLocaleString("en-GY", { timeZone: "America/Guyana" }),
    };

    // 2. Send Slack notification (non-blocking)
    sendSlackNotification(leadInfo).catch((err) =>
      console.error("Slack notification failed:", err)
    );

    // 3. Send email notification (non-blocking)
    sendEmailNotification(leadInfo).catch((err) =>
      console.error("Email notification failed:", err)
    );

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Server error. Please try WhatsApp instead." },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════
   SLACK NOTIFICATION
   Posts to #potential-customers channel
   
   Setup:
   1. Go to api.slack.com/apps → Create New App → From Scratch
   2. Name: "Evolve Leads Bot", Workspace: your workspace
   3. Go to Incoming Webhooks → Activate → Add New Webhook
   4. Select #potential-customers channel
   5. Copy the webhook URL
   6. Add to Vercel env vars: SLACK_LEADS_WEBHOOK_URL
═══════════════════════════════════════ */
async function sendSlackNotification(lead: {
  name: string; phone: string; email: string;
  source: string; plan_interest: string; timestamp: string;
}) {
  const webhookUrl = process.env.SLACK_LEADS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("Slack: No SLACK_LEADS_WEBHOOK_URL configured. Lead:", lead.name);
    return;
  }

  const payload = {
    text: `🔔 New Potential Customer from evolvewireless.gy`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "🔔 New Potential Customer", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Name:*\n${lead.name}` },
          { type: "mrkdwn", text: `*Phone:*\n<tel:${lead.phone}|${lead.phone}>` },
          { type: "mrkdwn", text: `*Email:*\n${lead.email}` },
          { type: "mrkdwn", text: `*Source:*\n${lead.source}` },
          { type: "mrkdwn", text: `*Interest:*\n${lead.plan_interest}` },
          { type: "mrkdwn", text: `*Time:*\n${lead.timestamp}` },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "💬 WhatsApp Customer", emoji: true },
            url: `https://wa.me/${lead.phone.replace("+", "")}?text=${encodeURIComponent("Hi " + lead.name.split(" ")[0] + "! Thanks for your interest in Evolve Wireless. How can we help you get connected?")}`,
            style: "primary",
          },
          {
            type: "button",
            text: { type: "plain_text", text: "📋 View in Supabase", emoji: true },
            url: "https://supabase.com/dashboard/project/zqlixzklxrqewxvqhfzc/editor",
          },
        ],
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: "⏰ *Respond within 1 hour* — this lead came from evolvewireless.gy" },
        ],
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Slack webhook failed: ${res.status} ${await res.text()}`);
  }
}

/* ═══════════════════════════════════════
   EMAIL NOTIFICATION
   Sends to your email when a new lead comes in
   
   Options (configure ONE in Vercel env vars):
   
   Option A — Resend (recommended, free tier: 100 emails/day):
     RESEND_API_KEY=re_xxxxxxxxxxxx
     NOTIFICATION_EMAIL=evolveenterprise592@gmail.com
   
   Option B — SendGrid:
     SENDGRID_API_KEY=SG.xxxxxxxxxxxx
     NOTIFICATION_EMAIL=evolveenterprise592@gmail.com
   
   Option C — Generic SMTP webhook (Zapier, Make, etc.):
     EMAIL_WEBHOOK_URL=https://hooks.zapier.com/xxxxx
═══════════════════════════════════════ */
async function sendEmailNotification(lead: {
  name: string; phone: string; email: string;
  source: string; plan_interest: string; timestamp: string;
}) {
  const notificationEmail = process.env.NOTIFICATION_EMAIL;

  // Option A: Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && notificationEmail) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Evolve Wireless <leads@evolvewireless.gy>",
        to: notificationEmail,
        subject: `🔔 New Lead: ${lead.name} — ${lead.phone}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px;">
            <h2 style="color: #D4654A; margin-bottom: 16px;">🔔 New Potential Customer</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #888; width: 100px;">Name</td><td style="padding: 8px 0; font-weight: bold;">${lead.name}</td></tr>
              <tr><td style="padding: 8px 0; color: #888;">Phone</td><td style="padding: 8px 0; font-weight: bold;">${lead.phone}</td></tr>
              <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0;">${lead.email}</td></tr>
              <tr><td style="padding: 8px 0; color: #888;">Source</td><td style="padding: 8px 0;">${lead.source}</td></tr>
              <tr><td style="padding: 8px 0; color: #888;">Interest</td><td style="padding: 8px 0;">${lead.plan_interest}</td></tr>
              <tr><td style="padding: 8px 0; color: #888;">Time</td><td style="padding: 8px 0;">${lead.timestamp}</td></tr>
            </table>
            <div style="margin-top: 20px;">
              <a href="https://wa.me/${lead.phone.replace("+", "")}" style="display: inline-block; padding: 10px 20px; background: #25D366; color: white; border-radius: 20px; text-decoration: none; font-weight: bold;">💬 WhatsApp ${lead.name.split(" ")[0]}</a>
            </div>
            <p style="margin-top: 16px; color: #999; font-size: 12px;">Respond within 1 hour — from evolvewireless.gy</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      throw new Error(`Resend email failed: ${res.status}`);
    }
    return;
  }

  // Option B: SendGrid
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (sendgridKey && notificationEmail) {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendgridKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: notificationEmail }] }],
        from: { email: "leads@evolvewireless.gy", name: "Evolve Wireless" },
        subject: `🔔 New Lead: ${lead.name} — ${lead.phone}`,
        content: [{
          type: "text/plain",
          value: `New Potential Customer\n\nName: ${lead.name}\nPhone: ${lead.phone}\nEmail: ${lead.email}\nSource: ${lead.source}\nInterest: ${lead.plan_interest}\nTime: ${lead.timestamp}\n\nWhatsApp: https://wa.me/${lead.phone.replace("+", "")}`,
        }],
      }),
    });

    if (!res.ok) {
      throw new Error(`SendGrid email failed: ${res.status}`);
    }
    return;
  }

  // Option C: Generic webhook
  const emailWebhook = process.env.EMAIL_WEBHOOK_URL;
  if (emailWebhook) {
    await fetch(emailWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: `New Lead: ${lead.name} — ${lead.phone}`,
        lead,
      }),
    });
    return;
  }

  // Fallback: log
  console.log("📩 EMAIL NOT CONFIGURED — New lead:", lead.name, lead.phone, lead.email);
}
