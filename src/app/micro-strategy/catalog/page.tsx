"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const catalog = [
  {
    id: 1,
    title: "Restaurant & Dining Website",
    sector: "Food & Hospitality",
    desc: "A dark, elegant restaurant website with online menu, table reservations, and GYD pricing. Features signature dish showcase, customer reviews, and WhatsApp ordering integration. Perfect for restaurants, bars, and catering services across Guyana.",
    image: "/catalog/restaurant-website.png",
    features: ["Online menu with GYD pricing", "Table reservation system", "WhatsApp order integration", "Photo gallery", "Google Maps & reviews"],
    startingPrice: "GYD 250,000",
    color: "#D4654A",
  },
  {
    id: 2,
    title: "Real Estate & Property Platform",
    sector: "Real Estate",
    desc: "A clean, modern property listing platform with advanced search, map integration, and property detail pages. Supports buy, rent, and commercial categories with GYD pricing. Ideal for real estate agencies, developers, and property managers in Guyana.",
    image: "/catalog/realestate-website.png",
    features: ["Property search & filters", "Map integration", "Listing management dashboard", "Enquiry forms per property", "Agent profiles"],
    startingPrice: "GYD 500,000",
    color: "#2A9D8F",
  },
  {
    id: 3,
    title: "Fitness & Gym Website",
    sector: "Health & Fitness",
    desc: "A bold, high-energy gym website with membership plans in GYD, class schedules, trainer profiles, and online sign-up. Designed to convert visitors into members with compelling CTAs and social proof.",
    image: "/catalog/gym-website.png",
    features: ["Membership plans & pricing", "Class schedule & booking", "Trainer profiles", "Free trial sign-up", "Progress tracking portal"],
    startingPrice: "GYD 200,000",
    color: "#FF6B35",
  },
  {
    id: 4,
    title: "Professional Services Website",
    sector: "Legal / Consulting",
    desc: "A sophisticated, trust-building website for law firms, accounting practices, and consulting firms. Elegant typography, practice area pages, team profiles, and consultation booking. Communicates credibility and expertise.",
    image: "/catalog/lawfirm-website.png",
    features: ["Practice area pages", "Attorney/team profiles", "Consultation booking", "Client testimonials", "Resource library / blog"],
    startingPrice: "GYD 300,000",
    color: "#8B6F4E",
  },
  {
    id: 5,
    title: "Billing & Invoice Dashboard",
    sector: "Business Automation",
    desc: "A complete invoicing and billing management system with client management, payment tracking, revenue analytics, and exportable reports. All in GYD with Guyanese business names. Saves hours of manual work every week.",
    image: "/catalog/billing-dashboard.png",
    features: ["Invoice creation & sending", "Payment tracking (paid/pending/overdue)", "Client management", "Revenue dashboard & analytics", "PDF export & email delivery"],
    startingPrice: "GYD 400,000",
    color: "#2A9D8F",
  },
];

export default function CatalogPage() {
  const [selected, setSelected] = useState<typeof catalog[0] | null>(null);

  return (
    <div style={{ paddingTop: "var(--nav-height)" }}>
      {/* Header */}
      <section style={{ background: "linear-gradient(135deg, #FDF8F3 0%, #F3F0FF 50%, #FDF8F3 100%)", padding: "clamp(48px, 8vw, 80px) 0 48px" }}>
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)", textAlign: "center" }}>
          <span className="section-label" style={{ color: "var(--teal)", background: "rgba(42, 157, 143, 0.1)", padding: "6px 16px", borderRadius: "100px", display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            💡 Micro Strategy
          </span>
          <h1 style={{ fontSize: "var(--fs-display)", fontWeight: 800, color: "var(--text)", marginBottom: "12px" }}>
            Website <span style={{ color: "var(--teal)" }}>Catalog</span>
          </h1>
          <p style={{ color: "var(--text3)", fontSize: "1.05rem", maxWidth: "580px", margin: "0 auto 8px" }}>
            Browse sample websites we can build for your business. Every design is fully customised to your brand, content, and Guyanese audience.
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
            Click any design to see details and pricing.
          </p>
        </div>
      </section>

      {/* Catalog Grid */}
      <section className="section" style={{ background: "var(--cream)", paddingTop: "32px" }}>
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {catalog.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                style={{
                  textAlign: "left",
                  background: "var(--card)",
                  borderRadius: "var(--r-lg)",
                  border: "1px solid var(--divider)",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "var(--transition)",
                }}
                className="catalog-card"
              >
                {/* Image */}
                <div className="catalog-card-img-border" style={{ position: "relative", overflow: "hidden" }}>
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={700}
                    height={480}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top left" }}
                  />
                  <span style={{
                    position: "absolute", top: "16px", left: "16px",
                    padding: "6px 14px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700,
                    background: "rgba(255,255,255,0.95)", color: item.color,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  }}>
                    {item.sector}
                  </span>
                </div>

                {/* Info */}
                <div style={{ padding: "32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <h3 style={{ fontSize: "var(--fs-h3)", fontWeight: 700, marginBottom: "10px", color: "var(--text)" }}>{item.title}</h3>
                  <p style={{ color: "var(--text3)", fontSize: "0.92rem", lineHeight: 1.7, marginBottom: "20px" }}>{item.desc}</p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
                    {item.features.map((f) => (
                      <span key={f} style={{ padding: "4px 12px", borderRadius: "100px", background: `${item.color}10`, color: item.color, fontSize: "0.78rem", fontWeight: 600 }}>
                        {f}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Starting from</span>
                      <div style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "1.4rem", fontWeight: 800, color: item.color }}>{item.startingPrice}</div>
                    </div>
                    <span style={{ padding: "10px 24px", borderRadius: "var(--r-sm)", background: item.color, color: "#fff", fontSize: "0.85rem", fontWeight: 600 }}>
                      View Details →
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Note */}
          <div style={{ marginTop: "40px", padding: "24px", borderRadius: "var(--r-sm)", background: "rgba(42, 157, 143, 0.05)", border: "1px solid rgba(42, 157, 143, 0.1)", textAlign: "center" }}>
            <p style={{ color: "var(--text2)", fontSize: "0.92rem", fontWeight: 500, marginBottom: "4px" }}>
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
        <div onClick={() => setSelected(null)} style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(44, 24, 16, 0.85)", backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
          overflowY: "auto",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            maxWidth: "900px", width: "100%", background: "var(--card)", borderRadius: "var(--r-lg)",
            overflow: "hidden", maxHeight: "90vh", overflowY: "auto",
          }}>
            <div style={{ position: "relative" }}>
              <Image
                src={selected.image}
                alt={selected.title}
                width={900}
                height={600}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
              <button onClick={() => setSelected(null)} style={{
                position: "absolute", top: "16px", right: "16px",
                width: "36px", height: "36px", borderRadius: "50%", border: "none",
                background: "rgba(0,0,0,0.6)", color: "#fff", cursor: "pointer",
                fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
            </div>
            <div style={{ padding: "32px" }}>
              <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700, background: `${selected.color}12`, color: selected.color, marginBottom: "12px" }}>
                {selected.sector}
              </span>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "10px" }}>{selected.title}</h3>
              <p style={{ color: "var(--text3)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "20px" }}>{selected.desc}</p>

              <h4 style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: "10px", color: "var(--text2)" }}>Included Features:</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
                {selected.features.map((f) => (
                  <span key={f} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "var(--r-sm)", background: "var(--soft-bg)", border: "1px solid var(--divider)", fontSize: "0.85rem", color: "var(--text2)" }}>
                    <span style={{ color: selected.color }}>✓</span> {f}
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", borderTop: "1px solid var(--divider)" }}>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Starting from</span>
                  <div style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "1.8rem", fontWeight: 800, color: selected.color }}>{selected.startingPrice}</div>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <Link href="/micro-strategy/consultation" className="btn btn-primary" style={{ background: selected.color, borderColor: selected.color, fontSize: "0.88rem", padding: "10px 24px" }}>
                    Get This Built →
                  </Link>
                  <button onClick={() => setSelected(null)} className="btn btn-outline" style={{ fontSize: "0.88rem", padding: "10px 24px" }}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <section style={{ background: "linear-gradient(135deg, var(--cream), #F3F0FF)", padding: "64px 0", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "580px", margin: "0 auto", padding: "0 var(--gutter)" }}>
          <h2 style={{ fontSize: "var(--fs-h2)", fontWeight: 800, marginBottom: "12px" }}>
            Don&apos;t see your industry?
          </h2>
          <p style={{ color: "var(--text3)", marginBottom: "24px" }}>
            We build custom websites for every business type. Tell us what you need and we&apos;ll design something perfect for you.
          </p>
          <Link href="/micro-strategy/consultation" className="btn btn-primary" style={{ background: "var(--teal)", borderColor: "var(--teal)", boxShadow: "0 4px 20px rgba(42, 157, 143, 0.3)" }}>
            Book Free Consultation
          </Link>
        </div>
      </section>
    </div>
  );
}
