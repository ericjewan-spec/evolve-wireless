import Link from "next/link";

export default function Hero() {
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
        {/* Dot pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(212, 101, 74, 0.08) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="container relative z-10 text-center mx-auto" style={{ maxWidth: 800 }}>
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
            animation: "fadeUp 0.8s ease both",
          }}
        >
          🇬🇾 &nbsp;Proudly Serving Guyana
        </div>

        <h1
          style={{
            fontSize: "clamp(2.4rem, 5.5vw, 4.2rem)",
            fontWeight: 800,
            color: "var(--text)",
            marginBottom: "1.25rem",
            letterSpacing: "-0.03em",
            animation: "fadeUp 0.8s 0.15s ease both",
          }}
        >
          Connecting Guyana,<br />
          <span style={{
            background: "linear-gradient(135deg, var(--terracotta), var(--teal))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>One Community</span><br />
          at a Time
        </h1>

        <p
          style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            color: "var(--text3)",
            maxWidth: 600,
            margin: "0 auto 2rem",
            lineHeight: 1.8,
            animation: "fadeUp 0.8s 0.3s ease both",
          }}
        >
          Fast, reliable wireless internet for homes and businesses across East Coast Demerara,
          Region 1, Port Kaituma and beyond. Built on Ubiquiti, Starlink, and dedicated local expertise.
        </p>

        <div className="flex gap-3 justify-center flex-wrap mb-12" style={{ animation: "fadeUp 0.8s 0.45s ease both" }}>
          <Link href="/plans" className="btn btn-primary">View Packages</Link>
          <Link href="/coverage" className="btn btn-ghost">Check Coverage</Link>
          <Link href="/contact" className="btn btn-outline">Contact Us</Link>
        </div>

        <div className="flex gap-10 justify-center flex-wrap" style={{ animation: "fadeUp 0.8s 0.6s ease both" }}>
          {[
            { num: "99%", label: "Uptime Target" },
            { num: "24hr", label: "Fast Install" },
            { num: "3+", label: "Regions Covered" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div style={{
                fontFamily: "'Bricolage Grotesque', serif",
                fontSize: "2.2rem",
                fontWeight: 800,
                color: "var(--terracotta)",
                lineHeight: 1,
              }}>
                {s.num}
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
