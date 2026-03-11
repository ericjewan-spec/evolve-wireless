"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#about", label: "About" },
  { href: "/#services", label: "Services" },
  { href: "/coverage", label: "Coverage" },
  { href: "/plans", label: "Packages" },
  { href: "/solar", label: "☀️ Solar", isSolar: true },
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

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center px-6 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(253, 248, 243, 0.95)" : "rgba(253, 248, 243, 0.7)",
          backdropFilter: "blur(20px)",
          borderBottom: scrolled ? "1px solid rgba(44, 24, 16, 0.08)" : "1px solid transparent",
          boxShadow: scrolled ? "0 2px 20px rgba(44, 24, 16, 0.06)" : "none",
        }}
      >
        <div className="flex items-center justify-between max-w-[1200px] mx-auto w-full">
          <Link href="/" aria-label="Home">
            <Logo className="h-[42px] w-auto" />
          </Link>

          <ul className="hidden md:flex items-center gap-1 list-none">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-[0.9rem] font-medium px-4 py-2 rounded-full transition-all duration-200"
                  style={{ color: "var(--text2)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--terracotta)";
                    e.currentTarget.style.background = "rgba(212, 101, 74, 0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text2)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-[0.9rem] font-medium px-4 py-2 rounded-full transition-all duration-200" style={{ color: "var(--text2)" }}>
              My Account
            </Link>
            <Link href="/contact" className="btn btn-outline" style={{ padding: "8px 20px", fontSize: "0.85rem" }}>
              Contact Us
            </Link>
            <Link href="/plans" className="btn btn-primary" style={{ padding: "8px 20px", fontSize: "0.85rem" }}>
              Sign Up
            </Link>
          </div>

          <button
            className="flex md:hidden flex-col gap-[5px] p-1 bg-transparent border-none cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span
              className="block w-6 h-[2px] rounded transition-transform"
              style={{ background: "var(--text)", transform: menuOpen ? "rotate(45deg) translateY(7px)" : "none" }}
            />
            <span
              className="block w-6 h-[2px] rounded transition-opacity"
              style={{ background: "var(--text)", opacity: menuOpen ? 0 : 1 }}
            />
            <span
              className="block w-6 h-[2px] rounded transition-transform"
              style={{ background: "var(--text)", transform: menuOpen ? "rotate(-45deg) translateY(-7px)" : "none" }}
            />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div
          className="fixed top-[72px] inset-x-0 bottom-0 z-40 p-10 flex flex-col gap-8"
          style={{ background: "rgba(253, 248, 243, 0.97)", backdropFilter: "blur(20px)" }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[1.3rem] font-bold transition-colors"
              style={{ fontFamily: "'Bricolage Grotesque', serif", color: "var(--text2)" }}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-3 flex-wrap mt-4">
            <Link href="/plans" className="btn btn-primary" onClick={() => setMenuOpen(false)}>
              Sign Up Now
            </Link>
            <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5926092487"}`} className="btn btn-outline" target="_blank" rel="noopener">
              WhatsApp Us
            </a>
          </div>
        </div>
      )}
    </>
  );
}
