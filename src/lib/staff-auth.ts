"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export type CurrentEmployee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  department: string | null;
  pay_type: string;
  pay_rate: number;
  pay_cycle: string;
  start_date: string;
  status: string;
  pin_code: string | null;
  leave_balance_vacation: number | null;
  leave_balance_sick: number | null;
  date_of_birth: string | null;
  gender: string | null;
  marital_status: string | null;
  address: string | null;
  nis_number: string | null;
  tin_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  photo_url: string | null;
  notes: string | null;
  bank_name: string | null;
  bank_account: string | null;
  auth_user_id: string | null;
  portal_enabled: boolean;
};

/**
 * Hook returning the employee row tied to the signed-in auth user.
 * Returns null while loading or if there's no linked employee (the middleware
 * should already have redirected such users to /staff/login).
 */
export function useCurrentEmployee() {
  const [employee, setEmployee] = useState<CurrentEmployee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) { setEmployee(null); setLoading(false); }
        return;
      }
      const { data } = await supabase
        .from("current_employee")
        .select("*")
        .maybeSingle();
      if (!cancelled) {
        setEmployee(data as CurrentEmployee | null);
        setLoading(false);
      }
    }

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => { load(); });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  return { employee, loading };
}
