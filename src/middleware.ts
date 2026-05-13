import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return supabaseResponse;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options as Record<string, unknown>)
        );
      },
    },
  });

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ============ CUSTOMER PORTAL ============
  if (pathname.startsWith("/portal") && !user) {
    const next = request.nextUrl.clone();
    next.pathname = "/login";
    return NextResponse.redirect(next);
  }

  if (pathname === "/login" && user) {
    // Only redirect to /portal if they are a customer, not an admin
    const { data: admin } = await supabase
      .from("admins").select("id").eq("id", user.id).maybeSingle();
    if (!admin) {
      const next = request.nextUrl.clone();
      next.pathname = "/portal";
      return NextResponse.redirect(next);
    }
  }

  // ============ ADMIN AREA ============
  // Public admin pages: /admin/login (sign in), /admin/reset-password (post-email recovery flow).
  // These are reachable without an active admin session.
  const isPublicAdminPath =
    pathname === "/admin/login" || pathname === "/admin/reset-password";

  if (pathname.startsWith("/admin") && !isPublicAdminPath) {
    if (!user) {
      const next = request.nextUrl.clone();
      next.pathname = "/admin/login";
      next.searchParams.set("next", pathname);
      return NextResponse.redirect(next);
    }

    const { data: admin } = await supabase
      .from("admins")
      .select("id, active")
      .eq("id", user.id)
      .maybeSingle();

    if (!admin || !admin.active) {
      await supabase.auth.signOut();
      const next = request.nextUrl.clone();
      next.pathname = "/admin/login";
      next.searchParams.set("error", "not_authorized");
      return NextResponse.redirect(next);
    }
  }

  if (pathname === "/admin/login" && user) {
    const { data: admin } = await supabase
      .from("admins")
      .select("id, active")
      .eq("id", user.id)
      .maybeSingle();
    if (admin && admin.active) {
      const next = request.nextUrl.clone();
      next.pathname = "/admin/payroll";
      next.search = "";
      return NextResponse.redirect(next);
    }
  }

  // ============ STAFF PORTAL ============
  // Public staff pages: /staff/login (sign in), /staff/reset-password (post-email recovery).
  const isPublicStaffPath =
    pathname === "/staff/login" || pathname === "/staff/reset-password";

  if (pathname.startsWith("/staff") && !isPublicStaffPath) {
    if (!user) {
      const next = request.nextUrl.clone();
      next.pathname = "/staff/login";
      next.searchParams.set("next", pathname);
      return NextResponse.redirect(next);
    }

    // Verify the signed-in user is staff (has a linked, portal-enabled employee row).
    // We use the SECURITY DEFINER my_account_kind() function so this works without
    // RLS-on-employees fighting us.
    const { data: kindRow } = await supabase.rpc("my_account_kind");
    if (kindRow !== "staff") {
      await supabase.auth.signOut();
      const next = request.nextUrl.clone();
      next.pathname = "/staff/login";
      next.searchParams.set("error", "not_staff");
      return NextResponse.redirect(next);
    }
  }

  if (pathname === "/staff/login" && user) {
    const { data: kindRow } = await supabase.rpc("my_account_kind");
    if (kindRow === "staff") {
      const next = request.nextUrl.clone();
      next.pathname = "/staff";
      next.search = "";
      return NextResponse.redirect(next);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/portal/:path*", "/login", "/admin/:path*", "/staff/:path*"],
};
