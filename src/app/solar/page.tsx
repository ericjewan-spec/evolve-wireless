"use client";

import Link from "next/link";

const services = [
  {
    title: "Residential Solar",
    desc: "Power your home with clean, affordable solar energy. Reduce your GPL bill by up to 90% and enjoy uninterrupted electricity.",
    icon: "🏠",
    features: ["2kW to 10kW systems", "Battery backup options", "Net metering ready", "GPL bill reduction up to 90%"],
  },
  {
    title: "Commercial Solar",
    desc: "Scale your business with solar. From shops on Regent Street to farms in the Rupununi — we design systems that pay for themselves.",
    icon: "🏢",
    features: ["10kW to 500kW+ systems", "Rooftop & ground-mount", "Energy audit included", "ROI within 3-5 years"],
  },
  {
    title: "Off-Grid Systems",
    desc: "Perfect for rural and hinterland locations. Complete standalone solar systems with battery storage — no GPL connection needed.",
    icon: "🌍",
    features: ["Full battery storage", "Generator hybrid option", "Mining camp solutions", "Community microgrids"],
  },
  {
    title: "Solar Water Heating",
    desc: "Heat your water with the sun. Simple, cost-effective systems for homes, hotels, and restaurants across Guyana.",
    icon: "🔥",
    features: ["Domestic hot water", "Hotel & hospitality", "Low maintenance", "10+ year lifespan"],
  },
];

const steps = [
  { n: "01", title: "Free Consultation", desc: "Chat with us on WhatsApp or fill out our quote form. We'll discuss your energy needs and budget." },
  { n: "02", title: "Site Assessment", desc: "Our engineers visit your property to assess roof condition, shading, and optimal panel placement." },
  { n: "03", title: "Custom Design", desc: "We design a system tailored to your energy usage, property layout, and goals." },
  { n: "04", title: "Professional Install", desc: "Our certified team installs your system — typically completed within 1-3 days for residential." },
  { n: "05", title: "Power On", desc: "We commission the system, train you on monitoring, and ensure everything is running perfectly." },
  { n: "06", title: "Ongoing Support", desc: "We monitor performance, handle maintenance, and are always a WhatsApp message away." },
];

const faqs = [
  { q: "How much does a solar system cost in Guyana?", a: "Residential systems typically range from GYD 600,000 to GYD 3,000,000 depending on size. Commercial systems are quoted based on energy needs. We offer flexible financing options to make solar affordable for every budget." },
  { q: "Will solar panels work during Guyana's rainy season?", a: "Yes! Solar panels work with daylight, not just direct sunshine. While output is slightly reduced on cloudy days, Guyana receives excellent solar radiation year-round. Battery storage ensures you have power 24/7." },
  { q: "How much can I save on my GPL bill?", a: "Most residential customers save 60-90% on their electricity bills. The exact savings depend on your current usage and system size. Many systems pay for themselves within 3-5 years." },
  { q: "Do you offer financing?", a: "Yes! We partner with local financial institutions to offer attractive financing terms. You can start saving on electricity from day one while spreading the system cost over comfortable monthly payments." },
  { q: "How long do solar panels last?", a: "Quality solar panels last 25-30 years with minimal degradation. We use Tier 1 panels with 25-year manufacturer warranties. Inverters typically last 10-15 years." },
  { q: "Can I sell excess power back to GPL?", a: "Net metering regulations in Guyana allow you to feed excess power back to the grid and receive credits on your GPL bill. We design systems to maximise your net metering benefits." },
  { q: "Do you service rural and hinterland areas?", a: "Absolutely! We have experience installing solar systems throughout Guyana — from Georgetown to Region 9. Off-grid solutions with battery storage are particularly popular in areas without reliable GPL service." },
];

export default function SolarPage() {
  return (
    <div style={{ paddingTop: "var(--nav-height)" }}>
      {/* Hero */}
      <section
        className="section"
        style={{
          background: "linear-gradient(135deg, #FDF8F3 0%, #FEF5EC 40%, #FFFBF0 100%)",
          position: "relative",
          overflow: "hidden",
          paddingTop: "clamp(48px, 8vw, 96px)",
          paddingBottom: "clamp(48px, 8vw, 96px)",
        }}
      >
        {/* Sun decoration */}
        <div
          style={{
            position: "absolute",
            top: "-60px",
            right: "-60px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(233, 180, 76, 0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)" }}>
          <div style={{ maxWidth: "680px" }}>
            <span
              className="section-label"
              style={{
                color: "var(--gold)",
                background: "rgba(233, 180, 76, 0.12)",
                padding: "6px 16px",
                borderRadius: "100px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "24px",
              }}
            >
              ☀️ Evolve Solar Solutions
            </span>

            <h1 style={{ fontSize: "var(--fs-display)", fontWeight: 800, color: "var(--text)", lineHeight: 1.1, marginBottom: "20px" }}>
              Harness <span style={{ color: "var(--gold)" }}>Guyana&apos;s Sunshine</span>,{" "}
              <span style={{ color: "var(--terracotta)" }}>Power Your Future</span>
            </h1>

            <p style={{ color: "var(--text3)", fontSize: "1.1rem", lineHeight: 1.7, marginBottom: "32px", maxWidth: "560px" }}>
              Professional solar panel installation for homes and businesses across Guyana. Cut your GPL bill, gain energy independence, and join the clean energy revolution.
            </p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link href="/solar/quote" className="btn btn-primary" style={{ background: "var(--gold)", borderColor: "var(--gold)", boxShadow: "0 4px 20px rgba(233, 180, 76, 0.3)" }}>
                Get Free Solar Quote
              </Link>
              <Link href="/solar/gallery" className="btn btn-outline">
                View Our Projects
              </Link>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginTop: "48px" }}>
              {[
                { val: "50MW+", label: "Installed Capacity" },
                { val: "200+", label: "Systems Installed" },
                { val: "90%", label: "Avg GPL Bill Reduction" },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "1.75rem", fontWeight: 800, color: "var(--gold)" }}>{s.val}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text3)", marginTop: "4px" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section" style={{ background: "var(--cream)" }}>
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="section-label" style={{ color: "var(--gold)" }}>What We Offer</span>
            <h2 className="section-title" style={{ margin: "12px auto 0" }}>Solar Solutions for <span style={{ color: "var(--gold)" }}>Every Need</span></h2>
            <p className="section-sub" style={{ margin: "12px auto 0" }}>From small residential systems to large commercial installations — we design, install, and maintain solar energy solutions across all of Guyana.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            {services.map((s) => (
              <div key={s.title} className="card" style={{ background: "var(--card)", borderRadius: "var(--r-lg)", padding: "32px", border: "1px solid var(--divider)", transition: "var(--transition)" }}>
                <span style={{ fontSize: "2rem", display: "block", marginBottom: "16px" }}>{s.icon}</span>
                <h3 style={{ fontSize: "var(--fs-h3)", fontWeight: 700, marginBottom: "8px" }}>{s.title}</h3>
                <p style={{ color: "var(--text3)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "16px" }}>{s.desc}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {s.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "var(--text2)" }}>
                      <span style={{ color: "var(--teal)", fontSize: "0.9rem" }}>✓</span> {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Solar */}
      <section className="section" style={{ background: "var(--warm-bg)" }}>
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="section-label" style={{ color: "var(--terracotta)" }}>Benefits</span>
            <h2 className="section-title" style={{ margin: "12px auto 0" }}>Why Go Solar <span>in Guyana?</span></h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            {[
              { icon: "☀️", title: "5+ Peak Sun Hours Daily", desc: "Guyana averages over 5 peak sun hours per day year-round — ideal for solar generation." },
              { icon: "💡", title: "Rising GPL Costs", desc: "Electricity prices keep climbing. Solar locks in your energy cost for 25+ years." },
              { icon: "🔋", title: "Energy Independence", desc: "With battery storage, keep your lights on during outages and load-shedding." },
              { icon: "🌿", title: "Green & Sustainable", desc: "Support Guyana's Low Carbon Development Strategy with zero-emission power." },
              { icon: "📈", title: "Property Value Boost", desc: "Solar installations increase property values — it's an investment that pays dividends." },
              { icon: "🏦", title: "Financing Available", desc: "Go solar with affordable monthly payments. Start saving from day one." },
            ].map((b) => (
              <div key={b.title} style={{ padding: "24px", borderRadius: "var(--r-sm)", background: "var(--card)", border: "1px solid var(--divider)" }}>
                <span style={{ fontSize: "1.8rem", display: "block", marginBottom: "12px" }}>{b.icon}</span>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "6px" }}>{b.title}</h3>
                <p style={{ color: "var(--text3)", fontSize: "0.9rem", lineHeight: 1.6 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="section" style={{ background: "var(--cream)" }}>
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="section-label" style={{ color: "var(--teal)" }}>Our Process</span>
            <h2 className="section-title" style={{ margin: "12px auto 0" }}>How It <span>Works</span></h2>
            <p className="section-sub" style={{ margin: "12px auto 0" }}>From first contact to power-on, we make going solar simple and stress-free.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            {steps.map((s) => (
              <div key={s.n} style={{ padding: "28px", borderRadius: "var(--r-sm)", background: "var(--card)", border: "1px solid var(--divider)" }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "2rem", fontWeight: 800, color: "rgba(233, 180, 76, 0.2)" }}>{s.n}</span>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: "8px", marginBottom: "6px" }}>{s.title}</h3>
                <p style={{ color: "var(--text3)", fontSize: "0.9rem", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" style={{ background: "var(--warm-bg)" }}>
        <div className="container" style={{ maxWidth: "720px", margin: "0 auto", padding: "0 var(--gutter)" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span className="section-label" style={{ color: "var(--terracotta)" }}>FAQ</span>
            <h2 className="section-title" style={{ margin: "12px auto 0" }}>Frequently Asked <span>Questions</span></h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {faqs.map((f, i) => (
              <details key={i} style={{ padding: "20px 24px", borderRadius: "var(--r-sm)", background: "var(--card)", border: "1px solid var(--divider)", cursor: "pointer" }}>
                <summary style={{ fontFamily: "'Bricolage Grotesque', serif", fontWeight: 600, color: "var(--text)", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {f.q}
                  <span style={{ color: "var(--gold)", fontSize: "1.2rem", marginLeft: "12px", flexShrink: 0 }}>+</span>
                </summary>
                <p style={{ color: "var(--text3)", fontSize: "0.95rem", lineHeight: 1.7, marginTop: "12px" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: "linear-gradient(135deg, var(--cream) 0%, #FEF5EC 100%)", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "640px", margin: "0 auto", padding: "0 var(--gutter)" }}>
          <h2 style={{ fontSize: "var(--fs-h2)", fontWeight: 800, color: "var(--text)", marginBottom: "16px" }}>
            Ready to <span style={{ color: "var(--gold)" }}>Go Solar?</span>
          </h2>
          <p style={{ color: "var(--text3)", fontSize: "1.05rem", marginBottom: "32px" }}>
            Get a free, no-obligation quote tailored to your property. Our team will design the perfect system for your needs and budget.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/solar/quote" className="btn btn-primary" style={{ background: "var(--gold)", borderColor: "var(--gold)", boxShadow: "0 4px 20px rgba(233, 180, 76, 0.3)" }}>
              Request Free Quote
            </Link>
            <Link href="/solar/gallery" className="btn btn-outline">
              View Our Projects
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
