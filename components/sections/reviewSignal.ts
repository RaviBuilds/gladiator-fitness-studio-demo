import type { Review } from "@/lib/types";

/**
 * Section 06 — MEMBER SIGNAL (Google Reviews wall).
 *
 * Pure data-shaping helpers, deliberately separated from the JSX component
 * so the "1 review / 3 reviews / 5+ reviews" adaptive behaviour the Master
 * Gym Data Contract requires (see docs/MASTER-GYM-DATA-CONTRACT.md) is
 * covered by plain unit tests instead of only visual QA.
 *
 * The section renders ONE featured review (the hero quotation) plus zero or
 * more supporting reviews (a numbered ledger). Nothing here invents review
 * content — it only selects and paginates the array `lib/reviews.ts`
 * already supplies.
 */

export interface SignalReview extends Review {
  /** Stable 0-based position in the ORIGINAL configured review array. */
  index: number;
}

export interface SignalSet {
  /** The review currently promoted to the hero quotation. */
  featured: SignalReview;
  /** Every other configured review, in original order. */
  supporting: SignalReview[];
  total: number;
}

/**
 * Builds the featured/supporting split for a given active index. `active`
 * is clamped into range so a stale or out-of-bounds index (e.g. after the
 * gym trims their review list) can never throw or select `undefined`.
 */
export function buildSignalSet(reviews: Review[], active: number = 0): SignalSet | null {
  if (reviews.length === 0) return null;

  const clamped = Math.min(Math.max(0, active), reviews.length - 1);
  const withIndex = reviews.map((review, index) => ({ ...review, index }));

  const featured = withIndex[clamped];
  const supporting = withIndex.filter((r) => r.index !== clamped);

  return { featured, supporting, total: reviews.length };
}

/** Zero-pads a 0-based index into a 2-digit 1-based reference, e.g. 0 -> "01". */
export function padRef(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/**
 * Zero-pads a COUNT (a total, already 1-based) to 2 digits, e.g. 4 -> "04".
 *
 * Deliberately separate from padRef: padRef adds 1 because it converts a
 * 0-based index for display, so passing a total through it renders one MORE
 * than exists ("01 / 05" for four reviews), which reads as a phantom extra /
 * duplicated review. Totals must come through here.
 */
export function padCount(total: number): string {
  return String(Math.max(0, total)).padStart(2, "0");
}

/**
 * Accessible name for the rating instrument, shared by the visible mono
 * numerals and the single `role="img"` wrapper around them.
 */
export function buildRatingAccessibleName(rating: number, reviewCount: number): string {
  return `Rated ${rating.toFixed(1)} out of 5 from ${reviewCount} Google reviews`;
}

/**
 * Wrapping next/previous index helper for the featured-review controls.
 * Wraps rather than clamps: with an unknown, gym-configured review count the
 * control should behave the same whether there are 2 reviews or 20.
 */
export function stepIndex(current: number, direction: 1 | -1, total: number): number {
  if (total <= 0) return 0;
  return (current + direction + total) % total;
}

/**
 * Derives a 1-2 character initials avatar from a reviewer's name, for the
 * Google-native review card's avatar circle. Never a fabricated portrait —
 * see the GOOGLE-NATIVE REVIEW CARD spec: initials only, no generated faces.
 *
 * Takes the first letter of up to the first two words. Falls back to "?"
 * for an empty/whitespace-only name so a malformed data entry degrades to a
 * visible placeholder glyph rather than an empty circle.
 */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
