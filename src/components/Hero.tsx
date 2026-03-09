import Link from "next/link";

export default function Hero() {
  // Split title into words for stagger animation (motion spec: 55ms per word, 600ms ease-out)
  const titleWords = ["Guyana's", "Internet."];
  const highlightWords = ["Finally", "Done"];
  const trailWords = ["Right."];

  return (
    <section id="home" className="min-h-screen flex items-center relative overflow-hidden" style={{ paddingTop: 72, background: "var(--cream)" }}>
      {/* Warm abstract background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            width: 600, height: 600, top: "-10%", right: "-5%",
            background: "radial-gradient(circle, var(--terracotta-light), transparent 70%)",
            filter: "blur(80px)", opacity: 0.35,
            animation: "float1 18s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 500, height: 500, bottom: "-15%", left: "-8%",
            background: "radial-gradient(circle, var(--teal-light), transparent 70%)",
            filter: "blur(80px)", opacity: 0.3,
            animation: "float2 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 350, height: 350, top: "30%", left: "40%",
            background: "radial-gradient(circle, var(--gold-soft), transparent 70%)",
            filter: "blur(80px)", opacity: 0.3,
            animation: "float3 15s ease-in-out infinite",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(212, 101, 74, 0.08) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="container relative z-10 text-center mx-auto" style={{ maxWidth: 800 }}>
        {/* Badge — fadeUp at 0ms */}
        <div
          className="inline-flex items-center gap-2 mb-6"
          style={{
            background: "white",
            border: "1px solid rgba(212, 101, 74, 0.15)",
            padding: "0.5rem 1.25rem",
            borderRadius: 9999,
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--terracotta)",
            boxShadow: "0 2px 20px rgba(44, 24, 16, 0.06)",
            animation: "fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          🇬🇾 &nbsp;Proudly Serving Guyana
        </div>

        {/* Title with word-by-word stagger (motion spec: 55ms stagger, 600ms ease-out) */}
        <h1
          style={{
            fontSize: "clamp(2.4rem, 5.5vw, 4.2rem)",
            fontWeight: 800,
            marginBottom: "1.25rem",
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
          }}
        >
          {titleWords.map((w, i) => (
            <span key={w} className="hero-word" style={{ marginRight: "0.2em" }}>{w} </span>
          ))}
          <br />
          {highlightWords.map((w, i) => (
            <span
              key={w}
              className="hero-word"
              style={{
                marginRight: "0.2em",
                background: "linear-gradient(135deg, var(--terracotta), var(--teal))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {w}{" "}
            </span>
          ))}
          <br />
          {trailWords.map((w, i) => (
            <span key={w + i} className="hero-word" style={{ marginRight: "0.2em" }}>{w} </span>
          ))}
        </h1>

        {/* Subtitle — delayed fade */}
        <p
          style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            color: "var(--text3)",
            maxWidth: 600,
            margin: "0 auto 2rem",
            lineHeight: 1.8,
            animation: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.4s both",
          }}
        >
          Fast, reliable wireless internet for homes and businesses across East Coast Demerara,
          Region 1, Port Kaituma, Mabaruma, Matthews Ridge and Baramita — installed in 48 hours.
        </p>

        {/* CTAs — spring entrance with 60ms stagger (from motion spec) */}
        <div className="flex gap-3 justify-center flex-wrap mb-12">
          {[
            { href: "/plans", cls: "btn btn-primary", label: "Check Your Coverage — It's Free", delay: 0.48 },
            { href: "/plans", cls: "btn btn-ghost", label: "See Our Plans", delay: 0.54 },
            { href: "https://wa.me/5926092487", cls: "btn btn-outline", label: "💬 WhatsApp Us", delay: 0.60 },
          ].map((cta) => (
            <Link
              key={cta.label}
              href={cta.href}
              className={cta.cls}
              style={{
                opacity: 0,
                animation: `fadeUp 0.45s cubic-bezier(0.34,1.56,0.64,1) ${cta.delay}s both`,
              }}
            >
              {cta.label}
            </Link>
          ))}
        </div>

        {/* Stats with animated counters (motion spec: easeOutCubic, 1200ms) */}
        <div
          className="flex gap-10 justify-center flex-wrap"
          style={{ animation: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.65s both" }}
        >
          {[
            { target: 99, suffix: "%", label: "Uptime Target", decimals: 0 },
            { target: 24, suffix: "hr", label: "Fast Install", decimals: 0 },
            { target: 3, suffix: "+", label: "Regions Covered", decimals: 0 },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div
                className="stat-counter"
                data-count-to={s.target}
                data-count-suffix={s.suffix}
                data-count-decimals={s.decimals}
                style={{
                  fontSize: "2.2rem",
                  fontWeight: 800,
                  color: "var(--terracotta)",
                  lineHeight: 1,
                }}
              >
                0{s.suffix}
              </div>
              <div style={{
                fontSize: "0.8rem",
                color: "var(--text3)",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
