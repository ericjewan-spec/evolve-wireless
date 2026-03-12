"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const catalog = [
  {
    id: 1,
    title: "Restaurant & Dining Website",
    sector: "Food & Hospitality",
    desc: "A dark, elegant restaurant website with online menu, table reservations, and GYD pricing. Features signature dish showcase, customer reviews, and WhatsApp ordering integration.",
    image: "/catalog/restaurant-website.png",
    features: ["Online menu with GYD pricing", "Table reservation system", "WhatsApp order integration", "Photo gallery", "Google Maps & reviews"],
    startingPrice: "GYD 250,000",
    color: "#D4654A",
  },
  {
    id: 2,
    title: "Real Estate & Property Platform",
    sector: "Real Estate",
    desc: "A clean, modern property listing platform with advanced search, map integration, and property detail pages. Supports buy, rent, and commercial categories.",
    image: "/catalog/realestate-website.png",
    features: ["Property search & filters", "Map integration", "Listing management", "Enquiry forms", "Agent profiles"],
    startingPrice: "GYD 500,000",
    color: "#2A9D8F",
  },
  {
    id: 3,
    title: "Fitness & Gym Website",
    sector: "Health & Fitness",
    desc: "A bold, high-energy gym website with membership plans in GYD, class schedules, trainer profiles, and online sign-up. Designed to convert visitors into members.",
    image: "/catalog/gym-website.png",
    features: ["Membership plans & pricing", "Class schedule & booking", "Trainer profiles", "Free trial sign-up", "Progress tracking"],
    startingPrice: "GYD 200,000",
    color: "#FF6B35",
  },
  {
    id: 4,
    title: "Professional Services Website",
    sector: "Legal / Consulting",
    desc: "A sophisticated, trust-building website for law firms, accounting practices, and consulting firms. Communicates credibility and expertise with elegant design.",
    image: "/catalog/lawfirm-website.png",
    features: ["Practice area pages", "Team profiles", "Consultation booking", "Client testimonials", "Blog / resources"],
    startingPrice: "GYD 300,000",
    color: "#8B6F4E",
  },
  {
    id: 5,
    title: "Billing & Invoice Dashboard",
    sector: "Business Automation",
    desc: "A complete invoicing and billing management system with client management, payment tracking, revenue analytics, and exportable reports — all in GYD.",
    image: "/catalog/billing-dashboard.png",
    features: ["Invoice creation & sending", "Payment tracking", "Client management", "Revenue analytics", "PDF export"],
    startingPrice: "GYD 400,000",
    color: "#2A9D8F",
  },
];

export default function CatalogPage() {
  const [selected, setSelected] = useState<typeof catalog[0] | null>(null);

  return (
    <div style={{ paddingTop: "var(--nav-height)" }}>
      {/* Header */}
      <section style={{ background: "linear-gradient(135deg, #FDF8F3 0%, #F3F0FF 50%, #FDF8F3 100%)", padding: "clamp(40px, 7vw, 72px) 0 clamp(24px, 4vw, 40px)" }}>
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)", textAlign: "center" }}>
          <span className="section-label" style={{ color: "var(--teal)", background: "rgba(42, 157, 143, 0.1)", padding: "6px 16px", borderRadius: "100px", display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            💡 Micro Strategy
          </span>
          <h1 style={{ fontSize: "var(--fs-display)", fontWeight: 800, color: "var(--text)", marginBottom: "12px" }}>
            Website <span style={{ color: "var(--teal)" }}>Catalog</span>
          </h1>
          <p style={{ color: "var(--text3)", fontSize: "var(--fs-body)", maxWidth: "520px", margin: "0 auto" }}>
            Browse sample websites we can build for your business. Every design is fully customised to your brand and Guyanese audience.
          </p>
        </div>
      </section>

      {/* Catalog Cards */}
      <section className="section" style={{ background: "var(--cream)", paddingTop: "clamp(24px, 4vw, 40px)" }}>
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)" }}>

          {catalog.map((item, i) => (
            <div
              key={item.id}
              onClick={() => setSelected(item)}
              role="button"
              tabIndex={0}
              style={{
                background: "var(--card)",
                borderRadius: "var(--r-lg)",
                border: "1px solid var(--divider)",
                overflow: "hidden",
                cursor: "pointer",
                transition: "var(--transition)",
                marginBottom: "28px",
              }}
            >
              {/* Image — always full width on top */}
              <div style={{ position: "relative", overflow: "hidden" }}>
                <Image
                  src={item.image}
                  alt={item.title}
                  width={1200}
                  height={600}
                  style={{
                    width: "100%",
                    height: "auto",
                    maxHeight: "420px",
                    objectFit: "cover",
                    objectPosition: "top left",
                    display: "block",
                  }}
                  priority={i < 2}
                />
                <span style={{
                  position: "absolute", top: "16px", left: "16px",
                  padding: "7px 16px", borderRadius: "100px", fontSize: "0.78rem", fontWeight: 700,
                  background: "rgba(255,255,255,0.95)", color: item.color,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                }}>
                  {item.sector}
                </span>
              </div>

              {/* Content */}
              <div style={{ padding: "clamp(20px, 4vw, 32px)" }}>
                <h3 style={{ fontSize: "var(--fs-h3)", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>
                  {item.title}
                </h3>
                <p style={{ color: "var(--text3)", fontSize: "var(--fs-body)", lineHeight: 1.7, marginBottom: "16px", maxWidth: "640px" }}>
                  {item.desc}
                </p>

                {/* Features */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
                  {item.features.map((f) => (
                    <span key={f} style={{
                      padding: "6px 14px", borderRadius: "100px",
                      background: `${item.color}0C`, color: item.color,
                      fontSize: "0.8rem", fontWeight: 600,
                    }}>
                      ✓ {f}
                    </span>
                  ))}
                </div>

                {/* Price + CTA */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                  <div>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Starting from</span>
                    <span style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "1.5rem", fontWeight: 800, color: item.color }}>
                      {item.startingPrice}
                    </span>
                  </div>
                  <span className="btn" style={{
                    background: item.color, color: "#fff", borderColor: item.color,
                    padding: "12px 28px", fontSize: "0.9rem",
                    boxShadow: `0 4px 16px ${item.color}30`,
                  }}>
                    View Details →
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Note */}
          <div style={{
            marginTop: "12px", padding: "20px 24px", borderRadius: "var(--r-sm)",
            background: "rgba(42, 157, 143, 0.04)", border: "1px solid rgba(42, 157, 143, 0.1)", textAlign: "center",
          }}>
            <p style={{ color: "var(--text2)", fontSize: "0.92rem", fontWeight: 600, marginBottom: "4px" }}>
              💡 Every website is fully customised to your brand, content, and business needs.
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
              Prices shown are starting estimates. Final pricing depends on features, pages, and complexity.
            </p>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(44, 24, 16, 0.85)", backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "880px", width: "100%", background: "var(--card)",
              borderRadius: "var(--r-lg)", overflow: "hidden",
              maxHeight: "92vh", overflowY: "auto",
            }}
          >
            {/* Image */}
            <div style={{ position: "relative" }}>
              <Image
                src={selected.image}
                alt={selected.title}
                width={880}
                height={500}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
              <button
                onClick={() => setSelected(null)}
                style={{
                  position: "absolute", top: "14px", right: "14px",
                  width: "40px", height: "40px", borderRadius: "50%", border: "none",
                  background: "rgba(0,0,0,0.55)", color: "#fff", cursor: "pointer",
                  fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center",
                  backdropFilter: "blur(8px)",
                }}
              >
                ✕
              </button>
            </div>

            {/* Details */}
            <div style={{ padding: "clamp(20px, 4vw, 36px)" }}>
              <span style={{
                display: "inline-block", padding: "5px 14px", borderRadius: "100px",
                fontSize: "0.78rem", fontWeight: 700,
                background: `${selected.color}10`, color: selected.color, marginBottom: "12px",
              }}>
                {selected.sector}
              </span>

              <h3 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "10px", fontFamily: "'Bricolage Grotesque', serif" }}>
                {selected.title}
              </h3>

              <p style={{ color: "var(--text3)", fontSize: "var(--fs-body)", lineHeight: 1.7, marginBottom: "20px" }}>
                {selected.desc}
              </p>

              <h4 style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: "10px", color: "var(--text2)" }}>
                Included Features:
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "28px" }}>
                {selected.features.map((f) => (
                  <span key={f} style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "7px 16px", borderRadius: "var(--r-sm)",
                    background: "var(--soft-bg)", border: "1px solid var(--divider)",
                    fontSize: "0.88rem", color: "var(--text2)",
                  }}>
                    <span style={{ color: selected.color, fontWeight: 700 }}>✓</span> {f}
                  </span>
                ))}
              </div>

              {/* Price + Actions */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "20px 0", borderTop: "1px solid var(--divider)", flexWrap: "wrap", gap: "16px",
              }}>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block" }}>Starting from</span>
                  <span style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "1.8rem", fontWeight: 800, color: selected.color }}>
                    {selected.startingPrice}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Link
                    href="/micro-strategy/consultation"
                    className="btn btn-primary"
                    style={{ background: selected.color, borderColor: selected.color, padding: "12px 28px", fontSize: "0.92rem" }}
                  >
                    Get This Built →
                  </Link>
                  <button onClick={() => setSelected(null)} className="btn btn-outline" style={{ padding: "12px 28px", fontSize: "0.92rem" }}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <section style={{ background: "linear-gradient(135deg, var(--cream), #F3F0FF)", padding: "clamp(40px, 6vw, 64px) 0", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "540px", margin: "0 auto", padding: "0 var(--gutter)" }}>
          <h2 style={{ fontSize: "var(--fs-h2)", fontWeight: 800, marginBottom: "12px" }}>
            Don&apos;t see your industry?
          </h2>
          <p style={{ color: "var(--text3)", fontSize: "var(--fs-body)", marginBottom: "24px" }}>
            We build custom websites for every business type. Tell us what you need and we&apos;ll design something perfect.
          </p>
          <Link href="/micro-strategy/consultation" className="btn btn-primary" style={{ background: "var(--teal)", borderColor: "var(--teal)", boxShadow: "0 4px 20px rgba(42, 157, 143, 0.3)" }}>
            Book Free Consultation
          </Link>
        </div>
      </section>
    </div>
  );
}
