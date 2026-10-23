-- Tech start-of-day cash advances + equipment checkout (applied 2026-10-23)
CREATE TABLE IF NOT EXISTS tech_day_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sheet_date DATE NOT NULL,
  technician_name TEXT NOT NULL,
  cash_advance_gyd NUMERIC NOT NULL DEFAULT 0,
  cash_purpose TEXT,
  equipment_taken JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'open',
  closed_at TIMESTAMPTZ,
  equipment_returned JSONB,
  purchases_gyd NUMERIC,
  cash_returned_gyd NUMERIC,
  close_notes TEXT,
  collections_total_gyd NUMERIC,
  collections_count INT
);
CREATE INDEX IF NOT EXISTS idx_day_sheets_status ON tech_day_sheets (status, sheet_date DESC);
ALTER TABLE tech_day_sheets ENABLE ROW LEVEL SECURITY;
