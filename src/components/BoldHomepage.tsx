"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════
   BOLD INDUSTRIAL SIGNAL — EVOLVE WIRELESS HOMEPAGE
   Dark high-contrast · #050505 base · #FF0000 accent (≤10%)
   Bebas Neue / Instrument Sans / JetBrains Mono
═══════════════════════════════════════════════════════════ */

export default function BoldHomepage() {
  return (
    <>
      <style>{globalStyles}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

      <Nav />
      <Hero />
      <Features />
      <Stats />
      <Testimonials />
      <CTABanner />
      <Footer />
      <MobileStickyBar />
    </>
  );
}

/* ─── GLOBAL STYLES ─────────────────────────────── */
const globalStyles = `
:root {
  --bg: #050505;
  --bg2: #0A0A0A;
  --bg3: #111111;
  --bg4: #1A1A1A;
  --red: #FF0000;
  --red-glow: 0 0 24px rgba(255,0,0,0.35);
  --red-dim: rgba(255,0,0,0.08);
  --white: #FFFFFF;
  --t1: #E8E8E8;
  --t2: #AAAAAA;
  --t3: #666666;
  --t4: #333333;
  --display: 'Bebas Neue', Impact, sans-serif;
  --body: 'Instrument Sans', system-ui, sans-serif;
  --mono: 'JetBrains Mono', monospace;
  --spring: cubic-bezier(0.34,1.56,0.64,1);
  --eout: cubic-bezier(0.16,1,0.3,1);
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { background: var(--bg); color: var(--t1); font-family: var(--body); -webkit-font-smoothing: antialiased; overflow-x: hidden; }
.bold-container { max-width: 1280px; margin: 0 auto; padding: 0 48px; }
@media (max-width: 767px) { .bold-container { padding: 0 24px; } }

/* Hero word stagger */
.hw { display: inline-block; opacity: 0; transform: translateY(16px); }
.hw.on { opacity: 1; transform: translateY(0); transition: opacity 0.6s var(--eout), transform 0.6s var(--eout); }

/* Chamfered CTA button */
.cta-chamfer {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 16px 32px; font-family: var(--body); font-weight: 600; font-size: 1rem;
  background: var(--red); color: #fff; border: none; cursor: pointer;
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%);
  position: relative; overflow: hidden; transition: transform 0.2s var(--spring), box-shadow 0.2s;
}
.cta-chamfer:hover { transform: translateY(-2px); box-shadow: var(--red-glow); }
.cta-chamfer:active { transform: scale(0.97); }
.cta-chamfer::after {
  content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
  transform: skewX(-15deg); transition: left 0.5s ease;
}
.cta-chamfer:hover::after { left: 150%; }

.cta-ghost {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 16px 32px; font-family: var(--body); font-weight: 600; font-size: 1rem;
  background: transparent; color: var(--t1); border: 1px solid var(--t4); cursor: pointer;
  transition: all 0.2s var(--spring);
}
.cta-ghost:hover { border-color: var(--t2); color: #fff; transform: translateY(-2px); }
.cta-ghost:active { transform: scale(0.97); }

/* Nav link underline */
.nav-ul a { position: relative; color: var(--t2); text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: color 0.15s; }
.nav-ul a::after {
  content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 1px;
  background: var(--red); transform: scaleX(0); transform-origin: left; transition: transform 0.25s var(--eout);
}
.nav-ul a:hover { color: #fff; }
.nav-ul a:hover::after { transform: scaleX(1); }

/* Card hover */
.bold-card {
  background: var(--bg3); border: 1px solid var(--t4); border-radius: 2px; position: relative; overflow: hidden;
  transition: transform 0.2s var(--spring), box-shadow 0.2s, border-color 0.2s;
}
.bold-card::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: var(--red); transform: scaleY(0); transform-origin: bottom; transition: transform 0.2s ease;
}
.bold-card:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.5); border-color: rgba(255,255,255,0.1); }
.bold-card:hover::before { transform: scaleY(1); }

/* Scroll reveal */
.sr { opacity: 0; transform: translateY(28px); transition: opacity 0.7s var(--eout), transform 0.7s var(--eout); }
.sr.on { opacity: 1; transform: translateY(0); }

/* Scanline */
@keyframes scanline { 0% { top: 0; opacity: 0; } 8% { opacity: 0.4; } 92% { opacity: 0.4; } 100% { top: 100%; opacity: 0; } }
.scanline { position: absolute; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--red), transparent); animation: scanline 3s ease-in-out infinite; }

/* Grid bg */
.grid-bg {
  background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse 70% 70% at 70% 50%, black 20%, transparent 70%);
}

/* Stars */
.star { color: var(--red); }

/* Mobile sticky bar */
.mobile-sticky { display: none; }
@media (max-width: 767px) {
  .mobile-sticky {
    display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 999;
    padding: 12px 24px; background: rgba(5,5,5,0.92); backdrop-filter: blur(16px);
    border-top: 1px solid var(--t4);
  }
}

/* Focus ring for coverage input */
.coverage-input:focus { outline: none; box-shadow: 0 0 0 2px var(--red), 0 0 16px rgba(255,0,0,0.2); animation: pulseRing 1.5s ease infinite; }
@keyframes pulseRing { 0%, 100% { box-shadow: 0 0 0 2px var(--red), 0 0 16px rgba(255,0,0,0.2); } 50% { box-shadow: 0 0 0 4px var(--red), 0 0 24px rgba(255,0,0,0.35); } }

/* Responsive */
@media (max-width: 1279px) {
  .hero-grid { grid-template-columns: 1fr !important; }
  .feat-grid { grid-template-columns: 1fr 1fr !important; }
  .test-grid { grid-template-columns: 1fr 1fr !important; }
  .stat-grid { grid-template-columns: repeat(3, 1fr) !important; }
  .foot-grid { grid-template-columns: 1fr 1fr !important; }
}
@media (max-width: 767px) {
  .hero-h1 { font-size: 40px !important; }
  .feat-grid, .test-grid, .stat-grid { grid-template-columns: 1fr !important; }
  .foot-grid { grid-template-columns: 1fr !important; }
  .hero-ctas { flex-direction: column; }
  .hero-ctas .cta-chamfer, .hero-ctas .cta-ghost { width: 100%; justify-content: center; }
}
`;

/* ─── NAV ───────────────────────────────────────── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, height: 64,
      display: "flex", alignItems: "center", padding: "0 48px",
      background: scrolled ? "rgba(5,5,5,0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      transition: "all 0.3s",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1280, margin: "0 auto", width: "100%" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="/logo.svg" alt="Evolve Wireless" style={{ height: 36, filter: "brightness(10)" }} />
        </Link>
        <ul className="nav-ul" style={{ display: "flex", gap: 28, listStyle: "none", alignItems: "center" }}>
          {[
            { href: "/#features", label: "Why Evolve" },
            { href: "/plans", label: "Plans" },
            { href: "/coverage", label: "Coverage" },
            { href: "/contact", label: "Contact" },
            { href: "/login", label: "My Account" },
          ].map((l) => (
            <li key={l.href} style={{ display: "none" }} className="md-show">
              <Link href={l.href}>{l.label}</Link>
            </li>
          ))}
          <li>
            <Link href="/signup" className="cta-chamfer" style={{ padding: "8px 20px", fontSize: "0.85rem" }}>
              Sign Up
            </Link>
          </li>
        </ul>
        <style>{`.md-show { display: block !important; } @media (max-width: 767px) { .md-show { display: none !important; } }`}</style>
      </div>
    </nav>
  );
}

/* ─── HERO ───────────────────────────────────────── */
function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const words = ref.current?.querySelectorAll(".hw");
    words?.forEach((w, i) => setTimeout(() => w.classList.add("on"), 200 + i * 80));
  }, []);

  return (
    <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden", background: "var(--bg)", paddingTop: 64 }}>
      {/* Grid background */}
      <div className="grid-bg" style={{ position: "absolute", inset: 0 }} />
      {/* Scanline */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div className="scanline" />
      </div>
      {/* Red radial glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 60% at 30% 50%, rgba(255,0,0,0.04) 0%, transparent 70%)" }} />

      <div className="bold-container" style={{ position: "relative", zIndex: 2, width: "100%" }}>
        <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div ref={ref}>
            {/* Eyebrow */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontFamily: "var(--mono)", fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase",
              color: "var(--red)", marginBottom: 24,
              opacity: 0, animation: "fadeIn 0.6s 0.1s var(--eout) forwards",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--red)", animation: "pulse 2s ease infinite" }} />
              Guyanese Owned &amp; Operated
            </div>
            <style>{`@keyframes fadeIn { to { opacity: 1; } } @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>

            {/* H1 */}
            <h1 className="hero-h1" style={{
              fontFamily: "var(--display)", fontSize: 72, fontWeight: 400,
              color: "#fff", lineHeight: 0.95, letterSpacing: "0.02em",
              textTransform: "uppercase", marginBottom: 20,
            }}>
              {"Guyana's Internet, Finally Done Right.".split(" ").map((w, i) => (
                <span key={i} className="hw" style={{ marginRight: "0.18em" }}>
                  {w === "Finally" || w === "Right." ? <span style={{ color: "var(--red)" }}>{w}</span> : w}
                  {" "}
                </span>
              ))}
            </h1>

            {/* Subhead */}
            <p style={{
              fontFamily: "var(--body)", fontSize: "1.05rem", color: "var(--t2)",
              lineHeight: 1.7, maxWidth: 480, marginBottom: 32,
              opacity: 0, animation: "fadeIn 0.7s 0.8s var(--eout) forwards",
            }}>
              Reliable, fast wireless internet for homes and businesses across East Coast Demerara, Region 1, and Port Kaituma — installed in 48 hours.
            </p>

            {/* CTAs */}
            <div className="hero-ctas" style={{
              display: "flex", gap: 12, marginBottom: 40, flexWrap: "wrap",
              opacity: 0, animation: "fadeIn 0.6s 1s var(--eout) forwards",
            }}>
              <Link href="/coverage" className="cta-chamfer">Check My Coverage →</Link>
              <Link href="/plans" className="cta-ghost">See Plans</Link>
            </div>

            {/* Trust bar */}
            <div style={{
              display: "flex", gap: 20, flexWrap: "wrap",
              fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--t3)",
              letterSpacing: "0.06em", textTransform: "uppercase",
              opacity: 0, animation: "fadeIn 0.6s 1.2s var(--eout) forwards",
            }}>
              {["Free Installation", "No Hidden Fees", "WhatsApp Support", "48h Install"].map((t) => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 4, height: 4, background: "var(--red)", borderRadius: "50%" }} />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right side: atmospheric grid (desktop only) */}
          <div style={{ position: "relative", height: 500, display: "flex", alignItems: "center", justifyContent: "center" }} className="md-show">
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
            }} />
            <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
              <div className="scanline" style={{ animationDelay: "1.5s" }} />
            </div>
            {/* Signal tower icon */}
            <svg width="120" height="200" viewBox="0 0 120 200" fill="none" style={{ opacity: 0.08 }}>
              <line x1="60" y1="10" x2="40" y2="190" stroke="white" strokeWidth="2" />
              <line x1="60" y1="10" x2="80" y2="190" stroke="white" strokeWidth="2" />
              <line x1="40" y1="190" x2="80" y2="190" stroke="white" strokeWidth="3" />
              <circle cx="60" cy="10" r="5" fill="var(--red)" />
              <path d="M40 40 Q60 25 80 40" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
              <path d="M30 55 Q60 35 90 55" stroke="white" strokeWidth="1.5" fill="none" opacity="0.3" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FEATURES ──────────────────────────────────── */
function Features() {
  return (
    <section id="features" style={{ padding: "96px 0", background: "var(--bg2)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="bold-container">
        <ScrollReveal>
          <p style={{ fontFamily: "var(--mono)", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--red)", marginBottom: 12 }}>
            Why Evolve
          </p>
          <h2 style={{ fontFamily: "var(--display)", fontSize: "clamp(2rem, 4vw, 3.2rem)", color: "#fff", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 48 }}>
            Why Thousands of Guyanese<br />Families Choose Evolve
          </h2>
        </ScrollReveal>

        <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            {
              icon: "📡", title: "Speeds That Never Lie.",
              body: "We don't advertise speeds we can't deliver. Our network runs on enterprise Ubiquiti infrastructure with real-time monitoring. What you pay for is what you get — peak hour or not.",
              link: { label: "See our plans →", href: "/plans" },
            },
            {
              icon: "🤝", title: "Support That Speaks Your Language.",
              body: "When something goes wrong, you reach a real Guyanese technician — not an overseas call centre, not a bot. We know your community because we live in it.",
              link: { label: "Contact support →", href: "/contact" },
            },
            {
              icon: "💰", title: "Your Bill. No Surprises.",
              body: "No contracts, no activation fees, no hidden charges. You pay month to month and you can cancel any time. We earn your business every single month.",
              link: { label: "View pricing →", href: "/plans" },
            },
          ].map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 100}>
              <div className="bold-card" style={{ padding: 32, height: "100%" }}>
                <div style={{ fontSize: "2rem", marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontFamily: "var(--display)", fontSize: "1.6rem", color: "#fff", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 12 }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: "0.92rem", color: "var(--t2)", lineHeight: 1.7, marginBottom: 16 }}>{f.body}</p>
                <Link href={f.link.href} style={{ fontFamily: "var(--mono)", fontSize: "0.78rem", color: "var(--red)", textDecoration: "none", letterSpacing: "0.04em" }}>
                  {f.link.label}
                </Link>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── STATS ─────────────────────────────────────── */
function Stats() {
  return (
    <section style={{ padding: "96px 0", background: "var(--bg)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="bold-container">
        <ScrollReveal>
          <p style={{ fontFamily: "var(--mono)", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--red)", marginBottom: 12, textAlign: "center" }}>
            Proof
          </p>
          <h2 style={{ fontFamily: "var(--display)", fontSize: "clamp(2rem, 4vw, 3rem)", color: "#fff", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 56, textAlign: "center" }}>
            Numbers That Prove the Promise
          </h2>
        </ScrollReveal>

        <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
          {[
            { target: 4200, suffix: "+", label: "Homes Connected" },
            { target: 99.8, suffix: "%", label: "Network Uptime", decimals: 1 },
            { target: 4, suffix: "min", label: "Avg Support Response" },
          ].map((s, i) => (
            <ScrollReveal key={s.label} delay={i * 120}>
              <div style={{
                textAlign: "center", padding: "40px 24px",
                borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}>
                <StatCounter target={s.target} suffix={s.suffix} decimals={s.decimals} />
                <div style={{ fontFamily: "var(--mono)", fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--t3)", marginTop: 8 }}>
                  {s.label}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TESTIMONIALS ──────────────────────────────── */
function Testimonials() {
  const testimonials = [
    { name: "Kwame T.", location: "Buxton, ECD", plan: "Family Plan", quote: "Finally a company that treats you like a person. When I call, they know who I am and they actually solve the problem. Best internet we've had." },
    { name: "Priya S.", location: "Port Kaituma", plan: "R1 Standard", quote: "We never thought we'd get reliable internet out here. Evolve came, set everything up, and it just works. My kids can do their schoolwork now." },
    { name: "Marcus D.", location: "Vigilance, ECD", plan: "Power Plan", quote: "I run my business from home and can't afford downtime. Six months with Evolve and not a single dropped connection during work hours. Solid." },
  ];

  return (
    <section style={{ padding: "96px 0", background: "var(--bg2)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="bold-container">
        <ScrollReveal>
          <p style={{ fontFamily: "var(--mono)", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--red)", marginBottom: 12 }}>
            Testimonials
          </p>
          <h2 style={{ fontFamily: "var(--display)", fontSize: "clamp(2rem, 4vw, 3rem)", color: "#fff", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 48 }}>
            Don&apos;t Take Our Word for It
          </h2>
        </ScrollReveal>

        <div className="test-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 100}>
              <div className="bold-card" style={{ padding: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%", background: "var(--bg4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--display)", fontSize: "1.1rem", color: "var(--t2)",
                  }}>
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--body)", fontWeight: 700, fontSize: "0.92rem", color: "#fff" }}>{t.name}</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "0.68rem", color: "var(--t3)" }}>{t.location} · {t.plan}</div>
                  </div>
                </div>
                <div className="star" style={{ marginBottom: 12, fontSize: "0.85rem", letterSpacing: 2 }}>★★★★★</div>
                <p style={{ fontSize: "0.92rem", color: "var(--t2)", lineHeight: 1.7, fontStyle: "italic" }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA BANNER ────────────────────────────────── */
function CTABanner() {
  return (
    <section style={{ padding: "80px 0", background: "var(--bg)", borderTop: "1px solid rgba(255,255,255,0.06)", position: "relative" }}>
      <div style={{ position: "absolute", left: 48, top: 0, bottom: 0, width: 3, background: "var(--red)" }} />
      <div className="bold-container">
        <ScrollReveal>
          <h2 style={{ fontFamily: "var(--display)", fontSize: "clamp(2.4rem, 5vw, 4rem)", color: "#fff", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 16 }}>
            Ready to Get Connected?
          </h2>
          <p style={{ fontSize: "1.05rem", color: "var(--t2)", lineHeight: 1.7, maxWidth: 500, marginBottom: 32 }}>
            Check if we cover your area, pick a plan, and be online within 48 hours. No contracts, no surprises.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
            <Link href="/coverage" className="cta-chamfer">Check My Coverage →</Link>
            <Link href="/plans" className="cta-ghost">See Plans</Link>
          </div>
          <div style={{
            display: "flex", gap: 20, flexWrap: "wrap",
            fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--t3)",
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            {["Free Installation", "No Hidden Fees", "WhatsApp Support", "48h Install"].map((t) => (
              <span key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 4, height: 4, background: "var(--red)", borderRadius: "50%" }} />
                {t}
              </span>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ─── FOOTER ────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background: "var(--bg2)", paddingTop: 0 }}>
      {/* Red gradient top line */}
      <div style={{ height: 2, background: "linear-gradient(90deg, var(--red), transparent 80%)" }} />

      <div className="bold-container" style={{ padding: "56px 48px 24px" }}>
        <div className="foot-grid" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 40, marginBottom: 40 }}>
          {/* Brand */}
          <div>
            <div style={{ fontFamily: "var(--display)", fontSize: "1.8rem", color: "#fff", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 8 }}>
              Evolve Wireless
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--t3)", lineHeight: 1.6, marginBottom: 16, maxWidth: 260 }}>
              Connecting Guyana, one community at a time.
            </p>
            <div style={{ fontFamily: "var(--mono)", fontSize: "0.75rem", color: "var(--t3)", lineHeight: 2 }}>
              📱 +592 609-2487<br />
              💬 WhatsApp 24/7<br />
              ✉️ support@evolvewireless.gy
            </div>
          </div>

          {/* Services */}
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 16 }}>Services</div>
            <div className="nav-ul" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["Home Internet", "Business Plans", "Starlink Install", "Remote Areas", "Managed WiFi"].map((l) => (
                <Link key={l} href="/plans" style={{ fontSize: "0.88rem", color: "var(--t2)", textDecoration: "none" }}>{l}</Link>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 16 }}>Support</div>
            <div className="nav-ul" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["Check Coverage", "Report Issue", "Billing Help", "FAQ", "My Account"].map((l) => (
                <Link key={l} href={l === "Check Coverage" ? "/coverage" : l === "My Account" ? "/login" : "/contact"} style={{ fontSize: "0.88rem", color: "var(--t2)", textDecoration: "none" }}>{l}</Link>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 16 }}>Company</div>
            <div className="nav-ul" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["About Us", "Coverage Areas", "Careers", "Privacy Policy", "Terms of Service"].map((l) => (
                <Link key={l} href="/" style={{ fontSize: "0.88rem", color: "var(--t2)", textDecoration: "none" }}>{l}</Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20,
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: "0.68rem", color: "var(--t4)" }}>
            © {new Date().getFullYear()} Evolve Wireless Internet. All rights reserved. Registered in Guyana.
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {["GUYANESE OWNED", "NO CONTRACTS", "LOCAL SUPPORT"].map((b) => (
              <span key={b} style={{
                fontFamily: "var(--mono)", fontSize: "0.6rem", letterSpacing: "0.08em",
                padding: "3px 8px", border: "1px solid var(--t4)", color: "var(--t3)",
              }}>{b}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── MOBILE STICKY BAR ─────────────────────────── */
function MobileStickyBar() {
  return (
    <div className="mobile-sticky">
      <Link href="/coverage" className="cta-chamfer" style={{ width: "100%", justifyContent: "center", padding: "14px 24px" }}>
        Check My Coverage →
      </Link>
    </div>
  );
}

/* ─── SCROLL REVEAL WRAPPER ─────────────────────── */
function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setTimeout(() => el.classList.add("on"), delay);
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return <div ref={ref} className="sr">{children}</div>;
}

/* ─── STAT COUNTER ──────────────────────────────── */
function StatCounter({ target, suffix = "", decimals = 0 }: { target: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          setStarted(true);
          const start = performance.now();
          const dur = 1200;
          function frame(now: number) {
            const p = Math.min((now - start) / dur, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            const v = ease * target;
            el!.textContent = (decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString()) + suffix;
            if (p < 1) requestAnimationFrame(frame);
          }
          requestAnimationFrame(frame);
          obs.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, suffix, decimals, started]);

  return (
    <div ref={ref} style={{
      fontFamily: "var(--display)", fontSize: "clamp(2.4rem, 5vw, 4rem)",
      color: "#fff", lineHeight: 1, fontVariantNumeric: "tabular-nums",
    }}>
      0{suffix}
    </div>
  );
}
