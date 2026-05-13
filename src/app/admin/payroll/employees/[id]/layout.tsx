export const dynamic = "force-dynamic";

export const metadata = {
  title: "Employee — Evolve Admin",
  robots: { index: false, follow: false, nocache: true },
};

// AdminGate is already provided by the parent /admin/payroll layout.
// Nesting it again here would double-render the header chrome.
export default function EmployeeDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
