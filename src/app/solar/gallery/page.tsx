"use client";

import { useState } from "react";
import Link from "next/link";

const galleryItems = [
  { id: 1, title: "Residential — Bel Air, Georgetown", category: "residential", desc: "5kW rooftop system with battery backup for a family home in Bel Air.", color: "#E9B44C" },
  { id: 2, title: "Commercial — Regent Street", category: "commercial", desc: "25kW rooftop installation for a retail business on Regent Street.", color: "#2A9D8F" },
  { id: 3, title: "Off-Grid — Region 9, Rupununi", category: "off-grid", desc: "10kW off-grid system with full battery storage for a community centre.", color: "#D4654A" },
  { id: 4, title: "Residential — East Bank Demerara", category: "residential", desc: "3kW system with net metering, reducing GPL bill by 85%.", color: "#E9B44C" },
  { id: 5, title: "Hotel — Essequibo Coast", category: "commercial", desc: "50kW ground-mount system powering a beachfront resort.", color: "#2A9D8F" },
  { id: 6, title: "Mining Camp — Region 7", category: "off-grid", desc: "20kW hybrid solar + generator system for a gold mining operation.", color: "#D4654A" },
  { id: 7, title: "School — Linden", category: "commercial", desc: "15kW system for a secondary school, powering classrooms and labs.", color: "#2A9D8F" },
  { id: 8, title: "Residential — Kitty, Georgetown", category: "residential", desc: "8kW premium system with battery backup.", color: "#E9B44C" },
  { id: 9, title: "Farm — Berbice", category: "commercial", desc: "30kW system powering irrigation pumps and cold storage for a rice farm.", color: "#2A9D8F" },
];

const categories = [
  { id: "all", label: "All Projects" },
  { id: "residential", label: "Residential" },
  { id: "commercial", label: "Commercial" },
  { id: "off-grid", label: "Off-Grid" },
];

export default function GalleryPage() {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<typeof galleryItems[0] | null>(null);

  const filtered = filter === "all" ? galleryItems : galleryItems.filter((i) => i.category === filter);

  return (
    <div style={{ paddingTop: "var(--nav-height)" }}>
      {/* Header */}
      <section style={{ background: "linear-gradient(135deg, #FDF8F3 0%, #FFFBF0 100%)", padding: "clamp(48px, 8vw, 80px) 0 48px" }}>
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)", textAlign: "center" }}>
          <span className="section-label" style={{ color: "var(--gold)", background: "rgba(233, 180, 76, 0.12)", padding: "6px 16px", borderRadius: "100px", display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            ☀️ Evolve Solar Solutions
          </span>
          <h1 style={{ fontSize: "var(--fs-display)", fontWeight: 800, color: "var(--text)", marginBottom: "12px" }}>
            Project <span style={{ color: "var(--gold)" }}>Gallery</span>
          </h1>
          <p style={{ color: "var(--text3)", fontSize: "1.05rem", maxWidth: "560px", margin: "0 auto" }}>
            Browse our completed solar installations across Guyana — from Georgetown homes to hinterland communities.
          </p>
        </div>
      </section>

      {/* Filter + Grid */}
      <section className="section" style={{ background: "var(--cream)", paddingTop: "32px" }}>
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)" }}>
          {/* Filters */}
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "40px", flexWrap: "wrap" }}>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                className="btn"
                style={{
                  background: filter === c.id ? "var(--gold)" : "var(--card)",
                  color: filter === c.id ? "#fff" : "var(--text2)",
                  borderColor: filter === c.id ? "var(--gold)" : "var(--divider)",
                  padding: "8px 20px",
                  fontSize: "0.85rem",
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {filtered.map((item) => (
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
              >
                {/* Placeholder for photo */}
                <div style={{
                  aspectRatio: "4/3",
                  background: `linear-gradient(135deg, ${item.color}20 0%, ${item.color}08 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}>
                  <span style={{ fontSize: "3rem", opacity: 0.2 }}>☀️</span>
                  <span style={{
                    position: "absolute",
                    bottom: "12px",
                    left: "12px",
                    padding: "4px 12px",
                    borderRadius: "100px",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    background: `${item.color}18`,
                    color: item.color,
                    textTransform: "capitalize",
                  }}>
                    {item.category}
                  </span>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>{item.title}</h3>
                  <p style={{ color: "var(--text3)", fontSize: "0.88rem", lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Photo note */}
          <div style={{ marginTop: "40px", padding: "20px", borderRadius: "var(--r-sm)", border: "1px dashed var(--divider)", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
              📸 Photographs will be added as projects are completed. Contact us to see more examples of our work.
            </p>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(44, 24, 16, 0.7)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            maxWidth: "560px", width: "100%", background: "var(--card)", borderRadius: "var(--r-lg)", overflow: "hidden",
          }}>
            <div style={{ aspectRatio: "16/9", background: `linear-gradient(135deg, ${selected.color}20, ${selected.color}08)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "4rem", opacity: 0.15 }}>☀️</span>
            </div>
            <div style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>{selected.title}</h3>
              <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 600, background: `${selected.color}15`, color: selected.color, textTransform: "capitalize", marginBottom: "12px" }}>
                {selected.category}
              </span>
              <p style={{ color: "var(--text3)", fontSize: "0.95rem", lineHeight: 1.7 }}>{selected.desc}</p>
              <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                <Link href="/solar/quote" className="btn btn-primary" style={{ background: "var(--gold)", borderColor: "var(--gold)", fontSize: "0.85rem", padding: "8px 20px" }}>
                  Get a Similar System
                </Link>
                <button onClick={() => setSelected(null)} className="btn btn-outline" style={{ fontSize: "0.85rem", padding: "8px 20px" }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <section style={{ background: "linear-gradient(135deg, var(--cream), #FEF5EC)", padding: "64px 0", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "560px", margin: "0 auto", padding: "0 var(--gutter)" }}>
          <h2 style={{ fontSize: "var(--fs-h2)", fontWeight: 800, marginBottom: "12px" }}>Want results like these?</h2>
          <p style={{ color: "var(--text3)", marginBottom: "24px" }}>Every installation starts with a free consultation. Let us design the perfect solar system for your property.</p>
          <Link href="/solar/quote" className="btn btn-primary" style={{ background: "var(--gold)", borderColor: "var(--gold)", boxShadow: "0 4px 20px rgba(233, 180, 76, 0.3)" }}>
            Request Your Free Quote
          </Link>
        </div>
      </section>
    </div>
  );
}
