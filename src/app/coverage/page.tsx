"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFAB from "@/components/WhatsAppFAB";

const SERVICE_AREAS = [
  {
    region: "East Coast Demerara",
    status: "live",
    color: "#D4654A",
    towers: ["Success", "Better Hope", "Cummings Lodge", "Good Hope", "Non Pareil", "Mahaica", "Cane Grove"],
    villages: [
      "Plaisance", "Sparendaam", "Better Hope", "Mon Repos", "Success", "LBI", "Ogle",
      "Cummings Lodge", "Strathspey", "Good Hope", "Non Pareil", "Enmore", "Hope",
      "Lusignan", "Annandale", "Mahaica", "Cane Grove", "Helena",
    ],
    planStart: "GYD 5,000/mo",
  },
  {
    region: "New Amsterdam, Berbice",
    status: "live",
    color: "#2A9D8F",
    towers: ["New Amsterdam"],
    villages: ["New Amsterdam", "Stanleytown", "Garrison Road", "Coburg", "Angoy's Avenue"],
    planStart: "GYD 5,000/mo",
  },
  {
    region: "Charity, Essequibo",
    status: "live",
    color: "#8B6F4E",
    towers: ["Charity"],
    villages: ["Charity", "Anna Regina", "Lima", "Queenstown", "Suddie"],
    planStart: "GYD 8,000/mo",
  },
  {
    region: "Region 1 — Mabaruma & Surrounds",
    status: "live",
    color: "#E9B44C",
    towers: ["Mabaruma", "Hosororo", "Whitewater"],
    villages: ["Mabaruma", "Hosororo", "Whitewater", "Kamwatta Hill", "Kumaka"],
    planStart: "GYD 10,000/mo",
  },
  {
    region: "Region 1 — Port Kaituma & Interior",
    status: "live",
    color: "#E9B44C",
    towers: ["Port Kaituma", "Matthews Ridge", "Baramita"],
    villages: ["Port Kaituma", "Matthews Ridge", "Baramita", "Arakaka"],
    planStart: "GYD 10,000/mo",
  },
];

export default function CoveragePage() {
  const [search, setSearch] = useState("");
  const [matchedArea, setMatchedArea] = useState<typeof SERVICE_AREAS[0] | null>(null);
  const [noMatch, setNoMatch] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;

    const q = search.toLowerCase().trim();
    setNoMatch(false);
    setMatchedArea(null);

    // Search across all villages and tower names
    for (const area of SERVICE_AREAS) {
      const allNames = [...area.villages, ...area.towers, area.region].map(n => n.toLowerCase());
      if (allNames.some(name => name.includes(q) || q.includes(name))) {
        setMatchedArea(area);
        return;
      }
    }

    // Fuzzy: check if any word in the query matches
    const words = q.split(/[\s,]+/).filter(w => w.length > 2);
    for (const area of SERVICE_AREAS) {
      const allNames = [...area.villages, ...area.towers].map(n => n.toLowerCase());
      for (const word of words) {
        if (allNames.some(name => name.includes(word) || word.includes(name))) {
          setMatchedArea(area);
          return;
        }
      }
    }

    setNoMatch(true);
  }

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 76 }}>
        {/* Hero */}
        <section className="section text-center" style={{ background: "var(--soft-bg)", paddingBottom: "clamp(24px, 4vw, 40px)" }}>
          <div className="container" style={{ maxWidth: 700, margin: "0 auto", padding: "0 var(--gutter)" }}>
            <div className="section-label" style={{ display: "inline-flex" }}>Coverage</div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>
              Check If We&apos;re in <span style={{ color: "var(--terracotta)" }}>Your Area</span>
            </h1>
            <p className="text-base mb-8" style={{ color: "var(--text3)", maxWidth: 500, margin: "0 auto" }}>
              Search your village or area name, or use the interactive map to check coverage at your exact location.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-3 max-w-lg mx-auto flex-wrap justify-center">
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setMatchedArea(null); setNoMatch(false); }}
                placeholder="e.g. Success, Mahaica, Port Kaituma..."
                className="flex-1 min-w-[250px] px-5 py-3.5 rounded-full text-sm outline-none"
                style={{ background: "white", border: "2px solid rgba(44,24,16,0.1)", fontSize: "0.95rem" }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: "14px 28px" }}>
                Check Coverage
              </button>
            </form>

            {/* Map link */}
            <div className="mt-4">
              <Link href="/coverage/map" className="font-semibold" style={{ color: "var(--teal)", fontSize: "0.92rem" }}>
                🗺️ Use Interactive Map to pin your exact location →
              </Link>
            </div>

            {/* Result — Covered */}
            {matchedArea && (
              <div className="mt-6 p-6 rounded-2xl text-left max-w-lg mx-auto" style={{
                background: "rgba(76,175,80,0.06)", border: "1px solid rgba(76,175,80,0.2)",
              }}>
                <div className="text-lg font-bold mb-2" style={{ color: "#4CAF50", fontFamily: "'Bricolage Grotesque', serif" }}>
                  ✅ Yes! We cover {matchedArea.region}
                </div>
                <p className="text-sm mb-2" style={{ color: "var(--text2)" }}>
                  We have <strong>{matchedArea.towers.length} tower{matchedArea.towers.length > 1 ? "s" : ""}</strong> serving this area: {matchedArea.towers.join(", ")}
                </p>
                <p className="text-sm mb-4" style={{ color: "var(--text3)" }}>
                  Plans start from <strong style={{ color: "var(--terracotta)" }}>{matchedArea.planStart}</strong>. Installation typically within 2-5 days.
                </p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Link href="/plans" className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "0.9rem" }}>
                    View Plans & Sign Up →
                  </Link>
                  <Link href="/coverage/map" className="btn btn-outline" style={{ padding: "12px 24px", fontSize: "0.9rem" }}>
                    🗺️ View on Map
                  </Link>
                </div>
              </div>
            )}

            {/* Result — Not Found */}
            {noMatch && (
              <div className="mt-6 p-6 rounded-2xl text-left max-w-lg mx-auto" style={{
                background: "rgba(212,101,74,0.06)", border: "1px solid rgba(212,101,74,0.2)",
              }}>
                <div className="text-lg font-bold mb-2" style={{ color: "var(--terracotta)", fontFamily: "'Bricolage Grotesque', serif" }}>
                  📍 We didn&apos;t find &ldquo;{search}&rdquo; in our service areas
                </div>
                <p className="text-sm mb-4" style={{ color: "var(--text2)" }}>
                  Try searching a nearby village name, or use the interactive map to pin your exact location — it&apos;s the most accurate way to check.
                </p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Link href="/coverage/map" className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "0.9rem" }}>
                    🗺️ Use Interactive Map
                  </Link>
                  <a href="https://wa.me/5926092487?text=Hi!%20I%20want%20to%20check%20if%20you%20cover%20my%20area.%20I%27m%20located%20at%20" target="_blank" rel="noopener" className="btn btn-outline" style={{ padding: "12px 24px", fontSize: "0.9rem" }}>
                    💬 Ask on WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Service Areas Grid */}
        <section className="section" style={{ background: "var(--cream)" }}>
          <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)" }}>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>
              Our <span style={{ color: "var(--terracotta)" }}>Service Areas</span>
            </h2>
            <p style={{ color: "var(--text3)", fontSize: "var(--fs-body)", marginBottom: "32px" }}>
              15 tower sites across 5 regions — and growing.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: "20px", marginBottom: "32px" }}>
              {SERVICE_AREAS.map((area) => (
                <div key={area.region} className="card" style={{ padding: "clamp(20px, 3vw, 28px)", borderLeft: `4px solid ${area.color}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#4CAF50", boxShadow: "0 0 6px rgba(76,175,80,0.4)" }} />
                    <h3 style={{ fontFamily: "'Bricolage Grotesque', serif", fontWeight: 700, fontSize: "1.05rem" }}>{area.region}</h3>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--text3)" }}>📡 {area.towers.length} tower{area.towers.length > 1 ? "s" : ""}:</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text2)" }}>{area.towers.join(", ")}</span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
                    {area.villages.map((v) => (
                      <span key={v} style={{ padding: "4px 12px", borderRadius: "100px", background: "var(--warm-bg)", fontSize: "0.78rem", color: "var(--text2)" }}>
                        {v}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: area.color }}>
                      From {area.planStart}
                    </span>
                    <Link href="/plans" style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--teal)" }}>
                      View Plans →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Map CTA */}
            <div style={{
              padding: "28px", borderRadius: "var(--r-lg)", textAlign: "center",
              background: "linear-gradient(135deg, rgba(42,157,143,0.06), rgba(212,101,74,0.04))",
              border: "1px solid rgba(42,157,143,0.12)",
            }}>
              <h3 style={{ fontFamily: "'Bricolage Grotesque', serif", fontWeight: 700, fontSize: "1.15rem", marginBottom: "8px" }}>
                🗺️ Not sure? Use the Interactive Map
              </h3>
              <p style={{ color: "var(--text3)", fontSize: "0.92rem", marginBottom: "16px" }}>
                Drop a pin on your exact location and instantly see if you&apos;re within range of our towers.
              </p>
              <Link href="/coverage/map" className="btn btn-primary" style={{ background: "var(--teal)", borderColor: "var(--teal)", boxShadow: "0 4px 20px rgba(42,157,143,0.3)" }}>
                Open Coverage Map →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFAB />
    </>
  );
}
