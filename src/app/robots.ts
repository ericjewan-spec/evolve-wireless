import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/portal/", "/login"],
      },
    ],
    sitemap: "https://evolvewireless.gy/sitemap.xml",
  };
}
