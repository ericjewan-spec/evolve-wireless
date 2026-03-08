export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Evolve Wireless Internet — Guyana"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0057FF" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="11" fill="url(#logoGrad)" />
      <path d="M12 28a12 12 0 0 1 24 0" stroke="white" strokeWidth="2.8" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M17 28a7 7 0 0 1 14 0" stroke="white" strokeWidth="2.8" strokeLinecap="round" fill="none" opacity="0.75" />
      <circle cx="24" cy="28" r="3" fill="white" />
      <line x1="24" y1="18" x2="24" y2="10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <polyline points="20,14 24,10 28,14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <text x="56" y="20" fontFamily="var(--font-display), sans-serif" fontWeight="800" fontSize="15" fill="white" letterSpacing="-0.3">EVOLVE</text>
      <text x="56" y="34" fontFamily="var(--font-display), sans-serif" fontWeight="600" fontSize="10.5" fill="#00D4FF" letterSpacing="2.5">WIRELESS</text>
      <text x="56" y="44" fontFamily="var(--font-body), sans-serif" fontWeight="300" fontSize="7.5" fill="#4A6583" letterSpacing="0.8">INTERNET · GUYANA</text>
    </svg>
  );
}
