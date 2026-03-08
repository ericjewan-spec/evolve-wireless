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

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center px-6 transition-all duration-300 border-b ${
          scrolled
            ? "bg-navy/92 backdrop-blur-[20px] border-divider"
            : "border-transparent"
        }`}
      >
        <div className="flex items-center justify-between max-w-[1200px] mx-auto w-full">
          <Link href="/" aria-label="Home">
            <Logo className="h-[42px] w-auto" />
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-8 list-none">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-[0.88rem] font-medium text-text2 hover:text-text transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/contact" className="btn btn-outline btn-sm">
              Contact Us
            </Link>
            <Link href="/plans" className="btn btn-primary btn-sm">
              Sign Up
            </Link>
          </div>

          {/* Hamburger */}
          <button
            className="flex md:hidden flex-col gap-[5px] p-1 bg-transparent border-none cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span
              className={`block w-6 h-[2px] bg-text rounded transition-transform ${
                menuOpen ? "rotate-45 translate-y-[7px]" : ""
              }`}
            />
            <span
              className={`block w-6 h-[2px] bg-text rounded transition-opacity ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-6 h-[2px] bg-text rounded transition-transform ${
                menuOpen ? "-rotate-45 -translate-y-[7px]" : ""
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed top-[72px] inset-x-0 bottom-0 bg-navy/97 backdrop-blur-[20px] z-40 p-10 flex flex-col gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-[family-name:var(--font-display)] text-[1.3rem] font-bold text-text2 hover:text-cyan transition-colors"
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
