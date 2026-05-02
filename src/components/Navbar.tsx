"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/plans", label: "Packages" },
  { href: "/coverage/map", label: "Coverage" },
  { href: "/solar", label: "☀️ Solar" },
  { href: "/micro-strategy", label: "💡 Micro Strategy" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center transition-all duration-300"
        style={{
          height: "76px",
          padding: "0 clamp(16px, 4vw, 40px)",
          background: scrolled ? "rgba(253, 248, 243, 0.97)" : "rgba(253, 248, 243, 0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: scrolled ? "1px solid rgba(44, 24, 16, 0.08)" : "1px solid transparent",
          boxShadow: scrolled ? "0 2px 24px rgba(44, 24, 16, 0.06)" : "none",
        }}
      >
        <div className="flex items-center justify-between max-w-[1200px] mx-auto w-full">
          <Link href="/" aria-label="Home" className="shrink-0">
            <Logo className="h-[44px] w-auto" />
          </Link>

          {/* Desktop Nav Links */}
          <ul className="hidden lg:flex items-center list-none" style={{ gap: "6px" }}>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-medium rounded-full transition-all duration-200"
                  style={{
                    fontSize: "0.92rem",
                    padding: "10px 18px",
                    color: isActive(link.href) ? "var(--terracotta)" : "var(--text2)",
                    background: isActive(link.href) ? "rgba(212, 101, 74, 0.06)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--terracotta)";
                    e.currentTarget.style.background = "rgba(212, 101, 74, 0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = isActive(link.href) ? "var(--terracotta)" : "var(--text2)";
                    e.currentTarget.style.background = isActive(link.href) ? "rgba(212, 101, 74, 0.06)" : "transparent";
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="font-semibold rounded-full transition-all duration-200"
              style={{
                fontSize: "0.92rem",
                padding: "10px 22px",
                color: "var(--text2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--terracotta)";
                e.currentTarget.style.background = "rgba(212, 101, 74, 0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text2)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              My Account
            </Link>
            <Link
              href="/plans"
              className="font-semibold rounded-full transition-all duration-200"
              style={{
                fontSize: "0.92rem",
                padding: "11px 26px",
                background: "var(--terracotta)",
                color: "#fff",
                boxShadow: "0 4px 16px rgba(212, 101, 74, 0.25)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow = "0 6px 24px rgba(212, 101, 74, 0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(212, 101, 74, 0.25)";
              }}
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="flex lg:hidden flex-col gap-[6px] p-2 bg-transparent border-none cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className="block w-6 h-[2px] rounded transition-all duration-300" style={{ background: "var(--text)", transform: menuOpen ? "rotate(45deg) translateY(8px)" : "none" }} />
            <span className="block w-6 h-[2px] rounded transition-all duration-300" style={{ background: "var(--text)", opacity: menuOpen ? 0 : 1 }} />
            <span className="block w-6 h-[2px] rounded transition-all duration-300" style={{ background: "var(--text)", transform: menuOpen ? "rotate(-45deg) translateY(-8px)" : "none" }} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="fixed top-[76px] inset-x-0 bottom-0 z-40 flex flex-col overflow-y-auto"
          style={{ background: "rgba(253, 248, 243, 0.98)", backdropFilter: "blur(20px)", padding: "32px clamp(24px, 6vw, 48px)" }}
        >
          <div className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-bold transition-colors rounded-xl"
                style={{
                  fontFamily: "'Bricolage Grotesque', serif",
                  fontSize: "1.15rem",
                  padding: "14px 16px",
                  color: isActive(link.href) ? "var(--terracotta)" : "var(--text2)",
                  background: isActive(link.href) ? "rgba(212, 101, 74, 0.06)" : "transparent",
                }}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div style={{ height: "1px", background: "rgba(44,24,16,0.08)", margin: "20px 0" }} />

          <div className="flex flex-col gap-3">
            <Link href="/login" className="btn btn-outline justify-center" style={{ padding: "14px 24px", fontSize: "0.95rem" }} onClick={() => setMenuOpen(false)}>
              My Account
            </Link>
            <Link href="/plans" className="btn btn-primary justify-center" style={{ padding: "14px 24px", fontSize: "0.95rem" }} onClick={() => setMenuOpen(false)}>
              Sign Up Now
            </Link>
            <a href="https://wa.me/5926092487" className="btn btn-cyan justify-center" style={{ padding: "14px 24px", fontSize: "0.95rem" }} target="_blank" rel="noopener">
              💬 WhatsApp Us
            </a>
          </div>
        </div>
      )}
    </>
  );
}
