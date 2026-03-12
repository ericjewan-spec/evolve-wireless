import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/email";


const ADMIN_EMAIL = process.env.NOTIFICATION_EMAIL || "evolveenterprise592@gmail.com"; // Must be Resend account owner email until domain is verified
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
