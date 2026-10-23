"use client";

import { useCallback, useEffect, useState } from "react";

const GREEN = "#1F6F3D";
const BROWN = "#4A3728";
const CREAM = "#FAF5EC";

const EQUIP_ITEMS = ["Dish", "Router", "POE", "Cable", "Pipe", "Clamps", "Other"];

type EquipRow = { item: string; qty: string };
type Sheet = {
  id: string; created_at: string; sheet_date: string; technician_name: string;
  cash_advance_gyd: number; cash_purpose: string | null;
  equipment_taken: { item: string; qty: number }[];
  paymentsCount: number; paymentsTotal: number;
  paymentsItems: { label: string; amountGyd: number }[];
};

const inp: React.CSSProperties = {
  width: "100%", padding: "12px 13px", borderRadius: 10, border: "1.5px solid #ddd",
  fontSize: 16, color: BROWN, background: "#fff", outline: "none", boxSizing: "border-box",
};
const gyd = (n: number) => "GYD " + Math.round(n).toLocaleString("en-US");

export default function DaySheetPage() {
  // ── Shared field-code gate ──
  const [unlocked, setUnlocked] = useState(false);
  const [checkingGate, setCheckingGate] = useState(true);
  const [code, setCode] = useState("");
  const [gateError, setGateError] = useState("");
  const [gateBusy, setGateBusy] = useState(false);
  const [techs, setTechs] = useState<string[]>([]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("evolve_install_code") : null;
    if (!saved) { setCheckingGate(false); return; }
    fetch("/api/v1/field/verify-code", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: saved }),
    })
      .then((r) => r.json())
      .then((j) => { if (j.ok) { setCode(saved); setUnlocked(true); setTechs(j.technicians || []); } else { localStorage.removeItem("evolve_install_code"); } })
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
      if (j.ok) { localStorage.setItem("evolve_install_code", code.trim()); setUnlocked(true); setTechs(j.technicians || []); }
      else setGateError("Wrong code — check with the office.");
    } catch { setGateError("Network error — try again."); }
    setGateBusy(false);
  };

  // ── Mode ──
  const [mode, setMode] = useState<"start" | "close">("start");

  // ── Start form ──
  const [tech, setTech] = useState("");
  const [cash, setCash] = useState("");
  const [purpose, setPurpose] = useState("");
  const [equip, setEquip] = useState<EquipRow[]>([]);
  const addEquip = (item: string) => setEquip((p) => [...p, { item: item === "Other" ? "" : item, qty: "1" }]);
  const setEq = (i: number, patch: Partial<EquipRow>) => setEquip((p) => p.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const rmEq = (i: number) => setEquip((p) => p.filter((_, idx) => idx !== i));

  const [startBusy, setStartBusy] = useState(false);
  const [startErr, setStartErr] = useState("");
  const [startDone, setStartDone] = useState<{ cash: number; equip: { item: string; qty: number }[] } | null>(null);

  const validEquip = equip.filter((e) => e.item.trim() && Number(e.qty) > 0);
  const startValid = tech.trim() && (Number(cash) > 0 || validEquip.length > 0);

  const submitStart = useCallback(async () => {
    if (!startValid || startBusy) return;
    setStartBusy(true); setStartErr("");
    try {
      const res = await fetch("/api/v1/field/day/start", {
        method: "POST", headers: { "Content-Type": "application/json", "x-install-code": code },
        body: JSON.stringify({
          technicianName: tech.trim(),
          cashAdvanceGyd: Number(cash) || 0,
          cashPurpose: purpose.trim(),
          equipment: validEquip.map((e) => ({ item: e.item.trim(), qty: Number(e.qty) })),
        }),
      });
      const j = await res.json();
      if (!res.ok) { setStartErr(j.detail || j.error || "Failed — try again."); setStartBusy(false); return; }
      setStartDone({ cash: Number(cash) || 0, equip: validEquip.map((e) => ({ item: e.item.trim(), qty: Number(e.qty) })) });
    } catch { setStartErr("Network error — try again."); }
    setStartBusy(false);
  }, [startValid, startBusy, code, tech, cash, purpose, validEquip]);

  const resetStart = () => { setStartDone(null); setTech(""); setCash(""); setPurpose(""); setEquip([]); };

  // ── Close flow ──
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [sheetsBusy, setSheetsBusy] = useState(false);
  const [active, setActive] = useState<Sheet | null>(null);
  const [retQty, setRetQty] = useState<Record<string, string>>({});
  const [receipts, setReceipts] = useState("");
  const [cashBack, setCashBack] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [closeBusy, setCloseBusy] = useState(false);
  const [closeErr, setCloseErr] = useState("");
  const [closeDone, setCloseDone] = useState<{ collectionsTotal: number; collectionsCount: number; cashDiff: number } | null>(null);

  const loadSheets = useCallback(async () => {
    setSheetsBusy(true);
    try {
      const res = await fetch("/api/v1/field/day/open", { headers: { "x-install-code": code } });
      const j = await res.json();
      if (res.ok) setSheets(j.sheets || []);
    } catch { /* retry on tab switch */ }
    setSheetsBusy(false);
  }, [code]);

  useEffect(() => { if (unlocked && mode === "close") loadSheets(); }, [unlocked, mode, loadSheets]);

  const openCloseForm = (s: Sheet) => {
    setActive(s);
    const q: Record<string, string> = {};
    for (const t of s.equipment_taken) q[t.item] = String(t.qty);
    setRetQty(q); setReceipts(""); setCashBack(""); setCloseNotes(""); setCloseErr(""); setCloseDone(null);
  };

  // Approximate "sold" count per item from the tech's field payments.
  const soldCount = (item: string) =>
    (active?.paymentsItems || []).filter((p) => (p.label || "").toLowerCase().includes(item.toLowerCase())).length;

  const cashDiffLive = active
    ? Math.round(Number(active.cash_advance_gyd) - (Number(receipts) || 0) - (Number(cashBack) || 0))
    : 0;

  const submitClose = useCallback(async () => {
    if (!active || closeBusy) return;
    setCloseBusy(true); setCloseErr("");
    try {
      const res = await fetch("/api/v1/field/day/close", {
        method: "POST", headers: { "Content-Type": "application/json", "x-install-code": code },
        body: JSON.stringify({
          id: active.id,
          equipmentReturned: active.equipment_taken.map((t) => ({ item: t.item, qty: Number(retQty[t.item]) || 0 })),
          purchasesGyd: Number(receipts) || 0,
          cashReturnedGyd: Number(cashBack) || 0,
          notes: closeNotes.trim(),
        }),
      });
      const j = await res.json();
      if (!res.ok) { setCloseErr(j.detail || j.error || "Failed — try again."); setCloseBusy(false); return; }
      setCloseDone(j);
      loadSheets();
    } catch { setCloseErr("Network error — try again."); }
    setCloseBusy(false);
  }, [active, closeBusy, code, retQty, receipts, cashBack, closeNotes, loadSheets]);

  // ── Render ──
  if (checkingGate) return <Shell><div style={{ textAlign: "center", padding: 60, color: BROWN }}>Loading…</div></Shell>;

  if (!unlocked) {
    return (
      <Shell>
        <div style={{ maxWidth: 360, margin: "60px auto", textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>🌅</div>
          <h1 style={{ color: GREEN, fontSize: 22, margin: "10px 0 4px" }}>Tech Day Sheet</h1>
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

  return (
    <Shell>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1 style={{ color: GREEN, fontSize: 22, margin: "18px 0 10px" }}>Tech Day Sheet</h1>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 6 }}>
          <button onClick={() => setMode("start")} style={tabStyle(mode === "start")}>🌅 Start Day</button>
          <button onClick={() => { setMode("close"); setActive(null); setCloseDone(null); }} style={tabStyle(mode === "close")}>🌇 Close Day</button>
        </div>

        {mode === "start" && !startDone && (
          <>
            <Section title="Technician">
              {techs.length ? (
                <select style={inp} value={tech} onChange={(e) => setTech(e.target.value)}>
                  <option value="">Select technician…</option>
                  {techs.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : (
                <input style={inp} placeholder="Your name" value={tech} onChange={(e) => setTech(e.target.value)} />
              )}
            </Section>
            <Section title="Cash for purchases">
              <input style={inp} placeholder="Amount (GYD)" inputMode="numeric" value={cash}
                onChange={(e) => setCash(e.target.value.replace(/[^\d]/g, ""))} />
              <input style={inp} placeholder="For what? (pipes, tape, gas…)" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            </Section>
            <Section title="Equipment taken">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {EQUIP_ITEMS.map((q) => (
                  <button key={q} onClick={() => addEquip(q)}
                    style={{ padding: "8px 13px", borderRadius: 100, border: "1.5px solid " + GREEN, background: "#fff", color: GREEN, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    + {q}
                  </button>
                ))}
              </div>
              {equip.map((e, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input style={{ ...inp, flex: 2 }} placeholder="Item" value={e.item} onChange={(ev) => setEq(i, { item: ev.target.value })} />
                  <input style={{ ...inp, flex: 1 }} placeholder="Qty" inputMode="numeric" value={e.qty}
                    onChange={(ev) => setEq(i, { qty: ev.target.value.replace(/[^\d]/g, "") })} />
                  <button onClick={() => rmEq(i)} style={{ border: "none", background: "none", color: "#B42318", fontSize: 18, cursor: "pointer" }}>✕</button>
                </div>
              ))}
            </Section>
            {startErr && <div style={{ background: "#FDECEA", color: "#B42318", borderRadius: 10, padding: "10px 14px", fontSize: 14, margin: "10px 0" }}>{startErr}</div>}
            <button onClick={submitStart} disabled={!startValid || startBusy}
              style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", fontSize: 17, fontWeight: 800, color: "#fff", background: startValid && !startBusy ? GREEN : "#B9C6BE", cursor: startValid ? "pointer" : "not-allowed", margin: "6px 0 40px" }}>
              {startBusy ? "Saving…" : "Start My Day"}
            </button>
          </>
        )}

        {mode === "start" && startDone && (
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <div style={{ fontSize: 48 }}>✅</div>
            <h2 style={{ color: GREEN, margin: "8px 0 4px" }}>Day started — safe travels!</h2>
            <p style={{ color: BROWN, fontSize: 14 }}>
              {startDone.cash > 0 && <>Cash advance: <b>{gyd(startDone.cash)}</b> — keep every purchase receipt.<br /></>}
              {startDone.equip.length > 0 && <>Equipment: {startDone.equip.map((e) => `${e.qty}× ${e.item}`).join(", ")}<br /></>}
              Close your day on this page before leaving HQ this evening.
            </p>
            <button onClick={resetStart}
              style={{ marginTop: 12, padding: "12px 22px", borderRadius: 12, border: "2px solid " + GREEN, background: "#fff", color: GREEN, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              + Another Tech
            </button>
          </div>
        )}

        {mode === "close" && !active && (
          <Section title="Open day sheets">
            {sheetsBusy && <div style={{ color: "#888", fontSize: 14 }}>Loading…</div>}
            {!sheetsBusy && sheets.length === 0 && <div style={{ color: "#888", fontSize: 14 }}>No open day sheets. 🎉</div>}
            {sheets.map((s) => (
              <button key={s.id} onClick={() => openCloseForm(s)}
                style={{ textAlign: "left", padding: 13, borderRadius: 10, border: "1.5px solid #ddd", background: "#fff", cursor: "pointer" }}>
                <div style={{ fontWeight: 700, color: BROWN }}>{s.technician_name} <span style={{ color: "#888", fontWeight: 400, fontSize: 12 }}>· {s.sheet_date}</span></div>
                <div style={{ fontSize: 13, color: "#888" }}>
                  {Number(s.cash_advance_gyd) > 0 ? `${gyd(Number(s.cash_advance_gyd))} advance` : "no cash"} ·{" "}
                  {s.equipment_taken.length ? s.equipment_taken.map((t) => `${t.qty}× ${t.item}`).join(", ") : "no equipment"} ·{" "}
                  {s.paymentsCount} payment{s.paymentsCount === 1 ? "" : "s"} today ({gyd(s.paymentsTotal)})
                </div>
              </button>
            ))}
          </Section>
        )}

        {mode === "close" && active && !closeDone && (
          <>
            <Section title={`Closing — ${active.technician_name}`}>
              <div style={{ fontSize: 13, color: "#888" }}>Opened {active.sheet_date}. Count everything together at the desk.</div>
            </Section>

            {active.equipment_taken.length > 0 && (
              <Section title="Equipment back">
                {active.equipment_taken.map((t) => {
                  const sold = soldCount(t.item);
                  const back = Number(retQty[t.item]) || 0;
                  const unacc = t.qty - back - sold;
                  return (
                    <div key={t.item}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ flex: 2, fontSize: 15, color: BROWN }}>{t.item} <span style={{ color: "#888", fontSize: 12 }}>(took {t.qty})</span></div>
                        <input style={{ ...inp, flex: 1 }} inputMode="numeric" value={retQty[t.item] ?? ""}
                          onChange={(e) => setRetQty((p) => ({ ...p, [t.item]: e.target.value.replace(/[^\d]/g, "") }))} />
                      </div>
                      <div style={{ fontSize: 12, color: unacc > 0 ? "#8a5a00" : "#888", marginTop: 2 }}>
                        {sold > 0 && `${sold} sold to customers (per payments). `}
                        {unacc > 0 ? `⚠️ ${unacc} unaccounted — add a note below.` : unacc < 0 ? "" : "✓ accounted for"}
                      </div>
                    </div>
                  );
                })}
              </Section>
            )}

            <Section title="Purchase cash">
              <div style={{ fontSize: 13, color: "#888" }}>Advance given: <b>{gyd(Number(active.cash_advance_gyd))}</b>{active.cash_purpose ? ` — ${active.cash_purpose}` : ""}</div>
              <input style={inp} placeholder="Receipts total (GYD)" inputMode="numeric" value={receipts}
                onChange={(e) => setReceipts(e.target.value.replace(/[^\d]/g, ""))} />
              <input style={inp} placeholder="Cash returned / change (GYD)" inputMode="numeric" value={cashBack}
                onChange={(e) => setCashBack(e.target.value.replace(/[^\d]/g, ""))} />
              <div style={{ fontSize: 13, fontWeight: 700, color: cashDiffLive === 0 ? GREEN : "#8a5a00" }}>
                {cashDiffLive === 0 ? "✓ Purchase cash balanced" : cashDiffLive > 0 ? `⚠️ ${gyd(cashDiffLive)} unaccounted` : `⚠️ ${gyd(Math.abs(cashDiffLive))} returned over advance`}
              </div>
            </Section>

            <Section title="Customer collections to hand in">
              <div style={{ fontSize: 15, color: BROWN }}>
                <b>{gyd(active.paymentsTotal)}</b> from {active.paymentsCount} payment{active.paymentsCount === 1 ? "" : "s"} today
              </div>
              {active.paymentsItems.length > 0 && (
                <div style={{ fontSize: 12, color: "#888" }}>{active.paymentsItems.map((p) => p.label).join(", ")}</div>
              )}
            </Section>

            <Section title="Notes (optional)">
              <input style={inp} placeholder="e.g. 1 router left installed for tomorrow's job" value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} />
            </Section>

            {closeErr && <div style={{ background: "#FDECEA", color: "#B42318", borderRadius: 10, padding: "10px 14px", fontSize: 14, margin: "10px 0" }}>{closeErr}</div>}
            <button onClick={submitClose} disabled={closeBusy}
              style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", fontSize: 17, fontWeight: 800, color: "#fff", background: closeBusy ? "#B9C6BE" : GREEN, cursor: "pointer", margin: "6px 0 10px" }}>
              {closeBusy ? "Closing…" : "Close Day"}
            </button>
            <button onClick={() => setActive(null)}
              style={{ width: "100%", padding: 12, borderRadius: 12, border: "2px solid #ddd", background: "#fff", color: "#888", fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 40 }}>
              ← Back to open sheets
            </button>
          </>
        )}

        {mode === "close" && closeDone && (
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <div style={{ fontSize: 48 }}>🌇</div>
            <h2 style={{ color: GREEN, margin: "8px 0 4px" }}>Day closed</h2>
            <div style={{ background: "#fff", border: "2px solid " + GREEN, borderRadius: 14, padding: 16, margin: "14px 0", textAlign: "left", fontSize: 14, color: BROWN }}>
              <div>Purchase cash: {closeDone.cashDiff === 0 ? "✓ balanced" : `⚠️ ${gyd(Math.abs(closeDone.cashDiff))} ${closeDone.cashDiff > 0 ? "unaccounted" : "over-returned"}`}</div>
              <div style={{ marginTop: 6 }}>Hand in from customer collections: <b>{gyd(closeDone.collectionsTotal)}</b> ({closeDone.collectionsCount} payment{closeDone.collectionsCount === 1 ? "" : "s"})</div>
            </div>
            <p style={{ color: "#888", fontSize: 13 }}>Billing has the full reconciliation in Slack.</p>
            <button onClick={() => { setActive(null); setCloseDone(null); loadSheets(); }}
              style={{ marginTop: 6, padding: "12px 22px", borderRadius: 12, border: "2px solid " + GREEN, background: "#fff", color: GREEN, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Close another sheet
            </button>
          </div>
        )}
      </div>
    </Shell>
  );
}

const tabStyle = (on: boolean): React.CSSProperties => ({
  padding: 13, borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer",
  border: on ? "2px solid " + GREEN : "1.5px solid #ddd",
  background: on ? "#F0F7F2" : "#fff", color: on ? GREEN : "#888",
});

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
