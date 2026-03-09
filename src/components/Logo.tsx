/* eslint-disable @next/next/no-img-element */

export function Logo({ className = "", variant = "default" }: { className?: string; variant?: "default" | "dark" }) {
  // Use the official SVG logo file from /public
  // Default variant: for light backgrounds (cream nav/pages)
  // Dark variant: for dark backgrounds (footer) — uses the PNG with transparency
  if (variant === "dark") {
    return (
      <img
        src="/logo.png"
        alt="Evolve Wireless Internet — Guyana"
        className={className}
        style={{ height: "42px", width: "auto" }}
      />
    );
  }

  return (
    <img
      src="/logo.svg"
      alt="Evolve Wireless Internet — Guyana"
      className={className}
      style={{ height: "42px", width: "auto" }}
    />
  );
}
