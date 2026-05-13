import { AdminGate } from "@/components/AdminGate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Holidays — Evolve Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function HolidaysLayout({ children }: { children: React.ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}
