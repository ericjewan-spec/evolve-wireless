"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Tower data — add more towers here as you expand
const TOWERS = [
  // East Coast Demerara towers — coverage extends from Cummings Lodge to Nonpareil and beyond
  {
    id: "success-ecd",
    name: "Success Tower",
    location: "Success, East Coast Demerara",
    lat: 6.8121,
    lng: -58.0719,
    radiusKm: 6,
    color: "#D4654A",
  },
  {
    id: "better-hope-ecd",
    name: "Better Hope Tower",
    location: "Better Hope, East Coast Demerara",
    lat: 6.8178,
    lng: -58.0890,
    radiusKm: 5,
    color: "#D4654A",
  },
  {
    id: "cummings-lodge-ecd",
    name: "Cummings Lodge Tower",
    location: "Cummings Lodge, East Coast Demerara",
    lat: 6.8179,
    lng: -58.1114,
    radiusKm: 5,
    color: "#D4654A",
  },
  {
    id: "good-hope-ecd",
    name: "Good Hope Tower",
    location: "Good Hope, East Coast Demerara",
    lat: 6.7990,
    lng: -58.0500,
    radiusKm: 6,
    color: "#D4654A",
  },
  {
    id: "nonpareil-ecd",
    name: "Non Pareil Tower",
    location: "Non Pareil, East Coast Demerara",
    lat: 6.7667,
    lng: -58.0167,
    radiusKm: 6,
    color: "#D4654A",
  },
  {
    id: "unity-ecd",
    name: "Unity Tower",
    location: "Unity, East Coast Demerara",
    lat: 6.7420,
    lng: -57.9850,
    radiusKm: 6,
    color: "#D4654A",
  },
  {
    id: "mahaica-ecd",
    name: "Mahaica Tower",
    location: "Mahaica, East Coast Demerara",
    lat: 6.6841,
    lng: -57.9218,
    radiusKm: 7,
    color: "#D4654A",
  },
  // New Amsterdam
  {
    id: "new-amsterdam",
    name: "New Amsterdam Tower",
    location: "New Amsterdam, Berbice",
    lat: 6.2426,
    lng: -57.5190,
    radiusKm: 8,
    color: "#2A9D8F",
  },
  // Region 1
  {
    id: "port-kaituma",
    name: "Port Kaituma Tower",
    location: "Port Kaituma, Region 1",
    lat: 7.7298,
    lng: -59.8751,
    radiusKm: 10,
    color: "#E9B44C",
  },
];

export default function CoverageMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);
  const [userPin, setUserPin] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [inCoverage, setInCoverage] = useState<boolean | null>(null);
  const [locating, setLocating] = useState(false);
  const userMarkerRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Dynamically load Leaflet
    const linkEl = document.createElement("link");
    linkEl.rel = "stylesheet";
    linkEl.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(linkEl);

    const scriptEl = document.createElement("script");
    scriptEl.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    scriptEl.onload = () => {
      initMap();
    };
    document.head.appendChild(scriptEl);

    return () => {
      linkEl.remove();
      scriptEl.remove();
    };
  }, []);

  function initMap() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    const map = L.map(mapRef.current, {
      center: [6.77, -58.00],
      zoom: 11,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    // Tower marker
    const towerIcon = L.divIcon({
      html: `<div style="background:#D4654A;width:36px;height:36px;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(212,101,74,0.5);font-size:16px;">📡</div>`,
      className: "",
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    L.marker([tower.lat, tower.lng], { icon: towerIcon })
      .addTo(map)
      .bindPopup(
        `<div style="font-family:sans-serif;text-align:center;padding:4px">
          <strong style="font-size:14px;color:#D4654A">📡 ${tower.name}</strong><br>
          <span style="color:#666;font-size:12px">${tower.location}</span><br>
          <span style="color:#999;font-size:11px">Coverage: ${tower.radiusKm}km radius</span>
        </div>`
      );

    // Coverage circle
    L.circle([tower.lat, tower.lng], {
      radius: tower.radiusKm * 1000,
      color: tower.color,
      fillColor: tower.color,
      fillOpacity: 0.08,
      weight: 2,
      dashArray: "8 6",
    }).addTo(map);

    // Inner strong-signal ring (50% of radius)
    L.circle([tower.lat, tower.lng], {
      radius: (tower.radiusKm * 1000) / 2,
      color: "#2A9D8F",
      fillColor: "#2A9D8F",
      fillOpacity: 0.06,
      weight: 1.5,
      dashArray: "4 4",
    }).addTo(map);

    // Click to place pin
    map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
      placeUserPin(L, map, e.latlng.lat, e.latlng.lng);
    });

    mapInstance.current = map;
  }

  function placeUserPin(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    L: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map: any,
    lat: number,
    lng: number
  ) {
    // Remove old marker and lines
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
    }
    // Remove old polylines
    map.eachLayer((layer: { options?: { className?: string }; remove?: () => void }) => {
      if (layer.options?.className === "user-line") layer.remove?.();
    });

    // Find nearest tower and check coverage against ALL towers
    const userLatLng = L.latLng(lat, lng);
    let nearestTower = TOWERS[0];
    let nearestDist = Infinity;
    let covered = false;

    TOWERS.forEach((t: { lat: number; lng: number; radiusKm: number }) => {
      const d = L.latLng(t.lat, t.lng).distanceTo(userLatLng) / 1000;
      if (d < nearestDist) {
        nearestDist = d;
        nearestTower = t;
      }
      if (d <= t.radiusKm) covered = true;
    });

    const dist = nearestDist;

    // User marker
    const userIcon = L.divIcon({
      html: `<div style="background:${covered ? "#2A9D8F" : "#E74C3C"};width:32px;height:32px;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.3);font-size:14px;">📍</div>`,
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([lat, lng], { icon: userIcon })
      .addTo(map)
      .bindPopup(
        `<div style="font-family:sans-serif;text-align:center;padding:4px">
          <strong style="font-size:13px;color:${covered ? "#2A9D8F" : "#E74C3C"}">
            ${covered ? "✅ You're in coverage!" : "❌ Outside coverage area"}
          </strong><br>
          <span style="color:#666;font-size:12px">${dist.toFixed(1)}km from ${nearestTower.name}</span>
        </div>`
      )
      .openPopup();

    // Draw line to nearest tower
    const line = L.polyline(
      [[nearestTower.lat, nearestTower.lng], [lat, lng]],
      { color: covered ? "#2A9D8F" : "#E74C3C", weight: 2, dashArray: "6 4", opacity: 0.6, className: "user-line" }
    ).addTo(map);

    userMarkerRef.current = marker;
    setUserPin({ lat, lng });
    setDistance(Math.round(dist * 10) / 10);
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const L = (window as any).L;
        const map = mapInstance.current;
        if (L && map) {
          placeUserPin(L, map, pos.coords.latitude, pos.coords.longitude);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (map as any).setView([pos.coords.latitude, pos.coords.longitude], 13);
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
            Click anywhere on the map to check if your location falls within our coverage zone, or use the button below to pin your current location.
          </p>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
            <button
              onClick={handleUseMyLocation}
              className="btn btn-primary"
              style={{ fontSize: "0.85rem", padding: "10px 20px" }}
              disabled={locating}
            >
              {locating ? "📍 Getting your location..." : "📍 Use My Location"}
            </button>
            <a
              href={`https://wa.me/5926092487?text=${encodeURIComponent(
                userPin
                  ? `Hi! I checked the coverage map. I'm ${distance}km from the nearest Evolve tower. ${inCoverage ? "I'm in coverage!" : "I'm outside coverage."} Can you confirm?`
                  : "Hi! I'd like to check if I'm in your coverage area."
              )}`}
              target="_blank"
              rel="noopener"
              className="btn btn-outline"
              style={{ fontSize: "0.85rem", padding: "10px 20px" }}
            >
              💬 Ask on WhatsApp
            </a>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "0.78rem", color: "var(--text3)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#D4654A" }} /> Tower Location
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#2A9D8F", opacity: 0.5 }} /> Strong Signal Zone
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#D4654A", opacity: 0.3 }} /> Extended Coverage
            </span>
          </div>
        </div>
      </section>

      {/* Map */}
      <section style={{ background: "var(--cream)" }}>
        <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)" }}>
          <div
            ref={mapRef}
            style={{
              width: "100%",
              height: "520px",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--divider)",
              overflow: "hidden",
              position: "relative",
              zIndex: 1,
            }}
          />
        </div>
      </section>

      {/* Result Panel */}
      {userPin && (
        <section style={{ background: "var(--cream)", padding: "24px 0" }}>
          <div className="container" style={{ maxWidth: "var(--container-max)", margin: "0 auto", padding: "0 var(--gutter)" }}>
            <div
              style={{
                padding: "20px 24px",
                borderRadius: "var(--r-lg)",
                background: inCoverage ? "rgba(42, 157, 143, 0.06)" : "rgba(231, 76, 60, 0.06)",
                border: `1px solid ${inCoverage ? "rgba(42, 157, 143, 0.2)" : "rgba(231, 76, 60, 0.2)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: "'Bricolage Grotesque', serif", color: inCoverage ? "var(--teal)" : "#E74C3C", marginBottom: "4px" }}>
                  {inCoverage ? "✅ You're within our coverage zone!" : "❌ You're outside our coverage zone"}
                </div>
                <div style={{ fontSize: "0.88rem", color: "var(--text3)" }}>
                  Your pin is <strong>{distance} km</strong> from the nearest Evolve tower.
                  {inCoverage
                    ? distance! <= 4
                      ? " You'll get an excellent signal."
                      : " You're in our extended coverage range."
                    : " But don't worry — we're expanding! WhatsApp us to be notified when we reach your area."
                  }
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {inCoverage ? (
                  <Link href="/signup" className="btn btn-primary" style={{ fontSize: "0.85rem", padding: "10px 20px" }}>
                    Sign Up Now →
                  </Link>
                ) : (
                  <a
                    href={`https://wa.me/5926092487?text=${encodeURIComponent(`Hi! I'm ${distance}km from the nearest Evolve tower and outside coverage. Please notify me when you expand to my area.`)}`}
                    target="_blank"
                    rel="noopener"
                    className="btn btn-outline"
                    style={{ fontSize: "0.85rem", padding: "10px 20px" }}
                  >
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
          <h2 className="text-lg font-bold mb-4 text-center" style={{ fontFamily: "'Bricolage Grotesque', serif" }}>
            How to Check Coverage
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { n: "1", text: "Click \"Use My Location\" to automatically pin your position, or tap anywhere on the map." },
              { n: "2", text: "The map shows our tower (📡) and a coverage circle around it." },
              { n: "3", text: "If your pin falls inside the circle, you're covered! A dashed line shows the distance." },
              { n: "4", text: "If you're outside coverage, WhatsApp us to join the waitlist for your area." },
            ].map((step) => (
              <div key={step.n} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span style={{
                  width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                  background: "var(--terracotta)", color: "#fff", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700,
                }}>
                  {step.n}
                </span>
                <p style={{ color: "var(--text3)", fontSize: "0.92rem", lineHeight: 1.6, paddingTop: "3px" }}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
