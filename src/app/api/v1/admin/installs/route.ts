import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/installs
 *
 * Admin-only. Returns recent field installs with short-lived signed URLs for
 * each install photo (the bucket is private) plus a UISP map link and the
 * public contract link. Powers the /admin/installs gallery.
 */
export async function GET() {
  // Admin gate — must be a signed-in admin.
  const authed = await createClient();
  const { data: { user } } = await authed.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: adminRow } = await authed.from("admins").select("id").eq("id", user.id).maybeSingle();
  if (!adminRow) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const svc = createServiceClient();
  const { data: rows, error } = await svc
    .from("field_signups")
    .select("id, full_name, phone, region, village, address, plan_name, account_number, uisp_client_id, uisp_service_id, gps_lat, gps_lon, gps_accuracy_m, photos, public_token, status, uisp_error, technician_name, install_date, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: "db_error", detail: error.message }, { status: 500 });

  const uispBase = (process.env.UISP_BASE_URL || "https://evolveenterprise.uisp.com").replace(/\/$/, "");
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL || "https://www.evolvewireless.gy";

  const installs = await Promise.all(
    (rows || []).map(async (r) => {
      const paths: string[] = Array.isArray(r.photos) ? r.photos : [];
      let photoUrls: string[] = [];
      if (paths.length) {
        const { data: signed } = await svc.storage.from("install-photos").createSignedUrls(paths, 3600);
        photoUrls = (signed || []).map((s) => s.signedUrl).filter(Boolean) as string[];
      }
      return {
        ...r,
        photoUrls,
        contractUrl: `${siteBase}/contract/${r.public_token}`,
        uispUrl: r.uisp_client_id ? `${uispBase}/crm/client/${r.uisp_client_id}` : null,
        mapUrl: r.gps_lat && r.gps_lon ? `https://www.google.com/maps?q=${r.gps_lat},${r.gps_lon}` : null,
      };
    }),
  );

  return NextResponse.json({ installs });
}
