import type { SEOConfiguration } from "./types";

/**
 * Master SEO configuration. Consumed once, centrally, by app/layout.tsx's
 * Metadata API. Never duplicate these values inside page/section
 * components.
 *
 * GLADIATOR FITNESS STUDIO SEO configuration, from
 * docs/gladiator-gym-research.md (SEO.title_candidate — INFERRED from
 * verified business data, not copied research commentary). canonical is a
 * placeholder domain pending the client's real production URL/domain (the
 * research confirms WEBSITE.discovery_status = "WEBSITE_NOT_FOUND").
 */
export const seo: SEOConfiguration = {
  title: "Gladiator Fitness Studio | Gym & Personal Training in Madhapur",
  description:
    "Gladiator Fitness Studio in Madhapur, Hitech City offers weight training, cardio fitness, bodybuilding, functional training and personal training on a spacious, clean training floor.",
  canonical: "https://example.com",
  ogImage: undefined,
  robots: "index, follow",
};
