"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

type TestState = "idle" | "testing" | "done";

export default function SpeedTestPage() {
  const [state, setState] = useState<TestState>("idle");
  const [download, setDownload] = useState(0);
  const [upload, setUpload] = useState(0);
  const [ping, setPing] = useState(0);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const runTest = useCallback(async () => {
    setState("testing");
    setDownload(0);
    setUpload(0);
    setPing(0);
    setProgress(0);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Phase 1: Ping test
      setPhase("Testing ping...");
      setProgress(5);
      const pingResults: number[] = [];
      for (let i = 0; i < 5; i++) {
        if (controller.signal.aborted) return;
        const start = performance.now();
        try {
          await fetch("/api/speedtest-ping", { signal: controller.signal, cache: "no-store" });
        } catch { /* ignore */ }
        pingResults.push(performance.now() - start);
        setProgress(5 + i * 3);
      }
      const avgPing = Math.round(pingResults.reduce((a, b) => a + b, 0) / pingResults.length);
      setPing(avgPing);

      // Phase 2: Download test
      setPhase("Testing download speed...");
      setProgress(20);
      const dlStart = performance.now();
      let dlBytes = 0;
      const dlDuration = 6000; // 6 seconds

      while (performance.now() - dlStart < dlDuration) {
        if (controller.signal.aborted) return;
        try {
          const res = await fetch(`https://speed.cloudflare.com/__down?bytes=2000000&r=${Math.random()}`, {
            signal: controller.signal,
            cache: "no-store",
          });
          const blob = await res.blob();
          dlBytes += blob.size;
        } catch { break; }
        const elapsed = performance.now() - dlStart;
        const mbps = ((dlBytes * 8) / (elapsed / 1000)) / 1000000;
        setDownload(Math.round(mbps * 10) / 10);
        setProgress(20 + Math.min(40, (elapsed / dlDuration) * 40));
      }
      const dlElapsed = performance.now() - dlStart;
      const finalDl = ((dlBytes * 8) / (dlElapsed / 1000)) / 1000000;
      setDownload(Math.round(finalDl * 10) / 10);
      setProgress(60);

      // Phase 3: Upload test
      setPhase("Testing upload speed...");
      const ulStart = performance.now();
      let ulBytes = 0;
      const ulDuration = 4000;
      const payload = new Blob([new ArrayBuffer(500000)]);

      while (performance.now() - ulStart < ulDuration) {
        if (controller.signal.aborted) return;
        try {
          await fetch("https://speed.cloudflare.com/__up", {
            method: "POST",
            body: payload,
            signal: controller.signal,
          });
          ulBytes += payload.size;
        } catch { break; }
        const elapsed = performance.now() - ulStart;
        const mbps = ((ulBytes * 8) / (elapsed / 1000)) / 1000000;
        setUpload(Math.round(mbps * 10) / 10);
        setProgress(60 + Math.min(35, (elapsed / ulDuration) * 35));
      }
      const ulElapsed = performance.now() - ulStart;
      const finalUl = ((ulBytes * 8) / (ulElapsed / 1000)) / 1000000;
      setUpload(Math.round(finalUl * 10) / 10);

      setProgress(100);
      setPhase("");
      setState("done");
    } catch {
      setState("done");
      setPhase("");
    }
  }, []);

  const stopTest = () => {
    abortRef.current?.abort();
    setState("done");
    setPhase("");
  };

  const speedColor = (mbps: number) => {
    if (mbps >= 20) return "var(--teal)";
    if (mbps >= 10) return "var(--gold)";
    return "var(--terracotta)";
  };

  return (
    <div style={{ paddingTop: "var(--nav-height)" }}>
      <section className="section" style={{ background: "var(--soft-bg)", textAlign: "center", minHeight: "70vh", display: "flex", alignItems: "center" }}>
        <div className="container" style={{ maxWidth: 600, margin: "0 auto", padding: "0 var(--gutter)" }}>
          <div className="section-label" style={{ display: "inline-flex" }}>Speed Test</div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>
            Test Your <span style={{ color: "var(--terracotta)" }}>Internet Speed</span>
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--text3)", maxWidth: 440, margin: "0 auto" }}>
            Check your current download speed, upload speed, and ping. Works on any connection.
          </p>

          {/* Speed Gauges */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "32px" }}>
            <div className="card p-5 text-center">
              <div style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text3)", marginBottom: "8px" }}>Ping</div>
              <div style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "2.2rem", fontWeight: 800, color: ping > 0 ? (ping < 50 ? "var(--teal)" : ping < 100 ? "var(--gold)" : "var(--terracotta)") : "var(--text)" }}>
                {ping || "—"}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text3)" }}>ms</div>
            </div>
            <div className="card p-5 text-center">
              <div style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text3)", marginBottom: "8px" }}>Download</div>
              <div style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "2.2rem", fontWeight: 800, color: download > 0 ? speedColor(download) : "var(--text)" }}>
                {download || "—"}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text3)" }}>Mbps</div>
            </div>
            <div className="card p-5 text-center">
              <div style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text3)", marginBottom: "8px" }}>Upload</div>
              <div style={{ fontFamily: "'Bricolage Grotesque', serif", fontSize: "2.2rem", fontWeight: 800, color: upload > 0 ? speedColor(upload) : "var(--text)" }}>
                {upload || "—"}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text3)" }}>Mbps</div>
            </div>
          </div>

          {/* Progress */}
          {state === "testing" && (
            <div style={{ marginBottom: "24px" }}>
              <div style={{ height: "6px", borderRadius: "3px", background: "var(--divider)", overflow: "hidden", marginBottom: "8px" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: "var(--terracotta)", borderRadius: "3px", transition: "width 0.3s ease" }} />
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text3)" }}>{phase}</p>
            </div>
          )}

          {/* Button */}
          {state === "idle" && (
            <button onClick={runTest} className="btn btn-primary" style={{ padding: "14px 48px", fontSize: "1rem" }}>
              ▶ Start Speed Test
            </button>
          )}
          {state === "testing" && (
            <button onClick={stopTest} className="btn btn-outline" style={{ padding: "14px 48px" }}>
              ■ Stop Test
            </button>
          )}
          {state === "done" && (
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => { setState("idle"); runTest(); }} className="btn btn-primary" style={{ padding: "12px 32px" }}>
                🔄 Test Again
              </button>
              {download < 10 && (
                <Link href="/plans" className="btn btn-outline" style={{ padding: "12px 32px" }}>
                  Upgrade Your Plan →
                </Link>
              )}
              <a href={`https://wa.me/5926092487?text=${encodeURIComponent(`Hi! I just ran a speed test on your website. Results: Download ${download} Mbps, Upload ${upload} Mbps, Ping ${ping}ms. Can you help?`)}`} target="_blank" rel="noopener" className="btn btn-outline" style={{ padding: "12px 32px" }}>
                💬 Report Issue
              </a>
            </div>
          )}

          {state === "done" && download > 0 && (
            <div className="card p-4 mt-6 text-left" style={{ background: download >= 15 ? "rgba(42,157,143,0.05)" : "rgba(212,101,74,0.05)", borderColor: download >= 15 ? "rgba(42,157,143,0.15)" : "rgba(212,101,74,0.15)" }}>
              <p style={{ fontSize: "0.88rem", color: "var(--text2)" }}>
                {download >= 20 ? "🚀 Excellent speeds! You're getting great performance." :
                 download >= 10 ? "👍 Good speeds for most activities including HD streaming." :
                 download >= 5 ? "⚡ Decent for browsing and SD streaming. Consider upgrading for HD." :
                 "📶 Slow connection detected. Contact us to troubleshoot or upgrade."}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
