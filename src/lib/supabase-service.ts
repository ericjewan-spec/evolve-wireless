import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for server-only use.
 *
 * Bypasses RLS — NEVER import this into a client component. Used by:
 *   • /api/v1/field/signup (insert install records)
 *   • /contract/[token]    (read a single agreement by its public token,
 *                           for an unauthenticated customer)
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in the environment (already set in
 * Vercel — the NIS route uses it too).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
