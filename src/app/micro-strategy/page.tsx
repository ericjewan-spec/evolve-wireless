"use client";

import Link from "next/link";

const services = [
  {
    title: "Website Development",
    desc: "Custom websites that work for Guyanese businesses. From landing pages to full e-commerce — mobile-first, fast-loading, and built to convert visitors into customers.",
    icon: "🌐",
    features: ["Custom design & branding", "Mobile-responsive", "E-commerce & payments", "SEO optimised"],
  },
  {
    title: "AI Solutions",
    desc: "Bring artificial intelligence into your business. Chatbots, intelligent document processing, predictive analytics, and AI-powered customer service — tailored for Guyana's market.",
    icon: "🤖",
    features: ["AI chatbots & assistants", "Document processing", "Predictive analytics", "Custom AI models"],
  },
  {
    title: "Business Automation",
    desc: "Stop doing repetitive work manually. We automate your invoicing, inventory, customer follow-ups, reporting, and more — saving you hours every week.",
    icon: "⚡",
    features: ["Workflow automation", "CRM & lead management", "Invoice & billing systems", "Inventory tracking"],
  },
  {
    title: "Digital Transformation",
    desc: "Take your traditional business digital. We help Guyanese companies modernise with cloud systems, digital payments, online booking, and data-driven decision making.",
    icon: "📊",
    features: ["Cloud migration", "Digital payment integration", "Online booking systems", "Data dashboards"],
  },
];

const steps = [
  { n: "01", title: "Discovery Call", desc: "We learn about your business, challenges, and goals. Free 30-minute consultation — no jargon, just real talk." },
  { n: "02", title: "Strategy & Proposal", desc: "We map out a solution with clear deliverables, timeline, and pricing. No surprises." },
  { n: "03", title: "Design & Build", desc: "Our team designs and develops your solution. You get regular updates and previews throughout." },
  { n: "04", title: "Testing & Launch", desc: "We thoroughly test everything, train your team, and launch when you're confident it's perfect." },
  { n: "05", title: "Ongoing Support", desc: "We don't disappear after launch. Ongoing maintenance, updates, and WhatsApp support included." },
];

const faqs = [
  { q: "How much does a website cost?", a: "Simple business websites start from GYD 150,000. E-commerce sites from GYD 400,000. Custom web applications are quoted based on complexity. We always provide a detailed proposal before any work begins." },
  { q: "How long does it take to build a website?", a: "A basic business website takes 2-3 weeks. E-commerce sites take 4-6 weeks. Complex web applications take 8-12 weeks. We'll give you a clear timeline in our proposal." },
  { q: "What is business automation?", a: "Business automation means using software to handle repetitive tasks automatically — like sending follow-up emails, generating invoices, tracking inventory, or creating reports. It saves time, reduces errors, and lets you focus on growing your business." },
  { q: "Can AI really help my small business?", a: "Absolutely! AI isn't just for big companies. A simple AI chatbot on your website can answer customer questions 24/7. Automated document processing can save hours of data entry. We start small and scale with you." },
  { q: "Do you work with businesses outside Georgetown?", a: "Yes! We work with businesses across all of Guyana. Most of our work is done remotely, so location isn't a barrier. We use WhatsApp, Zoom, and email to stay connected." },
  { q: "Will I be able to update my website myself?", a: "Yes. We build every website with a simple content management system so you can update text, images, and products yourself. We also provide training and documentation." },
  { q: "Do you offer payment plans?", a: "Yes! We understand cash flow matters. We typically structure payments as 50% upfront and 50% on completion, but we can discuss flexible arrangements for larger projects." },
];

const caseStudies = [
  { title: "E-commerce for a Georgetown Retailer", result: "3x increase in online orders within 2 months", category: "Web Development" },
  { title: "AI Chatbot for a Real Estate Agency", result: "60% reduction in phone enquiries with 24/7 automated responses", category: "AI Solutions" },
  { title: "Invoice Automation for a Construction Company", result: "Saved 12 hours per week on manual invoicing", category: "Automation" },
  { title: "Booking System for a Berbice Hotel", result: "Online bookings increased 200% in first quarter", category: "Digital Transformation" },
];

export default function MicroStrategyPage() {
  return (
    <div style={{ paddingTop: "var(--nav-height)" }}>
      {/* Hero */}
      <section
        className="section"
        style={{
          background: "linear-gradient(135deg, #FDF8F3 0%, #F3F0FF 40%, #FDF8F3 100%)",
          position: "relative",
          overflow: "hidden",
          paddingTop: "clamp(48px, 8vw, 96px)",
          paddingBottom: "clamp(48px, 8vw, 96px)",
        }}
      >
        {/* Decoration */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(42, 157, 143, 0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-40px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212, 101, 74, 0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)" }}>
          <div style={{ maxWidth: "680px" }}>
            <span
              className="section-label"
              style={{
                color: "var(--teal)",
                background: "rgba(42, 157, 143, 0.1)",
                padding: "6px 16px",
                borderRadius: "100px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "24px",
              }}
            >
              💡 Micro Strategy — by Evolve
            </span>

            <h1 style={{ fontSize: "var(--fs-display)", fontWeight: 800, color: "var(--text)", lineHeight: 1.1, marginBottom: "20px" }}>
              Build Smarter.{" "}
              <span style={{ color: "var(--teal)" }}>Automate More.</span>{" "}
              <span style={{ color: "var(--terracotta)" }}>Grow Faster.</span>
            </h1>

            <p style={{ color: "var(--text3)", fontSize: "1.1rem", lineHeight: 1.7, marginBottom: "32px", maxWidth: "560px" }}>
              Website development, AI solutions, and business automation for Guyanese companies. We help you work smarter, serve customers better, and scale your business with technology.
            </p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link href="/micro-strategy/consultation" className="btn btn-primary" style={{ background: "var(--teal)", borderColor: "var(--teal)", boxShadow: "0 4px 20px rgba(42, 157, 143, 0.3)" }}>
                Book Free Consultation
              </Link>
              <Link href="/micro-strategy/portfolio" className="btn btn-outline">
                View Our Work
              </Link>
            </div>

            {/* Stats */}
            <div className="grid-stats-3" style={{ marginTop: "48px" }}>
              {[
                { val: "50+", label: "Projects Delivered" },
                { val: "98%", label: "Client Satisfaction" },
                { val: "3x", label: "Avg. ROI for Clients" },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "1.75rem", fontWeight: 800, color: "var(--teal)" }}>{s.val}</div>
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
            <span className="section-label" style={{ color: "var(--teal)" }}>What We Build</span>
            <h2 className="section-title" style={{ margin: "12px auto 0" }}>Technology Solutions for <span style={{ color: "var(--teal)" }}>Every Business</span></h2>
            <p className="section-sub" style={{ margin: "12px auto 0" }}>Whether you need a website, an AI chatbot, or automated workflows — we design and build solutions that actually work for your business.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: "24px" }}>
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

      {/* Case Studies */}
      <section className="section" style={{ background: "var(--warm-bg)" }}>
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="section-label" style={{ color: "var(--terracotta)" }}>Results</span>
            <h2 className="section-title" style={{ margin: "12px auto 0" }}>Real Impact for <span>Real Businesses</span></h2>
            <p className="section-sub" style={{ margin: "12px auto 0" }}>Here&apos;s what our technology solutions have done for Guyanese businesses like yours.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: "20px" }}>
            {caseStudies.map((cs) => (
              <div key={cs.title} style={{ padding: "28px", borderRadius: "var(--r-lg)", background: "var(--card)", border: "1px solid var(--divider)" }}>
                <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 600, background: "rgba(42, 157, 143, 0.1)", color: "var(--teal)", marginBottom: "12px" }}>
                  {cs.category}
                </span>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "10px" }}>{cs.title}</h3>
                <p style={{ color: "var(--teal)", fontSize: "1rem", fontWeight: 600, fontFamily: "'Bricolage Grotesque', serif" }}>{cs.result}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Micro Strategy */}
      <section className="section" style={{ background: "var(--cream)" }}>
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="section-label" style={{ color: "var(--teal)" }}>Why Us</span>
            <h2 className="section-title" style={{ margin: "12px auto 0" }}>Why Guyanese Businesses Choose <span style={{ color: "var(--teal)" }}>Micro Strategy</span></h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: "20px" }}>
            {[
              { icon: "🇬🇾", title: "Built for Guyana", desc: "We understand Guyanese businesses, customers, and challenges. No cookie-cutter solutions — everything is tailored to our market." },
              { icon: "💬", title: "Plain Language", desc: "No tech jargon. We explain everything in simple terms and make sure you understand what you're getting." },
              { icon: "📱", title: "Mobile-First", desc: "Most Guyanese browse on their phones. Every website and system we build works beautifully on mobile." },
              { icon: "💰", title: "GYD Pricing", desc: "Transparent pricing in Guyanese dollars. No hidden fees, no USD surprises. We work with every budget." },
              { icon: "🤝", title: "Long-Term Partners", desc: "We don't just build and disappear. We're your ongoing tech partner — always a WhatsApp message away." },
              { icon: "🚀", title: "Fast Delivery", desc: "We respect your time. Most websites launch within 2-4 weeks. Automation projects in 1-3 weeks." },
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
      <section className="section" style={{ background: "var(--warm-bg)" }}>
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="section-label" style={{ color: "var(--teal)" }}>Our Process</span>
            <h2 className="section-title" style={{ margin: "12px auto 0" }}>How We <span>Work</span></h2>
            <p className="section-sub" style={{ margin: "12px auto 0" }}>Simple, transparent, and stress-free — from first call to launch day.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: "20px" }}>
            {steps.map((s) => (
              <div key={s.n} style={{ padding: "28px", borderRadius: "var(--r-sm)", background: "var(--card)", border: "1px solid var(--divider)" }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "2rem", fontWeight: 800, color: "rgba(42, 157, 143, 0.2)" }}>{s.n}</span>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: "8px", marginBottom: "6px" }}>{s.title}</h3>
                <p style={{ color: "var(--text3)", fontSize: "0.9rem", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="section" style={{ background: "var(--cream)" }}>
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span className="section-label" style={{ color: "var(--text3)" }}>Technologies We Use</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px" }}>
            {["Next.js", "React", "Node.js", "Python", "OpenAI", "Supabase", "Vercel", "Tailwind CSS", "Shopify", "WordPress", "WhatsApp API", "Zapier", "Make.com", "Google Cloud"].map((tech) => (
              <span key={tech} style={{ padding: "8px 18px", borderRadius: "100px", background: "var(--card)", border: "1px solid var(--divider)", fontSize: "0.85rem", color: "var(--text2)", fontWeight: 500 }}>
                {tech}
              </span>
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
                  <span style={{ color: "var(--teal)", fontSize: "1.2rem", marginLeft: "12px", flexShrink: 0 }}>+</span>
                </summary>
                <p style={{ color: "var(--text3)", fontSize: "0.95rem", lineHeight: 1.7, marginTop: "12px" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: "linear-gradient(135deg, var(--cream) 0%, #F3F0FF 50%, var(--cream) 100%)", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "640px", margin: "0 auto", padding: "0 var(--gutter)" }}>
          <h2 style={{ fontSize: "var(--fs-h2)", fontWeight: 800, color: "var(--text)", marginBottom: "16px" }}>
            Ready to <span style={{ color: "var(--teal)" }}>Level Up</span> Your Business?
          </h2>
          <p style={{ color: "var(--text3)", fontSize: "1.05rem", marginBottom: "32px" }}>
            Book a free 30-minute consultation. We&apos;ll discuss your business, explore what technology can do for you, and give you a clear roadmap — no pressure, no jargon.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/micro-strategy/consultation" className="btn btn-primary" style={{ background: "var(--teal)", borderColor: "var(--teal)", boxShadow: "0 4px 20px rgba(42, 157, 143, 0.3)" }}>
              Book Free Consultation
            </Link>
            <Link href="/micro-strategy/portfolio" className="btn btn-outline">
              View Our Work
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
