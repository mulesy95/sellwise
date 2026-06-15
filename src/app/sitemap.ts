import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const now = new Date();
  return [
    { url: base,                  lastModified: now, changeFrequency: "weekly",  priority: 1 },
    { url: `${base}/pricing`,     lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/check`,       lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/status`,      lastModified: now, changeFrequency: "daily",   priority: 0.4 },
    { url: `${base}/terms`,       lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/privacy`,     lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];
}
