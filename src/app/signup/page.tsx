"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";

const STEPS = ["Personal Info", "Service Address", "Choose Plan", "Confirm"];

const ECD_PLANS = [
  { id: "ecd-starter", name: "ECD Starter", price_gyd: 5000, speed_down_mbps: 10, features: ["Browsing & email", "1-2 devices", "Email support", "Free router"] },
  { id: "ecd-family", name: "ECD Family", price_gyd: 8000, speed_down_mbps: 25, features: ["Streaming & video calls", "4-6 devices", "24/7 WhatsApp support", "Free router", "No throttling"] },
  { id: "ecd-power", name: "ECD Power", price_gyd: 10000, speed_down_mbps: 50, features: ["Work from home + streaming", "8+ devices", "Priority support", "Free router", "Static IP available"] },
];

const R1_PLANS = [
  { id: "r1-essential", name: "R1 Essential", price_gyd: 10000, speed_down_mbps: 5, features: ["Reliable connectivity", "Browsing, email & WhatsApp", "1-3 devices", "Local tech support"] },
  { id: "r1-standard", name: "R1 Standard", price_gyd: 15000, speed_down_mbps: 15, features: ["Streaming & video calls", "4-6 devices", "24/7 WhatsApp support", "Free router included"] },
  { id: "r1-premium", name: "R1 Premium", price_gyd: 25000, speed_down_mbps: 30, features: ["Full household coverage", "8+ devices", "Priority support", "Best speeds available", "Static IP available"] },
];

export default function SignupPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", password: "",
    address: "", region: "ecd", village: "",
    planId: "", planName: "", planPrice: 0,
  });

  const supabase = createClient();
  const set = (field: string, value: string | number) => setForm((f) => ({ ...f, [field]: value }));
  const plans = form.region === "ecd" ? ECD_PLANS : R1_PLANS;

  const canContinue =
    (step === 0 && form.fullName && form.email && form.phone && form.password && form.password.length >= 6) ||
    (step === 1 && form.address) ||
    (step === 2 && form.planId);

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      // Step 1: Sign up — this creates the user AND signs them in
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.fullName, phone: form.phone },
        },
      });

      if (signUpErr) throw signUpErr;
      
      // Step 2: If signUp didn't auto-login, explicitly sign in
      let userId = signUpData.user?.id;
      
      if (!signUpData.session) {
        // Email confirmation might be required — sign in explicitly
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (signInErr) {
          // If sign-in fails (e.g. email needs confirmation), still try to proceed
          // The user was created, we just can't insert subscription right now
          console.warn("Auto sign-in failed:", signInErr.message);
        } else {
          userId = signInData.user?.id;
        }
      }

      if (!userId) throw new Error("Account creation failed — please try again");

      // Step 3: Update profile with full details
      await supabase.from("profiles").upsert({
        id: userId,
        full_name: form.fullName,
        phone: form.phone,
        status: "pending",
        role: "customer",
      }, { onConflict: "id" }).then(() => {});

      // Step 4: Insert subscription — now auth.uid() matches customer_id
      const serviceAddress = {
        line1: form.address,
        region: form.region === "ecd" ? "East Coast Demerara" : "Region 1",
        village: form.village,
        plan_name: form.planName,
        plan_price: form.planPrice,
      };

      const { error: subErr } = await supabase.from("subscriptions").insert({
        customer_id: userId,
        plan_id: null, // Plans aren't in DB yet — store details in service_address
        status: "pending_install",
        service_address: serviceAddress,
      });

      if (subErr) {
        console.error("Subscription error:", subErr.message);
        // Don't fail the whole signup — account was created successfully
        // The subscription can be added manually by the team
      }

      // Step 5: Send notifications (fire-and-forget via API)
      fetch("/api/v1/signup/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.fullName,
          email: form.email,
          phone: form.phone,
          plan: form.planName,
          region: form.region === "ecd" ? "East Coast Demerara" : "Region 1",
          address: `${form.address}, ${form.village}`,
        }),
      }).catch(() => {});

      setSuccess(true);
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
        <div className="text-center max-w-md p-8">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>You&apos;re All Set!</h1>
          <p className="text-sm mb-2" style={{ color: "var(--text3)" }}>
            Your account has been created and your <strong>{form.planName}</strong> service is pending installation.
          </p>
          <p className="text-sm mb-6" style={{ color: "var(--text3)" }}>
            Our team will contact you within <strong>24 hours</strong> at <strong>{form.phone}</strong> to schedule your installation.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/portal" className="btn btn-primary">Go to Dashboard</Link>
            <a href="https://wa.me/5926092487" className="btn btn-cyan" target="_blank" rel="noopener">💬 WhatsApp Us</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>
      <nav className="px-6 py-4 flex items-center justify-between" style={{ background: "white", borderBottom: "1px solid rgba(44,24,16,0.06)" }}>
        <Link href="/"><img src="/logo.svg" alt="Evolve Wireless" className="h-9" /></Link>
        <Link href="/" className="text-sm" style={{ color: "var(--text3)" }}>← Back to website</Link>
      </nav>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px" }}>
        {/* Stepper */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.8rem", fontWeight: 700,
                background: i <= step ? "var(--terracotta)" : "rgba(44,24,16,0.08)",
                color: i <= step ? "#fff" : "var(--text3)",
              }}>
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i < step ? "var(--terracotta)" : "rgba(44,24,16,0.1)" }} />}
            </div>
          ))}
        </div>

        <div style={{ background: "white", border: "1px solid rgba(44,24,16,0.06)", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(44,24,16,0.06)" }}>
          {error && (
            <div style={{ padding: 12, borderRadius: 8, fontSize: "0.88rem", marginBottom: 16, background: "rgba(212,101,74,0.08)", color: "var(--terracotta)", border: "1px solid rgba(212,101,74,0.2)" }}>
              {error}
            </div>
          )}

          {step === 0 && (
            <div>
              <h2 style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "1.3rem", fontWeight: 700, marginBottom: 4 }}>Personal Information</h2>
              <p style={{ fontSize: "0.88rem", color: "var(--text3)", marginBottom: 24 }}>Tell us about yourself so we can set up your account.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Input label="Full Name *" value={form.fullName} onChange={(v) => set("fullName", v)} placeholder="Your full name" />
                <Input label="Email *" value={form.email} onChange={(v) => set("email", v)} placeholder="your@email.com" type="email" />
                <Input label="Phone / WhatsApp *" value={form.phone} onChange={(v) => set("phone", v)} placeholder="+592 XXX-XXXX" type="tel" />
                <Input label="Create Password *" value={form.password} onChange={(v) => set("password", v)} placeholder="Min 6 characters" type="password" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "1.3rem", fontWeight: 700, marginBottom: 4 }}>Service Address</h2>
              <p style={{ fontSize: "0.88rem", color: "var(--text3)", marginBottom: 24 }}>Where should we install your internet connection?</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: 4 }}>Region *</label>
                  <select value={form.region} onChange={(e) => { set("region", e.target.value); set("planId", ""); set("planName", ""); set("planPrice", 0); }}
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 8, fontSize: "0.88rem", outline: "none", background: "#FAFAFA", border: "1.5px solid rgba(44,24,16,0.1)" }}>
                    <option value="ecd">East Coast Demerara</option>
                    <option value="region1">Region 1 (Port Kaituma, Mabaruma, Matthews Ridge, Baramita)</option>
                  </select>
                </div>
                <Input label="Address / Lot *" value={form.address} onChange={(v) => set("address", v)} placeholder="e.g. Lot 5, Beterverwagting, ECD" />
                <Input label="Village / Area" value={form.village} onChange={(v) => set("village", v)} placeholder="e.g. Buxton, Mahaica, Port Kaituma" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "1.3rem", fontWeight: 700, marginBottom: 4 }}>Choose Your Plan</h2>
              <p style={{ fontSize: "0.88rem", color: "var(--text3)", marginBottom: 24 }}>
                {form.region === "ecd" ? "East Coast Demerara" : "Region 1"} plans — pick what works for you.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {plans.map((p) => (
                  <div key={p.id} onClick={() => { set("planId", p.id); set("planName", p.name); set("planPrice", p.price_gyd); }}
                    style={{
                      padding: 20, borderRadius: 12, cursor: "pointer",
                      border: form.planId === p.id ? "2px solid var(--terracotta)" : "1px solid rgba(44,24,16,0.08)",
                      background: form.planId === p.id ? "rgba(212,101,74,0.03)" : "white",
                    }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontFamily: "'Bricolage Grotesque', serif", fontWeight: 700 }}>{p.name}</span>
                      <span style={{ fontFamily: "'Bricolage Grotesque', serif", fontWeight: 700, color: "var(--terracotta)" }}>GYD {p.price_gyd.toLocaleString()}/mo</span>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text3)" }}>{p.speed_down_mbps} Mbps · {p.features.join(" · ")}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "1.3rem", fontWeight: 700, marginBottom: 4 }}>Confirm Your Order</h2>
              <p style={{ fontSize: "0.88rem", color: "var(--text3)", marginBottom: 24 }}>Review everything before we set up your account.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Box label="Personal" line1={form.fullName} line2={`${form.email} · ${form.phone}`} />
                <Box label="Installation" line1={form.address} line2={`${form.village} · ${form.region === "ecd" ? "East Coast Demerara" : "Region 1"}`} />
                <Box label="Plan" line1={form.planName} line2={`GYD ${form.planPrice.toLocaleString()} / month`} accent />
                <div style={{ padding: 16, borderRadius: 8, background: "rgba(42,157,143,0.06)", border: "1px solid rgba(42,157,143,0.15)", fontSize: "0.78rem", color: "var(--teal)" }}>
                  ✓ No contracts · ✓ Free router · ✓ Install in {form.region === "ecd" ? "48 hours" : "7 days"}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
            {step > 0 ? <button onClick={() => setStep(step - 1)} className="btn btn-outline">← Back</button> : <div />}
            {step < 3 ? (
              <button onClick={() => setStep(step + 1)} className="btn btn-primary" disabled={!canContinue} style={{ opacity: canContinue ? 1 : 0.5 }}>Continue →</button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="btn btn-primary">
                {loading ? "Creating Account..." : "Create Account & Schedule Install"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "12px 16px", borderRadius: 8, fontSize: "0.88rem", outline: "none", background: "#FAFAFA", border: "1.5px solid rgba(44,24,16,0.1)" }} />
    </div>
  );
}

function Box({ label, line1, line2, accent }: { label: string; line1: string; line2: string; accent?: boolean }) {
  return (
    <div style={{ padding: 16, borderRadius: 8, background: "#FAFAFA" }}>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--teal)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: "0.88rem", fontWeight: accent ? 700 : 400 }}>{line1}</div>
      <div style={{ fontSize: "0.88rem", color: accent ? "var(--terracotta)" : "var(--text3)", fontWeight: accent ? 700 : 400 }}>{line2}</div>
    </div>
  );
}
