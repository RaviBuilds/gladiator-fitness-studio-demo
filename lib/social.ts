import type { SocialConfiguration } from "./types";

/**
 * Master social/Instagram data. Curated content only — no live authenticated
 * Instagram API dependency in Factory v1. An empty posts array is valid and
 * renders a "Follow us on Instagram" fallback CTA, never a broken widget.
 *
 * NOTE: `social` below is not currently imported by any component — the live
 * Instagram section (components/sections/Instagram.tsx) reads from
 * lib/instagram.ts. See docs/gym-customization-manifest.md §9.1
 * ("lib/social.ts is orphaned"). Left in sync with lib/instagram.ts for data
 * consistency (Phase 18) in case a future section consumes this module; not a
 * live rendering path. `socialLinks` further down IS live (footer icons).
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

/**
 * Footer social icons (Facebook, Justdial, X) shown next to Instagram.
 *
 * SOURCE-FIRST: no account-specific profile URL has been supplied for these
 * networks yet, so each `href` defaults to the network's own homepage and NO
 * handle or username is invented. When the gym's real profile URL is
 * available, replace the `href` below — the icon keeps working with no
 * component change.
 *
 * Instagram is configured separately in lib/instagram.ts (it also drives the
 * Reel embeds) and is not repeated here.
 */
export interface SocialLink {
  id: "facebook" | "justdial" | "x";
  /** Accessible name for the icon, e.g. "Facebook". */
  label: string;
  /** Profile URL. Defaults to the network homepage until the gym's own is set. */
  href: string;
}

export const socialLinks: SocialLink[] = [
  { id: "facebook", label: "Facebook", href: "https://www.facebook.com" },
  { id: "justdial", label: "Justdial", href: "https://www.justdial.com" },
  { id: "x", label: "X", href: "https://x.com" },
];
