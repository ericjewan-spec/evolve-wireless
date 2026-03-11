"use client";

import { useState } from "react";
import Link from "next/link";

type Status = "operational" | "degraded" | "outage" | "maintenance";

interface TowerStatus {
  name: string;
  location: string;
  status: Status;
  note?: string;
  lastUpdated: string;
}

// This data would ideally come from Supabase or UISP API
// For now it's static — you can update it manually or connect to monitoring later
const towers: TowerStatus[] = [
  { name: "Success Tower", location: "Success, ECD", status: "operational", lastUpdated: "2026-03-11T10:00:00" },
  { name: "Better Hope Tower", location: "Better Hope, ECD", status: "operational", lastUpdated: "2026-03-11T10:00:00" },
  { name: "Cummings Lodge Tower", location: "Cummings Lodge, ECD", status: "operational", lastUpdated: "2026-03-11T10:00:00" },
  { name: "Good Hope Tower", location: "Good Hope, ECD", status: "operational", lastUpdated: "2026-03-11T10:00:00" },
  { name: "Non Pareil Tower", location: "Non Pareil, ECD", status: "operational", lastUpdated: "2026-03-11T10:00:00" },
  { name: "Unity Tower", location: "Unity, ECD", status: "operational", lastUpdated: "2026-03-11T10:00:00" },
  { name: "Mahaica Tower", location: "Mahaica, ECD", status: "operational", lastUpdated: "2026-03-11T10:00:00" },
  { name: "New Amsterdam Tower", location: "New Amsterdam, Berbice", status: "operational", lastUpdated: "2026-03-11T10:00:00" },
  { name: "Port Kaituma Tower", location: "Port Kaituma, Region 1", status: "operational", lastUpdated: "2026-03-11T10:00:00" },
];

const services = [
  { name: "Internet Service", status: "operational" as Status },
  { name: "Customer Portal", status: "operational" as Status },
  { name: "Billing System", status: "operational" as Status },
  { name: "WhatsApp Support", status: "operational" as Status },
];

const statusConfig = {
  operational: { label: "Operational", color: "#2A9D8F", bg: "rgba(42,157,143,0.08)", icon: "✅" },
  degraded: { label: "Degraded", color: "#E9B44C", bg: "rgba(233,180,76,0.08)", icon: "⚠️" },
  outage: { label: "Outage", color: "#E74C3C", bg: "rgba(231,76,60,0.08)", icon: "🔴" },
  maintenance: { label: "Maintenance", color: "#8B6F4E", bg: "rgba(139,111,78,0.08)", icon: "🔧" },
};

const recentIncidents = [
  { date: "Mar 8, 2026", title: "Scheduled Maintenance — Success Tower", desc: "Brief maintenance window for firmware upgrade. No service interruption.", status: "resolved" },
  { date: "Mar 3, 2026", title: "Intermittent Connectivity — Mahaica", desc: "Some customers experienced intermittent connectivity due to weather. Resolved within 2 hours.", status: "resolved" },
];

export default function StatusPage() {
  const allOperational = towers.every(t => t.status === "operational") && services.every(s => s.status === "operational");
  const [filter, setFilter] = useState("all");

  const filteredTowers = filter === "all" ? towers : towers.filter(t => t.status === filter);

  return (
    <div style={{ paddingTop: "var(--nav-height)" }}>
      {/* Overall Status Banner */}
      <section style={{ background: allOperational ? "rgba(42,157,143,0.06)" : "rgba(231,76,60,0.06)", padding: "clamp(32px, 5vw, 56px) 0 24px" }}>
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>{allOperational ? "✅" : "⚠️"}</div>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2" style={{ fontFamily: "'Bricolage Grotesque', serif", color: allOperational ? "var(--teal)" : "#E74C3C" }}>
            {allOperational ? "All Systems Operational" : "Some Systems Affected"}
          </h1>
          <p className="text-sm" style={{ color: "var(--text3)" }}>
            Last checked: {new Date().toLocaleDateString("en-GY", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </section>

      {/* Core Services */}
      <section className="section" style={{ background: "var(--cream)", paddingTop: "32px" }}>
        <div className="container" style={{ maxWidth: 800, margin: "0 auto", padding: "0 var(--gutter)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Core Services</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "40px" }}>
            {services.map(s => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: "var(--r-sm)", background: "var(--card)", border: "1px solid var(--divider)" }}>
                <span style={{ fontSize: "0.92rem", fontWeight: 500, color: "var(--text)" }}>{s.name}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: 600, color: statusConfig[s.status].color, background: statusConfig[s.status].bg, padding: "4px 12px", borderRadius: "100px" }}>
                  {statusConfig[s.status].icon} {statusConfig[s.status].label}
                </span>
              </div>
            ))}
          </div>

          {/* Tower Status */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <h2 className="text-lg font-bold" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Tower Status ({towers.length} sites)</h2>
            <div style={{ display: "flex", gap: "4px" }}>
              {["all", "operational", "degraded", "outage", "maintenance"].map(f => (
                <button key={f} onClick={() => setFilter(f)} className="btn" style={{
                  padding: "4px 14px", fontSize: "0.75rem",
                  background: filter === f ? "var(--terracotta)" : "var(--card)",
                  color: filter === f ? "#fff" : "var(--text3)",
                  borderColor: filter === f ? "var(--terracotta)" : "var(--divider)",
                }}>
                  {f === "all" ? "All" : statusConfig[f as Status].label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "40px" }}>
            {filteredTowers.map(t => (
              <div key={t.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: "var(--r-sm)", background: "var(--card)", border: "1px solid var(--divider)" }}>
                <div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text)" }}>📡 {t.name}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text3)" }}>{t.location}</div>
                  {t.note && <div style={{ fontSize: "0.78rem", color: statusConfig[t.status].color, marginTop: "2px" }}>{t.note}</div>}
                </div>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: 600, color: statusConfig[t.status].color, background: statusConfig[t.status].bg, padding: "4px 12px", borderRadius: "100px", flexShrink: 0 }}>
                  {statusConfig[t.status].icon} {statusConfig[t.status].label}
                </span>
              </div>
            ))}
          </div>

          {/* Recent Incidents */}
          <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Recent Incidents</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "40px" }}>
            {recentIncidents.map((inc, i) => (
              <div key={i} style={{ padding: "16px 18px", borderRadius: "var(--r-sm)", background: "var(--card)", border: "1px solid var(--divider)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text)" }}>{inc.title}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--teal)", fontWeight: 600, background: "rgba(42,157,143,0.08)", padding: "2px 10px", borderRadius: "100px" }}>Resolved</span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text3)", marginBottom: "4px" }}>{inc.desc}</p>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{inc.date}</span>
              </div>
            ))}
          </div>

          {/* Report Issue */}
          <div className="card p-6 text-center" style={{ background: "rgba(212,101,74,0.04)", borderColor: "rgba(212,101,74,0.12)" }}>
            <h3 className="text-base font-bold mb-2" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Experiencing an issue?</h3>
            <p style={{ fontSize: "0.88rem", color: "var(--text3)", marginBottom: "16px" }}>If you&apos;re having connectivity problems, let us know immediately.</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="https://wa.me/5926092487?text=Hi!%20I'm%20experiencing%20an%20internet%20issue." target="_blank" rel="noopener" className="btn btn-primary" style={{ padding: "10px 24px", fontSize: "0.85rem" }}>
                💬 Report on WhatsApp
              </a>
              <Link href="/speed-test" className="btn btn-outline" style={{ padding: "10px 24px", fontSize: "0.85rem" }}>
                🚀 Run Speed Test
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
