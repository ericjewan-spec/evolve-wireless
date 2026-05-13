import { AdminGate } from "@/components/AdminGate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Leave — Evolve Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function LeaveLayout({ children }: { children: React.ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}
