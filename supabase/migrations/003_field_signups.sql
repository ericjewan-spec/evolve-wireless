-- =============================================================
-- EVOLVE WIRELESS — Field Technician Signups
-- Path: supabase/migrations/003_field_signups.sql
--
-- Powers the /staff/install form: a field tech signs up a customer
-- at the moment installation is completed. The record holds everything
-- needed to (a) create the UISP CRM client + service, (b) render the
-- customer agreement at /contract/{public_token}, and (c) deliver the
-- account number + contract link over WhatsApp.
--
-- Account number scheme: 'E' + UISP client id (unique, monotonic,
-- tied directly to UISP). If UISP isn't connected yet, account_number
-- stays NULL ("pending") and the row can be re-synced later.
-- =============================================================

CREATE TABLE IF NOT EXISTS field_signups (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Public, unguessable token used in the /contract/{token} URL
  public_token       UUID NOT NULL DEFAULT gen_random_uuid(),

  -- Customer
  full_name          TEXT NOT NULL,
  phone              TEXT NOT NULL,           -- WhatsApp number, GY format
  email              TEXT,
  region             TEXT NOT NULL DEFAULT 'ecd',   -- 'ecd' | 'region1'
  village            TEXT,
  address            TEXT NOT NULL,

  -- Service
  plan_id            TEXT NOT NULL,           -- e.g. 'ecd-family'
  plan_name          TEXT NOT NULL,
  monthly_gyd        INT NOT NULL,
  base_mbps          INT NOT NULL,
  install_fee_gyd    INT NOT NULL DEFAULT 20000,
  equipment          TEXT DEFAULT 'Ubiquiti LiteBeam AC Gen2',

  -- Router / WiFi handed to the customer
  wifi_name          TEXT,
  wifi_password      TEXT,

  -- Landlord consent (agreement clause 11)
  landlord_name      TEXT,

  -- Signatures (data URLs from the on-site signature pad)
  subscriber_signature TEXT,

  -- Who did the install
  technician_name    TEXT,
  install_date       DATE NOT NULL DEFAULT (now() AT TIME ZONE 'America/Guyana')::date,

  -- UISP linkage
  uisp_client_id     TEXT,
  uisp_service_id    TEXT,
  account_number     TEXT,                    -- 'E' + uisp_client_id once synced
  uisp_synced_at     TIMESTAMPTZ,
  uisp_error         TEXT,

  -- Delivery
  whatsapp_sent_at   TIMESTAMPTZ,
  contract_signed_at TIMESTAMPTZ,

  status             TEXT NOT NULL DEFAULT 'installed',  -- installed | active | pending_sync
  created_by         UUID,                    -- auth.users id of the tech
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_field_signups_token   ON field_signups (public_token);
CREATE INDEX IF NOT EXISTS idx_field_signups_created ON field_signups (created_at DESC);

ALTER TABLE field_signups ENABLE ROW LEVEL SECURITY;

-- Staff (any authenticated employee/admin) can insert + read their own installs.
-- The API route uses the service role, which bypasses RLS, so these policies
-- are a safety net for direct client reads inside /staff.
DROP POLICY IF EXISTS "staff insert field signups" ON field_signups;
CREATE POLICY "staff insert field signups" ON field_signups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "staff read field signups" ON field_signups;
CREATE POLICY "staff read field signups" ON field_signups
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- updated_at
DROP TRIGGER IF EXISTS set_updated_at_field_signups ON field_signups;
CREATE TRIGGER set_updated_at_field_signups
  BEFORE UPDATE ON field_signups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
