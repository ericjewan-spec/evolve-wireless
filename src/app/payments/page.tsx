"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GREEN = "#1F6F3D";
const BROWN = "#4A3728";
const CREAM = "#FAF5EC";

const QUICK_ITEMS = ["POE", "Router", "Cable", "Movement", "Dish Replacement", "Other"];

type Item = { label: string; amountGyd: string };

const inp: React.CSSProperties = {
  width: "100%", padding: "12px 13px", borderRadius: 10, border: "1.5px solid #ddd",
  fontSize: 16, color: BROWN, background: "#fff", outline: "none", boxSizing: "border-box",
};

const today = () => new Date().toLocaleDateString("en-GB");
const gyd = (n: number) => "GYD " + Math.round(n).toLocaleString("en-US");
const waNumber = (p: string) => { const d = (p || "").replace(/\D/g, ""); return d.startsWith("592") ? d : "592" + d.replace(/^0+/, ""); };

export default function FieldPaymentPage() {
  // ── Shared field-code gate (same code as /install) ──
  const [unlocked, setUnlocked] = useState(false);
  const [checkingGate, setCheckingGate] = useState(true);
  const [code, setCode] = useState("");
  const [gateError, setGateError] = useState("");
  const [gateBusy, setGateBusy] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("evolve_install_code") : null;
    if (!saved) { setCheckingGate(false); return; }
    fetch("/api/v1/field/verify-code", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: saved }),
    })
      .then((r) => r.json())
      .then((j) => { if (j.ok) { setCode(saved); setUnlocked(true); } else { localStorage.removeItem("evolve_install_code"); } })
      .catch(() => {})
      .finally(() => setCheckingGate(false));
  }, []);

  const tryUnlock = async () => {
    setGateBusy(true); setGateError("");
    try {
      const res = await fetch("/api/v1/field/verify-code", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const j = await res.json();
      if (j.ok) { localStorage.setItem("evolve_install_code", code.trim()); setUnlocked(true); }
      else setGateError("Wrong code — check with the office.");
    } catch { setGateError("Network error — try again."); }
    setGateBusy(false);
  };
  const lock = () => { localStorage.removeItem("evolve_install_code"); setUnlocked(false); setCode(""); };

  // ── Customer lookup ──
  const [account, setAccount] = useState("");
  const [customer, setCustomer] = useState<{ name: string; phone: string | null } | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const lookup = async () => {
    if (!account.trim()) return;
    setLookupBusy(true); setLookupError(""); setCustomer(null);
    try {
      const res = await fetch("/api/v1/field/client-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-install-code": code },
        body: JSON.stringify({ accountNumber: account.trim() }),
      });
      const j = await res.json();
      if (!res.ok) setLookupError(res.status === 404 ? "No customer with that account number." : j.detail || "Lookup failed.");
      else setCustomer(j);
    } catch { setLookupError("Network error — try again."); }
    setLookupBusy(false);
  };

  // ── Items ──
  const [items, setItems] = useState<Item[]>([]);
  const addItem = (label: string) => setItems((p) => [...p, { label: label === "Other" ? "" : label, amountGyd: "" }]);
  const setItem = (idx: number, patch: Partial<Item>) => setItems((p) => p.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const removeItem = (idx: number) => setItems((p) => p.filter((_, i) => i !== idx));
  const total = items.reduce((s, i) => s + (Number(i.amountGyd) || 0), 0);

  const [techName, setTechName] = useState("");

  // ── Signature pad ──
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasSig, setHasSig] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !unlocked) return;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const data = canvas.toDataURL();
      canvas.width = r.width * 2; canvas.height = 150 * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(2, 2);
      ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#1a1a1a";
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, r.width, 150);
      img.src = data;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [unlocked]);

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const startDraw = (e: React.PointerEvent) => {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.beginPath(); ctx.moveTo(p.x, p.y);
  };
  const draw = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y); ctx.stroke();
    setHasSig(true);
  };
  const endDraw = () => { drawing.current = false; };
  const clearSig = () => {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
  };

  // ── Submit ──
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    customerName: string; customerPhone: string | null; totalGyd: number;
    items: { label: string; amountGyd: number }[]; uispRecorded: boolean;
  } | null>(null);

  const validItems = items.filter((i) => i.label.trim() && Number(i.amountGyd) > 0);
  const valid = Boolean(customer) && validItems.length > 0 && techName.trim() && hasSig;

  const submit = useCallback(async () => {
    if (!valid || loading) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/v1/field/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-install-code": code },
        body: JSON.stringify({
          accountNumber: account.trim(),
          items: validItems.map((i) => ({ label: i.label.trim(), amountGyd: Number(i.amountGyd) })),
          technicianName: techName.trim(),
          subscriberSignature: hasSig ? canvasRef.current!.toDataURL("image/png") : null,
        }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.detail || j.error || "Something went wrong — try again."); setLoading(false); return; }
      setResult(j);
    } catch { setError("Network error — payment NOT recorded. Try again."); }
    setLoading(false);
  }, [valid, loading, code, account, validItems, techName, hasSig]);

  const receiptText = () => {
    if (!result) return "";
    const lines = result.items.map((i) => `• ${i.label} — ${gyd(i.amountGyd)}`).join("\n");
    return (
      `🧾 *Evolve Wireless Internet — Payment Receipt*\n\n` +
      `Account: ${account.trim().toUpperCase()}\n` +
      `Name: ${result.customerName}\n` +
      `Date: ${today()}\n\n` +
      `${lines}\n\n` +
      `*Total Paid: ${gyd(result.totalGyd)}* (cash)\n` +
      `Collected by: ${techName.trim()} (Evolve technician)\n\n` +
      `This payment has been recorded on your account.\n` +
      `Need help anytime? Chat with our support agent on WhatsApp: wa.me/5927346480\n` +
      `Technical Support: 609-2487`
    );
  };

  const reset = () => {
    setResult(null); setCustomer(null); setAccount(""); setItems([]); setError("");
    setHasSig(false);
    setTimeout(() => { const c = canvasRef.current; if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height); }, 50);
  };

  // ── Render ──
  if (checkingGate) return <Shell><div style={{ textAlign: "center", padding: 60, color: BROWN }}>Loading…</div></Shell>;

  if (!unlocked) {
    return (
      <Shell>
        <div style={{ maxWidth: 360, margin: "60px auto", textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>💵</div>
          <h1 style={{ color: GREEN, fontSize: 22, margin: "10px 0 4px" }}>Field Payments</h1>
          <p style={{ color: "#888", fontSize: 14, marginBottom: 18 }}>Enter the field code to continue.</p>
          <input style={{ ...inp, textAlign: "center", fontSize: 22, letterSpacing: 6 }} inputMode="numeric"
            value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && tryUnlock()} />
          {gateError && <div style={{ color: "#B42318", fontSize: 13, marginTop: 8 }}>{gateError}</div>}
          <button onClick={tryUnlock} disabled={gateBusy || !code.trim()}
            style={{ width: "100%", marginTop: 14, padding: 14, borderRadius: 12, border: "none", background: GREEN, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
            {gateBusy ? "Checking…" : "Unlock"}
          </button>
        </div>
      </Shell>
    );
  }

  if (result) {
    const phone = result.customerPhone || customer?.phone || "";
    return (
      <Shell>
        <div style={{ maxWidth: 460, margin: "30px auto", textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h1 style={{ color: GREEN, fontSize: 24, margin: "8px 0 2px" }}>Payment Recorded</h1>
          <p style={{ color: BROWN, fontSize: 15 }}>{result.customerName} · {account.trim().toUpperCase()}</p>

          <div style={{ background: "#fff", border: "2px solid " + GREEN, borderRadius: 14, padding: 18, margin: "16px 0" }}>
            <div style={{ fontSize: 13, color: "#888" }}>Total collected (cash)</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: GREEN }}>{gyd(result.totalGyd)}</div>
            <div style={{ fontSize: 13, color: BROWN, marginTop: 6 }}>
              {result.items.map((i) => i.label).join(", ")}
            </div>
            {!result.uispRecorded && (
              <div style={{ marginTop: 10, fontSize: 12, background: "#FFF4E5", color: "#8a5a00", borderRadius: 8, padding: "6px 10px" }}>
                ⚠️ Saved, but UISP didn&rsquo;t record it — office will add it manually.
              </div>
            )}
          </div>

          <div style={{ background: "#FFF8E8", border: "1px solid #E9B44C", borderRadius: 12, padding: "10px 14px", fontSize: 14, color: BROWN, marginBottom: 16 }}>
            💰 <b>{techName.trim()}</b>: bring <b>{gyd(result.totalGyd)}</b> to the office. Billing has been notified.
          </div>

          {phone && (
            <a href={`https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(receiptText())}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "block", padding: 15, borderRadius: 12, background: "#25D366", color: "#fff", fontSize: 16, fontWeight: 700, textDecoration: "none", marginBottom: 10 }}>
              💬 Send Receipt on WhatsApp
            </a>
          )}
          <button onClick={reset}
            style={{ width: "100%", padding: 14, borderRadius: 12, border: "2px solid " + GREEN, background: "#fff", color: GREEN, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            + New Payment
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "18px 0 6px" }}>
          <h1 style={{ color: GREEN, fontSize: 22, margin: 0 }}>💵 Field Payment</h1>
          <button onClick={lock} title="Lock" style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>🔒</button>
        </div>
        <p style={{ color: "#888", fontSize: 13, marginTop: 0 }}>Parts &amp; service collections — recorded straight to the customer&rsquo;s account.</p>

        <Section title="Customer">
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...inp, textTransform: "uppercase" }} placeholder="Account No. (e.g. E10234 / MA1191)"
              value={account} onChange={(e) => { setAccount(e.target.value); setCustomer(null); }}
              onKeyDown={(e) => e.key === "Enter" && lookup()} />
            <button onClick={lookup} disabled={lookupBusy || !account.trim()}
              style={{ padding: "0 18px", borderRadius: 10, border: "none", background: GREEN, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}>
              {lookupBusy ? "…" : "Find"}
            </button>
          </div>
          {lookupError && <div style={{ color: "#B42318", fontSize: 13 }}>{lookupError}</div>}
          {customer && (
            <div style={{ background: "#F0F7F2", border: "2px solid " + GREEN, borderRadius: 10, padding: "10px 13px", fontSize: 14, color: BROWN }}>
              ✓ <b>{customer.name}</b>{customer.phone ? ` · ${customer.phone}` : ""}
            </div>
          )}
        </Section>

        <Section title="What are they paying for?">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {QUICK_ITEMS.map((q) => (
              <button key={q} onClick={() => addItem(q)}
                style={{ padding: "8px 13px", borderRadius: 100, border: "1.5px solid " + GREEN, background: "#fff", color: GREEN, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                + {q}
              </button>
            ))}
          </div>
          {items.map((it, idx) => (
            <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input style={{ ...inp, flex: 2 }} placeholder="Item" value={it.label} onChange={(e) => setItem(idx, { label: e.target.value })} />
              <input style={{ ...inp, flex: 1 }} placeholder="GYD" inputMode="numeric" value={it.amountGyd}
                onChange={(e) => setItem(idx, { amountGyd: e.target.value.replace(/[^\d]/g, "") })} />
              <button onClick={() => removeItem(idx)} style={{ border: "none", background: "none", color: "#B42318", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
          ))}
          {items.length > 0 && (
            <div style={{ textAlign: "right", fontSize: 17, fontWeight: 800, color: GREEN }}>Total: {gyd(total)}</div>
          )}
        </Section>

        <Section title="Technician (responsible for funds)">
          <input style={inp} placeholder="Your name" value={techName} onChange={(e) => setTechName(e.target.value)} />
        </Section>

        <Section title="Customer Signature">
          <canvas ref={canvasRef}
            onPointerDown={startDraw} onPointerMove={draw} onPointerUp={endDraw} onPointerLeave={endDraw}
            style={{ width: "100%", height: 150, background: "#fff", border: "1.5px dashed #bbb", borderRadius: 10, touchAction: "none" }} />
          <button onClick={clearSig} style={{ alignSelf: "flex-end", background: "none", border: "none", color: "#888", fontSize: 13, cursor: "pointer" }}>Clear</button>
        </Section>

        {error && <div style={{ background: "#FDECEA", color: "#B42318", borderRadius: 10, padding: "10px 14px", fontSize: 14, margin: "10px 0" }}>{error}</div>}

        <button onClick={submit} disabled={!valid || loading}
          style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", fontSize: 17, fontWeight: 800, color: "#fff", background: valid && !loading ? GREEN : "#B9C6BE", cursor: valid ? "pointer" : "not-allowed", margin: "6px 0 40px" }}>
          {loading ? "Recording…" : total > 0 ? `Collect ${gyd(total)}` : "Collect Payment"}
        </button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: "100vh", background: CREAM, padding: "0 16px 30px", fontFamily: "system-ui, -apple-system, sans-serif" }}>{children}</div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 16, margin: "12px 0", border: "1px solid #eadfce", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#4A3728", textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</div>
      {children}
    </div>
  );
}
