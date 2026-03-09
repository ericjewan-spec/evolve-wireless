"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";

const STEPS = ["Personal Info", "Service Address", "Choose Plan", "Confirm"];

export default function SignupPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form state
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", password: "",
    address: "", region: "ecd", village: "",
    planId: "", planName: "", planPrice: 0,
  });

  const [plans, setPlans] = useState<Array<{ id: string; name: string; price_gyd: number; speed_down_mbps: number; features: string[] }>>([]);

  const supabase = createClient();

  const set = (field: string, value: string | number) => setForm((f) => ({ ...f, [field]: value }));

  // Load plans when reaching step 3
  async function loadPlans(region: string) {
    const { data } = await supabase
      .from("plans")
      .select("*")
      .eq("region", region)
      .eq("is_active", true)
      .order("sort_order");
    setPlans(data || []);
  }

  async function nextStep() {
    if (step === 1) {
      await loadPlans(form.region);
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      // 1. Create auth account
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.fullName, phone: form.phone },
        },
      });

      if (authErr) throw authErr;
      if (!authData.user) throw new Error("Account creation failed");

      // 2. Create subscription
      const { error: subErr } = await supabase.from("subscriptions").insert({
        customer_id: authData.user.id,
        plan_id: form.planId,
        status: "pending_install",
        service_address: {
          line1: form.address,
          region: form.region === "ecd" ? "East Coast Demerara" : "Region 1",
          village: form.village,
        },
      });

      if (subErr) throw subErr;

      // 3. Notify team via Slack + email (non-blocking)
      try {
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: form.fullName.split(" ")[0],
            last_name: form.fullName.split(" ").slice(1).join(" ") || form.fullName,
            phone: form.phone,
            email: form.email,
            plan_interest: form.planName,
            source: "signup_flow",
          }),
        });
      } catch { /* non-blocking */ }

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

      <div className="container py-10" style={{ maxWidth: 600 }}>
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: i <= step ? "var(--terracotta)" : "rgba(44,24,16,0.08)",
                  color: i <= step ? "#fff" : "var(--text3)",
                }}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span className="text-xs font-semibold hidden sm:block" style={{ color: i <= step ? "var(--text)" : "var(--text3)" }}>{s}</span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px" style={{ background: i < step ? "var(--terracotta)" : "rgba(44,24,16,0.1)" }} />}
            </div>
          ))}
        </div>

        <div className="card p-8">
          {error && (
            <div className="p-3 rounded-lg text-sm mb-4" style={{ background: "rgba(212,101,74,0.08)", color: "var(--terracotta)", border: "1px solid rgba(212,101,74,0.2)" }}>
              {error}
            </div>
          )}

          {/* Step 1: Personal Info */}
          {step === 0 && (
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Personal Information</h2>
              <p className="text-sm mb-6" style={{ color: "var(--text3)" }}>Tell us about yourself so we can set up your account.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Full Name *</label>
                  <input type="text" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required placeholder="Your full name" className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ background: "var(--soft-bg)", border: "1.5px solid rgba(44,24,16,0.1)" }} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required placeholder="your@email.com" className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ background: "var(--soft-bg)", border: "1.5px solid rgba(44,24,16,0.1)" }} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Phone / WhatsApp *</label>
                  <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} required placeholder="+592 XXX-XXXX" className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ background: "var(--soft-bg)", border: "1.5px solid rgba(44,24,16,0.1)" }} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Create Password *</label>
                  <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required placeholder="Min 6 characters" className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ background: "var(--soft-bg)", border: "1.5px solid rgba(44,24,16,0.1)" }} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Address */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Service Address</h2>
              <p className="text-sm mb-6" style={{ color: "var(--text3)" }}>Where should we install your internet connection?</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Region *</label>
                  <select value={form.region} onChange={(e) => set("region", e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ background: "var(--soft-bg)", border: "1.5px solid rgba(44,24,16,0.1)" }}>
                    <option value="ecd">East Coast Demerara</option>
                    <option value="region1">Region 1 (Port Kaituma, Mabaruma, Matthews Ridge, Baramita)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Address / Lot *</label>
                  <input type="text" value={form.address} onChange={(e) => set("address", e.target.value)} required placeholder="e.g. Lot 5, Beterverwagting, ECD" className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ background: "var(--soft-bg)", border: "1.5px solid rgba(44,24,16,0.1)" }} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Village / Area</label>
                  <input type="text" value={form.village} onChange={(e) => set("village", e.target.value)} placeholder="e.g. Buxton, Mahaica, Port Kaituma" className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={{ background: "var(--soft-bg)", border: "1.5px solid rgba(44,24,16,0.1)" }} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Plan */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Choose Your Plan</h2>
              <p className="text-sm mb-6" style={{ color: "var(--text3)" }}>
                {form.region === "ecd" ? "East Coast Demerara" : "Region 1"} plans — pick what works for your household.
              </p>
              <div className="space-y-3">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => { set("planId", p.id); set("planName", p.name); set("planPrice", p.price_gyd); }}
                    className="card p-5 cursor-pointer"
                    style={{
                      borderColor: form.planId === p.id ? "var(--terracotta)" : undefined,
                      borderWidth: form.planId === p.id ? 2 : undefined,
                      background: form.planId === p.id ? "rgba(212,101,74,0.03)" : "white",
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>{p.name}</h3>
                      <div className="font-bold" style={{ fontFamily: "'Bricolage Grotesque', serif", color: "var(--terracotta)" }}>
                        GYD {p.price_gyd.toLocaleString()}/mo
                      </div>
                    </div>
                    <div className="text-xs" style={{ color: "var(--text3)" }}>
                      {p.speed_down_mbps} Mbps · {(p.features as unknown as string[])?.join(" · ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Confirm Your Order</h2>
              <p className="text-sm mb-6" style={{ color: "var(--text3)" }}>Review everything before we set up your account.</p>
              <div className="space-y-4">
                <div className="p-4 rounded-lg" style={{ background: "var(--soft-bg)" }}>
                  <div className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--teal)" }}>Personal</div>
                  <p className="text-sm"><strong>{form.fullName}</strong></p>
                  <p className="text-sm" style={{ color: "var(--text3)" }}>{form.email} · {form.phone}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: "var(--soft-bg)" }}>
                  <div className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--teal)" }}>Installation Address</div>
                  <p className="text-sm">{form.address}</p>
                  <p className="text-sm" style={{ color: "var(--text3)" }}>{form.village} · {form.region === "ecd" ? "East Coast Demerara" : "Region 1"}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: "var(--soft-bg)" }}>
                  <div className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--teal)" }}>Plan</div>
                  <p className="text-sm font-bold">{form.planName}</p>
                  <p className="text-sm" style={{ color: "var(--terracotta)", fontWeight: 700 }}>GYD {form.planPrice.toLocaleString()} / month</p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: "rgba(42,157,143,0.06)", border: "1px solid rgba(42,157,143,0.15)" }}>
                  <p className="text-xs" style={{ color: "var(--teal)" }}>
                    ✓ No contracts — cancel any time · ✓ Free router included · ✓ Installation within {form.region === "ecd" ? "48 hours" : "7 days"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} className="btn btn-outline">← Back</button>
            ) : <div />}
            {step < STEPS.length - 1 ? (
              <button onClick={nextStep} className="btn btn-primary" disabled={
                (step === 0 && (!form.fullName || !form.email || !form.phone || !form.password)) ||
                (step === 1 && !form.address) ||
                (step === 2 && !form.planId)
              }>
                Continue →
              </button>
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
