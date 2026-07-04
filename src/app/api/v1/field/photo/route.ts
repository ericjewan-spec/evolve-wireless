import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/field/photo
 *
 * Uploads one install photo (multipart form-data, field name "file") to the
 * private `install-photos` bucket. Gated by the shared install code
 * (x-install-code header). Returns { path } to include in the signup payload.
 *
 * Photos are compressed client-side to ~1600px JPEG before upload, keeping
 * each request well under Vercel's body limit even on slow rural connections.
 */
export async function POST(req: NextRequest) {
  const svc = createServiceClient();

  // Gate on the shared install code
  const provided = req.headers.get("x-install-code")?.trim() || "";
  const { data: codeRow } = await svc
    .from("app_settings")
    .select("value")
    .eq("key", "field_install_code")
    .maybeSingle();
  if (!codeRow?.value || provided !== codeRow.value) {
    return NextResponse.json({ error: "invalid_code" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "too_large", detail: "Max 8MB per photo." }, { status: 413 });
  }

  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error } = await svc.storage.from("install-photos").upload(path, buf, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) {
    console.error("field/photo upload error:", error);
    return NextResponse.json({ error: "upload_failed", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ path });
}
