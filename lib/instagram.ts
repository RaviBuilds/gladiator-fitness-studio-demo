/**
 * Instagram configuration — official embed mode.
 *
 * PURE FRONTEND TEMPLATE: no Instagram API, no OAuth, no Meta tokens.
 * This is the default manual embed mode using public Instagram Reel URLs
 * and the official Instagram embed script.
 *
 * FUTURE CLIENT WORKFLOW:
 * - Clone template
 * - Edit this file only
 * - Replace profileUrl, handle, and Reel URLs with client's content
 * - Website updated
 *
 * No component modification required for standard customization.
 */

export interface InstagramReel {
  /** Stable identifier for React keys */
  id: string;
  /** Full Instagram Reel URL for official embed */
  url: string;
  /** Content type - future-proofed for potential post support */
  type: "reel";
}

export interface InstagramConfiguration {
  /** Full Instagram profile URL */
  profileUrl: string;
  /** Display handle with @ prefix */
  handle: string;
  /** Reel embeds - render all supplied items, no artificial limit */
  items: InstagramReel[];
}

/**
 * GLADIATOR FITNESS STUDIO Instagram configuration.
 *
 * docs/gladiator-gym-research.md INSTAGRAM.* supplies a concrete profile
 * URL, handle and 3 Reel URLs (all three Reel entries are explicitly
 * `status: VERIFIED_OFFICIAL`, source "Official Instagram"). The
 * profile_url/handle fields carry a stray `status: NOT_FOUND` label left
 * over from the research template despite now holding real supplied
 * values (`source: null` on both — i.e. not sourced from a third-party
 * directory, but operator-supplied); per Phase 7 these are applied as
 * provided. The research's own INSTAGRAM.note ("Unified official Instagram
 * ownership was not verified by the research") is a general caveat on the
 * network's branding, not a basis to omit the officially-sourced Reels —
 * so all 3 supplied Reel URLs are wired in, same as the standard product's
 * 3-reel pattern.
 */
export const instagramConfig: InstagramConfiguration = {
  profileUrl: "https://www.instagram.com/gladiatorfitnessstudioandgym",
  handle: "@gladiatorfitnessstudioandgym",
  items: [
    {
      id: "reel-01",
      type: "reel",
      url: "https://www.instagram.com/reel/DWnVt7ekbEV/?utm_source=ig_web_copy_link&stkn=MzRlODBiNWFlZA==",
    },
    {
      id: "reel-02",
      type: "reel",
      url: "https://www.instagram.com/reel/DR2Np_vEzhC/?utm_source=ig_web_copy_link&stkn=MzRlODBiNWFlZA==",
    },
    {
      id: "reel-03",
      type: "reel",
      url: "https://www.instagram.com/reel/DO7ofenEVaz/?utm_source=ig_web_copy_link&stkn=MzRlODBiNWFlZA==",
    },
  ],
};
