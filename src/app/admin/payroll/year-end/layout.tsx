import { AdminGate } from "@/components/AdminGate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Year-end 7B forms — Evolve Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function YearEndLayout({ children }: { children: React.ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}
