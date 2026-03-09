import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";
import { slackNewSignup } from "@/lib/slack";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, plan, region, address } = await req.json();

    // Fire-and-forget: send welcome email + Slack notification
    Promise.all([
      sendWelcomeEmail(email, name, plan),
      slackNewSignup({ name, email, phone, plan, region, address }),
    ]).catch((e) => console.error("Signup notification error:", e));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
