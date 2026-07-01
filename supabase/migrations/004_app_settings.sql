-- =============================================================
-- EVOLVE — App settings (server-only key/value)
-- Path: supabase/migrations/004_app_settings.sql
--
-- Holds the shared field-install access code (field_install_code).
-- RLS is ON with no policies, so ONLY the service role can read it —
-- the code is never exposed to the browser/anon client. The public
-- /install form validates the code server-side via /api/v1/field/verify-code.
-- =============================================================

CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO app_settings (key, value)
VALUES ('field_install_code', 'EVOLVE-5650')
ON CONFLICT (key) DO NOTHING;
