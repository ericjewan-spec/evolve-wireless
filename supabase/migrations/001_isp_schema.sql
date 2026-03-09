-- Evolve Wireless ISP Platform — Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- ══════════════════════════════════════
-- ENUMS
-- ══════════════════════════════════════
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'pending', 'cancelled');
CREATE TYPE user_role AS ENUM ('customer', 'technician', 'support', 'admin');
CREATE TYPE id_type AS ENUM ('national_id', 'passport', 'driver_licence');
CREATE TYPE subscription_status AS ENUM ('pending_install', 'active', 'suspended', 'cancelled');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'void');
CREATE TYPE payment_method AS ENUM ('card', 'bank_transfer', 'cash', 'mobile_money');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE ticket_type AS ENUM ('no_connection', 'slow_speed', 'intermittent', 'billing', 'equipment', 'upgrade', 'other');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed');
CREATE TYPE zone_status AS ENUM ('live', 'expanding', 'planned');

-- ══════════════════════════════════════
-- 1. PROFILES (extends auth.users)
-- ══════════════════════════════════════
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT, -- GY format +592XXXXXXX
  id_type id_type,
  id_number TEXT, -- encrypted at rest
  status user_status DEFAULT 'pending',
  role user_role DEFAULT 'customer',
  wa_opt_in BOOLEAN DEFAULT true,
  referral_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ══════════════════════════════════════
-- 2. PLANS
-- ══════════════════════════════════════
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('residential', 'business', 'starlink')),
  region TEXT NOT NULL CHECK (region IN ('ecd', 'region1', 'all')),
  speed_down_mbps INT,
  speed_up_mbps INT,
  price_gyd INT NOT NULL,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed ECD Plans
INSERT INTO plans (name, slug, type, region, speed_down_mbps, speed_up_mbps, price_gyd, features, sort_order) VALUES
  ('ECD Starter', 'ecd-starter', 'residential', 'ecd', 10, 5, 5000, '["Browsing & email", "1-2 devices", "Email support", "Free router"]', 1),
  ('ECD Family', 'ecd-family', 'residential', 'ecd', 25, 10, 8000, '["Streaming & video calls", "4-6 devices", "24/7 WhatsApp support", "Free router", "No throttling"]', 2),
  ('ECD Power', 'ecd-power', 'residential', 'ecd', 50, 20, 10000, '["Work from home + streaming", "8+ devices", "Priority support", "Free router", "Static IP available"]', 3),
  ('R1 Essential', 'r1-essential', 'residential', 'region1', 5, 2, 10000, '["Reliable connectivity", "Browsing, email & WhatsApp", "1-3 devices", "Local tech support"]', 4),
  ('R1 Standard', 'r1-standard', 'residential', 'region1', 15, 5, 15000, '["Streaming & video calls", "4-6 devices", "24/7 WhatsApp support", "Free router included"]', 5),
  ('R1 Premium', 'r1-premium', 'residential', 'region1', 30, 10, 25000, '["Full household coverage", "8+ devices", "Priority support", "Best speeds available", "Static IP available"]', 6);

-- ══════════════════════════════════════
-- 3. SUBSCRIPTIONS
-- ══════════════════════════════════════
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id),
  plan_id UUID NOT NULL REFERENCES plans(id),
  status subscription_status DEFAULT 'pending_install',
  service_address JSONB, -- {line1, line2, region, village, coordinates}
  billing_cycle_day INT DEFAULT 1 CHECK (billing_cycle_day BETWEEN 1 AND 28),
  autopay_enabled BOOLEAN DEFAULT false,
  install_date DATE,
  activated_at TIMESTAMPTZ,
  uisp_client_id TEXT, -- UISP CRM client ID for network management
  uisp_service_id TEXT, -- UISP service plan ID
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ══════════════════════════════════════
-- 4. INVOICES
-- ══════════════════════════════════════
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL, -- e.g. EWI-2025-00471
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  amount_gyd INT NOT NULL,
  due_date DATE NOT NULL,
  status invoice_status DEFAULT 'draft',
  line_items JSONB DEFAULT '[]', -- [{description, amount}]
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-generate invoice numbers
CREATE SEQUENCE invoice_seq START 1;

-- ══════════════════════════════════════
-- 5. PAYMENTS
-- ══════════════════════════════════════
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  method payment_method NOT NULL,
  amount_gyd INT NOT NULL,
  status payment_status DEFAULT 'pending',
  gateway_ref TEXT, -- External transaction ID
  bank_ref TEXT, -- For manual bank transfer reconciliation
  recorded_by UUID REFERENCES profiles(id), -- Admin who recorded cash payment
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════
-- 6. SUPPORT TICKETS
-- ══════════════════════════════════════
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL, -- e.g. TKT-8834
  customer_id UUID NOT NULL REFERENCES profiles(id),
  subscription_id UUID REFERENCES subscriptions(id),
  type ticket_type NOT NULL,
  priority ticket_priority DEFAULT 'medium',
  status ticket_status DEFAULT 'open',
  description TEXT,
  assigned_to UUID REFERENCES profiles(id),
  diagnostic_data JSONB,
  resolved_at TIMESTAMPTZ,
  csat_score INT CHECK (csat_score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE SEQUENCE ticket_seq START 1000;

-- Ticket messages
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════
-- 7. COVERAGE ZONES
-- ══════════════════════════════════════
CREATE TABLE coverage_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  region TEXT NOT NULL,
  status zone_status DEFAULT 'planned',
  description TEXT,
  areas TEXT[], -- e.g. {'Georgetown suburbs', 'Buxton', 'Mahaica'}
  coordinates JSONB, -- GeoJSON polygon for map rendering
  available_plan_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed coverage zones
INSERT INTO coverage_zones (name, slug, region, status, description, areas) VALUES
  ('East Coast Demerara', 'ecd', 'Demerara-Mahaica', 'live', 'Primary coverage zone — residential and commercial', ARRAY['Georgetown suburbs', 'Beterverwagting', 'Buxton', 'Vigilance', 'Mahaica', 'East Bank']),
  ('Port Kaituma', 'port-kaituma', 'Region 1', 'live', 'Dedicated wireless coverage for Port Kaituma and surrounds', ARRAY['Port Kaituma town', 'Surrounding villages', 'Mining operations']),
  ('Mabaruma', 'mabaruma', 'Region 1', 'live', 'Coverage for Mabaruma and nearby communities', ARRAY['Mabaruma', 'Kumaka', 'Surrounding areas']),
  ('Matthews Ridge', 'matthews-ridge', 'Region 1', 'live', 'Coverage for Matthews Ridge community', ARRAY['Matthews Ridge', 'Surrounding areas']),
  ('Baramita', 'baramita', 'Region 1', 'live', 'Coverage for Baramita community', ARRAY['Baramita', 'Surrounding areas']),
  ('Expanding Areas', 'expanding', 'Various', 'expanding', 'New towers being planned', ARRAY['New Amsterdam', 'Linden', 'Berbice corridor']);

-- ══════════════════════════════════════
-- WAITLIST (for uncovered areas)
-- ══════════════════════════════════════
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  lat FLOAT,
  lng FLOAT,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Public read on plans and coverage
CREATE POLICY "Plans are viewable by everyone" ON plans FOR SELECT USING (true);
CREATE POLICY "Coverage zones are viewable by everyone" ON coverage_zones FOR SELECT USING (true);

-- Profiles: users can read their own
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Subscriptions: customers see their own
CREATE POLICY "Customers view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = customer_id);

-- Invoices: customers see invoices for their subscriptions
CREATE POLICY "Customers view own invoices" ON invoices FOR SELECT USING (
  subscription_id IN (SELECT id FROM subscriptions WHERE customer_id = auth.uid())
);

-- Payments: customers see their own payments
CREATE POLICY "Customers view own payments" ON payments FOR SELECT USING (
  invoice_id IN (
    SELECT i.id FROM invoices i
    JOIN subscriptions s ON i.subscription_id = s.id
    WHERE s.customer_id = auth.uid()
  )
);

-- Support tickets: customers see their own
CREATE POLICY "Customers view own tickets" ON support_tickets FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers create tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Ticket messages: visible if ticket belongs to customer
CREATE POLICY "Customers view ticket messages" ON ticket_messages FOR SELECT USING (
  ticket_id IN (SELECT id FROM support_tickets WHERE customer_id = auth.uid())
);
CREATE POLICY "Customers send ticket messages" ON ticket_messages FOR INSERT WITH CHECK (
  ticket_id IN (SELECT id FROM support_tickets WHERE customer_id = auth.uid())
);

-- Waitlist: anyone can insert
CREATE POLICY "Anyone can join waitlist" ON waitlist FOR INSERT WITH CHECK (true);

-- ══════════════════════════════════════
-- FUNCTIONS
-- ══════════════════════════════════════
-- Auto-generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'EWI-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_seq')::text, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Auto-generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'TKT-' || nextval('ticket_seq')::text;
END;
$$ LANGUAGE plpgsql;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'customer',
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON coverage_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at();
