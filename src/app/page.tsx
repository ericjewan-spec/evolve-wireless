import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PlansSection from "@/components/PlansSection";
import LeadForm from "@/components/LeadForm";
import Footer from "@/components/Footer";
import WhatsAppFAB from "@/components/WhatsAppFAB";
import OutageBanner from "@/components/OutageBanner";
import ScrollRevealInit from "@/components/ScrollRevealInit";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <OutageBanner />
      <Navbar />
      <ScrollRevealInit />
      <Hero />

      <div className="section-divider" />

      {/* ═══ ABOUT ═══ */}
      <section id="about" className="section" style={{ background: "var(--soft-bg)" }}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="reveal">
              <div className="rounded-2xl p-10 relative overflow-hidden" style={{ background: "white", border: "1px solid rgba(44, 24, 16, 0.06)", boxShadow: "0 2px 20px rgba(44, 24, 16, 0.06)" }}>
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, var(--terracotta), var(--teal))" }} />
                <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Our Story</h3>
                <p className="text-sm leading-7" style={{ color: "var(--text2)" }}>
                  Evolve Wireless Internet was founded with a single purpose: to bring fast, reliable, and affordable internet access to every corner of Guyana — from the busy streets of the East Coast to the remote communities of Region 1 and Port Kaituma.
                </p>
                <div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(44, 24, 16, 0.06)" }}>
                  <p className="text-sm leading-7" style={{ color: "var(--text2)" }}>
                    Equipped with industry-leading Ubiquiti hardware, Starlink solutions, and a dedicated technical team, we design and deploy custom wireless networks that work — even in the most challenging terrain.
                  </p>
                </div>
              </div>
            </div>

            <div className="reveal reveal-delay-1">
              <div className="section-label">About Evolve Wireless</div>
              <h2 className="section-title">Built for <span>Guyana&apos;s</span> Future</h2>
              <p className="section-sub">
                We&apos;re not just an ISP — we&apos;re infrastructure builders. Our mission is to bridge the digital divide and empower Guyanese communities with the connectivity they deserve.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-7">
                <div className="rounded-xl p-5" style={{ background: "white", border: "1px solid rgba(44, 24, 16, 0.06)", boxShadow: "0 2px 16px rgba(44, 24, 16, 0.04)" }}>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--teal)" }}>Our Mission</h4>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text2)" }}>To provide accessible, high-quality wireless internet solutions that connect individuals, businesses, and communities across Guyana.</p>
                </div>
                <div className="rounded-xl p-5" style={{ background: "white", border: "1px solid rgba(44, 24, 16, 0.06)", boxShadow: "0 2px 16px rgba(44, 24, 16, 0.04)" }}>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--teal)" }}>Our Vision</h4>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text2)" }}>To become Guyana&apos;s most trusted wireless internet provider, known for reliable coverage, innovative technology, and genuine community commitment.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══ SERVICES ═══ */}
      <section id="services" className="section" style={{ background: "var(--cream)" }}>
        <div className="container">
          <div className="section-label">What We Offer</div>
          <h2 className="section-title reveal">Complete <span>Internet</span> Solutions</h2>
          <p className="section-sub reveal reveal-delay-1">From residential connections to full tower projects, we have the expertise and equipment to get you online — anywhere in Guyana.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-14">
            {[
              { icon: "🏠", title: "Home Internet", desc: "Fast, stable residential internet for browsing, streaming, gaming, and remote work.", tags: ["5–100 Mbps", "Wireless Radio", "Router Included"] },
              { icon: "🏢", title: "Business Internet", desc: "Dedicated business-grade connections with guaranteed bandwidth and SLA support.", tags: ["Dedicated Bandwidth", "SLA Available", "Priority Support"] },
              { icon: "📡", title: "Remote Installations", desc: "We specialize in bringing internet to out-of-town and hard-to-reach communities.", tags: ["Port Kaituma", "Region 1", "Long-Range Links"] },
              { icon: "🗼", title: "Tower Build & Maintenance", desc: "End-to-end tower construction, equipment mounting, alignment, and ongoing maintenance.", tags: ["Tower Erection", "Sector Antennas", "Maintenance Plans"] },
              { icon: "📶", title: "Managed WiFi Solutions", desc: "Complete WiFi management for hotels, offices, clinics, and large venues.", tags: ["Ubiquiti UniFi", "Multi-Zone", "Captive Portal"] },
              { icon: "🌐", title: "Starlink Installations", desc: "Authorized Starlink dish installation and support for areas beyond traditional wireless reach.", tags: ["Starlink", "Remote Sites", "Setup & Support"] },
            ].map((s, i) => (
              <div key={s.title} className={`card p-8 cursor-default reveal ${i > 0 ? `reveal-delay-${Math.min(i, 3)}` : ""}`}>
                <div className="text-3xl mb-5">{s.icon}</div>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>{s.title}</h3>
                <p className="text-sm leading-7 mb-5" style={{ color: "var(--text3)" }}>{s.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.tags.map((t) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(42, 157, 143, 0.08)", border: "1px solid rgba(42, 157, 143, 0.15)", color: "var(--text3)" }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══ PLANS ═══ */}
      <PlansSection />

      <div className="section-divider" />

      {/* ═══ CTA BAND ═══ */}
      <div className="py-20 text-center relative overflow-hidden" style={{
        background: "linear-gradient(135deg, rgba(212, 101, 74, 0.08), rgba(42, 157, 143, 0.06))",
        borderTop: "1px solid rgba(44, 24, 16, 0.06)", borderBottom: "1px solid rgba(44, 24, 16, 0.06)"
      }}>
        <div className="container relative z-10">
          <h2 className="font-extrabold mb-4" style={{ fontSize: "var(--fs-h2)", fontFamily: "'Bricolage Grotesque', serif" }}>
            Ready to <span style={{ color: "var(--terracotta)" }}>Get Connected?</span>
          </h2>
          <p className="text-base mb-7" style={{ color: "var(--text3)" }}>Sign up today or contact us to check coverage in your area.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/plans" className="btn btn-primary">View Packages</Link>
            <a href="https://wa.me/5926092487" className="btn btn-cyan" target="_blank" rel="noopener">💬 Chat on WhatsApp</a>
            <Link href="/contact" className="btn btn-outline">Contact Us</Link>
          </div>
        </div>
      </div>

      <div className="section-divider" />

      {/* ═══ CONTACT PREVIEW ═══ */}
      <section id="contact-preview" className="section" style={{ background: "var(--cream)" }}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <div className="section-label">Get In Touch</div>
              <h2 className="section-title reveal">We&apos;re Here to <span>Help</span></h2>
              <p className="section-sub reveal reveal-delay-1">Reach out via WhatsApp, email, or our contact form.</p>
            </div>
            <div className="rounded-2xl p-9 reveal reveal-delay-2" style={{ background: "white", border: "1px solid rgba(44, 24, 16, 0.06)", boxShadow: "0 4px 24px rgba(44, 24, 16, 0.08)" }}>
              <h3 className="text-xl font-bold mb-6" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Get Connected</h3>
              <LeadForm />
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />
      <Footer />
      <WhatsAppFAB />
    </>
  );
}
