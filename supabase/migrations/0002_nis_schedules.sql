-- =============================================================
-- EVOLVE HR — NIS AUTO-GENERATION FEATURE
-- Migration 0002: NIS schedules, employee NIS fields, cron job
-- Run this in Supabase SQL Editor (or via Supabase CLI)
-- =============================================================

-- ───────────────────────────────────────────────────────────────
-- 1. EMPLOYEE NIS FIELDS (idempotent — safe to re-run)
-- ───────────────────────────────────────────────────────────────
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nis_number TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tin_number TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS exclude_from_nis BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN employees.nis_number IS 'Guyana NIS contributor number (e.g. B20780466)';
COMMENT ON COLUMN employees.exclude_from_nis IS 'Set to true for casual/hourly workers not on the monthly NIS schedule';

-- ───────────────────────────────────────────────────────────────
-- 2. EMPLOYER NIS PROFILE (single row, settings-style)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nis_employer (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_name   TEXT NOT NULL,
  employer_nis    TEXT NOT NULL,
  address_line_1  TEXT NOT NULL,
  address_line_2  TEXT,
  region          TEXT,
  phone           TEXT,
  -- Singleton lock: only one row ever
  singleton       BOOLEAN NOT NULL DEFAULT true UNIQUE,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed with the canonical employer details (idempotent)
INSERT INTO nis_employer (employer_name, employer_nis, address_line_1, region, phone)
VALUES (
  'PARSRAM JEWAN',
  '41421',
  '41 Railway Embankment',
  'East Coast Demerara',
  '+592 698 9219'
)
ON CONFLICT (singleton) DO NOTHING;

ALTER TABLE nis_employer ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access nis_employer" ON nis_employer
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────
-- 3. NIS SCHEDULES TABLE (one row per month)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nis_schedules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Period identification (e.g. 2026, 6 for June 2026)
  period_year      INTEGER NOT NULL,
  period_month     INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_label     TEXT NOT NULL,                          -- "June 2026"

  -- Link to the underlying payroll run (may be null if generated manually)
  payroll_run_id   UUID REFERENCES payroll_runs(id) ON DELETE SET NULL,

  -- Lifecycle
  status           TEXT NOT NULL DEFAULT 'generated'
                   CHECK (status IN ('generated', 'paid', 'cancelled')),
  generated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by     TEXT,                                   -- 'system:cron' or user email
  paid_at          TIMESTAMPTZ,
  paid_by          TEXT,
  payment_ref      TEXT,                                   -- NIS receipt #, optional

  -- Aggregates (computed at generation time)
  total_employees       INTEGER NOT NULL DEFAULT 0,
  total_insurable       NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_employee_5_6    NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_employer_8_4    NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_payable         NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_industrial_1    NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Optional cached snapshot of line items at generation time
  line_items_json  JSONB,

  -- Storage paths
  pdf_path         TEXT,

  -- Notification state
  reminder_sent_at TIMESTAMPTZ,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_nis_schedules_period
  ON nis_schedules (period_year DESC, period_month DESC);

ALTER TABLE nis_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access nis_schedules" ON nis_schedules
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────
-- 4. NIS LINE ITEMS (one row per employee per schedule)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nis_schedule_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id       UUID NOT NULL REFERENCES nis_schedules(id) ON DELETE CASCADE,
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,

  surname           TEXT NOT NULL,
  other_names       TEXT NOT NULL,
  nis_number        TEXT,
  date_of_birth     DATE,

  insurable_earnings NUMERIC(12,2) NOT NULL,
  employee_5_6       NUMERIC(12,2) NOT NULL,
  employer_8_4       NUMERIC(12,2) NOT NULL,
  industrial_1       NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_payable      NUMERIC(12,2) NOT NULL,

  sort_order         INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (schedule_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_nis_schedule_items_schedule
  ON nis_schedule_items (schedule_id);

ALTER TABLE nis_schedule_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access nis_schedule_items" ON nis_schedule_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- ───────────────────────────────────────────────────────────────
-- 5. GENERATION FUNCTION (idempotent: re-runs UPDATE in place)
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_nis_schedule(
  p_year     INTEGER,
  p_month    INTEGER,
  p_actor    TEXT DEFAULT 'system:cron'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_schedule_id   UUID;
  v_run_id        UUID;
  v_label         TEXT;
  v_period_start  DATE;
  v_period_end    DATE;
  v_total_emp     INTEGER := 0;
  v_total_insur   NUMERIC(12,2) := 0;
  v_total_5_6     NUMERIC(12,2) := 0;
  v_total_8_4     NUMERIC(12,2) := 0;
  v_total_pay     NUMERIC(12,2) := 0;
  v_lines_json    JSONB;
BEGIN
  v_period_start := make_date(p_year, p_month, 1);
  v_period_end   := (v_period_start + INTERVAL '1 month - 1 day')::date;
  v_label        := to_char(v_period_start, 'FMMonth YYYY');

  SELECT id INTO v_run_id
  FROM payroll_runs
  WHERE status = 'paid'
    AND period_start <= v_period_end
    AND period_end   >= v_period_start
  ORDER BY period_end DESC
  LIMIT 1;

  INSERT INTO nis_schedules (
    period_year, period_month, period_label, payroll_run_id,
    status, generated_at, generated_by
  )
  VALUES (
    p_year, p_month, v_label, v_run_id,
    'generated', now(), p_actor
  )
  ON CONFLICT (period_year, period_month) DO UPDATE
    SET payroll_run_id = EXCLUDED.payroll_run_id,
        generated_at   = now(),
        generated_by   = p_actor,
        updated_at     = now()
  RETURNING id INTO v_schedule_id;

  DELETE FROM nis_schedule_items WHERE schedule_id = v_schedule_id;

  IF v_run_id IS NOT NULL THEN
    INSERT INTO nis_schedule_items (
      schedule_id, employee_id,
      surname, other_names, nis_number, date_of_birth,
      insurable_earnings, employee_5_6, employer_8_4, industrial_1, total_payable,
      sort_order
    )
    SELECT
      v_schedule_id,
      e.id,
      e.last_name,
      e.first_name,
      e.nis_number,
      e.date_of_birth,
      LEAST(pi.gross_pay, 280000)                                  AS insurable_earnings,
      ROUND(LEAST(pi.gross_pay, 280000) * 0.056, 0)                AS employee_5_6,
      ROUND(LEAST(pi.gross_pay, 280000) * 0.084, 0)                AS employer_8_4,
      0                                                            AS industrial_1,
      ROUND(LEAST(pi.gross_pay, 280000) * 0.14, 0)                 AS total_payable,
      ROW_NUMBER() OVER (ORDER BY e.last_name, e.first_name)       AS sort_order
    FROM payroll_items pi
    JOIN employees e ON e.id = pi.employee_id
    WHERE pi.payroll_run_id = v_run_id
      AND e.status = 'active'
      AND e.exclude_from_nis = false
      AND e.pay_type = 'salary';
  END IF;

  SELECT
    COUNT(*),
    COALESCE(SUM(insurable_earnings), 0),
    COALESCE(SUM(employee_5_6), 0),
    COALESCE(SUM(employer_8_4), 0),
    COALESCE(SUM(total_payable), 0)
  INTO v_total_emp, v_total_insur, v_total_5_6, v_total_8_4, v_total_pay
  FROM nis_schedule_items
  WHERE schedule_id = v_schedule_id;

  SELECT jsonb_agg(row_to_json(si.*) ORDER BY si.sort_order)
  INTO v_lines_json
  FROM nis_schedule_items si
  WHERE si.schedule_id = v_schedule_id;

  UPDATE nis_schedules
  SET total_employees    = v_total_emp,
      total_insurable    = v_total_insur,
      total_employee_5_6 = v_total_5_6,
      total_employer_8_4 = v_total_8_4,
      total_payable      = v_total_pay,
      line_items_json    = v_lines_json,
      updated_at         = now()
  WHERE id = v_schedule_id;

  RETURN v_schedule_id;
END;
$$;

-- ───────────────────────────────────────────────────────────────
-- 6. NOTIFICATION HELPER (privacy-safe — NO names, NO amounts)
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION queue_nis_reminder_notification(p_schedule_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_label TEXT;
  v_days_until_15 INTEGER;
  v_today DATE;
BEGIN
  SELECT period_label INTO v_label FROM nis_schedules WHERE id = p_schedule_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Schedule % not found', p_schedule_id; END IF;

  v_today := (now() AT TIME ZONE 'America/Guyana')::date;
  v_days_until_15 := 15 - EXTRACT(DAY FROM v_today)::int;
  IF v_days_until_15 < 0 THEN v_days_until_15 := 0; END IF;

  INSERT INTO notification_log (event_type, title, body, status, scheduled_for)
  VALUES (
    'nis_schedule_ready',
    'NIS schedule ready for ' || v_label,
    'Due in ' || v_days_until_15 || ' days. Open admin → Payroll → NIS to review and pay.',
    'queued',
    now()
  );

  UPDATE nis_schedules SET reminder_sent_at = now() WHERE id = p_schedule_id;
END;
$$;

CREATE OR REPLACE FUNCTION mark_nis_schedule_paid(
  p_schedule_id UUID,
  p_actor       TEXT,
  p_ref         TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE nis_schedules
  SET status      = 'paid',
      paid_at     = now(),
      paid_by     = p_actor,
      payment_ref = p_ref,
      updated_at  = now()
  WHERE id = p_schedule_id;

  INSERT INTO notification_log (event_type, title, body, status, scheduled_for)
  VALUES (
    'nis_schedule_paid',
    'NIS schedule marked as paid',
    'NIS payment confirmed in admin.',
    'queued',
    now()
  );
END;
$$;

-- ───────────────────────────────────────────────────────────────
-- 7. CRON JOB — 10th of every month, 12:00 UTC (08:00 Guyana)
-- ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'nis-monthly-generate' LIMIT 1;

SELECT cron.schedule(
  'nis-monthly-generate',
  '0 12 10 * *',
  $cron$
    SELECT net.http_post(
      url     := current_setting('app.settings.edge_url') || '/functions/v1/nis-generate',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body    := jsonb_build_object('trigger', 'cron')
    );
  $cron$
);

-- ───────────────────────────────────────────────────────────────
-- 8. STORAGE BUCKET
-- ───────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('nis-schedules', 'nis-schedules', false) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admin read nis pdfs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'nis-schedules');

SELECT 'NIS migration 0002 complete' AS status;
