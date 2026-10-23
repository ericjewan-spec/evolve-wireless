-- Per-technician PINs replacing the shared field code (applied 2026-10-23)
CREATE TABLE IF NOT EXISTS field_techs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS field_auth_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tech_name TEXT,
  success BOOLEAN NOT NULL,
  device_id TEXT,
  ip TEXT
);
CREATE INDEX IF NOT EXISTS idx_auth_log_recent ON field_auth_log (created_at DESC);
ALTER TABLE field_techs ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_auth_log ENABLE ROW LEVEL SECURITY;
-- PINs seeded separately; manage in Supabase Table Editor (field_techs)
