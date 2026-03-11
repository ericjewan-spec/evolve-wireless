import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://evolvewireless.gy";
  const now = new Date().toISOString();

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/plans`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/coverage`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/coverage/map`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/speed-test`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/status`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
    { url: `${base}/pay`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // Solar
    { url: `${base}/solar`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/solar/gallery`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/solar/quote`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // Micro Strategy
    { url: `${base}/micro-strategy`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/micro-strategy/catalog`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/micro-strategy/portfolio`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/micro-strategy/consultation`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
}
