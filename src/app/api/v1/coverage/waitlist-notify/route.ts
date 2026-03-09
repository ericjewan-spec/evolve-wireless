import { NextRequest, NextResponse } from "next/server";
import { slackWaitlistSignup } from "@/lib/slack";

export async function POST(req: NextRequest) {
  try {
    const { email, address } = await req.json();
    slackWaitlistSignup({ email, address }).catch(() => {});
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
