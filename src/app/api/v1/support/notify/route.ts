import { NextRequest, NextResponse } from "next/server";
import { sendTicketCreated } from "@/lib/email";
import { slackNewTicket } from "@/lib/slack";

export async function POST(req: NextRequest) {
  try {
    const { email, customerName, customerPhone, ticketNumber, type, priority, description } = await req.json();

    Promise.all([
      sendTicketCreated(email, ticketNumber, type),
      slackNewTicket({ ticketNumber, customerName, customerPhone, type, priority, description }),
    ]).catch((e) => console.error("Ticket notification error:", e));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
