"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { useCurrentEmployee } from "@/lib/staff-auth";

const NAV = [
  { href: "/staff", label: "Overview" },
  { href: "/staff/hours", label: "Hours" },
  { href: "/staff/leave", label: "Leave" },
  { href: "/staff/payslips", label: "Payslips" },
  { href: "/staff/development", label: "Development" },
  { href: "/staff/documents", label: "Documents" },
  { href: "/staff/profile", label: "Profile" },
];

export function StaffGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { employee, loading } = useCurrentEmployee();
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
    router.push("/staff/login");
    router.refresh();
  }

  // Public staff paths don't need the gate or chrome — they render their own full-page UI.
  // (Server-side, the middleware also allows these without an active session.)
  const isPublicPath = pathname === "/staff/login" || pathname === "/staff/reset-password";
  if (isPublicPath) {
    return <>{children}</>;
  }

  if (loading) {
    return <div style={{ minHeight: "100vh", background: "#0C0A09" }} />;
  }
  if (!employee) {
    return <div style={{ minHeight: "100vh", background: "#0C0A09" }} />;
  }

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
          maxWidth: 1100,
          margin: "0 auto",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
            <Link href="/staff" style={{ color: "#F5F0EB", textDecoration: "none", fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em" }}>
              <span style={{ color: "#D4654A" }}>Evolve</span> Staff
            </Link>
            <nav style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {NAV.map((it) => {
                const active = it.href === "/staff" ? pathname === "/staff" : pathname?.startsWith(it.href);
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontSize: 13,
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
                width: 28, height: 28, borderRadius: "50%",
                background: "linear-gradient(135deg, #D4654A 0%, #E9B44C 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 800, fontSize: 12,
              }}>
                {employee.first_name[0]}{employee.last_name[0]}
              </div>
              <span style={{ fontWeight: 600 }}>{employee.first_name}</span>
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
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{employee.first_name} {employee.last_name}</div>
                  <div style={{ color: "#8B7355", fontSize: 12, marginTop: 2 }}>{employee.role}{employee.department ? ` · ${employee.department}` : ""}</div>
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
