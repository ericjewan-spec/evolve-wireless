"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { formatGYDMonthly, formatUSD } from "@/lib/utils";
import type { InternetPlan } from "@/lib/types";

export default function PlansSection() {
  const [plans, setPlans] = useState<InternetPlan[]>([]);
  const [tab, setTab] = useState<"residential" | "business">("residential");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("internet_plans")
          .select("*, plan_features(*)")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        if (data) setPlans(data);
      } catch { /* silent */ } finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = plans.filter((p) => p.tier === tab);

  return (
    <section id="packages" className="section" style={{ background: "var(--navy)" }}>
      <div className="container">
        <div className="section-label">Internet Plans</div>
        <h2 className="section-title reveal">Packages for <span>Every Need</span></h2>
        <p className="section-sub reveal reveal-delay-1">Simple, transparent pricing with no hidden fees. All plans include free installation and local support.</p>

        <div className="flex gap-2 mt-9 mb-10 rounded-full p-1 w-fit reveal reveal-delay-2" style={{ background: "var(--card)", border: "1px solid var(--divider)" }}>
          {(["residential", "business"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className="px-6 py-2 rounded-full text-sm font-medium transition-all cursor-pointer border-none" style={{
              background: tab === t ? "var(--blue)" : "transparent",
              color: tab === t ? "#fff" : "var(--text2)",
              boxShadow: tab === t ? "0 0 16px rgba(0,87,255,0.3)" : "none"
            }}>
              {t === "residential" ? "Home Plans" : "Business Plans"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1,2,3,4].map((i) => (
              <div key={i} className="rounded-2xl p-7 animate-pulse" style={{ background: "var(--card)", border: "1px solid var(--divider)", height: 360 }} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: filtered.length <= 3 ? `repeat(${filtered.length}, 1fr)` : "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {filtered.map((plan) => (
              <div key={plan.id} className="relative flex flex-col rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1" style={{
                background: plan.is_featured ? "linear-gradient(160deg, rgba(0,87,255,0.08), var(--card))" : "var(--card)",
                border: plan.is_featured ? "1px solid var(--blue)" : "1px solid var(--divider)",
                boxShadow: plan.is_featured ? "0 0 40px rgba(0,87,255,0.15)" : "none"
              }}>
                {plan.badge_text && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[var(--blue)] text-white text-[0.65rem] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full whitespace-nowrap">{plan.badge_text}</div>
                )}
                <div className="font-['Syne'] text-xs font-bold uppercase tracking-[0.15em] text-[var(--text2)] mb-3">{plan.name}</div>
                <div className="font-['Syne'] text-4xl font-extrabold leading-none mb-1">
                  {plan.speed_down_mbps} <span className="text-base font-normal text-[var(--text2)]">Mbps</span>
                </div>
                <div className="font-['Syne'] text-xl font-bold text-[var(--cyan)] my-3">
                  {formatGYDMonthly(plan.price_gyd)}
                  {plan.price_usd && <span className="text-xs font-normal text-[var(--text3)] ml-2">{formatUSD(plan.price_usd)}</span>}
                </div>
                <div className="h-px bg-[var(--divider)] my-4" />
                <ul className="flex flex-col gap-2 flex-1 list-none">
                  {plan.plan_features?.sort((a, b) => a.sort_order - b.sort_order).map((f) => (
                    <li key={f.id} className="flex items-start gap-2 text-sm text-[var(--text2)]">
                      <span className="text-xs font-bold mt-0.5 shrink-0" style={{
                        color: f.quality === "excellent" ? "var(--green)" : f.quality === "good" ? "var(--cyan)" : "var(--text3)"
                      }}>{f.quality === "limited" ? "—" : "✓"}</span>
                      {f.label}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 w-full text-center">
                  <Link href="/contact" className={plan.is_featured ? "btn btn-primary" : "btn btn-outline"} style={{ width: "100%", justifyContent: "center", fontSize: "0.85rem", padding: "10px" }}>
                    Get Started
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-center text-[var(--text3)] text-sm mt-6">* All prices in GYD. Installation fee may apply. Contact us for current rates.</p>
      </div>
    </section>
  );
}
