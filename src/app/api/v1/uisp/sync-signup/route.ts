import { NextRequest, NextResponse } from "next/server";
import { createClientWithService } from "@/lib/uisp-sync";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, phone, email, address, region, village } = body;

    const client = await createClientWithService({
      firstName,
      lastName,
      phone,
      email,
      address: `${address}${village ? ", " + village : ""}`,
      region,
      city: region === "ecd" ? "Georgetown" : "Port Kaituma",
    });

    return NextResponse.json({ success: true, uisp_client_id: client?.id || null });
  } catch (err) {
    console.error("UISP sync error:", err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
