import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";
import { slackNewSignup } from "@/lib/slack";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, plan, region, address } = await req.json();

    // Actually await both so we can see if they succeed or fail
    const [emailResult, slackResult] = await Promise.allSettled([
      sendWelcomeEmail(email, name, plan || "Internet Plan"),
      slackNewSignup({
        name: name || "Unknown",
        email: email || "",
        phone: phone || "",
        plan: plan || "Unknown",
        region: region || "Unknown",
        address: address || "",
      }),
    ]);

    const emailOk = emailResult.status === "fulfilled" && emailResult.value?.success;
    const slackOk = slackResult.status === "fulfilled" && slackResult.value?.success;

    console.log("[SIGNUP NOTIFY]", {
      email: emailOk ? "sent" : emailResult.status === "fulfilled" ? emailResult.value?.error : (emailResult as PromiseRejectedResult).reason,
      slack: slackOk ? "sent" : slackResult.status === "fulfilled" ? slackResult.value?.error : (slackResult as PromiseRejectedResult).reason,
      to: email,
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasSlackWebhook: !!process.env.SLACK_WEBHOOK_GENERAL,
    });

    return NextResponse.json({
      success: true,
      email: emailOk ? "sent" : "failed",
      slack: slackOk ? "sent" : "failed",
    });
  } catch (e) {
    console.error("[SIGNUP NOTIFY] Error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
