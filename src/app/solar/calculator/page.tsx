"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const COST_PER_WATT_GYD = 550; // GYD per watt installed (panels + inverter + installation)
const BATTERY_COST_PER_KWH_GYD = 180000; // GYD per kWh of battery storage
const GPL_RATE_PER_KWH_GYD = 65; // average GPL electricity rate per kWh
const SUN_HOURS_PER_DAY = 5; // average peak sun hours in Guyana
const DAYS_PER_MONTH = 30;

const presets = [
  { label: "Small Home", icon: "🏠", watts: 2000, description: "Lights, fans, fridge, TV, phone charging" },
  { label: "Medium Home", icon: "🏡", watts: 4000, description: "Above + AC unit, washer, microwave" },
  { label: "Large Home", icon: "🏘️", watts: 7000, description: "Multiple ACs, full appliances, water heater" },
  { label: "Small Business", icon: "🏪", watts: 10000, description: "Office, computers, lighting, AC, equipment" },
];

const commonAppliances = [
  { name: "LED Lights (5 bulbs)", watts: 50 },
  { name: "Ceiling Fan", watts: 75 },
  { name: "Refrigerator", watts: 150 },
  { name: "Television", watts: 100 },
  { name: "Phone Charger (2)", watts: 20 },
  { name: "Laptop", watts: 65 },
  { name: "Washing Machine", watts: 500 },
  { name: "Microwave", watts: 1000 },
  { name: "Air Conditioner (1 ton)", watts: 1500 },
  { name: "Water Pump", watts: 750 },
  { name: "Water Heater", watts: 2000 },
  { name: "Iron", watts: 1000 },
];

export default function SolarCalculatorPage() {
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [totalWatts, setTotalWatts] = useState(4000);
  const [selectedAppliances, setSelectedAppliances] = useState<Set<number>>(new Set());
  const [wantBattery, setWantBattery] = useState(false);
  const [batteryHours, setBatteryHours] = useState(4);

  const customWatts = useMemo(() => {
    let w = 0;
    selectedAppliances.forEach((i) => { w += commonAppliances[i].watts; });
    return w;
  }, [selectedAppliances]);

  const watts = mode === "custom" ? customWatts : totalWatts;
  const systemKw = watts / 1000;
  const panelCount = Math.ceil(watts / 550); // ~550W per panel
  const dailyKwh = (watts * SUN_HOURS_PER_DAY) / 1000;
  const monthlyKwh = dailyKwh * DAYS_PER_MONTH;
  const systemCost = watts * COST_PER_WATT_GYD;
  const batteryCost = wantBattery ? (watts / 1000) * batteryHours * BATTERY_COST_PER_KWH_GYD : 0;
  const totalCost = systemCost + batteryCost;
  const monthlySavings = monthlyKwh * GPL_RATE_PER_KWH_GYD;
  const paybackMonths = monthlySavings > 0 ? Math.ceil(totalCost / monthlySavings) : 0;
  const paybackYears = (paybackMonths / 12).toFixed(1);

  const toggleAppliance = (i: number) => {
    setSelectedAppliances((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const fmt = (n: number) => n.toLocaleString();

  return (
    <div style={{ paddingTop: "var(--nav-height)" }}>
      {/* Header */}
      <section style={{ background: "linear-gradient(135deg, #FFFBF0 0%, #FDF8F3 50%, #FFF9F0 100%)", padding: "clamp(40px, 7vw, 72px) 0 clamp(24px, 4vw, 40px)" }}>
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)", textAlign: "center" }}>
          <span className="section-label" style={{ color: "var(--gold)", background: "rgba(233, 180, 76, 0.12)", padding: "6px 16px", borderRadius: "100px", display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            ☀️ Solar Calculator
          </span>
          <h1 style={{ fontSize: "var(--fs-display)", fontWeight: 800, color: "var(--text)", marginBottom: "12px" }}>
            Estimate Your <span style={{ color: "var(--gold)" }}>Solar Cost</span>
          </h1>
          <p style={{ color: "var(--text3)", fontSize: "var(--fs-body)", maxWidth: "480px", margin: "0 auto" }}>
            Get a quick estimate of what a solar setup would cost for your home or business. All prices in GYD.
          </p>
        </div>
      </section>

      <section className="section" style={{ background: "var(--cream)", paddingTop: "clamp(24px, 4vw, 40px)" }}>
        <div className="container" style={{ maxWidth: "720px", margin: "0 auto", padding: "0 var(--gutter)" }}>

          {/* Mode Toggle */}
          <div style={{ display: "flex", gap: "4px", background: "var(--card)", border: "1px solid var(--divider)", borderRadius: "var(--r-sm)", padding: "4px", marginBottom: "28px" }}>
            {[
              { key: "preset", label: "Quick Estimate" },
              { key: "custom", label: "Pick Appliances" },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key as "preset" | "custom")}
                style={{
                  flex: 1, padding: "12px", border: "none", borderRadius: "var(--r-sm)", cursor: "pointer",
                  fontWeight: 700, fontSize: "0.92rem", fontFamily: "inherit", transition: "all 0.2s",
                  background: mode === m.key ? "var(--gold)" : "transparent",
                  color: mode === m.key ? "#fff" : "var(--text3)",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Preset Mode */}
          {mode === "preset" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))", gap: "12px", marginBottom: "28px" }}>
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setTotalWatts(p.watts)}
                  style={{
                    padding: "20px 16px", borderRadius: "var(--r-sm)", border: `2px solid ${totalWatts === p.watts ? "var(--gold)" : "var(--divider)"}`,
                    background: totalWatts === p.watts ? "rgba(233, 180, 76, 0.06)" : "var(--card)",
                    cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>{p.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text)", marginBottom: "4px" }}>{p.label}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text3)", lineHeight: 1.4 }}>{p.description}</div>
                  <div style={{ marginTop: "8px", fontWeight: 800, color: "var(--gold)", fontSize: "0.88rem" }}>{(p.watts / 1000).toFixed(1)} kW</div>
                </button>
              ))}
            </div>
          )}

          {/* Custom Mode */}
          {mode === "custom" && (
            <div style={{ marginBottom: "28px" }}>
              <p style={{ fontSize: "0.88rem", color: "var(--text3)", marginBottom: "16px" }}>Select the appliances you want to power with solar:</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: "8px" }}>
                {commonAppliances.map((a, i) => (
                  <button
                    key={a.name}
                    onClick={() => toggleAppliance(i)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", borderRadius: "var(--r-sm)",
                      border: `2px solid ${selectedAppliances.has(i) ? "var(--gold)" : "var(--divider)"}`,
                      background: selectedAppliances.has(i) ? "rgba(233, 180, 76, 0.06)" : "var(--card)",
                      cursor: "pointer", transition: "all 0.15s", textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text)" }}>{a.name}</span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: selectedAppliances.has(i) ? "var(--gold)" : "var(--text-muted)", whiteSpace: "nowrap", marginLeft: "8px" }}>
                      {a.watts}W
                    </span>
                  </button>
                ))}
              </div>
              {customWatts > 0 && (
                <div style={{ marginTop: "12px", padding: "12px 16px", borderRadius: "var(--r-sm)", background: "rgba(233, 180, 76, 0.08)", textAlign: "center" }}>
                  <span style={{ fontWeight: 700, color: "var(--gold)" }}>Total: {fmt(customWatts)}W ({(customWatts / 1000).toFixed(1)} kW)</span>
                </div>
              )}
            </div>
          )}

          {/* Battery Option */}
          <div style={{ padding: "20px", borderRadius: "var(--r-sm)", background: "var(--card)", border: "1px solid var(--divider)", marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: wantBattery ? "16px" : "0" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text)" }}>🔋 Battery Backup?</div>
                <div style={{ fontSize: "0.82rem", color: "var(--text3)" }}>Store energy for nighttime or outages</div>
              </div>
              <button
                onClick={() => setWantBattery(!wantBattery)}
                style={{
                  width: "52px", height: "28px", borderRadius: "14px", border: "none", cursor: "pointer",
                  background: wantBattery ? "var(--gold)" : "var(--divider)", transition: "all 0.2s",
                  position: "relative",
                }}
              >
                <span style={{
                  position: "absolute", top: "3px", width: "22px", height: "22px", borderRadius: "50%",
                  background: "#fff", transition: "all 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                  left: wantBattery ? "27px" : "3px",
                }} />
              </button>
            </div>
            {wantBattery && (
              <div>
                <label style={{ fontSize: "0.82rem", color: "var(--text2)", fontWeight: 600, marginBottom: "8px", display: "block" }}>
                  Hours of backup: {batteryHours}h
                </label>
                <input
                  type="range" min={2} max={12} step={1} value={batteryHours}
                  onChange={(e) => setBatteryHours(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--gold)" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  <span>2h</span><span>6h</span><span>12h</span>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {watts > 0 && (
            <div style={{ borderRadius: "var(--r-lg)", overflow: "hidden", border: "1px solid var(--divider)", marginBottom: "28px" }}>
              {/* Header */}
              <div style={{ background: "var(--gold)", padding: "20px 24px", color: "#fff", textAlign: "center" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, opacity: 0.85, marginBottom: "4px" }}>Estimated Total Cost</div>
                <div style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "2.4rem", fontWeight: 800 }}>
                  GYD {fmt(totalCost)}
                </div>
                <div style={{ fontSize: "0.82rem", opacity: 0.8, marginTop: "4px" }}>
                  {systemKw.toFixed(1)} kW system · {panelCount} panels{wantBattery ? ` · ${batteryHours}h battery` : ""}
                </div>
              </div>

              {/* Breakdown */}
              <div style={{ background: "var(--card)", padding: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.88rem", color: "var(--text2)" }}>☀️ Solar panels + inverter + installation</span>
                    <span style={{ fontWeight: 700, color: "var(--text)" }}>GYD {fmt(systemCost)}</span>
                  </div>
                  {wantBattery && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.88rem", color: "var(--text2)" }}>🔋 Battery storage ({batteryHours}h backup)</span>
                      <span style={{ fontWeight: 700, color: "var(--text)" }}>GYD {fmt(batteryCost)}</span>
                    </div>
                  )}

                  <div style={{ height: "1px", background: "var(--divider)", margin: "4px 0" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.88rem", color: "var(--text2)" }}>⚡ Monthly energy production</span>
                    <span style={{ fontWeight: 700, color: "var(--teal)" }}>{fmt(Math.round(monthlyKwh))} kWh</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.88rem", color: "var(--text2)" }}>💰 Estimated monthly GPL savings</span>
                    <span style={{ fontWeight: 700, color: "var(--teal)" }}>GYD {fmt(Math.round(monthlySavings))}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.88rem", color: "var(--text2)" }}>📅 Estimated payback period</span>
                    <span style={{ fontWeight: 700, color: "var(--gold)" }}>{paybackYears} years</span>
                  </div>
                </div>

                {/* CTA */}
                <div style={{ marginTop: "24px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Link
                    href="/solar/quote"
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: "center", background: "var(--gold)", borderColor: "var(--gold)", boxShadow: "0 4px 16px rgba(233, 180, 76, 0.3)" }}
                  >
                    Get Exact Quote →
                  </Link>
                  <a
                    href={`https://wa.me/5926092487?text=${encodeURIComponent(`Hi! I used your solar calculator. I'm interested in a ${systemKw.toFixed(1)}kW system (${panelCount} panels${wantBattery ? `, ${batteryHours}h battery` : ""}). Estimated cost: GYD ${fmt(totalCost)}. Can I get an exact quote?`)}`}
                    target="_blank" rel="noopener"
                    className="btn btn-outline"
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    💬 WhatsApp Us
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6 }}>
            * Estimates are approximate and based on average Guyana conditions (5 peak sun hours/day, GYD {GPL_RATE_PER_KWH_GYD}/kWh GPL rate).
            Actual costs depend on roof type, equipment brand, and site conditions. Contact us for a precise quote.
          </p>
        </div>
      </section>
    </div>
  );
}
