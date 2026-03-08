import Link from "next/link";

export default function Hero() {
  return (
    <section id="home" className="min-h-screen flex items-center relative overflow-hidden" style={{ paddingTop: 72 }}>
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 80% 60% at 60% 40%, rgba(0,87,255,0.18) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 20% 80%, rgba(0,212,255,0.08) 0%, transparent 60%), var(--navy)"
      }} />
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        animation: "gridPan 20s linear infinite"
      }} />
      <div className="absolute right-[8%] top-1/2 -translate-y-1/2 w-[520px] h-[520px] pointer-events-none hidden lg:block">
        {[160, 260, 360, 460].map((size, i) => (
          <div key={i} className="absolute rounded-full top-1/2 left-1/2" style={{
            width: size, height: size,
            border: `1px solid rgba(0,212,255,${i === 3 ? 0.1 : 0.15})`,
            transform: "translate(-50%,-50%) scale(0)",
            animation: `ringPulse 4s ease-out infinite ${i * 0.8}s`
          }} />
        ))}
      </div>

      <div className="container relative z-[2] py-16">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-7" style={{
            background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "var(--cyan)",
            animation: "fadeUp 0.8s ease both"
          }}>
            <span className="w-2 h-2 rounded-full" style={{ background: "var(--cyan)", animation: "blink 1.5s ease infinite" }} />
            Now Expanding — Region 1 &amp; Port Kaituma
          </div>

          <h1 className="font-['Syne'] font-extrabold mb-5" style={{
            fontSize: "clamp(2.2rem, 5vw, 4rem)", lineHeight: 1.08, letterSpacing: "-0.025em",
            animation: "fadeUp 0.8s 0.1s ease both"
          }}>
            Connecting<br />
            <span style={{ color: "var(--cyan)" }}>Guyana,</span><br />
            One Community<br />
            at a Time
          </h1>

          <p className="text-base font-light max-w-md mb-9" style={{
            color: "var(--text2)", lineHeight: 1.7, animation: "fadeUp 0.8s 0.2s ease both"
          }}>
            Fast, reliable wireless internet for homes, businesses, and remote communities across East Coast Demerara and beyond.
          </p>

          <div className="flex gap-3 flex-wrap" style={{ animation: "fadeUp 0.8s 0.3s ease both" }}>
            <Link href="/plans" className="btn btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1.5 8.5a18.5 18.5 0 0 1 21 0M5 12a13 13 0 0 1 14 0M8.5 15.5a7.5 7.5 0 0 1 7 0M12 19h.01" />
              </svg>
              Sign Up Today
            </Link>
            <Link href="/coverage" className="btn btn-outline">Coverage Areas</Link>
            <Link href="/contact" className="btn btn-outline">Contact Us</Link>
          </div>

          <div className="flex gap-10 mt-16 flex-wrap" style={{ animation: "fadeUp 0.8s 0.4s ease both" }}>
            {[
              { num: "99", unit: "%", label: "Uptime Target" },
              { num: "3", unit: "+", label: "Coverage Regions" },
              { num: "24", unit: "h", label: "Support Available" },
              { num: "48", unit: "h", label: "Fast Installation" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-['Syne'] text-3xl font-extrabold leading-none">
                  {s.num}<span style={{ color: "var(--cyan)" }}>{s.unit}</span>
                </div>
                <div className="text-xs mt-1 uppercase tracking-widest" style={{ color: "var(--text3)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
