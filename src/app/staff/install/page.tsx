"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";

const PLANS: Record<string, Array<{ id: string; name: string; price_gyd: number; speed_down_mbps: number }>> = {
  ecd: [
    { id: "ecd-starter", name: "ECD Starter", price_gyd: 5000, speed_down_mbps: 10 },
    { id: "ecd-family", name: "ECD Family", price_gyd: 8000, speed_down_mbps: 25 },
    { id: "ecd-power", name: "ECD Power", price_gyd: 10000, speed_down_mbps: 50 },
  ],
  region1: [
    { id: "r1-essential", name: "R1 Essential", price_gyd: 10000, speed_down_mbps: 5 },
    { id: "r1-standard", name: "R1 Standard", price_gyd: 15000, speed_down_mbps: 15 },
    { id: "r1-premium", name: "R1 Premium", price_gyd: 25000, speed_down_mbps: 30 },
  ],
};

const GREEN = "#1F6F3D";
const BROWN = "#4A3728";

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Guyana" }); // YYYY-MM-DD

function waNumber(raw: string) {
  let d = (raw || "").replace(/\D/g, "");
  if (d.startsWith("592")) return d;
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length === 7) return "592" + d;
  return d;
}

type Result = { accountNumber: string | null; contractUrl: string; uispConnected: boolean; uispError: string | null };

export default function InstallPage() {
  const [region, setRegion] = useState("ecd");
  const [planId, setPlanId] = useState("");
  const [form, setForm] = useState({
    fullName: "", phone: "", email: "", village: "", address: "",
    equipment: "Ubiquiti LiteBeam AC Gen2",
    wifiName: "", wifiPassword: "", landlordName: "", technicianName: "",
    installDate: today(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const plans = PLANS[region] || PLANS.ecd;
  const plan = plans.find((p) => p.id === planId);

  const valid = form.fullName.trim() && form.phone.trim() && form.address.trim() && planId;

  // ── Signature pad ──
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasSig, setHasSig] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    ctx.scale(ratio, ratio);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const startDraw = (e: React.PointerEvent) => {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const moveDraw = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSig(true);
  };
  const endDraw = () => { drawing.current = false; };
  const clearSig = () => {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
  };

  const submit = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const signature = hasSig ? canvasRef.current!.toDataURL("image/png") : null;
      const res = await fetch("/api/v1/field/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          region,
          village: form.village,
          address: form.address,
          planId,
          planName: plan?.name,
          monthlyGyd: plan?.price_gyd,
          baseMbps: plan?.speed_down_mbps,
          installFeeGyd: 20000,
          equipment: form.equipment,
          wifiName: form.wifiName,
          wifiPassword: form.wifiPassword,
          landlordName: form.landlordName,
          technicianName: form.technicianName,
          installDate: form.installDate,
          subscriberSignature: signature,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.detail || json.error || "Signup failed");
      setResult({
        accountNumber: json.accountNumber,
        contractUrl: json.contractUrl,
        uispConnected: json.uispConnected,
        uispError: json.uispError,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [form, region, planId, plan, hasSig]);

  // ── Success screen ──
  if (result) {
    const first = form.fullName.trim().split(" ")[0];
    const acct = result.accountNumber || "(pending activation)";
    const msg =
      `Welcome to Evolve Wireless, ${first}! 🎉\n\n` +
      `Your account number is *${acct}* — use this for MMG payments.\n` +
      `Plan: ${plan?.name} — GYD ${plan?.price_gyd.toLocaleString("en-GY")}/month.\n` +
      (form.wifiName ? `WiFi: ${form.wifiName}${form.wifiPassword ? ` / ${form.wifiPassword}` : ""}\n` : "") +
      `\nYour service agreement: ${result.contractUrl}\n\n` +
      `Technical Support: 609-2487`;
    const waLink = `https://wa.me/${waNumber(form.phone)}?text=${encodeURIComponent(msg)}`;

    return (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h1 style={{ color: GREEN, fontSize: 22, margin: "8px 0" }}>Customer Signed Up</h1>
          <p style={{ color: BROWN }}>{form.fullName} — {plan?.name}</p>
        </div>

        {!result.uispConnected && (
          <div style={{ background: "#FFF4E5", border: "1px solid #F0C070", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: "#8a5a00" }}>
            ⚠️ Saved, but UISP isn&rsquo;t connected yet — the account number is pending. Add the UISP CRM App Key in Vercel and this install can be synced.
            {result.uispError ? <div style={{ marginTop: 6, opacity: 0.8 }}>Detail: {result.uispError}</div> : null}
          </div>
        )}

        <div style={{ background: "#F5F1EA", borderRadius: 12, padding: 18, marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: BROWN, textTransform: "uppercase", letterSpacing: 1 }}>Account Number (MMG)</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: GREEN, letterSpacing: 1 }}>{acct}</div>
          <button
            onClick={() => { navigator.clipboard?.writeText(result.accountNumber || ""); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            style={{ marginTop: 6, background: "none", border: "none", color: GREEN, cursor: "pointer", fontSize: 13, textDecoration: "underline" }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <a href={waLink} target="_blank" rel="noopener noreferrer"
          style={{ display: "block", textAlign: "center", background: "#25D366", color: "#fff", padding: "16px", borderRadius: 12, fontWeight: 700, fontSize: 16, textDecoration: "none", marginBottom: 12 }}>
          Send Contract on WhatsApp
        </a>

        <a href={result.contractUrl} target="_blank" rel="noopener noreferrer"
          style={{ display: "block", textAlign: "center", background: "#fff", color: GREEN, padding: "14px", borderRadius: 12, fontWeight: 600, fontSize: 15, textDecoration: "none", border: `1.5px solid ${GREEN}`, marginBottom: 12 }}>
          Open Contract
        </a>

        <button onClick={() => { setResult(null); setPlanId(""); setForm({ ...form, fullName: "", phone: "", email: "", village: "", address: "", wifiName: "", wifiPassword: "", landlordName: "" }); clearSig(); }}
          style={{ display: "block", width: "100%", background: "none", border: "none", color: BROWN, padding: 12, cursor: "pointer", fontSize: 14 }}>
          + Sign up another customer
        </button>
      </div>
    );
  }

  // ── Form ──
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ color: GREEN, fontSize: 22, margin: 0 }}>New Install Sign-Up</h1>
        <Link href="/staff" style={{ color: BROWN, fontSize: 13 }}>← Portal</Link>
      </div>
      <p style={{ color: BROWN, fontSize: 14, marginBottom: 20 }}>
        Complete this after the installation is done. The customer gets their account number and contract on WhatsApp.
      </p>

      <Section title="Customer">
        <Field label="Full Name *"><input style={inp} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} /></Field>
        <Field label="WhatsApp Number *"><input style={inp} inputMode="tel" placeholder="592XXXXXXX" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="Email (optional)"><input style={inp} inputMode="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
      </Section>

      <Section title="Service Address">
        <Field label="Region">
          <select style={inp} value={region} onChange={(e) => { setRegion(e.target.value); setPlanId(""); }}>
            <option value="ecd">East Coast Demerara</option>
            <option value="region1">Region 1</option>
          </select>
        </Field>
        <Field label="Village / Area"><input style={inp} value={form.village} onChange={(e) => set("village", e.target.value)} /></Field>
        <Field label="Address *"><input style={inp} value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
      </Section>

      <Section title="Plan">
        <div style={{ display: "grid", gap: 8 }}>
          {plans.map((p) => (
            <button key={p.id} onClick={() => setPlanId(p.id)}
              style={{
                textAlign: "left", padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                border: planId === p.id ? `2px solid ${GREEN}` : "1.5px solid #ddd",
                background: planId === p.id ? "#F0F7F2" : "#fff",
              }}>
              <div style={{ fontWeight: 700, color: BROWN }}>{p.name} <span style={{ color: GREEN }}>· GYD {p.price_gyd.toLocaleString("en-GY")}/mo</span></div>
              <div style={{ fontSize: 12, color: "#888" }}>{p.speed_down_mbps} Mbps · Install fee GYD 20,000</div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Equipment & Router">
        <Field label="Equipment">
          <select style={inp} value={form.equipment} onChange={(e) => set("equipment", e.target.value)}>
            <option>Ubiquiti LiteBeam AC Gen2</option>
            <option>Ubiquiti NanoStation Gen2</option>
          </select>
        </Field>
        <Field label="WiFi Name"><input style={inp} value={form.wifiName} onChange={(e) => set("wifiName", e.target.value)} /></Field>
        <Field label="WiFi Password"><input style={inp} value={form.wifiPassword} onChange={(e) => set("wifiPassword", e.target.value)} /></Field>
      </Section>

      <Section title="Install Details">
        <Field label="Technician Name"><input style={inp} value={form.technicianName} onChange={(e) => set("technicianName", e.target.value)} /></Field>
        <Field label="Install Date"><input style={inp} type="date" value={form.installDate} onChange={(e) => set("installDate", e.target.value)} /></Field>
        <Field label="Landlord Name (if applicable)"><input style={inp} value={form.landlordName} onChange={(e) => set("landlordName", e.target.value)} /></Field>
      </Section>

      <Section title="Customer Signature">
        <div style={{ border: "1.5px dashed #bbb", borderRadius: 10, background: "#fff", touchAction: "none" }}>
          <canvas ref={canvasRef}
            onPointerDown={startDraw} onPointerMove={moveDraw} onPointerUp={endDraw} onPointerLeave={endDraw}
            style={{ width: "100%", height: 140, display: "block", touchAction: "none" }} />
        </div>
        <button onClick={clearSig} style={{ background: "none", border: "none", color: BROWN, fontSize: 13, marginTop: 6, cursor: "pointer", textDecoration: "underline" }}>Clear</button>
      </Section>

      {error && <div style={{ background: "#FDECEA", color: "#B42318", padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 14 }}>{error}</div>}

      <button onClick={submit} disabled={!valid || loading}
        style={{
          width: "100%", padding: 16, borderRadius: 12, border: "none", fontSize: 16, fontWeight: 700,
          color: "#fff", background: valid && !loading ? GREEN : "#B9C6BE",
          cursor: valid && !loading ? "pointer" : "not-allowed",
        }}>
        {loading ? "Signing up…" : "Complete Sign-Up"}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#1F6F3D", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>{title}</div>
      <div style={{ display: "grid", gap: 12 }}>{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 13, color: "#4A3728", marginBottom: 4 }}>{label}</div>
      {children}
    </label>
  );
}
const inp: React.CSSProperties = {
  width: "100%", padding: "11px 12px", borderRadius: 9, border: "1.5px solid #ddd",
  fontSize: 15, color: "#4A3728", background: "#fff", boxSizing: "border-box",
};
