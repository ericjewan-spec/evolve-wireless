export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Evolve",
  robots: { index: false, follow: false, nocache: true },
};

// Each /admin/* sub-route brings its own AdminGate via its own layout.tsx.
// This top-level layout is intentionally transparent so we don't double-wrap.
// The /admin index page imports AdminGate directly.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
