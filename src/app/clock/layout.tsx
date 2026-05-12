export const dynamic = "force-dynamic";

export const metadata = {
  title: "Clock In — Evolve",
  robots: { index: false, follow: false, nocache: true },
};

export default function ClockLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
