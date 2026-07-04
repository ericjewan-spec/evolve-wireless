"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/AdminGate";

const GREEN = "#1F6F3D";
const BROWN = "#4A3728";

type Install = {
  id: string;
  full_name: string;
  phone: string;
  region: string;
  village: string | null;
  address: string;
  plan_name: string;
  account_number: string | null;
  gps_lat: number | null;
  gps_lon: number | null;
  gps_accuracy_m: number | null;
  status: string;
  uisp_error: string | null;
  technician_name: string | null;
  install_date: string;
  created_at: string;
  photoUrls: string[];
  contractUrl: string;
  uispUrl: string | null;
  mapUrl: string | null;
};

export default function InstallsGallery() {
  const [installs, setInstalls] = useState<Install[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/installs");
      const j = await res.json();
      if (!res.ok) throw new Error(j.detail || j.error || "Failed to load");
      setInstalls(j.installs || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <AdminGate>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h1 style={{ color: GREEN, fontSize: 24, margin: 0 }}>Install Sign-Ups</h1>
          <Link href="/admin" style={{ color: BROWN, fontSize: 14 }}>← Admin</Link>
        </div>
        <p style={{ color: BROWN, fontSize: 14, marginBottom: 20 }}>
          Every field install, with photos, GPS location, UISP account and contract.
        </p>

        {loading && <div style={{ color: BROWN, padding: 40, textAlign: "center" }}>Loading…</div>}
        {error && <div style={{ background: "#FDECEA", color: "#B42318", padding: 12, borderRadius: 10 }}>{error}</div>}

        {!loading && !error && installs.length === 0 && (
          <div style={{ color: "#888", padding: 40, textAlign: "center" }}>No installs yet.</div>
        )}

        <div style={{ display: "grid", gap: 16 }}>
          {installs.map((i) => (
            <div key={i.id} style={{ border: "1px solid #eadfce", borderRadius: 14, padding: 16, background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: BROWN }}>
                    {i.full_name}
                    {i.account_number && <span style={{ marginLeft: 8, color: GREEN, fontWeight: 800 }}>{i.account_number}</span>}
                  </div>
                  <div style={{ fontSize: 13, color: "#888" }}>
                    {i.plan_name} · {i.region === "region1" ? "Region 1" : "ECD"} · {i.address}{i.village ? `, ${i.village}` : ""}
                  </div>
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
                    {new Date(i.created_at).toLocaleDateString("en-GY")} · {i.phone}
                    {i.technician_name ? ` · tech: ${i.technician_name}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                  {i.mapUrl && <a href={i.mapUrl} target="_blank" rel="noopener noreferrer" style={pill}>📍 Map{i.gps_accuracy_m ? ` ±${Math.round(i.gps_accuracy_m)}m` : ""}</a>}
                  {i.uispUrl && <a href={i.uispUrl} target="_blank" rel="noopener noreferrer" style={pill}>UISP</a>}
                  <a href={i.contractUrl} target="_blank" rel="noopener noreferrer" style={pill}>Contract</a>
                </div>
              </div>

              {i.uisp_error && (
                <div style={{ marginTop: 8, fontSize: 12, background: "#FFF4E5", color: "#8a5a00", borderRadius: 8, padding: "6px 10px" }}>
                  UISP note: {i.uisp_error}
                </div>
              )}

              {i.photoUrls.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8, marginTop: 12 }}>
                  {i.photoUrls.map((url, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={idx} src={url} alt={`install ${idx + 1}`} onClick={() => setLightbox(url)}
                      style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, cursor: "pointer" }} />
                  ))}
                </div>
              ) : (
                <div style={{ marginTop: 10, fontSize: 12, color: "#bbb" }}>No photos.</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="install full" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8 }} />
        </div>
      )}
    </AdminGate>
  );
}

const pill: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: GREEN, background: "#F0F7F2",
  padding: "5px 11px", borderRadius: 100, textDecoration: "none", whiteSpace: "nowrap",
};
