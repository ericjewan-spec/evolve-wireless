import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
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

      {/* Trust bar */}
      <div className="text-center py-4" style={{ background: "rgba(42, 157, 143, 0.06)", borderTop: "1px solid rgba(44, 24, 16, 0.06)", borderBottom: "1px solid rgba(44, 24, 16, 0.06)" }}>
        <p style={{ fontSize: "0.85rem", color: "var(--text3)", fontWeight: 500, letterSpacing: "0.04em" }}>
          Local Guyanese support team · Free router included
        </p>
      </div>

      {/* ═══ QUICK ACTIONS — Strategic entry points ═══ */}
      <section className="py-8" style={{ background: "var(--cream)" }}>
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/coverage/map", icon: "📍", label: "Check Coverage", desc: "See if we're in your area", color: "var(--terracotta)" },
              { href: "/plans", icon: "📋", label: "View Plans", desc: "From GYD 5,000/mo", color: "var(--teal)" },
              { href: "/signup", icon: "🚀", label: "Sign Up", desc: "Get online in 48 hours", color: "var(--terracotta)" },
              { href: "/login", icon: "👤", label: "My Account", desc: "Pay bills & get support", color: "var(--teal)" },
            ].map((a) => (
              <Link key={a.label} href={a.href} className="card p-4 text-center" style={{ cursor: "pointer", textDecoration: "none" }}>
                <div className="text-2xl mb-1">{a.icon}</div>
                <div className="text-sm font-bold" style={{ fontFamily: "'Bricolage Grotesque', serif", color: a.color }}>{a.label}</div>
                <div className="text-xs" style={{ color: "var(--text3)" }}>{a.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="section" style={{ background: "var(--soft-bg)" }}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "🔒",
                title: "Your Connection Never Drops. We Guarantee It.",
                body: "Your children's education, your business calls, your family WhatsApp — they all depend on a connection that never lets you down. We engineer our network for Guyana's real conditions, not textbook scenarios.",
                link: { label: "Check your coverage →", href: "/coverage/map" },
              },
              {
                icon: "⚡",
                title: "Live in 48 Hours. Not 48 Days.",
                body: "Our certified technicians serve East Coast Demerara, Region 1, and Port Kaituma. Once you sign up, we confirm your appointment within 24 hours. Your internet is live before the week is out.",
                link: { label: "Sign up now →", href: "/signup" },
              },
              {
                icon: "🇬🇾",
                title: "Support That Actually Picks Up.",
                body: "When something goes wrong, you reach a real Guyanese technician — not an overseas call centre, not an automated bot. We know your community because we live in it. That is the Evolve difference.",
                link: { label: "Get support →", href: "/portal/support" },
              },
            ].map((f, i) => (
              <div key={f.title} className={`card p-8 reveal ${i > 0 ? `reveal-delay-${i}` : ""}`}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "'Bricolage Grotesque', serif", lineHeight: 1.3 }}>{f.title}</h3>
                <p className="text-sm leading-7 mb-4" style={{ color: "var(--text3)" }}>{f.body}</p>
                <Link href={f.link.href} className="text-sm font-semibold" style={{ color: "var(--terracotta)" }}>{f.link.label}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══ COVERAGE CTA STRIP ═══ */}
      <div className="py-10" style={{ background: "linear-gradient(135deg, rgba(42, 157, 143, 0.06), rgba(212, 101, 74, 0.04))" }}>
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Not sure if we cover your area?</h3>
              <p className="text-sm" style={{ color: "var(--text3)" }}>Enter your address and find out instantly — it takes 10 seconds.</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link href="/coverage/map" className="btn btn-primary">Check My Coverage →</Link>
              <Link href="/plans" className="btn btn-ghost">View All Plans</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="section-divider" />

      {/* ═══ ABOUT ═══ */}
      <section id="about" className="section" style={{ background: "var(--cream)" }}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="reveal">
              <div className="section-label">About Evolve Wireless</div>
              <h2 className="section-title">Built in <span>Guyana.</span> Built for Guyana.</h2>
              <p className="section-sub">
                We are a Guyanese company — rooted here, growing here, committed to connecting every community we call home.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-7">
                <div className="rounded-xl p-5" style={{ background: "white", border: "1px solid rgba(44, 24, 16, 0.06)", boxShadow: "0 2px 16px rgba(44, 24, 16, 0.04)" }}>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--teal)" }}>Our Mission</h4>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text2)" }}>To make fast, dependable internet available to every Guyanese household and business — from the seawall to the savannah. Because connectivity is not a luxury. It is a right.</p>
                </div>
                <div className="rounded-xl p-5" style={{ background: "white", border: "1px solid rgba(44, 24, 16, 0.06)", boxShadow: "0 2px 16px rgba(44, 24, 16, 0.04)" }}>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--teal)" }}>Our Vision</h4>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text2)" }}>A Guyana where no child misses an online class because the signal dropped. Where no entrepreneur loses a client because the call froze. Where the interior is as connected as the coast.</p>
                </div>
              </div>
            </div>

            <div className="reveal reveal-delay-1">
              <div className="grid grid-cols-1 gap-5">
                {[
                  { icon: "🔧", title: "Local Experts. Not Call Centres.", body: "Every technician on our team is Guyanese — trained, certified, and proud. They know the terrain, the conditions, and what it means to lose power in a storm. Your problem is personal to them." },
                  { icon: "📈", title: "Growing as Fast as Guyana Is", body: "Guyana is one of the world's fastest-growing economies. We are scaling our infrastructure to match — new towers, new regions, new capacity. Every month, more communities come online." },
                  { icon: "🤝", title: "We Stay When Others Leave", body: "When the weather turns, when the road is flooded — our technicians still come. We have serviced communities during flood season, during power outages, during the hardest conditions." },
                ].map((c) => (
                  <div key={c.title} className="card p-6">
                    <div className="text-2xl mb-3">{c.icon}</div>
                    <h3 className="text-base font-bold mb-2" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>{c.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text3)" }}>{c.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══ SERVICES ═══ */}
      <section id="services" className="section" style={{ background: "var(--soft-bg)" }}>
        <div className="container">
          <div className="section-label">What We Offer</div>
          <h2 className="section-title reveal">Complete <span>Internet</span> Solutions</h2>
          <p className="section-sub reveal reveal-delay-1">From residential connections to full tower projects, we have the expertise and equipment to get you online — anywhere in Guyana.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-14">
            {[
              { icon: "🏠", title: "For the Home That Never Slows Down", desc: "Stream, study, work, and video-call simultaneously. Our residential plans are built for real Guyanese households — large families, shared connections, peak-hour pressure. We don't throttle at 6pm.", tags: ["ECD from GYD 5,000/mo", "No Throttling", "Router Included"] },
              { icon: "🏢", title: "For Businesses That Can't Afford Downtime", desc: "Every minute your connection is down costs you money, customers, and reputation. Our business plans come with priority routing, dedicated support, and SLA-backed uptime guarantees.", tags: ["Dedicated Bandwidth", "SLA Available", "Priority Support"] },
              { icon: "🛰️", title: "Reach the Unreachable — Starlink", desc: "Deep in Region 1, miles from the nearest tower — your location is not your limitation. We install and support Starlink satellite systems across Guyana's most remote communities.", tags: ["Starlink Install", "Remote Sites", "Ongoing Support"] },
              { icon: "🗼", title: "Tower Build & Maintenance", desc: "End-to-end tower construction, equipment mounting, alignment, and ongoing maintenance. We design, build, and operate wireless towers that expand coverage.", tags: ["Tower Erection", "Sector Antennas", "Maintenance Plans"] },
              { icon: "📶", title: "Managed WiFi Solutions", desc: "Hotel-grade WiFi for resorts, schools, offices, and large venues. We design, deploy, and manage enterprise WiFi systems with centralized monitoring.", tags: ["Ubiquiti UniFi", "Multi-Zone", "Captive Portal"] },
              { icon: "📡", title: "Remote Area Installations", desc: "We specialize in bringing internet to out-of-town and hard-to-reach communities. Port Kaituma, Mabaruma, Matthews Ridge, Baramita — we're already there.", tags: ["Region 1", "Long-Range Links", "Site Surveys"] },
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

          {/* Post-services CTA */}
          <div className="flex gap-3 justify-center flex-wrap mt-10 reveal">
            <Link href="/plans" className="btn btn-primary">See All Plans & Pricing →</Link>
            <Link href="/signup" className="btn btn-outline">Sign Up Now</Link>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══ ALREADY A CUSTOMER? — Portal strip ═══ */}
      <div className="py-8" style={{ background: "var(--warm-bg)", borderTop: "1px solid rgba(44, 24, 16, 0.06)", borderBottom: "1px solid rgba(44, 24, 16, 0.06)" }}>
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">👋</span>
              <div>
                <div className="text-sm font-bold" style={{ fontFamily: "'Bricolage Grotesque', serif", color: "var(--text)" }}>Already a customer?</div>
                <div className="text-xs" style={{ color: "var(--text3)" }}>Manage your account, pay bills, or get support.</div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href="/portal" className="btn btn-ghost" style={{ padding: "8px 16px", fontSize: "0.82rem" }}>📊 Dashboard</Link>
              <Link href="/portal/billing" className="btn btn-ghost" style={{ padding: "8px 16px", fontSize: "0.82rem" }}>💳 Pay Bill</Link>
              <Link href="/portal/support" className="btn btn-ghost" style={{ padding: "8px 16px", fontSize: "0.82rem" }}>🎫 Get Support</Link>
              <Link href="/portal/account" className="btn btn-ghost" style={{ padding: "8px 16px", fontSize: "0.82rem" }}>👤 My Account</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="section-divider" />

      {/* ═══ PLANS PREVIEW ═══ */}
      <section className="section" style={{ background: "var(--cream)" }}>
        <div className="container">
          <div className="section-label">Pricing</div>
          <h2 className="section-title reveal">Speed for Every <span>Guyanese</span> Household.</h2>
          <p className="section-sub reveal reveal-delay-1">Simple pricing, no hidden fees, and plans you can upgrade or change any time you need.</p>

          {/* ECD Plans */}
          <h3 className="mt-12 mb-6 text-lg font-bold reveal" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>📍 East Coast Demerara Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 reveal reveal-delay-1">
            {[
              { name: "Starter", price: "5,000", features: ["Browsing & email", "1–2 devices", "Email support", "Free router"] },
              { name: "Family", price: "8,000", popular: true, features: ["Streaming & video calls", "4–6 devices", "24/7 WhatsApp support", "Free router", "No throttling"] },
              { name: "Power", price: "10,000", features: ["Work from home + streaming", "8+ devices", "Priority support", "Free router", "Static IP available"] },
            ].map((p) => (
              <div key={p.name} className="card p-7 text-center" style={p.popular ? { borderColor: "var(--terracotta)", borderWidth: 2 } : {}}>
                {p.popular && <div className="text-xs font-bold uppercase tracking-widest mb-3 py-1 px-3 rounded-full inline-block" style={{ background: "var(--terracotta)", color: "#fff", fontSize: "0.7rem" }}>Most Guyanese Families Choose This</div>}
                <div className="text-sm font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text3)" }}>{p.name}</div>
                <div className="mb-1" style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "2.4rem", fontWeight: 800, color: "var(--text)" }}>
                  <span style={{ fontSize: "1rem", color: "var(--text3)" }}>GYD </span>{p.price}
                </div>
                <div className="text-sm mb-5" style={{ color: "var(--text3)" }}>per month</div>
                <ul className="text-left text-sm space-y-2 mb-6">
                  {p.features.map((f) => (
                    <li key={f} style={{ color: "var(--text2)" }}>
                      <span style={{ color: "var(--teal)", fontWeight: 700, marginRight: 8 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={`btn ${p.popular ? "btn-primary" : "btn-outline"} w-full justify-center`}>
                  Sign Up →
                </Link>
              </div>
            ))}
          </div>

          {/* Region 1 Plans */}
          <h3 className="mt-14 mb-6 text-lg font-bold reveal" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>📡 Region 1 Plans — Port Kaituma · Mabaruma · Matthews Ridge · Baramita</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 reveal reveal-delay-1">
            {[
              { name: "Essential", price: "10,000", features: ["Reliable connectivity", "Browsing, email & WhatsApp", "1–3 devices", "Local tech support"] },
              { name: "Standard", price: "15,000", popular: true, features: ["Streaming & video calls", "4–6 devices", "24/7 WhatsApp support", "Free router included"] },
              { name: "Premium", price: "25,000", features: ["Full household coverage", "8+ devices", "Priority support", "Best speeds available", "Static IP available"] },
            ].map((p) => (
              <div key={p.name} className="card p-7 text-center" style={p.popular ? { borderColor: "var(--teal)", borderWidth: 2 } : {}}>
                {p.popular && <div className="text-xs font-bold uppercase tracking-widest mb-3 py-1 px-3 rounded-full inline-block" style={{ background: "var(--teal)", color: "#fff", fontSize: "0.7rem" }}>Most Popular in Region 1</div>}
                <div className="text-sm font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text3)" }}>{p.name}</div>
                <div className="mb-1" style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "2.4rem", fontWeight: 800, color: "var(--text)" }}>
                  <span style={{ fontSize: "1rem", color: "var(--text3)" }}>GYD </span>{p.price}
                </div>
                <div className="text-sm mb-5" style={{ color: "var(--text3)" }}>per month</div>
                <ul className="text-left text-sm space-y-2 mb-6">
                  {p.features.map((f) => (
                    <li key={f} style={{ color: "var(--text2)" }}>
                      <span style={{ color: "var(--teal)", fontWeight: 700, marginRight: 8 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={`btn ${p.popular ? "btn-cyan" : "btn-outline"} w-full justify-center`}>
                  Sign Up →
                </Link>
              </div>
            ))}
          </div>

          {/* Starlink + full plans link */}
          <div className="card p-8 mt-10 reveal" style={{ background: "linear-gradient(135deg, rgba(42, 157, 143, 0.04), rgba(233, 180, 76, 0.04))", borderColor: "rgba(42, 157, 143, 0.15)" }}>
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="text-4xl">🛰️</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Starlink Installation Service</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text3)" }}>
                  We supply, install, and provide ongoing support for Starlink satellite systems. Available at cost — contact us for a quote.
                </p>
              </div>
              <Link href="/contact" className="btn btn-cyan whitespace-nowrap">Get a Quote</Link>
            </div>
          </div>

          <div className="text-center mt-8 reveal">
            <Link href="/plans" className="text-sm font-semibold" style={{ color: "var(--terracotta)" }}>See detailed plan comparison on our plans page →</Link>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══ FAQ ═══ */}
      <section className="section" style={{ background: "var(--soft-bg)" }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="section-label">FAQ</div>
          <h2 className="section-title reveal">Questions Real <span>Customers</span> Ask.</h2>
          <div className="mt-10 space-y-0">
            {[
              { q: "What happens if my internet goes down in the middle of the night?", a: "You message us on WhatsApp — we monitor it around the clock. For known outages, we broadcast a status update before you wake up. For individual issues, a technician responds within one hour." },
              { q: "How fast is the installation, really?", a: "Our average is 48 hours from sign-up to live internet. For ECD customers, same-week installation is standard. For Port Kaituma, Mabaruma, Matthews Ridge and Baramita, we book within 7 days." },
              { q: "Do I need to buy my own equipment?", a: "No. Your plan includes a free router. Our technician installs everything — the outdoor antenna, cabling, and indoor router. You do not need to buy, source, or configure anything." },
              { q: "Can I upgrade or downgrade my plan?", a: "Yes, any time. Contact us via WhatsApp at +592 609-2487 and we adjust your plan from the next billing cycle. No fees, no penalties." },
              { q: "Is Starlink available through Evolve?", a: "Yes. We supply, install, and support Starlink satellite systems across Guyana's most remote communities. Installation is available at cost — contact us for pricing and availability in your area." },
            ].map((faq, i) => (
              <div key={i} className="reveal py-5" style={{ borderTop: "1px solid rgba(44, 24, 16, 0.08)" }}>
                <h3 className="text-base font-bold mb-2" style={{ fontFamily: "'Bricolage Grotesque', serif", color: "var(--text)" }}>{faq.q}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text3)" }}>{faq.a}</p>
              </div>
            ))}
          </div>
          {/* Post-FAQ support CTA */}
          <div className="text-center mt-8 reveal">
            <p className="text-sm mb-3" style={{ color: "var(--text3)" }}>Still have questions?</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <a href="https://wa.me/5926092487" className="btn btn-cyan" target="_blank" rel="noopener" style={{ padding: "10px 20px", fontSize: "0.85rem" }}>💬 WhatsApp Us</a>
              <Link href="/portal/support" className="btn btn-ghost" style={{ padding: "10px 20px", fontSize: "0.85rem" }}>🎫 Submit a Ticket</Link>
            </div>
          </div>
        </div>
      </section>

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
          <p className="text-base mb-7" style={{ color: "var(--text3)" }}>Check your coverage, pick a plan, or chat with us on WhatsApp.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/coverage/map" className="btn btn-primary">Check My Coverage →</Link>
            <Link href="/signup" className="btn btn-outline">Sign Up Now</Link>
            <a href="https://wa.me/5926092487" className="btn btn-cyan" target="_blank" rel="noopener">💬 WhatsApp Us</a>
          </div>
        </div>
      </div>

      <div className="section-divider" />

      {/* ═══ CONTACT ═══ */}
      <section id="contact-preview" className="section" style={{ background: "var(--cream)" }}>
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <div className="section-label">Get In Touch</div>
              <h2 className="section-title reveal">We&apos;re Here to <span>Help</span></h2>
              <p className="section-sub reveal reveal-delay-1">Tell us what&apos;s happening and a real Guyanese technician will respond within the hour — guaranteed.</p>
              <div className="mt-8 space-y-4 reveal reveal-delay-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📱</span>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>WhatsApp / Phone</div>
                    <a href="tel:+5926092487" className="text-sm" style={{ color: "var(--terracotta)" }}>+592 609-2487</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg">⏰</span>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>Support Hours</div>
                    <span className="text-sm" style={{ color: "var(--text3)" }}>Mon–Fri 8am–6pm · Sat 9am–4pm</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg">📍</span>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>Service Areas</div>
                    <span className="text-sm" style={{ color: "var(--text3)" }}>East Coast Demerara · Port Kaituma · Mabaruma · Matthews Ridge · Baramita</span>
                  </div>
                </div>
              </div>
              {/* Existing customer quick links */}
              <div className="mt-8 p-5 rounded-xl reveal reveal-delay-3" style={{ background: "rgba(42, 157, 143, 0.06)", border: "1px solid rgba(42, 157, 143, 0.12)" }}>
                <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--teal)" }}>Existing Customers</div>
                <div className="flex gap-2 flex-wrap">
                  <Link href="/portal" className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "white", color: "var(--teal)", border: "1px solid rgba(42,157,143,0.2)" }}>📊 Dashboard</Link>
                  <Link href="/portal/billing" className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "white", color: "var(--teal)", border: "1px solid rgba(42,157,143,0.2)" }}>💳 Pay Bill</Link>
                  <Link href="/portal/support" className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "white", color: "var(--teal)", border: "1px solid rgba(42,157,143,0.2)" }}>🎫 Support Ticket</Link>
                  <Link href="/portal/account" className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "white", color: "var(--teal)", border: "1px solid rgba(42,157,143,0.2)" }}>👤 Account Settings</Link>
                </div>
              </div>
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
