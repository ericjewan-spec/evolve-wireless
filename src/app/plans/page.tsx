"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFAB from "@/components/WhatsAppFAB";
import Link from "next/link";

interface Plan {
  id: string;
  name: string;
  slug: string;
  type: string;
  region: string;
  speed_down_mbps: number;
  speed_up_mbps: number;
  price_gyd: number;
  features: string[];
  sort_order: number;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.from("plans").select("*").eq("is_active", true).order("sort_order").then(({ data }) => {
      setPlans(data || []);
      setLoading(false);
    });
  }, [supabase]);

  const ecdPlans = plans.filter((p) => p.region === "ecd");
  const r1Plans = plans.filter((p) => p.region === "region1");

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 72 }}>
        <section className="section text-center" style={{ background: "var(--soft-bg)" }}>
          <div className="container" style={{ maxWidth: 700 }}>
            <div className="section-label" style={{ display: "inline-flex" }}>Pricing</div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>
              Speed for Every <span style={{ color: "var(--terracotta)" }}>Guyanese</span> Household.
            </h1>
            <p className="text-base mb-4" style={{ color: "var(--text3)", maxWidth: 500, margin: "0 auto" }}>
              Simple pricing, no hidden fees, and plans you can upgrade or change any time you need.
            </p>
            <Link href="/signup" className="btn btn-primary">Find My Plan →</Link>
          </div>
        </section>

        {loading ? (
          <section className="section"><div className="container text-center"><p style={{ color: "var(--text3)" }}>Loading plans...</p></div></section>
        ) : (
          <>
            {/* ECD Plans */}
            <section className="section" style={{ background: "var(--cream)" }}>
              <div className="container">
                <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>
                  📍 East Coast Demerara Plans
                </h2>
                <p className="text-sm mb-6" style={{ color: "var(--text3)" }}>From Beterverwagting to Vigilance — our ECD network is live.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {ecdPlans.map((p, i) => (
                    <PlanCard key={p.id} plan={p} popular={i === 1} badge={i === 1 ? "Most Guyanese Families Choose This" : undefined} />
                  ))}
                </div>
              </div>
            </section>

            {/* Region 1 Plans */}
            <section className="section" style={{ background: "var(--soft-bg)" }}>
              <div className="container">
                <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>
                  📡 Region 1 Plans
                </h2>
                <p className="text-sm mb-6" style={{ color: "var(--text3)" }}>Port Kaituma · Mabaruma · Matthews Ridge · Baramita</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {r1Plans.map((p, i) => (
                    <PlanCard key={p.id} plan={p} popular={i === 1} badge={i === 1 ? "Most Popular in Region 1" : undefined} teal />
                  ))}
                </div>
              </div>
            </section>

            {/* Starlink */}
            <section className="section" style={{ background: "var(--cream)" }}>
              <div className="container" style={{ maxWidth: 700 }}>
                <div className="card p-8 text-center" style={{ background: "linear-gradient(135deg, rgba(42,157,143,0.04), rgba(233,180,76,0.04))", borderColor: "rgba(42,157,143,0.15)" }}>
                  <div className="text-4xl mb-4">🛰️</div>
                  <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>
                    Reach the Unreachable — Starlink
                  </h2>
                  <p className="text-sm mb-4" style={{ color: "var(--text3)", maxWidth: 500, margin: "0 auto" }}>
                    Deep in Region 1, miles from the nearest tower — your location is not your limitation. We install and support Starlink satellite systems across Guyana&apos;s most remote communities. Available at cost.
                  </p>
                  <Link href="/contact" className="btn btn-cyan">Get a Starlink Quote</Link>
                </div>
              </div>
            </section>
          </>
        )}

        {/* FAQ mini */}
        <section className="section" style={{ background: "var(--soft-bg)" }}>
          <div className="container" style={{ maxWidth: 600 }}>
            <h2 className="text-xl font-bold mb-6 text-center" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Common Questions</h2>
            {[
              { q: "Is there a contract?", a: "No. Pay month to month. Cancel any time, no penalties." },
              { q: "What's included?", a: "Free router, professional installation, and local support — all included." },
              { q: "How fast is installation?", a: "ECD: within 48 hours. Region 1: within 7 days." },
              { q: "Can I upgrade my plan?", a: "Yes — WhatsApp us at +592 609-2487 and we change it from the next billing cycle." },
            ].map((f, i) => (
              <div key={i} className="py-4" style={{ borderTop: "1px solid rgba(44,24,16,0.08)" }}>
                <h3 className="text-sm font-bold mb-1" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>{f.q}</h3>
                <p className="text-sm" style={{ color: "var(--text3)" }}>{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="py-16 text-center" style={{ background: "linear-gradient(135deg, rgba(212,101,74,0.08), rgba(42,157,143,0.06))" }}>
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>
            Ready to <span style={{ color: "var(--terracotta)" }}>get connected?</span>
          </h2>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/signup" className="btn btn-primary">Sign Up Now</Link>
            <a href="https://wa.me/5926092487" className="btn btn-cyan" target="_blank" rel="noopener">💬 WhatsApp Us</a>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppFAB />
    </>
  );
}

function PlanCard({ plan, popular, badge, teal }: { plan: Plan; popular?: boolean; badge?: string; teal?: boolean }) {
  const accent = teal ? "var(--teal)" : "var(--terracotta)";
  return (
    <div className="card p-7 text-center" style={popular ? { borderColor: accent, borderWidth: 2 } : {}}>
      {badge && (
        <div className="text-xs font-bold uppercase tracking-widest mb-3 py-1 px-3 rounded-full inline-block" style={{ background: accent, color: "#fff", fontSize: "0.7rem" }}>
          {badge}
        </div>
      )}
      <div className="text-sm font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text3)" }}>{plan.name}</div>
      <div className="mb-1" style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "2.4rem", fontWeight: 800, color: "var(--text)" }}>
        <span style={{ fontSize: "1rem", color: "var(--text3)" }}>GYD </span>{plan.price_gyd.toLocaleString()}
      </div>
      <div className="text-sm mb-1" style={{ color: "var(--text3)" }}>per month</div>
      <div className="text-xs mb-5" style={{ color: accent }}>{plan.speed_down_mbps} Mbps down / {plan.speed_up_mbps} Mbps up</div>
      <ul className="text-left text-sm space-y-2 mb-6">
        {(plan.features as unknown as string[])?.map((f) => (
          <li key={f} style={{ color: "var(--text2)" }}>
            <span style={{ color: "var(--teal)", fontWeight: 700, marginRight: 8 }}>✓</span>{f}
          </li>
        ))}
      </ul>
      <Link href="/signup" className={`btn ${popular ? (teal ? "btn-cyan" : "btn-primary") : "btn-outline"} w-full justify-center`}>
        Get Connected
      </Link>
    </div>
  );
}
