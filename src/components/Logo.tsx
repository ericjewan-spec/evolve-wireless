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
          <stop offset="0%" stopColor="#D4654A" />
          <stop offset="100%" stopColor="#F0906E" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#logoGrad)" />
      <circle cx="24" cy="28" r="3.5" fill="white" />
      <path d="M15 22 Q24 14 33 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M11 18 Q24 8 37 18" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M18.5 25.5 Q24 20.5 29.5 25.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.85" />
      <text x="56" y="21" fontFamily="'Bricolage Grotesque', serif" fontWeight="800" fontSize="15" fill="#2C1810" letterSpacing="-0.3">EVOLVE</text>
      <text x="56" y="34" fontFamily="'Bricolage Grotesque', serif" fontWeight="600" fontSize="10.5" fill="#D4654A" letterSpacing="2.5">WIRELESS</text>
      <text x="56" y="44" fontFamily="'Nunito', sans-serif" fontWeight="400" fontSize="7.5" fill="#8B7355" letterSpacing="0.8">INTERNET · GUYANA</text>
    </svg>
  );
}
