"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFAB from "@/components/WhatsAppFAB";
import { createClient } from "@/lib/supabase-browser";
import type { CoverageZone } from "@/lib/types";

export default function CoveragePage() {
  const [zones, setZones] = useState<CoverageZone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("coverage_zones")
          .select("*")
          .eq("is_active", true)
          .order("region_number", { ascending: true });
        if (data) setZones(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statusColor = (s: string) => {
    if (s === "active") return { bg: "rgba(0,230,118,0.1)", border: "rgba(0,230,118,0.3)", text: "#00E676", label: "Active" };
    if (s === "planned") return { bg: "rgba(0,87,255,0.1)", border: "rgba(0,87,255,0.3)", text: "#0057FF", label: "Coming Soon" };
    return { bg: "rgba(255,171,0,0.1)", border: "rgba(255,171,0,0.3)", text: "#FFAB00", label: "Limited" };
  };

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 72 }}>
        <section className="section" style={{ background: "var(--navy)" }}>
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="section-label justify-center">Where We Serve</div>
              <h1
                className="font-['Syne'] font-extrabold mt-4"
                style={{ fontSize: "var(--fs-display)", lineHeight: 1.1 }}
              >
                Coverage <span style={{ color: "var(--cyan)" }}>Areas</span>
              </h1>
              <p className="section-sub mx-auto text-center mt-4">
                We&apos;re actively expanding across Guyana. Check if your area is
                covered or contact us for a site assessment.
              </p>
            </div>

            {/* Legend */}
            <div className="flex gap-6 justify-center mb-10 flex-wrap">
              {[
                { color: "#00E676", label: "Active Coverage" },
                { color: "#FFAB00", label: "Limited Coverage" },
                { color: "#0057FF", label: "Coming Soon" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2 text-sm text-[var(--text2)]">
                  <span className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>

            {/* Zone cards */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-7 animate-pulse"
                    style={{ background: "var(--card)", border: "1px solid var(--divider)", height: 200 }}
                  />
                ))}
              </div>
            ) : zones.length === 0 ? (
              <div className="text-center py-20 text-[var(--text2)]">
                <p className="text-lg">Coverage data loading...</p>
                <p className="text-sm mt-2">Contact us to check availability in your area.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {zones.map((zone) => {
                  const st = statusColor(zone.status);
                  return (
                    <div
                      key={zone.id}
                      className="rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1"
                      style={{ background: "var(--card)", border: "1px solid var(--divider)" }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-['Syne'] text-lg font-bold">{zone.name}</h3>
                          <p className="text-xs text-[var(--text3)] mt-1">
                            Region {zone.region_number}
                            {zone.region_name && ` — ${zone.region_name}`}
                          </p>
                        </div>
                        <span
                          className="text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.text }}
                        >
                          {st.label}
                        </span>
                      </div>

                      {zone.technology && (
                        <p className="text-sm text-[var(--text2)] mb-2">
                          Technology: <span className="text-white">{zone.technology}</span>
                        </p>
                      )}

                      {zone.max_speed_mbps && (
                        <p className="text-sm text-[var(--text2)]">
                          Max Speed: <span className="text-[var(--cyan)] font-semibold">{zone.max_speed_mbps} Mbps</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* CTA */}
            <div
              className="rounded-2xl p-10 text-center mt-14"
              style={{
                background: "linear-gradient(135deg, rgba(0,87,255,0.1), rgba(0,212,255,0.05))",
                border: "1px solid var(--divider)",
              }}
            >
              <h3 className="font-['Syne'] text-xl font-bold mb-3">
                Don&apos;t see your area?
              </h3>
              <p className="text-[var(--text2)] text-sm mb-5 max-w-md mx-auto">
                We&apos;re expanding rapidly. Contact us and we&apos;ll do a free
                site assessment to check if we can reach you.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5926092487"}?text=${encodeURIComponent("Hi! I'd like to check coverage in my area.")}`}
                  className="btn btn-cyan"
                  target="_blank"
                  rel="noopener"
                >
                  💬 WhatsApp Us
                </a>
                <a href="/contact" className="btn btn-outline">Contact Form</a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFAB />
    </>
  );
}
