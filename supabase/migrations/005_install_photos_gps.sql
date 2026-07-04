-- Install photos + GPS location for field signups (applied 2026-07-04)
ALTER TABLE field_signups
  ADD COLUMN IF NOT EXISTS photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gps_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS gps_lon DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS gps_accuracy_m DOUBLE PRECISION;

INSERT INTO storage.buckets (id, name, public)
VALUES ('install-photos', 'install-photos', false)
ON CONFLICT (id) DO NOTHING;
