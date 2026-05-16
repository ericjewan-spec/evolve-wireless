// =============================================================
// EVOLVE HR — NIS Generation Edge Function
// Path: supabase/functions/nis-generate/index.ts
//
// Triggered by:
//   • pg_cron on the 10th of every month at 12:00 UTC (08:00 Guyana)
//   • Manual POST from /admin/payroll/nis "Regenerate" button
//
// Flow:
//   1. Determine the target period (PREVIOUS calendar month)
//   2. Call generate_nis_schedule(year, month) — builds DB rows
//   3. Render PDF using pdf-lib (matches the official NIS 5.62 form)
//   4. Upload PDF to Supabase Storage at nis-schedules/{YYYY}-{MM}.pdf
//   5. Update nis_schedules.pdf_path
//   6. Call queue_nis_reminder_notification() — privacy-safe Slack
//
// Deploy:
//   supabase functions deploy nis-generate --no-verify-jwt
// =============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ScheduleRow {
  id: string;
  period_year: number;
  period_month: number;
  period_label: string;
  total_employees: number;
  total_insurable: number;
  total_employee_5_6: number;
  total_employer_8_4: number;
  total_payable: number;
}

interface LineItemRow {
  surname: string;
  other_names: string;
  nis_number: string | null;
  date_of_birth: string | null;
  insurable_earnings: number;
  employee_5_6: number;
  employer_8_4: number;
  industrial_1: number;
  total_payable: number;
  sort_order: number;
}

interface EmployerRow {
  employer_name: string;
  employer_nis: string;
  address_line_1: string;
  address_line_2: string | null;
  region: string | null;
  phone: string | null;
}

interface RequestBody {
  trigger?: "cron" | "manual";
  year?: number;
  month?: number;
}

serve(async (req) => {
  try {
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body: RequestBody = await req.json().catch(() => ({}));
    const trigger = body.trigger ?? "cron";

    let year: number, month: number;
    if (body.year && body.month) {
      year = body.year;
      month = body.month;
    } else {
      const nowGY = new Date(
        new Date().toLocaleString("en-US", { timeZone: "America/Guyana" }),
      );
      const prev = new Date(nowGY.getFullYear(), nowGY.getMonth() - 1, 1);
      year = prev.getFullYear();
      month = prev.getMonth() + 1;
    }

    console.log(`[NIS] Generating for ${year}-${String(month).padStart(2, "0")} (trigger: ${trigger})`);

    const actor = trigger === "cron" ? "system:cron" : "system:manual";
    const { data: scheduleId, error: genError } = await sb.rpc(
      "generate_nis_schedule",
      { p_year: year, p_month: month, p_actor: actor },
    );

    if (genError) {
      console.error("[NIS] generate_nis_schedule failed:", genError);
      return new Response(
        JSON.stringify({ error: "generation_failed", detail: genError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const [{ data: schedule }, { data: items }, { data: employer }] = await Promise.all([
      sb.from("nis_schedules").select("*").eq("id", scheduleId).single(),
      sb.from("nis_schedule_items").select("*").eq("schedule_id", scheduleId).order("sort_order"),
      sb.from("nis_employer").select("*").single(),
    ]);

    if (!schedule || !employer) {
      return new Response(
        JSON.stringify({ error: "data_missing" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const missingNis = (items || []).filter((i: LineItemRow) => !i.nis_number);
    if ((items?.length ?? 0) === 0) {
      console.warn("[NIS] No employees to schedule");
      await sb.from("notification_log").insert({
        event_type: "nis_warning",
        title: "NIS generation skipped",
        body: `No eligible employees for ${schedule.period_label}. Verify locked payroll exists and active salaried staff are configured.`,
        status: "queued",
        scheduled_for: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ status: "skipped", reason: "no_employees" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }
    if (missingNis.length > 0) {
      console.warn(`[NIS] ${missingNis.length} employees missing NIS number`);
      await sb.from("notification_log").insert({
        event_type: "nis_warning",
        title: "NIS generation needs attention",
        body: `${missingNis.length} employee(s) missing NIS number for ${schedule.period_label}. Open admin → Onboarding to complete profiles.`,
        status: "queued",
        scheduled_for: new Date().toISOString(),
      });
    }

    const pdfBytes = await renderNisPdf(
      schedule as ScheduleRow,
      (items || []) as LineItemRow[],
      employer as EmployerRow,
    );

    const filename = `${schedule.period_year}-${String(schedule.period_month).padStart(2, "0")}.pdf`;
    const storagePath = `nis-schedules/${filename}`;

    const { error: uploadErr } = await sb.storage
      .from("nis-schedules")
      .upload(filename, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadErr) {
      console.error("[NIS] Upload failed:", uploadErr);
      return new Response(
        JSON.stringify({ error: "upload_failed", detail: uploadErr.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    await sb.from("nis_schedules").update({ pdf_path: storagePath }).eq("id", scheduleId);

    await sb.rpc("queue_nis_reminder_notification", { p_schedule_id: scheduleId });

    return new Response(
      JSON.stringify({
        status: "ok",
        schedule_id: scheduleId,
        period: schedule.period_label,
        employees: items?.length ?? 0,
        pdf_path: storagePath,
        missing_nis: missingNis.length,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[NIS] Fatal:", e);
    return new Response(
      JSON.stringify({ error: "internal", detail: String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

async function renderNisPdf(
  schedule: ScheduleRow,
  items: LineItemRow[],
  employer: EmployerRow,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const page = pdf.addPage([612, 792]);
  const { width } = page.getSize();

  const ink = rgb(0.08, 0.08, 0.08);
  const muted = rgb(0.45, 0.45, 0.45);
  const accent = rgb(0.83, 0.4, 0.29);

  const text = (
    s: string,
    x: number,
    y: number,
    size = 9,
    font = helv,
    color = ink,
  ) => page.drawText(s, { x, y, size, font, color });

  const line = (x1: number, y1: number, x2: number, y2: number, w = 0.5) =>
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: w,
      color: ink,
    });

  text("THE NATIONAL INSURANCE SCHEME", 130, 750, 13, helvBold);
  text("SCHEDULE OF CONTRIBUTIONS — FORM 5.62", 145, 735, 10, helv, muted);

  const empY = 700;
  text("Employer:", 40, empY, 9, helvBold);
  text(employer.employer_name, 100, empY);

  text("Employer NIS #:", 40, empY - 14, 9, helvBold);
  text(employer.employer_nis, 120, empY - 14);

  text("Address:", 40, empY - 28, 9, helvBold);
  const addr = [employer.address_line_1, employer.address_line_2, employer.region]
    .filter(Boolean).join(", ");
  text(addr, 100, empY - 28);

  text("Period:", 380, empY, 9, helvBold);
  text(schedule.period_label, 420, empY, 9, helvBold, accent);

  text("Employees:", 380, empY - 14, 9, helvBold);
  text(String(schedule.total_employees), 445, empY - 14);

  text("Due by:", 380, empY - 28, 9, helvBold);
  const due = new Date(schedule.period_year, schedule.period_month, 15);
  text(
    due.toLocaleDateString("en-GY", { day: "numeric", month: "long", year: "numeric" }),
    420, empY - 28,
  );

  const tableTop = 640;
  const colX = {
    no: 40, nis: 65, surname: 130, other: 215, dob: 295,
    insurable: 345, emp56: 410, er84: 465, total: 525,
  };

  line(40, tableTop + 4, width - 40, tableTop + 4, 0.8);
  line(40, tableTop - 14, width - 40, tableTop - 14, 0.8);

  text("#", colX.no, tableTop - 9, 8, helvBold);
  text("NIS No.", colX.nis, tableTop - 9, 8, helvBold);
  text("Surname", colX.surname, tableTop - 9, 8, helvBold);
  text("Other Names", colX.other, tableTop - 9, 8, helvBold);
  text("DOB", colX.dob, tableTop - 9, 8, helvBold);
  text("Insurable", colX.insurable, tableTop - 9, 8, helvBold);
  text("Empl 5.6%", colX.emp56, tableTop - 9, 8, helvBold);
  text("Emplr 8.4%", colX.er84, tableTop - 9, 8, helvBold);
  text("Total 14%", colX.total, tableTop - 9, 8, helvBold);

  const fmtG = (n: number) => Math.round(n).toLocaleString("en-GY");
  const fmtDob = (d: string | null) => {
    if (!d) return "—";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });
  };

  let y = tableTop - 30;
  const rowHeight = 16;

  items.forEach((it, idx) => {
    if (y < 100) return;
    text(String(idx + 1), colX.no, y, 8);
    text(it.nis_number ?? "— MISSING —", colX.nis, y, 8, helv, it.nis_number ? ink : accent);
    text(it.surname, colX.surname, y, 8);
    text(it.other_names, colX.other, y, 8);
    text(fmtDob(it.date_of_birth), colX.dob, y, 8);
    text(fmtG(it.insurable_earnings), colX.insurable, y, 8);
    text(fmtG(it.employee_5_6), colX.emp56, y, 8);
    text(fmtG(it.employer_8_4), colX.er84, y, 8);
    text(fmtG(it.total_payable), colX.total, y, 8, helvBold);
    line(40, y - 4, width - 40, y - 4, 0.3);
    y -= rowHeight;
  });

  y -= 4;
  line(40, y + 8, width - 40, y + 8, 1);
  text("TOTALS", colX.surname, y - 6, 9, helvBold);
  text(`GYD ${fmtG(schedule.total_insurable)}`, colX.insurable, y - 6, 9, helvBold);
  text(`GYD ${fmtG(schedule.total_employee_5_6)}`, colX.emp56, y - 6, 9, helvBold);
  text(`GYD ${fmtG(schedule.total_employer_8_4)}`, colX.er84, y - 6, 9, helvBold);
  text(`GYD ${fmtG(schedule.total_payable)}`, colX.total, y - 6, 9, helvBold, accent);
  line(40, y - 14, width - 40, y - 14, 1);

  const footY = 80;
  text("Certified true and correct.", 40, footY + 30, 9, helv, muted);
  text("Authorised Signature: ____________________________", 40, footY + 10, 9);
  text("Date: ______________________", 350, footY + 10, 9);
  text(
    `Generated by Evolve HR · ${new Date().toLocaleString("en-GY", { timeZone: "America/Guyana" })} GYT`,
    40, footY - 10, 7, helv, muted,
  );

  return await pdf.save();
}
