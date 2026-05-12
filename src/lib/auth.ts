"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export type AdminRole = "owner" | "hr" | "finance" | "admin";

export type CurrentAdmin = {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  active: boolean;
  last_login_at: string | null;
  created_at: string;
};

export function useCurrentAdmin() {
  const [admin, setAdmin] = useState<CurrentAdmin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) { setAdmin(null); setLoading(false); }
        return;
      }
      const { data } = await supabase
        .from("current_admin")
        .select("*")
        .maybeSingle();
      if (!cancelled) {
        setAdmin(data as CurrentAdmin | null);
        setLoading(false);
      }
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => { load(); });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  return { admin, loading };
}

export function isOwner(admin: CurrentAdmin | null) {
  return admin?.role === "owner";
}

export function canManageFinance(admin: CurrentAdmin | null) {
  return admin?.role === "owner" || admin?.role === "finance";
}
