import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFAB from "@/components/WhatsAppFAB";
import OutageBanner from "@/components/OutageBanner";
import Link from "next/link";
import BoldHomepage from "@/components/BoldHomepage";

export default function HomePage() {
  return (
    <>
      <OutageBanner />
      <BoldHomepage />
      <WhatsAppFAB />
    </>
  );
}
