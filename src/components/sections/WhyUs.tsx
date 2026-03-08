const REASONS = [
  { title: "Reliable Uptime", desc: "Our network is engineered for maximum availability with redundant links and proactive monitoring. We target 99%+ uptime." },
  { title: "Dedicated Field Technicians", desc: "Our certified technicians handle every installation with care and precision. We do the job right the first time." },
  { title: "Fast Installation", desc: "Most residential installations are completed within 24–48 hours of approval. You won't wait weeks." },
  { title: "Local Support Team", desc: "We're Guyanese, and we understand Guyana. Our support team is reachable by phone, WhatsApp, and email — no overseas call centres." },
  { title: "Growing Network", desc: "We're actively investing in new towers and infrastructure, expanding coverage to more communities every season." },
  { title: "Affordable Packages", desc: "Quality internet shouldn't break the bank. Flexible packages for every budget with fair, transparent pricing." },
];

export function WhyUs() {
  return (
    <section id="why" className="section-ew bg-slate">
      <div className="container-ew">
        <div className="section-label">Why Choose Evolve</div>
        <h2 className="section-title reveal">
          The Evolve <span className="text-cyan">Difference</span>
        </h2>
        <p className="section-sub reveal reveal-delay-1">
          We built Evolve around the values that matter most: reliability, speed,
          and real human support.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-14">
          {REASONS.map((r, i) => (
            <div
              key={r.title}
              className={`reveal ${i % 3 !== 0 ? `reveal-delay-${(i % 3)}` : ""} bg-card border border-divider rounded-[20px] p-7 flex gap-4 items-start hover:border-cyan/20 hover:-translate-y-0.5 transition-all`}
            >
              <span className="font-[family-name:var(--font-display)] text-[1.6rem] font-extrabold text-cyan/15 leading-none shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h4 className="font-[family-name:var(--font-display)] text-base font-bold mb-2">{r.title}</h4>
                <p className="text-[0.85rem] text-text2 leading-[1.7]">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
