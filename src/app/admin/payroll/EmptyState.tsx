// =============================================================================
// EmptyState.tsx
// Place at: src/app/admin/payroll/EmptyState.tsx
// =============================================================================
// Friendly empty state with icon, title, description, optional CTA.
// Replaces the bare "No X found" lines that scare first-time admins.
// =============================================================================

"use client";

import { ReactNode } from "react";

export default function EmptyState({
  icon,
  title,
  description,
  cta,
  onCta,
  ctaHref,
  secondary,
}: {
  icon: string;
  title: string;
  description: string;
  cta?: string;
  onCta?: () => void;
  ctaHref?: string;
  secondary?: ReactNode;
}) {
  return (
    <div
      style={{
        padding: "48px 24px",
        textAlign: "center",
        borderRadius: 12,
        background: "#141210",
        border: "1px dashed #2a2420",
      }}
    >
      <div
        aria-hidden
        style={{
          fontSize: 36,
          lineHeight: 1,
          marginBottom: 14,
          opacity: 0.85,
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontFamily: "'Bricolage Grotesque', serif",
          fontSize: "1.05rem",
          fontWeight: 700,
          color: "#F5F0EB",
          margin: 0,
          marginBottom: 6,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: "#8B7355",
          fontSize: 13,
          maxWidth: 380,
          margin: "0 auto",
          lineHeight: 1.5,
          marginBottom: cta || secondary ? 18 : 0,
        }}
      >
        {description}
      </p>
      {cta && (ctaHref ? (
        <a
          href={ctaHref}
          style={{
            display: "inline-block",
            padding: "10px 22px",
            borderRadius: 8,
            background: "#D4654A",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.85rem",
            textDecoration: "none",
          }}
        >
          {cta}
        </a>
      ) : (
        <button
          onClick={onCta}
          style={{
            padding: "10px 22px",
            borderRadius: 8,
            background: "#D4654A",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.85rem",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {cta}
        </button>
      ))}
      {secondary && <div style={{ marginTop: 12 }}>{secondary}</div>}
    </div>
  );
}
