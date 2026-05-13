import { StaffGate } from "@/components/StaffGate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Staff portal — Evolve",
  robots: { index: false, follow: false, nocache: true },
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <StaffGate>{children}</StaffGate>;
}
