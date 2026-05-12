import { createBrowserClient } from "@supabase/ssr";

// Build-safe: during Next.js prerender, public env vars may not be inlined.
// Return a placeholder client if missing so the build doesn't crash.
// At runtime in the browser, the real env vars are available and a real client is constructed.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return createBrowserClient(
      "https://placeholder.supabase.co",
      "placeholder-anon-key"
    );
  }

  return createBrowserClient(url, key);
}
