import { AdminGate } from "@/components/AdminGate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Employee — Evolve Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function EmployeeDetailLayout({ children }: { children: React.ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}
