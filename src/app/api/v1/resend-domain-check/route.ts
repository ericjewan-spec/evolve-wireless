import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return NextResponse.json({ error: "No RESEND_API_KEY" });

  try {
    // First get domains list
    const listRes = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });
    const listData = await listRes.json();
    
    // Get detailed info for the first domain
    if (listData.data && listData.data.length > 0) {
      const domainId = listData.data[0].id;
      const detailRes = await fetch(`https://api.resend.com/domains/${domainId}`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      const detailData = await detailRes.json();
      return NextResponse.json(detailData);
    }
    
    return NextResponse.json(listData);
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
