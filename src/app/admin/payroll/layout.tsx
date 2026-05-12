import { AdminGate } from "@/components/AdminGate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Evolve",
  robots: { index: false, follow: false, nocache: true },
};

export default function PayrollLayout({ children }: { children: React.ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}
