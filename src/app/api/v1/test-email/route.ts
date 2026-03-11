import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to") || "evolveenterprise592@gmail.com";

  const result = await sendEmail({
    to,
    subject: "Evolve Wireless — Email Test ✓",
    html: `
      <div style="font-family: sans-serif; padding: 24px; max-width: 500px;">
        <h2>Email is working!</h2>
        <p>This confirms that Resend email integration is live for evolvewireless.gy.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>RESEND_API_KEY:</strong> ${process.env.RESEND_API_KEY ? "Set (" + process.env.RESEND_API_KEY.substring(0, 8) + "...)" : "NOT SET"}</p>
      </div>
    `,
  });

  return NextResponse.json({
    ...result,
    hasKey: !!process.env.RESEND_API_KEY,
    keyPrefix: process.env.RESEND_API_KEY?.substring(0, 8) || "none",
    to,
  });
}
