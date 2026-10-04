import type { MetadataRoute } from "next";
import { seo } from "@/lib/seo";

/**
 * Site sitemap. The canonical base comes from lib/seo.ts (the single source of
 * the production domain), with any trailing slash trimmed so URLs are built
 * consistently. Only the real routes are listed: the homepage and the three
 * interactive tools, /start, /journey and /first-30-days.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = seo.canonical.replace(/\/$/, "");
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/start`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/journey`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/first-30-days`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}
