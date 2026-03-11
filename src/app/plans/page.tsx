"use client";

import Link from "next/link";
import WhatsAppFAB from "@/components/WhatsAppFAB";

const regions = [
  {
    name: "East Coast Demerara",
    tag: "ECD",
    icon: "📍",
    desc: "Beterverwagting to Mahaica — our flagship ECD network.",
    installFee: 20000,
    accent: "var(--terracotta)",
    plans: [
      { name: "Basic", price: 5000, speed: "20 Mbps" },
      { name: "Preferred", price: 8000, speed: "30 Mbps", popular: true },
      { name: "Premium", price: 10000, speed: "40 Mbps" },
    ],
  },
  {
    name: "New Amsterdam",
    tag: "Berbice",
    icon: "📍",
    desc: "Serving New Amsterdam and surrounding areas in Region 6.",
    installFee: 20000,
    accent: "var(--teal)",
    plans: [
      { name: "Basic", price: 5000, speed: "20 Mbps" },
      { name: "Preferred", price: 8000, speed: "30 Mbps", popular: true },
      { name: "Premium", price: 10000, speed: "40 Mbps" },
    ],
  },
  {
    name: "Charity",
    tag: "Essequibo",
    icon: "📍",
    desc: "Serving Charity and the Essequibo Coast communities.",
    installFee: 20000,
    accent: "var(--terracotta)",
    plans: [
      { name: "Basic", price: 8000, speed: "" },
      { name: "Standard", price: 10000, speed: "", popular: true },
      { name: "Premium", price: 15000, speed: "" },
    ],
  },
  {
    name: "Mabaruma",
    tag: "Region 1",
    icon: "📡",
    desc: "Connecting Mabaruma and surrounding villages in Region 1.",
    installFee: 25000,
    accent: "var(--teal)",
    plans: [
      { name: "Basic", price: 10000, speed: "" },
      { name: "Standard", price: 15000, speed: "", popular: true },
      { name: "Premium", price: 25000, speed: "" },
    ],
  },
  {
    name: "Port Kaituma",
    tag: "Region 1",
    icon: "📡",
    desc: "Reliable wireless internet for Port Kaituma and nearby communities.",
    installFee: 15000,
    accent: "var(--teal)",
    plans: [
      { name: "Basic", price: 10000, speed: "" },
      { name: "Standard", price: 15000, speed: "", popular: true },
      { name: "Premium", price: 25000, speed: "" },
    ],
  },
  {
    name: "Baramita",
    tag: "Region 1",
    icon: "📡",
    desc: "Bringing connectivity to the Baramita community.",
    installFee: 15000,
    accent: "var(--teal)",
    plans: [
      { name: "Basic", price: 10000, speed: "" },
      { name: "Standard", price: 15000, speed: "", popular: true },
      { name: "Premium", price: 25000, speed: "" },
    ],
  },
];

export default function PlansPage() {
  return (
    <>
      <main style={{ paddingTop: 72 }}>
        {/* Hero */}
        <section className="section text-center" style={{ background: "var(--soft-bg)" }}>
          <div className="container" style={{ maxWidth: 700 }}>
            <div className="section-label" style={{ display: "inline-flex" }}>Pricing</div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>
              Internet Plans for Every <span style={{ color: "var(--terracotta)" }}>Community</span>
            </h1>
            <p className="text-base mb-4" style={{ color: "var(--text3)", maxWidth: 520, margin: "0 auto" }}>
              Simple pricing in GYD, no hidden fees. Now serving 6 areas across Guyana with plans you can upgrade or change any time.
            </p>
            <Link href="/signup" className="btn btn-primary">Find My Plan →</Link>
          </div>
        </section>

        {/* Region Cards */}
        {regions.map((region, ri) => (
          <section key={region.name} className="section" style={{ background: ri % 2 === 0 ? "var(--cream)" : "var(--soft-bg)" }}>
            <div className="container">
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                <span style={{ fontSize: "1.4rem" }}>{region.icon}</span>
                <h2 className="text-xl font-bold" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>
                  {region.name}
                </h2>
                <span style={{
                  padding: "3px 10px", borderRadius: "100px", fontSize: "0.7rem",
                  fontWeight: 700, background: `${region.accent}15`, color: region.accent,
                  letterSpacing: "0.04em",
                }}>
                  {region.tag}
                </span>
              </div>
              <p className="text-sm mb-2" style={{ color: "var(--text3)" }}>{region.desc}</p>
              <p className="text-sm mb-6" style={{ color: region.accent, fontWeight: 600 }}>
                Installation Fee: GYD {region.installFee.toLocaleString()}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {region.plans.map((plan) => (
                  <div
                    key={plan.name}
                    className="card p-7 text-center"
                    style={plan.popular ? { borderColor: region.accent, borderWidth: 2 } : {}}
                  >
                    {plan.popular && (
                      <div
                        className="text-xs font-bold uppercase tracking-widest mb-3 py-1 px-3 rounded-full inline-block"
                        style={{ background: region.accent, color: "#fff", fontSize: "0.7rem" }}
                      >
                        Most Popular
                      </div>
                    )}
                    <div className="text-sm font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text3)" }}>
                      {plan.name}
                    </div>
                    <div className="mb-1" style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "2.4rem", fontWeight: 800, color: "var(--text)" }}>
                      <span style={{ fontSize: "1rem", color: "var(--text3)" }}>GYD </span>
                      {plan.price.toLocaleString()}
                    </div>
                    <div className="text-sm mb-1" style={{ color: "var(--text3)" }}>per month</div>
                    {plan.speed && (
                      <div className="text-xs mb-4" style={{ color: region.accent, fontWeight: 600 }}>
                        {plan.speed}
                      </div>
                    )}
                    {!plan.speed && <div className="mb-4" />}
                    <ul className="text-left text-sm space-y-2 mb-6">
                      {["Free router included", "Professional installation", "WhatsApp support", "No contract — cancel anytime"].map((f) => (
                        <li key={f} style={{ color: "var(--text2)" }}>
                          <span style={{ color: "var(--teal)", fontWeight: 700, marginRight: 8 }}>✓</span>{f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/signup"
                      className={`btn ${plan.popular ? "btn-primary" : "btn-outline"} w-full justify-center`}
                      style={plan.popular ? { background: region.accent, borderColor: region.accent } : {}}
                    >
                      Get Connected
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* Starlink */}
        <section className="section" style={{ background: "var(--cream)" }}>
          <div className="container" style={{ maxWidth: 700 }}>
            <div className="card p-8 text-center" style={{ background: "linear-gradient(135deg, rgba(42,157,143,0.04), rgba(233,180,76,0.04))", borderColor: "rgba(42,157,143,0.15)" }}>
              <div className="text-4xl mb-4">🛰️</div>
              <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>
                Reach the Unreachable — Starlink
              </h2>
              <p className="text-sm mb-4" style={{ color: "var(--text3)", maxWidth: 500, margin: "0 auto" }}>
                Deep in the hinterland, miles from the nearest tower — your location is not your limitation. We install and support Starlink satellite systems across Guyana&apos;s most remote communities. Available at cost.
              </p>
              <Link href="/contact" className="btn btn-cyan">Get a Starlink Quote</Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section" style={{ background: "var(--soft-bg)" }}>
          <div className="container" style={{ maxWidth: 600 }}>
            <h2 className="text-xl font-bold mb-6 text-center" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Common Questions</h2>
            {[
              { q: "Is there a contract?", a: "No. Pay month to month. Cancel any time, no penalties." },
              { q: "What's included?", a: "Free router, professional installation, and local support — all included." },
              { q: "How fast is installation?", a: "ECD & New Amsterdam: within 48 hours. Region 1: within 7 days." },
              { q: "Can I upgrade my plan?", a: "Yes — WhatsApp us at +592 609-2487 and we change it from the next billing cycle." },
              { q: "What areas do you serve?", a: "East Coast Demerara, New Amsterdam, Charity, Mabaruma, Port Kaituma, and Baramita — with more areas coming soon." },
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
      <WhatsAppFAB />
    </>
  );
}
