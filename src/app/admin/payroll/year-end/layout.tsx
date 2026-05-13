export const dynamic = "force-dynamic";

export const metadata = {
  title: "Year-end 7B forms — Evolve Admin",
  robots: { index: false, follow: false, nocache: true },
};

// AdminGate is already provided by the parent /admin/payroll layout.
export default function YearEndLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
