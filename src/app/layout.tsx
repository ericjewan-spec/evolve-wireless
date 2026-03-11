import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://evolvewireless.gy"),
  title: {
    default: "Evolve Wireless Internet & Solar Solutions — Guyana",
    template: "%s | Evolve Wireless",
  },
  description:
    "High-speed wireless internet, solar energy solutions, and technology services for homes and businesses across Guyana. Serving ECD, New Amsterdam, Region 1, and more.",
  keywords: [
    "internet provider Guyana",
    "wireless internet Guyana",
    "ISP Guyana",
    "home internet East Coast Demerara",
    "business internet Guyana",
    "solar panels Guyana",
    "solar installation Georgetown",
    "solar energy Guyana",
    "website development Guyana",
    "New Amsterdam internet",
    "Port Kaituma internet",
    "Mahaica internet",
    "Evolve Wireless",
  ],
  openGraph: {
    title: "Evolve Wireless Internet & Solar Solutions",
    description: "Fast, reliable wireless internet and professional solar energy solutions for Guyana.",
    url: "https://evolvewireless.gy",
    siteName: "Evolve Wireless Internet & Solar Solutions",
    locale: "en_GY",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Evolve Wireless Internet & Solar Solutions",
    description: "Fast internet and clean solar energy for homes and businesses across Guyana.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  alternates: {
    canonical: "https://evolvewireless.gy",
  },
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://evolvewireless.gy/#organization",
      name: "Evolve Wireless Internet & Solar Solutions",
      url: "https://evolvewireless.gy",
      description: "Wireless internet service provider and solar energy installer serving Guyana.",
      areaServed: {
        "@type": "Country",
        name: "Guyana",
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+592-609-2487",
        contactType: "customer service",
        availableLanguage: "English",
      },
      sameAs: [],
    },
    {
      "@type": "InternetService",
      "@id": "https://evolvewireless.gy/#isp",
      name: "Evolve Wireless Internet",
      provider: { "@id": "https://evolvewireless.gy/#organization" },
      areaServed: [
        { "@type": "City", name: "Georgetown", containedInPlace: { "@type": "Country", name: "Guyana" } },
        { "@type": "Place", name: "East Coast Demerara" },
        { "@type": "City", name: "New Amsterdam" },
        { "@type": "Place", name: "Port Kaituma" },
        { "@type": "Place", name: "Mahaica" },
      ],
      offers: [
        { "@type": "Offer", name: "Basic Plan", price: "5000", priceCurrency: "GYD", description: "20 Mbps wireless internet" },
        { "@type": "Offer", name: "Preferred Plan", price: "8000", priceCurrency: "GYD", description: "30 Mbps wireless internet" },
        { "@type": "Offer", name: "Premium Plan", price: "10000", priceCurrency: "GYD", description: "40 Mbps wireless internet" },
      ],
    },
    {
      "@type": "LocalBusiness",
      "@id": "https://evolvewireless.gy/#local",
      name: "Evolve Solar Solutions",
      url: "https://evolvewireless.gy/solar",
      description: "Professional solar panel installation for homes and businesses in Guyana.",
      areaServed: { "@type": "Country", name: "Guyana" },
      parentOrganization: { "@id": "https://evolvewireless.gy/#organization" },
    },
    {
      "@type": "WebSite",
      "@id": "https://evolvewireless.gy/#website",
      url: "https://evolvewireless.gy",
      name: "Evolve Wireless Internet & Solar Solutions",
      publisher: { "@id": "https://evolvewireless.gy/#organization" },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,600;12..96,700;12..96,800&family=Nunito:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
