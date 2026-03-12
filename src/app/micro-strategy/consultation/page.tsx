"use client";

import { useState } from "react";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px", borderRadius: "var(--r-sm)", border: "1px solid var(--divider)",
  background: "var(--soft-bg)", color: "var(--text)", fontSize: "0.95rem", fontFamily: "'Nunito', sans-serif",
  outline: "none", transition: "var(--transition)",
};

export default function ConsultationPage() {
  const [form, setForm] = useState({
    name: "", phone: "", email: "", business_name: "", business_type: "",
    service_interest: "", budget: "", timeline: "", message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5926092487";

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.service_interest) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/micro-strategy-consult", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setStatus(res.ok ? "sent" : "error");
      if (res.ok) setForm({ name: "", phone: "", email: "", business_name: "", business_type: "", service_interest: "", budget: "", timeline: "", message: "" });
    } catch { setStatus("error"); }
  };

  const waMsg = `Hi! I'd like to book a consultation with Micro Strategy.\n\nName: ${form.name || "(not provided)"}\nBusiness: ${form.business_name || "(not provided)"}\nInterested in: ${form.service_interest || "(not specified)"}${form.message ? `\n\nDetails: ${form.message}` : ""}`;

  return (
    <div style={{ paddingTop: "var(--nav-height)" }}>
      {/* Header */}
      <section style={{ background: "linear-gradient(135deg, #FDF8F3 0%, #F3F0FF 50%, #FDF8F3 100%)", padding: "clamp(48px, 8vw, 80px) 0 48px" }}>
        <div className="container" style={{ maxWidth: "720px", margin: "0 auto", padding: "0 var(--gutter)", textAlign: "center" }}>
          <span className="section-label" style={{ color: "var(--teal)", background: "rgba(42, 157, 143, 0.1)", padding: "6px 16px", borderRadius: "100px", display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            💡 Micro Strategy
          </span>
          <h1 style={{ fontSize: "var(--fs-display)", fontWeight: 800, color: "var(--text)", marginBottom: "12px" }}>
            Book a Free <span style={{ color: "var(--teal)" }}>Consultation</span>
          </h1>
          <p style={{ color: "var(--text3)", fontSize: "1.05rem", maxWidth: "500px", margin: "0 auto" }}>
            Tell us about your business and what you&apos;re looking for. We&apos;ll schedule a free 30-minute call to explore how we can help.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="section" style={{ background: "var(--cream)", paddingTop: "32px" }}>
        <div className="container" style={{ maxWidth: "720px", margin: "0 auto", padding: "0 var(--gutter)" }}>
          {status === "sent" ? (
            <div style={{ textAlign: "center", padding: "64px 0" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(42, 157, 143, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "2rem" }}>✓</div>
              <h2 style={{ fontSize: "var(--fs-h2)", fontWeight: 800, marginBottom: "12px" }}>Request Received!</h2>
              <p style={{ color: "var(--text3)", fontSize: "1.05rem", maxWidth: "440px", margin: "0 auto 24px" }}>
                We&apos;ll review your details and reach out within 24 hours to schedule your free consultation.
              </p>
              <a href={`https://wa.me/${WA}?text=${encodeURIComponent("Hi! I just submitted a consultation request for Micro Strategy on your website.")}`} target="_blank" rel="noopener" className="btn btn-primary" style={{ background: "#25D366", borderColor: "#25D366" }}>
                Follow Up on WhatsApp
              </a>
            </div>
          ) : (
            <div style={{ background: "var(--card)", borderRadius: "var(--r-lg)", border: "1px solid var(--divider)", padding: "clamp(24px, 4vw, 40px)" }}>
              {/* Section 1 */}
              <div style={{ marginBottom: "32px" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", fontSize: "1.1rem", fontWeight: 700 }}>
                  <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(42, 157, 143, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--teal)", fontSize: "0.8rem", fontWeight: 800 }}>1</span>
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
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text2)", marginBottom: "6px", fontWeight: 600 }}>Email</label>
                    <input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text2)", marginBottom: "6px", fontWeight: 600 }}>Business Name</label>
                    <input value={form.business_name} onChange={(e) => update("business_name", e.target.value)} placeholder="Your company name" style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div style={{ marginBottom: "32px" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", fontSize: "1.1rem", fontWeight: 700 }}>
                  <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(42, 157, 143, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--teal)", fontSize: "0.8rem", fontWeight: 800 }}>2</span>
                  Project Details
                </h3>
                <div className="form-grid-2">
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text2)", marginBottom: "6px", fontWeight: 600 }}>Business Type</label>
                    <select value={form.business_type} onChange={(e) => update("business_type", e.target.value)} style={inputStyle}>
                      <option value="">Select...</option>
                      <option value="retail">Retail / Shop</option>
                      <option value="restaurant">Restaurant / Food</option>
                      <option value="hotel">Hotel / Tourism</option>
                      <option value="professional">Professional Services</option>
                      <option value="construction">Construction / Trades</option>
                      <option value="agriculture">Agriculture / Farming</option>
                      <option value="health">Health / Medical</option>
                      <option value="education">Education / Training</option>
                      <option value="ngo">NGO / Non-profit</option>
                      <option value="startup">Startup</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text2)", marginBottom: "6px", fontWeight: 600 }}>Service Interest *</label>
                    <select value={form.service_interest} onChange={(e) => update("service_interest", e.target.value)} style={inputStyle}>
                      <option value="">Select...</option>
                      <option value="website">Website Development</option>
                      <option value="ecommerce">E-commerce / Online Store</option>
                      <option value="ai_chatbot">AI Chatbot / Assistant</option>
                      <option value="ai_other">Other AI Solution</option>
                      <option value="automation">Business Automation</option>
                      <option value="crm">CRM / Lead Management</option>
                      <option value="digital_transform">Digital Transformation</option>
                      <option value="multiple">Multiple Services</option>
                      <option value="not_sure">Not Sure — Need Advice</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text2)", marginBottom: "6px", fontWeight: 600 }}>Budget Range</label>
                    <select value={form.budget} onChange={(e) => update("budget", e.target.value)} style={inputStyle}>
                      <option value="">Select...</option>
                      <option value="under_200k">Under GYD 200,000</option>
                      <option value="200k_500k">GYD 200,000 – 500,000</option>
                      <option value="500k_1m">GYD 500,000 – 1,000,000</option>
                      <option value="1m_3m">GYD 1,000,000 – 3,000,000</option>
                      <option value="over_3m">Over GYD 3,000,000</option>
                      <option value="not_sure">Not sure yet</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text2)", marginBottom: "6px", fontWeight: 600 }}>Timeline</label>
                    <select value={form.timeline} onChange={(e) => update("timeline", e.target.value)} style={inputStyle}>
                      <option value="">Select...</option>
                      <option value="asap">As soon as possible</option>
                      <option value="1_month">Within 1 month</option>
                      <option value="3_months">Within 3 months</option>
                      <option value="exploring">Just exploring</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text2)", marginBottom: "6px", fontWeight: 600 }}>Tell Us About Your Project</label>
                <textarea value={form.message} onChange={(e) => update("message", e.target.value)} rows={4} placeholder="What problems are you trying to solve? What does your ideal solution look like?" style={{ ...inputStyle, resize: "none" }} />
              </div>

              {/* Submit */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  onClick={handleSubmit}
                  disabled={status === "sending" || !form.name || !form.phone || !form.service_interest}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: "center", background: "var(--teal)", borderColor: "var(--teal)", boxShadow: "0 4px 20px rgba(42, 157, 143, 0.3)", opacity: (!form.name || !form.phone || !form.service_interest) ? 0.5 : 1 }}
                >
                  {status === "sending" ? "Submitting..." : "Request Consultation"}
                </button>
                <a href={`https://wa.me/${WA}?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noopener" className="btn" style={{ background: "#25D366", color: "#fff", borderColor: "#25D366", display: "flex", alignItems: "center", gap: "8px" }}>
                  💬 WhatsApp
                </a>
              </div>
              {status === "error" && <p style={{ color: "#e74c3c", fontSize: "0.88rem", textAlign: "center", marginTop: "12px" }}>Something went wrong. Please try WhatsApp instead.</p>}
              <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", textAlign: "center", marginTop: "16px" }}>Free consultation. No commitment. Your information is kept confidential.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
