"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const projects = [
  { id: 1, title: "E-commerce Platform — Georgetown Retailer", category: "web", desc: "Full online store with MMG mobile payment integration, inventory management, and delivery tracking.", result: "3x increase in online orders", color: "#2A9D8F", image: "/catalog/restaurant-website.png" },
  { id: 2, title: "AI Customer Service Bot — Real Estate Agency", category: "ai", desc: "WhatsApp-integrated AI chatbot handling property enquiries, scheduling viewings, and qualifying leads 24/7.", result: "60% fewer phone calls, 24/7 coverage", color: "#D4654A", image: "/catalog/realestate-website.png" },
  { id: 3, title: "Invoice Automation — Construction Co.", category: "automation", desc: "Automated invoice generation, payment tracking, and overdue reminders integrated with their accounting system.", result: "12 hours saved per week", color: "#E9B44C", image: "/catalog/billing-dashboard.png" },
  { id: 4, title: "Hotel Booking System — Berbice Coast", category: "web", desc: "Online booking platform with room availability, mobile payments, guest management, and email confirmations.", result: "200% increase in direct bookings", color: "#2A9D8F", image: "/catalog/realestate-website.png" },
  { id: 5, title: "Document Processing — Legal Firm", category: "ai", desc: "AI-powered system to extract key data from contracts, deeds, and legal documents — reducing manual review time.", result: "80% faster document processing", color: "#D4654A", image: "/catalog/lawfirm-website.png" },
  { id: 6, title: "Lead Management — Auto Dealership", category: "automation", desc: "CRM system with automated lead capture from website and social media, follow-up sequences, and sales reporting.", result: "45% improvement in lead conversion", color: "#E9B44C", image: "/catalog/billing-dashboard.png" },
  { id: 7, title: "Restaurant Ordering System", category: "web", desc: "Online menu and ordering with WhatsApp order notifications, kitchen display, and delivery zone management.", result: "Launched in 3 weeks", color: "#2A9D8F", image: "/catalog/restaurant-website.png" },
  { id: 8, title: "Inventory Dashboard — Wholesale Business", category: "automation", desc: "Real-time inventory tracking across multiple warehouses with low-stock alerts and automated reorder suggestions.", result: "Zero stockouts in 6 months", color: "#E9B44C", image: "/catalog/billing-dashboard.png" },
  { id: 9, title: "Predictive Analytics — Agriculture", category: "ai", desc: "Weather and market data analysis helping farmers optimise planting schedules and pricing strategies.", result: "15% yield improvement", color: "#D4654A", image: "/catalog/gym-website.png" },
];

const categories = [
  { id: "all", label: "All Projects" },
  { id: "web", label: "Web Development" },
  { id: "ai", label: "AI Solutions" },
  { id: "automation", label: "Automation" },
];

const categoryLabel = (c: string) => c === "web" ? "Web Development" : c === "ai" ? "AI Solutions" : "Automation";

export default function PortfolioPage() {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<typeof projects[0] | null>(null);

  const filtered = filter === "all" ? projects : projects.filter((p) => p.category === filter);

  return (
    <div style={{ paddingTop: "var(--nav-height)" }}>
      {/* Header */}
      <section style={{ background: "linear-gradient(135deg, #FDF8F3 0%, #F3F0FF 50%, #FDF8F3 100%)", padding: "clamp(48px, 8vw, 80px) 0 48px" }}>
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)", textAlign: "center" }}>
          <span className="section-label" style={{ color: "var(--teal)", background: "rgba(42, 157, 143, 0.1)", padding: "6px 16px", borderRadius: "100px", display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            💡 Micro Strategy
          </span>
          <h1 style={{ fontSize: "var(--fs-display)", fontWeight: 800, color: "var(--text)", marginBottom: "12px" }}>
            Our <span style={{ color: "var(--teal)" }}>Portfolio</span>
          </h1>
          <p style={{ color: "var(--text3)", fontSize: "1.05rem", maxWidth: "560px", margin: "0 auto" }}>
            Real projects, real results. See how we&apos;ve helped Guyanese businesses grow with technology.
          </p>
        </div>
      </section>

      {/* Filter + Grid */}
      <section className="section" style={{ background: "var(--cream)", paddingTop: "32px" }}>
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "40px", flexWrap: "wrap" }}>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                className="btn"
                style={{
                  background: filter === c.id ? "var(--teal)" : "var(--card)",
                  color: filter === c.id ? "#fff" : "var(--text2)",
                  borderColor: filter === c.id ? "var(--teal)" : "var(--divider)",
                  padding: "8px 20px",
                  fontSize: "0.85rem",
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" }}>
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                style={{ textAlign: "left", background: "var(--card)", borderRadius: "var(--r-lg)", border: "1px solid var(--divider)", overflow: "hidden", cursor: "pointer", transition: "var(--transition)" }}
              >
                <div style={{ position: "relative", overflow: "hidden", height: "220px" }}>
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={600}
                    height={400}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top left" }}
                  />
                  <span style={{
                    position: "absolute", top: "12px", left: "12px",
                    padding: "4px 12px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 700,
                    background: "rgba(255,255,255,0.92)", color: item.color,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}>
                    {categoryLabel(item.category)}
                  </span>
                </div>
                <div style={{ padding: "20px" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>{item.title}</h3>
                  <p style={{ color: "var(--text3)", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: "12px" }}>{item.desc}</p>
                  <p style={{ color: item.color, fontSize: "0.9rem", fontWeight: 700, fontFamily: "'Bricolage Grotesque', serif" }}>📈 {item.result}</p>
                </div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: "40px", padding: "20px", borderRadius: "var(--r-sm)", border: "1px dashed var(--divider)", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
              🔒 Some projects are under NDA. Contact us for more examples relevant to your industry.
            </p>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(44, 24, 16, 0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px", width: "100%", background: "var(--card)", borderRadius: "var(--r-lg)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ position: "relative" }}>
              <Image
                src={selected.image}
                alt={selected.title}
                width={700}
                height={460}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
              <button onClick={() => setSelected(null)} style={{
                position: "absolute", top: "12px", right: "12px",
                width: "32px", height: "32px", borderRadius: "50%", border: "none",
                background: "rgba(0,0,0,0.5)", color: "#fff", cursor: "pointer",
                fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
            </div>
            <div style={{ padding: "28px" }}>
              <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 700, background: `${selected.color}12`, color: selected.color, marginBottom: "10px" }}>
                {categoryLabel(selected.category)}
              </span>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "8px" }}>{selected.title}</h3>
              <p style={{ color: "var(--text3)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "16px" }}>{selected.desc}</p>
              <p style={{ color: selected.color, fontSize: "1.1rem", fontWeight: 700, fontFamily: "'Bricolage Grotesque', serif", marginBottom: "24px" }}>📈 {selected.result}</p>
              <div style={{ display: "flex", gap: "12px" }}>
                <Link href="/micro-strategy/consultation" className="btn btn-primary" style={{ background: selected.color, borderColor: selected.color, fontSize: "0.85rem", padding: "10px 24px" }}>
                  Get Something Similar →
                </Link>
                <button onClick={() => setSelected(null)} className="btn btn-outline" style={{ fontSize: "0.85rem", padding: "10px 24px" }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <section style={{ background: "linear-gradient(135deg, var(--cream), #F3F0FF)", padding: "64px 0", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "560px", margin: "0 auto", padding: "0 var(--gutter)" }}>
          <h2 style={{ fontSize: "var(--fs-h2)", fontWeight: 800, marginBottom: "12px" }}>Want results like these?</h2>
          <p style={{ color: "var(--text3)", marginBottom: "24px" }}>Every project starts with a free consultation. Let&apos;s talk about what technology can do for your business.</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/micro-strategy/consultation" className="btn btn-primary" style={{ background: "var(--teal)", borderColor: "var(--teal)", boxShadow: "0 4px 20px rgba(42, 157, 143, 0.3)" }}>
              Book Free Consultation
            </Link>
            <Link href="/micro-strategy/catalog" className="btn btn-outline">
              Browse Website Catalog
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
