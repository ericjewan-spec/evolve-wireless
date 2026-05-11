"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

const supabase = createClient();

export default function ClockPage() {
  const [pin, setPin] = useState("");
  const [employee, setEmployee] = useState<{ id: string; first_name: string; last_name: string; role: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "clocked_in" | "clocked_out" | "error">("idle");
  const [message, setMessage] = useState("");
  const [todayRecord, setTodayRecord] = useState<{ clock_in: string; clock_out: string | null } | null>(null);

  async function handlePin() {
    if (pin.length !== 4) return;
    setStatus("loading");
    setMessage("");

    // Look up employee by PIN
    const { data: emp } = await supabase.from("employees").select("id, first_name, last_name, role").eq("pin_code", pin).eq("status", "active").single();

    if (!emp) {
      setStatus("error");
      setMessage("Invalid PIN. Please try again.");
      setPin("");
      return;
    }

    setEmployee(emp);

    // Check today's attendance
    const today = new Date().toISOString().split("T")[0];
    const { data: att } = await supabase.from("attendance").select("*").eq("employee_id", emp.id).eq("date", today).single();

    if (att) {
      setTodayRecord({ clock_in: att.clock_in, clock_out: att.clock_out });
      if (att.clock_out) {
        setStatus("clocked_out");
        setMessage(`Already clocked out today at ${new Date(att.clock_out).toLocaleTimeString("en-GY", { hour: "2-digit", minute: "2-digit" })}`);
      } else {
        // Clock out
        const now = new Date().toISOString();
        await supabase.from("attendance").update({ clock_out: now }).eq("id", att.id);
        const hours = ((new Date(now).getTime() - new Date(att.clock_in).getTime()) / 3600000).toFixed(1);
        setStatus("clocked_out");
        setMessage(`Clocked out! You worked ${hours} hours today.`);
        setTodayRecord({ clock_in: att.clock_in, clock_out: now });
      }
    } else {
      // Clock in
      const now = new Date().toISOString();
      await supabase.from("attendance").insert({
        employee_id: emp.id,
        date: today,
        clock_in: now,
        status: "present",
        source: "self_service",
      });
      setStatus("clocked_in");
      setMessage(`Clocked in at ${new Date(now).toLocaleTimeString("en-GY", { hour: "2-digit", minute: "2-digit" })}`);
      setTodayRecord({ clock_in: now, clock_out: null });
    }
  }

  function reset() {
    setPin("");
    setEmployee(null);
    setStatus("idle");
    setMessage("");
    setTodayRecord(null);
  }

  const btnStyle = { width: "72px", height: "72px", borderRadius: "16px", border: "1px solid #2a2420", background: "#141210", color: "#F5F0EB", fontSize: "1.6rem", fontWeight: 700 as const, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" };

  return (
    <div style={{ minHeight: "100vh", background: "#0C0A09", color: "#F5F0EB", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "380px", textAlign: "center" }}>

        {/* Logo */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "1.3rem", fontWeight: 800, marginBottom: "4px" }}>Evolve Wireless</div>
          <div style={{ fontSize: "0.82rem", color: "#7A7068" }}>Staff Clock In / Out</div>
        </div>

        {status === "idle" || status === "error" ? (
          <>
            <p style={{ fontSize: "0.92rem", color: "#8B7355", marginBottom: "24px" }}>Enter your 4-digit PIN</p>

            {/* PIN Display */}
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "28px" }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ width: "48px", height: "56px", borderRadius: "12px", background: "#141210", border: `2px solid ${pin.length > i ? "#D4654A" : "#2a2420"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 800, color: "#D4654A" }}>
                  {pin.length > i ? "•" : ""}
                </div>
              ))}
            </div>

            {/* Keypad */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", maxWidth: "248px", margin: "0 auto 20px" }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <button key={n} onClick={() => pin.length < 4 && setPin(pin + n)} style={btnStyle}>{n}</button>
              ))}
              <button onClick={() => setPin(pin.slice(0, -1))} style={{ ...btnStyle, fontSize: "1.2rem", color: "#7A7068" }}>⌫</button>
              <button onClick={() => pin.length < 4 && setPin(pin + "0")} style={btnStyle}>0</button>
              <button onClick={handlePin} disabled={pin.length !== 4} style={{ ...btnStyle, background: pin.length === 4 ? "#D4654A" : "#1a1513", color: pin.length === 4 ? "#fff" : "#4a3728", fontSize: "1rem" }}>GO</button>
            </div>

            {status === "error" && <p style={{ color: "#E74C3C", fontSize: "0.88rem", marginTop: "12px" }}>{message}</p>}
          </>
        ) : status === "loading" ? (
          <div style={{ padding: "60px", color: "#8B7355" }}>Processing...</div>
        ) : (
          /* Result */
          <div style={{ padding: "32px 24px", borderRadius: "20px", background: "#141210", border: `2px solid ${status === "clocked_in" ? "#4CAF50" : "#E9B44C"}` }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>
              {status === "clocked_in" ? "✅" : "👋"}
            </div>
            <div style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "1.4rem", fontWeight: 800, marginBottom: "4px" }}>
              {employee?.first_name} {employee?.last_name}
            </div>
            <div style={{ fontSize: "0.82rem", color: "#7A7068", marginBottom: "20px" }}>{employee?.role}</div>

            <div style={{
              padding: "16px", borderRadius: "12px", marginBottom: "20px",
              background: status === "clocked_in" ? "rgba(76,175,80,0.08)" : "rgba(233,180,76,0.08)",
              color: status === "clocked_in" ? "#4CAF50" : "#E9B44C",
              fontSize: "1.05rem", fontWeight: 700,
            }}>
              {status === "clocked_in" ? "🟢 CLOCKED IN" : "🟡 CLOCKED OUT"}
            </div>

            <p style={{ fontSize: "0.92rem", color: "#BFB5A8", marginBottom: "8px" }}>{message}</p>

            {todayRecord && (
              <div style={{ fontSize: "0.82rem", color: "#7A7068", marginBottom: "20px" }}>
                In: {todayRecord.clock_in ? new Date(todayRecord.clock_in).toLocaleTimeString("en-GY", { hour: "2-digit", minute: "2-digit" }) : "—"}
                {todayRecord.clock_out && ` · Out: ${new Date(todayRecord.clock_out).toLocaleTimeString("en-GY", { hour: "2-digit", minute: "2-digit" })}`}
              </div>
            )}

            <button onClick={reset} style={{ padding: "14px 36px", borderRadius: "12px", background: "#1a1513", border: "1px solid #2a2420", color: "#8B7355", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: "0.92rem" }}>
              Done
            </button>
          </div>
        )}

        {/* Time */}
        <div style={{ marginTop: "32px", fontSize: "0.78rem", color: "#4a3728" }}>
          {new Date().toLocaleDateString("en-GY", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>
    </div>
  );
}
