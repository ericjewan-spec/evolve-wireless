"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const TOWERS = [
  { id: "success-ecd", name: "Success Tower", location: "Success, ECD", lat: 6.8121, lng: -58.0719, radiusKm: 4, color: "#D4654A" },
  { id: "better-hope-ecd", name: "Better Hope Tower", location: "Better Hope, ECD", lat: 6.8178, lng: -58.0890, radiusKm: 4, color: "#D4654A" },
  { id: "cummings-lodge-ecd", name: "Cummings Lodge Tower", location: "Cummings Lodge, ECD", lat: 6.8179, lng: -58.1114, radiusKm: 4, color: "#D4654A" },
  { id: "good-hope-ecd", name: "Good Hope Tower", location: "Good Hope, ECD", lat: 6.7990, lng: -58.0500, radiusKm: 4, color: "#D4654A" },
  { id: "nonpareil-ecd", name: "Non Pareil Tower", location: "Non Pareil, ECD", lat: 6.7720, lng: -58.0250, radiusKm: 3, color: "#D4654A" },
  { id: "canegrove-ecd", name: "Cane Grove Tower", location: "Cane Grove, ECD", lat: 6.6242, lng: -57.9101, radiusKm: 4, color: "#D4654A" },
  { id: "mahaica-ecd", name: "Mahaica Tower", location: "Mahaica, ECD", lat: 6.6841, lng: -57.9218, radiusKm: 4, color: "#D4654A" },
  { id: "new-amsterdam", name: "New Amsterdam Tower", location: "New Amsterdam, Berbice", lat: 6.2426, lng: -57.5190, radiusKm: 4, color: "#2A9D8F" },
  { id: "port-kaituma", name: "Port Kaituma Tower", location: "Port Kaituma, Region 1", lat: 7.7298, lng: -59.8751, radiusKm: 4, color: "#E9B44C" },
  { id: "mabaruma", name: "Mabaruma Tower", location: "Mabaruma, Region 1", lat: 8.2041, lng: -59.7776, radiusKm: 4, color: "#E9B44C" },
  { id: "matthews-ridge", name: "Matthews Ridge Tower", location: "Matthews Ridge, Region 1", lat: 7.4914, lng: -60.1518, radiusKm: 4, color: "#E9B44C" },
  { id: "baramita", name: "Baramita Tower", location: "Baramita, Region 1", lat: 7.3501, lng: -60.4880, radiusKm: 4, color: "#E9B44C" },
  { id: "hosororo", name: "Hosororo Tower", location: "Hosororo, Region 1", lat: 8.1667, lng: -59.8000, radiusKm: 4, color: "#E9B44C" },
  { id: "whitewater", name: "Whitewater Tower", location: "Whitewater, Region 1", lat: 8.1450, lng: -59.8200, radiusKm: 4, color: "#E9B44C" },
  { id: "charity", name: "Charity Tower", location: "Charity, Essequibo", lat: 7.4000, lng: -58.6000, radiusKm: 4, color: "#8B6F4E" },
];

export default function CoverageMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObjRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const userLayersRef = useRef<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [userPin, setUserPin] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [nearestName, setNearestName] = useState("");
  const [inCoverage, setInCoverage] = useState<boolean | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapObjRef.current) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = (window as any).L; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!L || !mapRef.current) return;
      leafletRef.current = L;

      const map = L.map(mapRef.current, {
        center: [6.77, -58.00],
        zoom: 11,
        zoomControl: true,
        scrollWheelZoom: true,
      });
      mapObjRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      // Add each tower
      for (const t of TOWERS) {
        const icon = L.divIcon({
          html: '<div style="background:' + t.color + ';width:34px;height:34px;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.35);font-size:15px;">📡</div>',
          className: "",
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        L.marker([t.lat, t.lng], { icon: icon })
          .addTo(map)
          .bindPopup(
            '<div style="font-family:sans-serif;text-align:center;padding:4px">' +
              '<strong style="font-size:13px;color:' + t.color + '">📡 ' + t.name + "</strong><br>" +
              '<span style="color:#666;font-size:12px">' + t.location + "</span><br>" +
              '<span style="color:#999;font-size:11px">Coverage: ' + t.radiusKm + "km radius</span>" +
            "</div>"
          );

        // Single coverage circle — strong signal only
        L.circle([t.lat, t.lng], {
          radius: t.radiusKm * 1000,
          color: t.color,
          fillColor: t.color,
          fillOpacity: 0.10,
          weight: 2,
        }).addTo(map);
      }

      // Click to pin
      map.on("click", function (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        doPlacePin(e.latlng.lat, e.latlng.lng);
      });
    };
    document.head.appendChild(script);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function doPlacePin(lat: number, lng: number) {
    const L = leafletRef.current;
    const map = mapObjRef.current;
    if (!L || !map) return;

    // Clear old user layers
    for (const layer of userLayersRef.current) {
      map.removeLayer(layer);
    }
    userLayersRef.current = [];

    // Find nearest tower & check if covered by ANY tower
    const userLL = L.latLng(lat, lng);
    let bestTower = TOWERS[0];
    let bestDist = Infinity;
    let covered = false;

    for (const t of TOWERS) {
      const d = L.latLng(t.lat, t.lng).distanceTo(userLL) / 1000;
      if (d < bestDist) {
        bestDist = d;
        bestTower = t;
      }
      if (d <= t.radiusKm) covered = true;
    }

    const dist = Math.round(bestDist * 10) / 10;

    // User pin
    const pinIcon = L.divIcon({
      html: '<div style="background:' + (covered ? "#2A9D8F" : "#E74C3C") + ';width:30px;height:30px;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.3);font-size:13px;">📍</div>',
      className: "",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    const marker = L.marker([lat, lng], { icon: pinIcon })
      .addTo(map)
      .bindPopup(
        '<div style="font-family:sans-serif;text-align:center;padding:4px">' +
          '<strong style="font-size:13px;color:' + (covered ? "#2A9D8F" : "#E74C3C") + '">' +
          (covered ? "✅ You're in coverage!" : "❌ Outside coverage") +
          "</strong><br>" +
          '<span style="color:#666;font-size:12px">' + dist + "km from " + bestTower.name + "</span>" +
        "</div>"
      )
      .openPopup();
    userLayersRef.current.push(marker);

    // Line to nearest tower
    const line = L.polyline(
      [[bestTower.lat, bestTower.lng], [lat, lng]],
      { color: covered ? "#2A9D8F" : "#E74C3C", weight: 2, dashArray: "6 4", opacity: 0.6 }
    ).addTo(map);
    userLayersRef.current.push(line);

    setUserPin({ lat, lng });
    setDistance(dist);
    setNearestName(bestTower.name);
    setInCoverage(covered);
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        doPlacePin(pos.coords.latitude, pos.coords.longitude);
        if (mapObjRef.current) {
          mapObjRef.current.setView([pos.coords.latitude, pos.coords.longitude], 13);
        }
      },
      () => {
        setLocating(false);
        alert("Unable to get your location. Please click the map to place your pin manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div style={{ paddingTop: "var(--nav-height)" }}>
      {/* Header */}
      <section style={{ background: "var(--soft-bg)", padding: "clamp(32px, 5vw, 56px) 0 24px" }}>
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Link href="/coverage" style={{ color: "var(--text3)", fontSize: "0.85rem" }}>← Coverage</Link>
          </div>
          <div className="section-label" style={{ display: "inline-flex" }}>Interactive Map</div>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>
            Check Your <span style={{ color: "var(--terracotta)" }}>Coverage</span>
          </h1>
          <p className="text-sm mb-4" style={{ color: "var(--text3)", maxWidth: 520 }}>
            Click anywhere on the map or use the button below to check if your location is within our coverage. We have {TOWERS.length} tower sites across Guyana.
          </p>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
            <button onClick={handleUseMyLocation} className="btn btn-primary" style={{ fontSize: "0.85rem", padding: "10px 20px" }} disabled={locating}>
              {locating ? "📍 Getting your location..." : "📍 Use My Location"}
            </button>
            <a
              href={`https://wa.me/5926092487?text=${encodeURIComponent(
                userPin
                  ? `Hi! I checked the coverage map. I'm ${distance}km from ${nearestName}. ${inCoverage ? "I'm in coverage!" : "I'm outside coverage."} Can you confirm?`
                  : "Hi! I'd like to check if I'm in your coverage area."
              )}`}
              target="_blank" rel="noopener" className="btn btn-outline" style={{ fontSize: "0.85rem", padding: "10px 20px" }}
            >
              💬 Ask on WhatsApp
            </a>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "0.78rem", color: "var(--text3)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#D4654A" }} /> ECD Towers
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#2A9D8F" }} /> New Amsterdam
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#E9B44C" }} /> Region 1 (Port Kaituma, Mabaruma, Matthews Ridge, Baramita, Hosororo, Whitewater)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#8B6F4E" }} /> Charity, Essequibo
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#D4654A", opacity: 0.3, border: "1px solid #D4654A" }} /> 4km Coverage Zone
            </span>
          </div>
        </div>
      </section>

      {/* Map */}
      <section style={{ background: "var(--cream)" }}>
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)" }}>
          <div ref={mapRef} style={{ width: "100%", height: "520px", borderRadius: "var(--r-lg)", border: "1px solid var(--divider)", overflow: "hidden", position: "relative", zIndex: 1 }} />
        </div>
      </section>

      {/* Result Panel */}
      {userPin && (
        <section style={{ background: "var(--cream)", padding: "24px 0" }}>
          <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)" }}>
            <div style={{
              padding: "20px 24px", borderRadius: "var(--r-lg)",
              background: inCoverage ? "rgba(42, 157, 143, 0.06)" : "rgba(231, 76, 60, 0.06)",
              border: `1px solid ${inCoverage ? "rgba(42, 157, 143, 0.2)" : "rgba(231, 76, 60, 0.2)"}`,
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px",
            }}>
              <div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: "'Bricolage Grotesque', serif", color: inCoverage ? "var(--teal)" : "#E74C3C", marginBottom: "4px" }}>
                  {inCoverage ? "✅ You're within our coverage zone!" : "❌ You're outside our coverage zone"}
                </div>
                <div style={{ fontSize: "0.88rem", color: "var(--text3)" }}>
                  Your pin is <strong>{distance} km</strong> from {nearestName}.
                  {inCoverage
                    ? " You'll get a strong signal from this tower."
                    : " But don't worry — we're expanding! WhatsApp us to be notified when we reach your area."
                  }
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {inCoverage ? (
                  <>
                    <Link href="/signup" className="btn btn-primary" style={{ fontSize: "0.95rem", padding: "14px 28px", boxShadow: "0 4px 20px rgba(212,101,74,0.3)" }}>🚀 Sign Up Now →</Link>
                    <Link href="/plans" className="btn btn-outline" style={{ fontSize: "0.88rem", padding: "12px 22px" }}>View Plans</Link>
                  </>
                ) : (
                  <a href={`https://wa.me/5926092487?text=${encodeURIComponent(`Hi! I'm ${distance}km from ${nearestName} and outside coverage. Please notify me when you expand to my area.`)}`} target="_blank" rel="noopener" className="btn btn-outline" style={{ fontSize: "0.85rem", padding: "10px 20px" }}>
                    💬 Join Waitlist
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Instructions */}
      <section style={{ background: "var(--soft-bg)", padding: "48px 0" }}>
        <div className="container" style={{ maxWidth: 600, margin: "0 auto", padding: "0 var(--gutter)" }}>
          <h2 className="text-lg font-bold mb-4 text-center" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>How to Check Coverage</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { n: "1", text: 'Click "Use My Location" to automatically pin your position, or tap anywhere on the map.' },
              { n: "2", text: "Each tower (📡) has a 4km coverage circle around it." },
              { n: "3", text: "If your pin falls inside any circle, you're covered! A dashed line shows the distance to the nearest tower." },
              { n: "4", text: "If you're outside coverage, WhatsApp us to join the waitlist for your area." },
            ].map((step) => (
              <div key={step.n} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, background: "var(--terracotta)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700 }}>{step.n}</span>
                <p style={{ color: "var(--text3)", fontSize: "0.92rem", lineHeight: 1.6, paddingTop: "3px" }}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
