"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";

interface Profile {
  full_name: string;
  phone: string;
  status: string;
}

interface Subscription {
  id: string;
  status: string;
  service_address: Record<string, string>;
  plans: { name: string; price_gyd: number; speed_down_mbps: number };
}

export default function PortalDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, phone, status")
        .eq("id", user.id)
        .single();

      const { data: subData } = await supabase
        .from("subscriptions")
        .select("id, status, service_address, plans(name, price_gyd, speed_down_mbps)")
        .eq("customer_id", user.id);

      setProfile(profileData);
      setSubscriptions((subData as unknown as Subscription[]) || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
        <div className="text-center">
          <div className="text-lg font-semibold" style={{ color: "var(--text3)" }}>Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>
      {/* Portal nav */}
      <nav className="px-6 py-4 flex items-center justify-between" style={{ background: "white", borderBottom: "1px solid rgba(44, 24, 16, 0.06)" }}>
        <Link href="/">
          <img src="/logo.svg" alt="Evolve Wireless" className="h-9" />
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{profile?.full_name}</span>
          <button onClick={handleLogout} className="text-sm px-4 py-2 rounded-full" style={{ color: "var(--terracotta)", border: "1px solid var(--terracotta)" }}>
            Sign Out
          </button>
        </div>
      </nav>

      <div className="container py-10" style={{ maxWidth: 1000 }}>
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>
          Welcome back, {profile?.full_name?.split(" ")[0] || "Customer"}
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text3)" }}>Manage your internet service, pay bills, and get support.</p>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Pay Bill", href: "/portal/billing", icon: "💳", color: "var(--terracotta)" },
            { label: "Get Support", href: "/portal/support", icon: "🎫", color: "var(--teal)" },
            { label: "My Account", href: "/portal/account", icon: "👤", color: "var(--gold)" },
            { label: "WhatsApp Us", href: "https://wa.me/5926092487", icon: "💬", color: "#25D366" },
          ].map((a) => (
            <Link key={a.label} href={a.href} className="card p-5 text-center" style={{ cursor: "pointer" }}>
              <div className="text-2xl mb-2">{a.icon}</div>
              <div className="text-sm font-semibold" style={{ color: a.color }}>{a.label}</div>
            </Link>
          ))}
        </div>

        {/* Active services */}
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Your Services</h2>
        {subscriptions.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="text-3xl mb-3">📡</div>
            <h3 className="font-bold mb-2">No active services</h3>
            <p className="text-sm mb-4" style={{ color: "var(--text3)" }}>You don&apos;t have any active internet plans yet.</p>
            <Link href="/plans" className="btn btn-primary">Browse Plans</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="card p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="font-bold" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>{sub.plans?.name}</h3>
                    <p className="text-sm" style={{ color: "var(--text3)" }}>
                      {sub.plans?.speed_down_mbps} Mbps · GYD {sub.plans?.price_gyd?.toLocaleString()}/mo
                    </p>
                  </div>
                  <span className="text-xs font-bold uppercase px-3 py-1 rounded-full" style={{
                    background: sub.status === "active" ? "rgba(76, 175, 80, 0.1)" : "rgba(233, 180, 76, 0.1)",
                    color: sub.status === "active" ? "#4CAF50" : "#E9B44C",
                  }}>
                    {sub.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
