"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "#1F6F3D",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        padding: "12px 20px",
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      ⬇ Save / Print as PDF
    </button>
  );
}
