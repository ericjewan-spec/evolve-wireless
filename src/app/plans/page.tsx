"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFAB from "@/components/WhatsAppFAB";
import { createClient } from "@/lib/supabase-browser";
import { formatGYDMonthly, formatUSD } from "@/lib/utils";
import type { InternetPlan } from "@/lib/types";

export default function PlansPage() {
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
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = plans.filter((p) => p.tier === tab);

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 72 }}>
        <section className="section" style={{ background: "var(--navy)" }}>
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="section-label justify-center">Internet Packages</div>
              <h1
                className="font-['Syne'] font-extrabold mt-4"
                style={{ fontSize: "var(--fs-display)", lineHeight: 1.1 }}
              >
                Simple, Transparent <span style={{ color: "var(--cyan)" }}>Pricing</span>
              </h1>
              <p className="section-sub mx-auto text-center mt-4">
                No hidden fees. No contracts required on most plans. Just fast,
                reliable internet for your home or business.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-10">
              <div
                className="flex gap-2 rounded-full p-1"
                style={{ background: "var(--card)", border: "1px solid var(--divider)" }}
              >
                {(["residential", "business"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="px-7 py-2.5 rounded-full text-sm font-medium transition-all cursor-pointer border-none"
                    style={{
                      background: tab === t ? "var(--blue)" : "transparent",
                      color: tab === t ? "#fff" : "var(--text2)",
                      boxShadow: tab === t ? "0 0 16px rgba(0,87,255,0.3)" : "none",
                    }}
                  >
                    {t === "residential" ? "Home Plans" : "Business Plans"}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-7 animate-pulse"
                    style={{ background: "var(--card)", border: "1px solid var(--divider)", height: 400 }}
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-[var(--text2)]">
                <p className="text-lg mb-3">No {tab} plans available yet.</p>
                <p className="text-sm">Contact us for custom business solutions.</p>
              </div>
            ) : (
              <div
                className="grid gap-5"
                style={{
                  gridTemplateColumns:
                    filtered.length <= 4
                      ? `repeat(${filtered.length}, 1fr)`
                      : "repeat(auto-fit, minmax(260px, 1fr))",
                }}
              >
                {filtered.map((plan) => (
                  <div
                    key={plan.id}
                    className="relative flex flex-col rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1"
                    style={{
                      background: plan.is_featured
                        ? "linear-gradient(160deg, rgba(0,87,255,0.1), var(--card))"
                        : "var(--card)",
                      border: plan.is_featured
                        ? "1.5px solid var(--blue)"
                        : "1px solid var(--divider)",
                      boxShadow: plan.is_featured ? "0 0 48px rgba(0,87,255,0.15)" : "none",
                    }}
                  >
                    {plan.badge_text && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[var(--blue)] text-white text-[0.65rem] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full whitespace-nowrap">
                        {plan.badge_text}
                      </div>
                    )}

                    <div className="font-['Syne'] text-xs font-bold uppercase tracking-[0.15em] text-[var(--text2)] mb-3">
                      {plan.name}
                    </div>

                    <div className="font-['Syne'] text-5xl font-extrabold leading-none mb-1">
                      {plan.speed_down_mbps}
                      <span className="text-lg font-normal text-[var(--text2)] ml-1">Mbps</span>
                    </div>

                    <div className="font-['Syne'] text-2xl font-bold text-[var(--cyan)] my-4">
                      {formatGYDMonthly(plan.price_gyd)}
                      {plan.price_usd && (
                        <span className="text-xs font-normal text-[var(--text3)] ml-2">
                          {formatUSD(plan.price_usd)}
                        </span>
                      )}
                    </div>

                    {plan.setup_fee_gyd > 0 && (
                      <p className="text-xs text-[var(--text3)] mb-3">
                        Setup fee: GYD {plan.setup_fee_gyd.toLocaleString()}
                      </p>
                    )}

                    <div className="h-px bg-[var(--divider)] my-4" />

                    <ul className="flex flex-col gap-2.5 flex-1 list-none mb-6">
                      {plan.plan_features
                        ?.sort((a, b) => a.sort_order - b.sort_order)
                        .map((f) => (
                          <li key={f.id} className="flex items-start gap-2 text-sm text-[var(--text2)]">
                            <span
                              className="text-xs font-bold mt-0.5 shrink-0"
                              style={{
                                color:
                                  f.quality === "excellent"
                                    ? "var(--green)"
                                    : f.quality === "good"
                                      ? "var(--cyan)"
                                      : "var(--text3)",
                              }}
                            >
                              {f.quality === "limited" ? "—" : "✓"}
                            </span>
                            {f.label}
                          </li>
                        ))}
                    </ul>

                    {plan.data_cap_gb && (
                      <p className="text-xs text-[var(--text3)] mb-4">
                        Data cap: {plan.data_cap_gb} GB/month
                      </p>
                    )}

                    <Link
                      href="/contact"
                      className={plan.is_featured ? "btn btn-primary" : "btn btn-outline"}
                      style={{ width: "100%", justifyContent: "center", fontSize: "0.9rem", padding: "12px" }}
                    >
                      Get Started
                    </Link>
                  </div>
                ))}
              </div>
            )}

            <p className="text-center text-[var(--text3)] text-sm mt-8">
              * All prices in GYD. Installation fee may apply depending on location.
              Contact us for current rates and availability in your area.
            </p>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFAB />
    </>
  );
}
