"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";

interface Profile {
  full_name: string;
  phone: string;
  status: string;
  role: string;
  wa_opt_in: boolean;
  referral_code: string;
  created_at: string;
}

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      setEmail(user.email || "");

      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setProfile(data);
        setEditName(data.full_name);
        setEditPhone(data.phone || "");
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").update({
      full_name: editName,
      phone: editPhone,
    }).eq("id", user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
        <p style={{ color: "var(--text3)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>
      <nav className="px-6 py-4 flex items-center justify-between" style={{ background: "white", borderBottom: "1px solid rgba(44,24,16,0.06)" }}>
        <Link href="/portal"><img src="/logo.svg" alt="Evolve Wireless" className="h-9" /></Link>
        <Link href="/portal" className="text-sm" style={{ color: "var(--teal)" }}>← Dashboard</Link>
      </nav>

      <div className="container py-10" style={{ maxWidth: 600 }}>
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Account Settings</h1>
        <p className="text-sm mb-8" style={{ color: "var(--text3)" }}>Manage your profile and preferences.</p>

        <div className="card p-6 mb-6">
          <h3 className="font-bold mb-4" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Profile</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                style={{ background: "var(--soft-bg)", border: "1.5px solid rgba(44,24,16,0.1)" }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 rounded-lg text-sm outline-none opacity-60"
                style={{ background: "var(--soft-bg)", border: "1.5px solid rgba(44,24,16,0.1)" }}
              />
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Contact us to change your email address.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>Phone / WhatsApp</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+592 609-XXXX"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                style={{ background: "var(--soft-bg)", border: "1.5px solid rgba(44,24,16,0.1)" }}
              />
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? "Saving..." : "Save Changes"}
              </button>
              {saved && <span className="text-sm font-semibold" style={{ color: "#4CAF50" }}>✓ Saved</span>}
            </div>
          </form>
        </div>

        <div className="card p-6 mb-6">
          <h3 className="font-bold mb-3" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Account Info</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "var(--text3)" }}>Account Status</span>
              <span className="font-semibold capitalize" style={{ color: profile?.status === "active" ? "#4CAF50" : "var(--terracotta)" }}>{profile?.status}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--text3)" }}>Referral Code</span>
              <span className="font-mono font-semibold" style={{ color: "var(--text)" }}>{profile?.referral_code}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--text3)" }}>Member Since</span>
              <span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-GY", { month: "long", year: "numeric" }) : "—"}</span>
            </div>
          </div>
        </div>

        <div className="card p-6" style={{ background: "rgba(212,101,74,0.04)", borderColor: "rgba(212,101,74,0.15)" }}>
          <h3 className="font-bold mb-2" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Need to cancel or pause?</h3>
          <p className="text-sm" style={{ color: "var(--text3)" }}>
            No contracts, no penalties. Contact us on WhatsApp at <a href="https://wa.me/5926092487" style={{ color: "var(--teal)" }}>+592 609-2487</a> and we&apos;ll handle it immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
