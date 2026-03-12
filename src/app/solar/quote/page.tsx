"use client";

import { useState } from "react";
import Link from "next/link";

const regions = [
  "Region 1 — Barima-Waini", "Region 2 — Pomeroon-Supenaam", "Region 3 — Essequibo Islands-West Demerara",
  "Region 4 — Demerara-Mahaica", "Region 5 — Mahaica-Berbice", "Region 6 — East Berbice-Corentyne",
  "Region 7 — Cuyuni-Mazaruni", "Region 8 — Potaro-Siparuni", "Region 9 — Upper Takutu-Upper Essequibo",
  "Region 10 — Upper Demerara-Berbice",
];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px", borderRadius: "var(--r-sm)", border: "1px solid var(--divider)",
  background: "var(--soft-bg)", color: "var(--text)", fontSize: "0.95rem", fontFamily: "'Nunito', sans-serif",
  outline: "none", transition: "var(--transition)",
};

export default function QuotePage() {
  const [form, setForm] = useState({
    name: "", phone: "", email: "", property_type: "", location: "", region: "",
    monthly_bill: "", roof_type: "", has_generator: "", battery_interest: "", timeline: "", message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5926092487";

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.property_type) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/solar-quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setStatus(res.ok ? "sent" : "error");
      if (res.ok) setForm({ name: "", phone: "", email: "", property_type: "", location: "", region: "", monthly_bill: "", roof_type: "", has_generator: "", battery_interest: "", timeline: "", message: "" });
    } catch { setStatus("error"); }
  };

  const waMsg = `Hi! I'd like a solar quote.\n\nName: ${form.name || "(not provided)"}\nProperty: ${form.property_type || "(not specified)"}\nLocation: ${form.location || "(not provided)"}${form.monthly_bill ? `\nGPL Bill: ${form.monthly_bill}` : ""}${form.message ? `\n\nInfo: ${form.message}` : ""}`;

  return (
    <div style={{ paddingTop: "var(--nav-height)" }}>
      {/* Header */}
      <section style={{ background: "linear-gradient(135deg, #FDF8F3 0%, #FFFBF0 100%)", padding: "clamp(48px, 8vw, 80px) 0 48px" }}>
        <div className="container" style={{ maxWidth: "720px", margin: "0 auto", padding: "0 var(--gutter)", textAlign: "center" }}>
          <span className="section-label" style={{ color: "var(--gold)", background: "rgba(233, 180, 76, 0.12)", padding: "6px 16px", borderRadius: "100px", display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            ☀️ Evolve Solar Solutions
          </span>
          <h1 style={{ fontSize: "var(--fs-display)", fontWeight: 800, color: "var(--text)", marginBottom: "12px" }}>
            Request a <span style={{ color: "var(--gold)" }}>Solar Quote</span>
          </h1>
          <p style={{ color: "var(--text3)", fontSize: "1.05rem", maxWidth: "500px", margin: "0 auto" }}>
            Fill out the form and our team will prepare a customised proposal — completely free, no obligation.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="section" style={{ background: "var(--cream)", paddingTop: "32px" }}>
        <div className="container" style={{ maxWidth: "720px", margin: "0 auto", padding: "0 var(--gutter)" }}>
          {status === "sent" ? (
            <div style={{ textAlign: "center", padding: "64px 0" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(233, 180, 76, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "2rem" }}>✓</div>
              <h2 style={{ fontSize: "var(--fs-h2)", fontWeight: 800, marginBottom: "12px" }}>Quote Request Received!</h2>
              <p style={{ color: "var(--text3)", fontSize: "1.05rem", maxWidth: "440px", margin: "0 auto 24px" }}>
                Our solar team will review your details and get back to you within 24 hours.
              </p>
              <a href={`https://wa.me/${WA}?text=${encodeURIComponent("Hi! I just submitted a solar quote request on your website.")}`} target="_blank" rel="noopener" className="btn btn-primary" style={{ background: "#25D366", borderColor: "#25D366" }}>
                Follow Up on WhatsApp
              </a>
            </div>
          ) : (
            <div style={{ background: "var(--card)", borderRadius: "var(--r-lg)", border: "1px solid var(--divider)", padding: "clamp(24px, 4vw, 40px)" }}>
              {/* Section 1 */}
              <div style={{ marginBottom: "32px" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", fontSize: "1.1rem", fontWeight: 700 }}>
                  <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(233, 180, 76, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)", fontSize: "0.8rem", fontWeight: 800 }}>1</span>
                  Your Details
                </h3>
                <div className="form-grid-2">
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text2)", marginBottom: "6px", fontWeight: 600 }}>Full Name *</label>
                    <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your full name" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text2)", marginBottom: "6px", fontWeight: 600 }}>Phone *</label>
                    <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+592 XXX XXXX" style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text2)", marginBottom: "6px", fontWeight: 600 }}>Email (optional)</label>
                    <input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div style={{ marginBottom: "32px" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", fontSize: "1.1rem", fontWeight: 700 }}>
                  <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(233, 180, 76, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)", fontSize: "0.8rem", fontWeight: 800 }}>2</span>
                  Property Details
                </h3>
                <div className="form-grid-2">
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text2)", marginBottom: "6px", fontWeight: 600 }}>Property Type *</label>
                    <select value={form.property_type} onChange={(e) => update("property_type", e.target.value)} style={inputStyle}>
                      <option value="">Select type...</option>
                      <option value="residential_small">Residential — Small (1-2 bed)</option>
                      <option value="residential_medium">Residential — Medium (3-4 bed)</option>
                      <option value="residential_large">Residential — Large (5+ bed)</option>
                      <option value="commercial_small">Commercial — Small business</option>
                      <option value="commercial_medium">Commercial — Medium business</option>
                      <option value="commercial_large">Commercial — Large / Industrial</option>
                      <option value="farm">Farm / Agricultural</option>
                      <option value="institutional">School / Church / Community</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text2)", marginBottom: "6px", fontWeight: 600 }}>Region</label>
                    <select value={form.region} onChange={(e) => update("region", e.target.value)} style={inputStyle}>
                      <option value="">Select region...</option>
                      {regions.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text2)", marginBottom: "6px", fontWeight: 600 }}>Address / Area</label>
                    <input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="e.g., Lot 45 Bel Air, Georgetown" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text2)", marginBottom: "6px", fontWeight: 600 }}>Roof Type</label>
                    <select value={form.roof_type} onChange={(e) => update("roof_type", e.target.value)} style={inputStyle}>
                      <option value="">Select...</option>
                      <option value="zinc">Zinc / Galvanized</option>
                      <option value="concrete">Concrete / Flat</option>
                      <option value="clay_tile">Clay Tile</option>
                      <option value="shingle">Shingle</option>
                      <option value="ground_mount">Ground Mount (No Roof)</option>
                      <option value="other">Other / Not Sure</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text2)", marginBottom: "6px", fontWeight: 600 }}>Monthly GPL Bill</label>
                    <select value={form.monthly_bill} onChange={(e) => update("monthly_bill", e.target.value)} style={inputStyle}>
                      <option value="">Select range...</option>
                      <option value="under_10000">Under GYD 10,000</option>
                      <option value="10000_25000">GYD 10,000 – 25,000</option>
                      <option value="25000_50000">GYD 25,000 – 50,000</option>
                      <option value="50000_100000">GYD 50,000 – 100,000</option>
                      <option value="100000_250000">GYD 100,000 – 250,000</option>
                      <option value="over_250000">Over GYD 250,000</option>
                      <option value="no_gpl">No GPL Connection</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3 */}
              <div style={{ marginBottom: "32px" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", fontSize: "1.1rem", fontWeight: 700 }}>
                  <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(233, 180, 76, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)", fontSize: "0.8rem", fontWeight: 800 }}>3</span>
                  Preferences
                </h3>
                <div className="form-grid-2">
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text2)", marginBottom: "6px", fontWeight: 600 }}>Do you have a generator?</label>
                    <select value={form.has_generator} onChange={(e) => update("has_generator", e.target.value)} style={inputStyle}>
                      <option value="">Select...</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                      <option value="planning">Planning to get one</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text2)", marginBottom: "6px", fontWeight: 600 }}>Battery backup interest?</label>
                    <select value={form.battery_interest} onChange={(e) => update("battery_interest", e.target.value)} style={inputStyle}>
                      <option value="">Select...</option>
                      <option value="yes">Yes, definitely</option>
                      <option value="maybe">Maybe, want to learn more</option>
                      <option value="no">No, grid-tied only</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text2)", marginBottom: "6px", fontWeight: 600 }}>Timeline</label>
                    <select value={form.timeline} onChange={(e) => update("timeline", e.target.value)} style={inputStyle}>
                      <option value="">Select...</option>
                      <option value="asap">As soon as possible</option>
                      <option value="1_month">Within 1 month</option>
                      <option value="3_months">Within 3 months</option>
                      <option value="6_months">Within 6 months</option>
                      <option value="just_exploring">Just exploring</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text2)", marginBottom: "6px", fontWeight: 600 }}>Additional Information</label>
                <textarea value={form.message} onChange={(e) => update("message", e.target.value)} rows={4} placeholder="Tell us about your energy needs, specific requirements, or questions..." style={{ ...inputStyle, resize: "none" }} />
              </div>

              {/* Submit */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  onClick={handleSubmit}
                  disabled={status === "sending" || !form.name || !form.phone || !form.property_type}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: "center", background: "var(--gold)", borderColor: "var(--gold)", boxShadow: "0 4px 20px rgba(233, 180, 76, 0.3)", opacity: (!form.name || !form.phone || !form.property_type) ? 0.5 : 1 }}
                >
                  {status === "sending" ? "Submitting..." : "Submit Quote Request"}
                </button>
                <a href={`https://wa.me/${WA}?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noopener" className="btn" style={{ background: "#25D366", color: "#fff", borderColor: "#25D366", display: "flex", alignItems: "center", gap: "8px" }}>
                  💬 WhatsApp
                </a>
              </div>
              {status === "error" && <p style={{ color: "#e74c3c", fontSize: "0.88rem", textAlign: "center", marginTop: "12px" }}>Something went wrong. Please try WhatsApp instead.</p>}
              <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", textAlign: "center", marginTop: "16px" }}>Your information is kept confidential and only used to prepare your solar quote.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
