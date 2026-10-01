import type { SocialConfiguration } from "./types";

/**
 * Master social/Instagram data. Curated content only — no live authenticated
 * Instagram API dependency in Factory v1. An empty posts array is valid and
 * renders a "Follow us on Instagram" fallback CTA, never a broken widget.
 *
 * NOTE: not currently imported by any component — the live Instagram
 * section (components/sections/Instagram.tsx) reads from lib/instagram.ts.
 * See docs/gym-customization-manifest.md §9.1 ("lib/social.ts is orphaned").
 * Left in sync with lib/instagram.ts for data consistency (Phase 18) in case
 * a future section consumes this module; not a live rendering path.
 *
 * GLADIATOR FITNESS STUDIO — docs/gladiator-gym-research.md INSTAGRAM.*
 * supplies a verified handle/URL (see lib/instagram.ts for the full
 * sourcing note). `posts` stays empty here since no curated post images are
 * part of this module's live rendering path (orphaned, see note above);
 * the live Reels render via lib/instagram.ts instead.
 */
export const social: SocialConfiguration = {
  instagramHandle: "@gladiatorfitnessstudioandgym",
  instagramUrl: "https://www.instagram.com/gladiatorfitnessstudioandgym",
  posts: [],
};
