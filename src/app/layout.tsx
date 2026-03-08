import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evolve Wireless Internet — Fast, Reliable Internet in Guyana",
  description:
    "Get high-speed home and business internet in Guyana. Serving East Coast Demerara, Region 1 and Port Kaituma. Fast installation, local support, affordable plans.",
  keywords: [
    "internet provider Guyana",
    "home internet East Coast Demerara",
    "wireless internet Guyana",
    "ISP Guyana",
    "business internet ECD",
    "Port Kaituma internet",
  ],
  openGraph: {
    title: "Evolve Wireless Internet — Connecting Guyana",
    description:
      "Fast, reliable wireless internet for homes and businesses across Guyana.",
    url: "https://evolvewireless.gy",
    siteName: "Evolve Wireless Internet",
    locale: "en_GY",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
