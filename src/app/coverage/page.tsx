"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFAB from "@/components/WhatsAppFAB";
import Link from "next/link";

interface Zone {
  id: string;
  name: string;
  slug: string;
  region: string;
  status: string;
  description: string;
  areas: string[];
}

export default function CoveragePage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [address, setAddress] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ covered: boolean; zone_name?: string; estimated_install_days?: number } | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistDone, setWaitlistDone] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    supabase.from("coverage_zones").select("*").order("name").then(({ data }) => {
      setZones(data || []);
    });
  }, [supabase]);

  async function checkCoverage(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setResult(null);

    try {
      const res = await fetch("/api/v1/coverage/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ covered: false });
    }
    setChecking(false);
  }

  async function joinWaitlist(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from("waitlist").insert({ email: waitlistEmail, address });
    // Slack notification (non-blocking)
    fetch("/api/v1/coverage/waitlist-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: waitlistEmail, address }),
    }).catch(() => {});
    setWaitlistDone(true);
  }

  const liveZones = zones.filter((z) => z.status === "live");
  const expandingZones = zones.filter((z) => z.status !== "live");

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 72 }}>
        {/* Hero */}
        <section className="section text-center" style={{ background: "var(--soft-bg)" }}>
          <div className="container" style={{ maxWidth: 700 }}>
            <div className="section-label" style={{ display: "inline-flex" }}>Coverage</div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>
              Check If We&apos;re in <span style={{ color: "var(--terracotta)" }}>Your Area</span>
            </h1>
            <p className="text-base mb-8" style={{ color: "var(--text3)", maxWidth: 500, margin: "0 auto" }}>
              Enter your address and discover if fast, reliable Evolve Wireless service is ready for you today.
            </p>

            {/* Address checker */}
            <form onSubmit={checkCoverage} className="flex gap-3 max-w-lg mx-auto flex-wrap justify-center">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                placeholder="Enter your address, e.g. Lot 5, Buxton, ECD"
                className="flex-1 min-w-[250px] px-5 py-3 rounded-full text-sm outline-none"
                style={{ background: "white", border: "2px solid rgba(44,24,16,0.1)" }}
              />
              <button type="submit" disabled={checking} className="btn btn-primary">
                {checking ? "Checking..." : "Check My Address →"}
              </button>
            </form>

            <div className="mt-4">
              <Link href="/coverage/map" className="text-sm font-semibold" style={{ color: "var(--teal)" }}>
                🗺️ Or use our Interactive Coverage Map to pin your exact location →
              </Link>
            </div>

            {/* Result */}
            {result && (
              <div className="mt-6 p-6 rounded-2xl text-left max-w-lg mx-auto" style={{
                background: result.covered ? "rgba(76,175,80,0.06)" : "rgba(212,101,74,0.06)",
                border: `1px solid ${result.covered ? "rgba(76,175,80,0.2)" : "rgba(212,101,74,0.2)"}`,
              }}>
                {result.covered ? (
                  <>
                    <div className="text-lg font-bold mb-2" style={{ color: "#4CAF50", fontFamily: "'Bricolage Grotesque', serif" }}>
                      ✅ You&apos;re covered! — {result.zone_name}
                    </div>
                    <p className="text-sm mb-3" style={{ color: "var(--text2)" }}>
                      Installation available within <strong>{result.estimated_install_days} days</strong>. Sign up now and our team will contact you to schedule.
                    </p>
                    <Link href="/signup" className="btn btn-primary">Sign Up Now →</Link>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-bold mb-2" style={{ color: "var(--terracotta)", fontFamily: "'Bricolage Grotesque', serif" }}>
                      📍 Not covered yet
                    </div>
                    <p className="text-sm mb-3" style={{ color: "var(--text2)" }}>
                      We&apos;re expanding fast. Join our waitlist and be the first to know when we reach your area.
                    </p>
                    {!waitlistDone ? (
                      <form onSubmit={joinWaitlist} className="flex gap-2">
                        <input type="email" value={waitlistEmail} onChange={(e) => setWaitlistEmail(e.target.value)} required placeholder="your@email.com" className="flex-1 px-4 py-2 rounded-full text-sm outline-none" style={{ border: "1.5px solid rgba(44,24,16,0.1)" }} />
                        <button type="submit" className="btn btn-outline" style={{ padding: "8px 16px" }}>Join Waitlist</button>
                      </form>
                    ) : (
                      <p className="text-sm font-semibold" style={{ color: "var(--teal)" }}>✓ You&apos;re on the waitlist! We&apos;ll notify you when your area goes live.</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Coverage Zones */}
        <section className="section" style={{ background: "var(--cream)" }}>
          <div className="container">
            <h2 className="text-2xl font-bold mb-8" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>
              Our <span style={{ color: "var(--terracotta)" }}>Coverage</span> Areas
            </h2>

            {/* Live zones */}
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "var(--teal)" }}>✅ Live Now</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {liveZones.map((z) => (
                <div key={z.id} className="card p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#4CAF50", boxShadow: "0 0 8px rgba(76,175,80,0.4)" }} />
                    <h3 className="font-bold" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>{z.name}</h3>
                  </div>
                  <p className="text-sm mb-3" style={{ color: "var(--text3)" }}>{z.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {z.areas?.map((a) => (
                      <span key={a} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--warm-bg)", color: "var(--text2)" }}>{a}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Expanding */}
            {expandingZones.length > 0 && (
              <>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "var(--gold)" }}>🔜 Expanding Soon</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {expandingZones.map((z) => (
                    <div key={z.id} className="card p-6" style={{ opacity: 0.8 }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--gold)" }} />
                        <h3 className="font-bold" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>{z.name}</h3>
                      </div>
                      <p className="text-sm mb-3" style={{ color: "var(--text3)" }}>{z.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {z.areas?.map((a) => (
                          <span key={a} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--warm-bg)", color: "var(--text2)" }}>{a}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFAB />
    </>
  );
}
