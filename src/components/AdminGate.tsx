"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { useCurrentAdmin } from "@/lib/auth";

/**
 * Admin chrome — top bar with logo, navigation, and signed-in user menu.
 * Auth gating happens in middleware.ts. This component just renders the
 * shared chrome around all /admin/* pages.
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, loading } = useCurrentAdmin();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = () => setMenuOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuOpen]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  if (loading) {
    return <div style={{ minHeight: "100vh", background: "#0C0A09" }} />;
  }

  if (!admin) {
    // Middleware should have redirected; if we somehow reach here, blank.
    return <div style={{ minHeight: "100vh", background: "#0C0A09" }} />;
  }

  const navItems: Array<{ href: string; label: string; ownerOnly?: boolean }> = [
    { href: "/admin/payroll", label: "Payroll" },
    { href: "/admin/leave", label: "Leave" },
    { href: "/admin/holidays", label: "Holidays" },
    { href: "/admin/admins", label: "Admins", ownerOnly: true },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0C0A09", color: "#F5F0EB", fontFamily: "'Nunito', sans-serif" }}>
      <header style={{
        borderBottom: "1px solid #1e1a17",
        background: "#100E0C",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <Link href="/admin/payroll" style={{
              color: "#F5F0EB",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: "-0.01em",
            }}>
              <span style={{ color: "#D4654A" }}>Evolve</span> Admin
            </Link>
            <nav style={{ display: "flex", gap: 4 }}>
              {navItems
                .filter((it) => !it.ownerOnly || admin.role === "owner")
                .map((it) => {
                  const active = pathname?.startsWith(it.href);
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        color: active ? "#F5F0EB" : "#8B7355",
                        background: active ? "#1a1513" : "transparent",
                        textDecoration: "none",
                        transition: "all 0.15s",
                      }}
                    >
                      {it.label}
                    </Link>
                  );
                })}
            </nav>
          </div>

          <div style={{ position: "relative" }}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((m) => !m); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 12px 6px 6px",
                background: "#1a1513",
                border: "1px solid #2a2420",
                borderRadius: 100,
                color: "#F5F0EB",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#D4654A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: 12,
              }}>
                {admin.full_name?.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?"}
              </div>
              <span style={{ fontWeight: 600 }}>{admin.full_name}</span>
              <span style={{ color: "#8B7355", fontSize: 12 }}>▾</span>
            </button>
            {menuOpen && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                background: "#141210",
                border: "1px solid #2a2420",
                borderRadius: 12,
                minWidth: 240,
                padding: 8,
                boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              }}>
                <div style={{ padding: "8px 12px 12px 12px", borderBottom: "1px solid #1e1a17", marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{admin.full_name}</div>
                  <div style={{ color: "#8B7355", fontSize: 12, marginTop: 2 }}>{admin.email}</div>
                  <div style={{
                    marginTop: 6,
                    display: "inline-block",
                    padding: "2px 8px",
                    background: "rgba(212,101,74,0.12)",
                    color: "#D4654A",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    borderRadius: 100,
                    textTransform: "uppercase",
                  }}>{admin.role}</div>
                </div>
                <button
                  onClick={signOut}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    background: "transparent",
                    border: "none",
                    color: "#F5F0EB",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 13,
                    borderRadius: 6,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#1a1513"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
