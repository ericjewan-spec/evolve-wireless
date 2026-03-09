import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("*, plans(*)")
      .eq("customer_id", user.id)
      .is("deleted_at", null);

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      profile,
      subscriptions,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
