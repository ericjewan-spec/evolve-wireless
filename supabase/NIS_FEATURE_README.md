# Evolve HR — NIS Auto-Generation Feature

**Built:** May 15, 2026
**Target:** `github.com/ericjewan-spec/evolve-wireless` (main)
**Status:** Ready to deploy

---

## What this ships

| Layer | What it does |
|---|---|
| **DB migration** | Adds `nis_number`/`tin_number`/`address`/`date_of_birth`/`exclude_from_nis` to `employees`. Creates `nis_employer` (singleton, seeded with PARSRAM JEWAN / 41421 / 41 Railway Embankment), `nis_schedules`, `nis_schedule_items`. Adds `generate_nis_schedule(year, month, actor)`, `queue_nis_reminder_notification(schedule_id)`, `mark_nis_schedule_paid(id, actor, ref)`. Schedules a `pg_cron` job on the 10th of every month at 12:00 UTC (= 08:00 Guyana). Creates the `nis-schedules` Storage bucket. |
| **Edge function** | `supabase/functions/nis-generate/index.ts`. Called by the cron. Determines the prior calendar month, calls `generate_nis_schedule`, renders the PDF using `pdf-lib`, uploads to `nis-schedules/{YYYY}-{MM}.pdf`, queues the Slack reminder. Also callable manually with `{year, month}` body. |
| **Admin page** | `/admin/payroll/nis` — list of all NIS schedules with urgent banner, download PDF, mark as paid, regenerate manually. Inline info panel explaining the 14% / 5.6% + 8.4% split and the 280,000 GYD cap. |
| **API routes** | `POST /api/v1/nis/generate` (trigger regeneration) · `POST /api/v1/nis/[id]/paid` (mark paid). Both require an authenticated admin session. |
| **Component** | `EmployeeNisFields` — drop-in for the employee detail page, captures NIS#, TIN, address, DOB, exclude-from-NIS flag. |
| **Small patch** | Adds NIS schedules link next to Year-end 7B on `/admin/payroll/runs`. See `PATCH-runs-page.md`. |

**Total new code: ~1,200 lines across 7 files. SQL validated with pglast; TypeScript syntax-checked.**

---

## Apply order (4 steps, ~15 minutes)

### 1. Run the database migration

Open Supabase SQL Editor for project `zqlixzklxrqewxvqhfzc`, paste the entire contents of `supabase/migrations/0002_nis_schedules.sql`, run. Expect:

```
NIS migration 0002 complete
```

Verify with:

```sql
SELECT * FROM nis_employer;
SELECT * FROM cron.job WHERE jobname = 'nis-monthly-generate';
```

### 2. Set two Postgres settings for the cron

The cron job needs the edge function URL and service role key:

```sql
ALTER DATABASE postgres SET app.settings.edge_url = 'https://zqlixzklxrqewxvqhfzc.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = '<paste service role key here>';
```

Get the service role key from: Supabase Dashboard -> Project Settings -> API -> `service_role` key (the secret one, not anon).

### 3. Deploy the edge function

```bash
cd evolve-wireless
supabase functions deploy nis-generate --no-verify-jwt
```

The `--no-verify-jwt` flag is needed because the cron calls it with a service role token, not a user JWT.

### 4. Push & deploy

The Next.js code auto-deploys via Vercel on push to main. Apply the small patch to `src/app/admin/payroll/runs/page.tsx` per `PATCH-runs-page.md`.

---

## Testing checklist

### Smoke test (no payroll data needed)

1. Visit `/admin/payroll/nis` — should render the empty state with a Generate now button. No 404.
2. Click Generate now — expect a skipped: no_employees message because no payroll run exists yet.

### Full test (after first payroll run is locked)

1. Onboard the 3 active employees with NIS numbers via the EmployeeNisFields component:
   - Darell Saul: `B20780466`
   - Suraj Jailall: `A21228796`
   - Clabert Bacchus: `B20990529`
2. Run a test payroll for the current month, lock as paid.
3. Visit `/admin/payroll/nis` -> Generate now.
4. Verify: schedule row appears, total_payable = total_insurable x 0.14, PDF downloads with employer header + all 3 employees, Slack #hr-payroll posts a privacy-safe reminder (no names/amounts), Mark as paid works.

### Cron test (no waiting until the 10th)

```sql
SELECT net.http_post(
  url     := current_setting('app.settings.edge_url') || '/functions/v1/nis-generate',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
  ),
  body    := jsonb_build_object('trigger', 'manual_test')
);
```

Then check `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;`.

---

## Operational notes

### NIS rates assumed

- **Employee:** 5.6% of insurable earnings
- **Employer:** 8.4% of insurable earnings
- **Total payable:** 14%
- **Insurable ceiling:** GYD 280,000 / month per employee (Guyana NIS 2024+ rate — adjust in `generate_nis_schedule` if GRA updates)
- **Industrial benefit (1%):** Currently 0 in line items. Update the function if you take on industrial work.

### Who gets included

Only employees where ALL of these are true: `status = 'active'`, `exclude_from_nis = false`, `pay_type = 'salary'`, and has a row in `payroll_items` for the latest paid `payroll_runs` covering that month. Hourly workers are automatically excluded.

### Privacy

The Slack ping is intentionally generic — no employee names, no amounts, no NIS numbers. Just: NIS schedule ready for [Month]. Due in [n] days. Detail lives only inside the admin app.

### If NIS numbers are missing

The cron generates anyway with MISSING in red on the PDF rows, and posts a separate Slack warning telling you how many to fix. Regenerate after fixing.

---

## Rollback

```sql
-- Stop the cron first (safest)
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'nis-monthly-generate';

-- Full rollback (DESTRUCTIVE)
DROP TABLE IF EXISTS nis_schedule_items CASCADE;
DROP TABLE IF EXISTS nis_schedules CASCADE;
DROP TABLE IF EXISTS nis_employer CASCADE;
DROP FUNCTION IF EXISTS generate_nis_schedule(INTEGER, INTEGER, TEXT);
DROP FUNCTION IF EXISTS queue_nis_reminder_notification(UUID);
DROP FUNCTION IF EXISTS mark_nis_schedule_paid(UUID, TEXT, TEXT);
```

The `employees` table additions are non-destructive (new nullable columns) so leave those.

---

## Pending follow-ups (not in this patch)

- Privacy-safe Slack patch for existing notification builders (separate work)
- Mark-paid UI confirmation modal (currently uses `prompt()`; fine for v1)
- Multi-page PDF support for >30 employees (currently single-page Letter)
- Wire EmployeeNisFields into the onboarding pipeline UI, not just employee detail

---

Built by Claude for Eric Jewan · Evolve Wireless Internet & Solar Solutions · Guyana
