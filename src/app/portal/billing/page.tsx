"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";

interface Invoice {
  id: string;
  invoice_number: string;
  amount_gyd: number;
  due_date: string;
  status: string;
  created_at: string;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      // Get invoices via subscriptions
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("customer_id", user.id);

      if (subs && subs.length > 0) {
        const subIds = subs.map((s) => s.id);
        const { data } = await supabase
          .from("invoices")
          .select("*")
          .in("subscription_id", subIds)
          .order("due_date", { ascending: false });
        setInvoices(data || []);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  const statusColor: Record<string, { bg: string; text: string }> = {
    paid: { bg: "rgba(76,175,80,0.1)", text: "#4CAF50" },
    sent: { bg: "rgba(42,157,143,0.1)", text: "#2A9D8F" },
    overdue: { bg: "rgba(212,101,74,0.1)", text: "#D4654A" },
    draft: { bg: "rgba(139,115,85,0.1)", text: "#8B7355" },
    void: { bg: "rgba(139,115,85,0.1)", text: "#8B7355" },
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>
      <nav className="px-6 py-4 flex items-center justify-between" style={{ background: "white", borderBottom: "1px solid rgba(44,24,16,0.06)" }}>
        <Link href="/portal"><img src="/logo.svg" alt="Evolve Wireless" className="h-9" /></Link>
        <div className="flex items-center gap-4">
          <Link href="/portal" className="text-sm" style={{ color: "var(--teal)" }}>← Dashboard</Link>
        </div>
      </nav>

      <div className="container py-10" style={{ maxWidth: 800 }}>
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Billing & Invoices</h1>
        <p className="text-sm mb-8" style={{ color: "var(--text3)" }}>View your invoices and payment history. Need to pay? Contact us on WhatsApp.</p>

        {loading ? (
          <div className="card p-8 text-center">
            <p style={{ color: "var(--text3)" }}>Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="text-3xl mb-3">🧾</div>
            <h3 className="font-bold mb-2" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>No invoices yet</h3>
            <p className="text-sm mb-4" style={{ color: "var(--text3)" }}>Your invoices will appear here once your service is active.</p>
            <Link href="/portal" className="btn btn-outline">Back to Dashboard</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => {
              const sc = statusColor[inv.status] || statusColor.draft;
              return (
                <div key={inv.id} className="card p-5 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="text-sm font-bold" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>{inv.invoice_number}</div>
                    <div className="text-xs" style={{ color: "var(--text3)" }}>
                      Due: {new Date(inv.due_date).toLocaleDateString("en-GY", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div className="text-base font-bold" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>
                      GYD {inv.amount_gyd.toLocaleString()}
                    </div>
                    <span className="text-xs font-bold uppercase px-3 py-1 rounded-full" style={{ background: sc.bg, color: sc.text }}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="card p-6 mt-8" style={{ background: "rgba(42,157,143,0.04)", borderColor: "rgba(42,157,143,0.15)" }}>
          <h3 className="font-bold mb-2" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>How to Pay</h3>
          <div className="text-sm space-y-2" style={{ color: "var(--text2)" }}>
            <p><strong>WhatsApp:</strong> Message us at <a href="https://wa.me/5926092487" target="_blank" rel="noopener" style={{ color: "var(--teal)" }}>+592 609-2487</a> with your invoice number</p>
            <p><strong>Bank Transfer:</strong> Contact us for our banking details and use your invoice number as reference</p>
            <p><strong>Cash:</strong> Pay at our office during business hours (Mon–Fri 8am–6pm, Sat 9am–4pm)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
