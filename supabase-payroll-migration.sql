-- =============================================
-- EVOLVE WIRELESS PAYROLL SYSTEM
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'Technician',
  department TEXT DEFAULT 'Operations',
  pay_type TEXT NOT NULL CHECK (pay_type IN ('hourly', 'salary')),
  pay_rate NUMERIC(12,2) NOT NULL, -- GYD per hour (hourly) or GYD per period (salary)
  pay_cycle TEXT NOT NULL CHECK (pay_cycle IN ('fortnightly', 'monthly')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  annual_leave_days INTEGER DEFAULT 14,
  sick_leave_days INTEGER DEFAULT 10,
  leave_balance_vacation NUMERIC(4,1) DEFAULT 14,
  leave_balance_sick NUMERIC(4,1) DEFAULT 10,
  pin_code TEXT, -- 4-digit PIN for clock in/out
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ATTENDANCE TABLE (clock in/out records)
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  hours_worked NUMERIC(5,2), -- auto-calculated
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'holiday')),
  notes TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'self_service')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- 3. LEAVE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('vacation', 'sick', 'personal', 'unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count NUMERIC(4,1) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PAYROLL RUNS TABLE
CREATE TABLE IF NOT EXISTS payroll_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  pay_cycle TEXT NOT NULL CHECK (pay_cycle IN ('fortnightly', 'monthly')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
  total_amount NUMERIC(14,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PAYROLL LINE ITEMS (one per employee per pay run)
CREATE TABLE IF NOT EXISTS payroll_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  regular_hours NUMERIC(6,2) DEFAULT 0,
  overtime_hours NUMERIC(6,2) DEFAULT 0,
  days_worked INTEGER DEFAULT 0,
  days_absent INTEGER DEFAULT 0,
  days_leave INTEGER DEFAULT 0,
  gross_pay NUMERIC(12,2) NOT NULL,
  deductions NUMERIC(12,2) DEFAULT 0,
  net_pay NUMERIC(12,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(payroll_run_id, employee_id)
);

-- Enable RLS but allow service role full access
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;

-- Policies: allow authenticated users (admin) full access
CREATE POLICY "Admin full access employees" ON employees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access attendance" ON attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access leave_requests" ON leave_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access payroll_runs" ON payroll_runs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access payroll_items" ON payroll_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Anon policies for self-service clock in (by PIN)
CREATE POLICY "Anon clock in" ON attendance FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon read own attendance" ON attendance FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read employees for pin" ON employees FOR SELECT TO anon USING (true);

-- Function to auto-calculate hours_worked on clock_out
CREATE OR REPLACE FUNCTION calc_hours_worked()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.clock_in IS NOT NULL AND NEW.clock_out IS NOT NULL THEN
    NEW.hours_worked := ROUND(EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 3600.0, 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_calc_hours
BEFORE INSERT OR UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION calc_hours_worked();
