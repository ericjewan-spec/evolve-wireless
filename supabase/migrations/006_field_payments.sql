-- Field technician part/service payment collections (applied 2026-10-22)
CREATE TABLE IF NOT EXISTS field_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  account_number TEXT NOT NULL,
  uisp_client_id TEXT,
  uisp_payment_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_gyd NUMERIC NOT NULL,
  technician_name TEXT NOT NULL,
  subscriber_signature TEXT,
  status TEXT NOT NULL DEFAULT 'recorded',
  uisp_error TEXT
);
CREATE INDEX IF NOT EXISTS idx_field_payments_created ON field_payments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_field_payments_account ON field_payments (account_number);
ALTER TABLE field_payments ENABLE ROW LEVEL SECURITY;
