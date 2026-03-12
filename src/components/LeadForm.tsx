"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { isValidGYPhone, waLink, getUTMParams } from "@/lib/utils";

export default function LeadForm() {
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "+592", email: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    if (!isValidGYPhone(form.phone)) { setErrorMsg("Phone must be +592 followed by 7 digits (e.g. +5926092487)"); return; }
    if (!form.first_name.trim() || !form.last_name.trim()) { setErrorMsg("First and last name are required"); return; }
    setStatus("submitting");
    try {
      const utm = getUTMParams();
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone: form.phone,
          email: form.email.trim() || null,
          source: "website",
          utm_source: utm.utm_source,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
    } catch { setStatus("error"); setErrorMsg("Could not submit right now. You can also WhatsApp us directly."); }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.3)" }}>
        <div className="text-3xl mb-3">✓</div>
        <h3 className="font-['Syne'] text-xl font-bold mb-2">Thanks, {form.first_name}!</h3>
        <p className="text-[var(--text2)] text-sm">We&apos;ll contact you within 24 hours via WhatsApp.</p>
      </div>
    );
  }

  const inputStyle = { background: "var(--card2)", border: "1px solid var(--divider)", color: "var(--text)" };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-[var(--text2)]">First Name *</label>
          <input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="John" required className="rounded-lg px-4 py-3 text-sm outline-none" style={inputStyle} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-[var(--text2)]">Last Name *</label>
          <input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Doe" required className="rounded-lg px-4 py-3 text-sm outline-none" style={inputStyle} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-[var(--text2)]">Phone / WhatsApp *</label>
        <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+5926092487" required className="rounded-lg px-4 py-3 text-sm outline-none" style={inputStyle} />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-[var(--text2)]">Email (optional)</label>
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" className="rounded-lg px-4 py-3 text-sm outline-none" style={inputStyle} />
      </div>
      {errorMsg && (
        <div className="text-sm text-red-400 flex items-center gap-2">
          <span>⚠</span> {errorMsg}
          {status === "error" && <a href={waLink("Hi! I tried to sign up on your website.")} className="text-[#25D366] underline ml-1" target="_blank" rel="noopener">WhatsApp us instead →</a>}
        </div>
      )}
      <button type="submit" disabled={status === "submitting"} className="btn btn-primary w-full justify-center mt-2" style={{ opacity: status === "submitting" ? 0.7 : 1 }}>
        {status === "submitting" ? "Submitting..." : "Get Connected →"}
      </button>
      <p className="text-center text-xs text-[var(--text3)]">We typically respond within 1–2 business hours.</p>
    </form>
  );
}
