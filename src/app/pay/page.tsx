"use client";

import { useState } from "react";
import Link from "next/link";

export default function PayPage() {
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState("");
  const [step, setStep] = useState<"lookup" | "pay" | "confirm" | "done">("lookup");
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");

  const handleLookup = () => {
    if (!accountId.trim()) return;
    setStep("pay");
  };

  const handlePay = async () => {
    if (!amount || !phone || !method) return;
    setStatus("processing");
    // In production, this would call your MMG payment API
    // For now, simulate and redirect to WhatsApp confirmation
    setTimeout(() => {
      setStatus("success");
      setStep("done");
    }, 2000);
  };

  return (
    <div style={{ paddingTop: "var(--nav-height)" }}>
      {/* Header */}
      <section style={{ background: "var(--soft-bg)", padding: "clamp(32px, 5vw, 56px) 0 24px" }}>
        <div className="container" style={{ maxWidth: 600, margin: "0 auto", padding: "0 var(--gutter)", textAlign: "center" }}>
          <div className="section-label" style={{ display: "inline-flex" }}>Payments</div>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>
            Pay Your <span style={{ color: "var(--terracotta)" }}>Bill</span>
          </h1>
          <p className="text-sm" style={{ color: "var(--text3)", maxWidth: 440, margin: "0 auto" }}>
            Pay your Evolve Wireless internet bill securely using MMG Mobile Money or bank transfer.
          </p>
        </div>
      </section>

      <section className="section" style={{ background: "var(--cream)", paddingTop: "24px" }}>
        <div className="container" style={{ maxWidth: 520, margin: "0 auto", padding: "0 var(--gutter)" }}>

          {step === "done" ? (
            <div className="card p-8 text-center">
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✅</div>
              <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Payment Initiated!</h2>
              <p style={{ color: "var(--text3)", fontSize: "0.92rem", marginBottom: "8px" }}>
                Your payment of <strong>GYD {parseInt(amount).toLocaleString()}</strong> is being processed.
              </p>
              <p style={{ color: "var(--text3)", fontSize: "0.85rem", marginBottom: "24px" }}>
                You&apos;ll receive a confirmation via {method === "mmg" ? "MMG notification" : "email"} shortly. If you don&apos;t receive confirmation within 30 minutes, please contact us.
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => { setStep("lookup"); setAccountId(""); setAmount(""); setPhone(""); setMethod(""); setStatus("idle"); }} className="btn btn-primary" style={{ padding: "10px 24px", fontSize: "0.85rem" }}>
                  Make Another Payment
                </button>
                <a href="https://wa.me/5926092487?text=Hi!%20I%20just%20made%20a%20payment%20on%20your%20website.%20Can%20you%20confirm?" target="_blank" rel="noopener" className="btn btn-outline" style={{ padding: "10px 24px", fontSize: "0.85rem" }}>
                  💬 Confirm on WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: "clamp(24px, 4vw, 36px)" }}>
              {/* Progress Steps */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "32px" }}>
                {["Account", "Payment"].map((label, i) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.78rem", fontWeight: 700,
                      background: (i === 0 && step === "lookup") || (i === 1 && step === "pay") ? "var(--terracotta)" : (i === 0 && step === "pay") ? "var(--teal)" : "var(--divider)",
                      color: (i === 0 && (step === "lookup" || step === "pay")) || (i === 1 && step === "pay") ? "#fff" : "var(--text3)",
                    }}>
                      {i === 0 && step === "pay" ? "✓" : i + 1}
                    </span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text2)" }}>{label}</span>
                    {i < 1 && <span style={{ width: "40px", height: "2px", background: "var(--divider)", display: "block" }} />}
                  </div>
                ))}
              </div>

              {step === "lookup" && (
                <>
                  <h3 className="text-base font-bold mb-4" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Enter Your Account ID</h3>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text2)", fontWeight: 600, marginBottom: "6px" }}>Account ID / Customer Number</label>
                    <input
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      placeholder="e.g., EW-10045 or your phone number"
                      style={{ width: "100%", padding: "12px 16px", borderRadius: "var(--r-sm)", border: "1px solid var(--divider)", background: "var(--soft-bg)", fontFamily: "inherit", fontSize: "0.95rem", color: "var(--text)" }}
                    />
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "20px" }}>
                    Your account ID is on your invoice or signup confirmation. Not sure? <a href="https://wa.me/5926092487?text=Hi!%20I%20need%20my%20account%20ID%20to%20make%20a%20payment." target="_blank" rel="noopener" style={{ color: "var(--teal)" }}>Ask on WhatsApp</a>.
                  </p>
                  <button onClick={handleLookup} disabled={!accountId.trim()} className="btn btn-primary w-full justify-center" style={{ opacity: !accountId.trim() ? 0.5 : 1 }}>
                    Continue →
                  </button>
                </>
              )}

              {step === "pay" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <h3 className="text-base font-bold" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>Payment Details</h3>
                    <button onClick={() => setStep("lookup")} style={{ fontSize: "0.82rem", color: "var(--teal)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                      ← Back
                    </button>
                  </div>

                  <div className="card p-3 mb-4" style={{ background: "var(--soft-bg)", borderColor: "var(--divider)" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--text3)" }}>Account: </span>
                    <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{accountId}</span>
                  </div>

                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text2)", fontWeight: 600, marginBottom: "6px" }}>Amount (GYD) *</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g., 8000"
                      style={{ width: "100%", padding: "12px 16px", borderRadius: "var(--r-sm)", border: "1px solid var(--divider)", background: "var(--soft-bg)", fontFamily: "inherit", fontSize: "0.95rem", color: "var(--text)" }}
                    />
                    <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                      {[5000, 8000, 10000, 15000].map(v => (
                        <button key={v} onClick={() => setAmount(String(v))} className="btn" style={{ padding: "4px 12px", fontSize: "0.75rem", background: amount === String(v) ? "var(--terracotta)" : "var(--card)", color: amount === String(v) ? "#fff" : "var(--text3)", borderColor: "var(--divider)" }}>
                          GYD {v.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text2)", fontWeight: 600, marginBottom: "6px" }}>Phone Number *</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+592 XXX XXXX"
                      style={{ width: "100%", padding: "12px 16px", borderRadius: "var(--r-sm)", border: "1px solid var(--divider)", background: "var(--soft-bg)", fontFamily: "inherit", fontSize: "0.95rem", color: "var(--text)" }}
                    />
                  </div>

                  <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text2)", fontWeight: 600, marginBottom: "8px" }}>Payment Method *</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {[
                        { id: "mmg", label: "MMG Mobile Money", desc: "Pay instantly from your MMG wallet", icon: "📱" },
                        { id: "bank", label: "Bank Transfer", desc: "Transfer from your bank account", icon: "🏦" },
                      ].map(m => (
                        <button key={m.id} onClick={() => setMethod(m.id)} style={{
                          display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px",
                          borderRadius: "var(--r-sm)", background: method === m.id ? "rgba(212,101,74,0.05)" : "var(--soft-bg)",
                          border: `2px solid ${method === m.id ? "var(--terracotta)" : "var(--divider)"}`,
                          cursor: "pointer", textAlign: "left",
                        }}>
                          <span style={{ fontSize: "1.4rem" }}>{m.icon}</span>
                          <div>
                            <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text)" }}>{m.label}</div>
                            <div style={{ fontSize: "0.78rem", color: "var(--text3)" }}>{m.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handlePay}
                    disabled={status === "processing" || !amount || !phone || !method}
                    className="btn btn-primary w-full justify-center"
                    style={{ padding: "14px", fontSize: "0.95rem", opacity: (!amount || !phone || !method) ? 0.5 : 1 }}
                  >
                    {status === "processing" ? "Processing..." : `Pay GYD ${amount ? parseInt(amount).toLocaleString() : "0"}`}
                  </button>

                  {method === "bank" && (
                    <div className="card p-4 mt-4" style={{ background: "rgba(42,157,143,0.04)", borderColor: "rgba(42,157,143,0.12)" }}>
                      <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Bank Transfer Details:</p>
                      <p style={{ fontSize: "0.82rem", color: "var(--text3)", lineHeight: 1.6 }}>
                        Bank: Republic Bank Guyana<br />
                        Account Name: Evolve Wireless Internet<br />
                        Account #: Contact us for details<br />
                        Reference: {accountId}
                      </p>
                    </div>
                  )}

                  <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "center", marginTop: "16px" }}>
                    🔒 Payments are processed securely. Your information is not stored.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Alternative Payment */}
          <div style={{ marginTop: "32px", padding: "20px", borderRadius: "var(--r-sm)", border: "1px dashed var(--divider)", textAlign: "center" }}>
            <p style={{ fontSize: "0.88rem", color: "var(--text2)", fontWeight: 500, marginBottom: "8px" }}>Prefer to pay in person?</p>
            <p style={{ fontSize: "0.82rem", color: "var(--text3)" }}>
              You can also pay via any MMG agent location, or contact us on <a href="https://wa.me/5926092487" target="_blank" rel="noopener" style={{ color: "var(--teal)", fontWeight: 600 }}>WhatsApp</a> for other payment arrangements.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
