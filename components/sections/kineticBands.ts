/**
 * Kinetic Identity Strip — band geometry and motion math.
 *
 * FIXED part of the Master Component System: the two bands' typography
 * variant, direction, density and target velocity live here, while the
 * phrases themselves stay customizable in lib/kinetic-strip.ts (see the
 * Fixed vs Customizable matrix in docs/MASTER-GYM-WEBSITE-ARCHITECTURE.md).
 *
 * Why the width math exists: the strip is a Server Component with no
 * measurement step, and a CSS marquee only loops seamlessly while one copy
 * of the content is at least as wide as the viewport. Below that, the
 * -50% translate exposes empty track (a visible blank gap) at wide
 * viewports. So the run width is *estimated* from character counts at the
 * type ceiling, and the sequence is repeated just enough times to clear
 * MIN_COPY_PX — no more. The same estimate makes speed deterministic:
 * duration = distance / target velocity instead of a magic seconds value.
 *
 * Kept free of JSX so scripts/kinetic-strip.test.mjs can import it under
 * `node --test` type stripping, matching components/motion/heroZone.ts.
 */

export type BandVariant = "declaration" | "technical";
export type BandDirection = "left" | "right";

export interface BandPreset {
  variant: BandVariant;
  /** Scroll direction. The two bands must always oppose each other. */
  direction: BandDirection;
  /**
   * Target velocity in CSS px/s once the type reaches its clamp ceiling.
   * Narrower viewports render smaller type, so the same duration yields a
   * proportionally slower band — deliberate: motion must not speed up just
   * because the viewport got narrow.
   */
  velocityPxPerSecond: number;
  separator: string;
  /** Phrase indices rendered in the recessed tone (declaration band). */
  recessedIndices: readonly number[];
  /** Phrase indices rendered in the accent color (technical band). */
  accentIndices: readonly number[];
  /** Type clamp ceiling, px. Keep in sync with app/globals.css. */
  fontCeilingPx: number;
  /** Type clamp floor, px. Keep in sync with app/globals.css. */
  fontFloorPx: number;
  /** Mean glyph advance as a ratio of font size, tracking included. */
  advanceRatio: number;
  /** Separator glyph advance, px, at the type ceiling. */
  separatorPx: number;
  /** Flex gap between items, px, at the type ceiling. */
  gapPx: number;
}

/**
 * Strip 01. Largest type on the page after the hero headline, moving left,
 * slowly and linearly. Index 0 of the sequence (the brand name) is recessed
 * so the band has internal hierarchy without a second color.
 */
export const DECLARATION_BAND: BandPreset = {
  variant: "declaration",
  direction: "left",
  velocityPxPerSecond: 42,
  separator: "✦",
  recessedIndices: [0],
  accentIndices: [],
  fontCeilingPx: 68, // 4.25rem
  fontFloorPx: 25.6, // 1.6rem
  advanceRatio: 0.58, // Geist 800, uppercase, -0.025em tracking
  separatorPx: 18,
  gapPx: 36, // 2.25rem
};

/**
 * Strip 02. Technical training-floor metadata: mono, small, tightly
 * tracked, moving right at a clearly different rate. Index 0 (the locality)
 * carries the accent color as the single highlighted metadata token.
 */
export const TECHNICAL_BAND: BandPreset = {
  variant: "technical",
  direction: "right",
  velocityPxPerSecond: 60,
  separator: "✦",
  recessedIndices: [],
  accentIndices: [0],
  fontCeilingPx: 13, // 0.8125rem
  fontFloorPx: 11, // 0.6875rem
  advanceRatio: 0.82, // Geist Mono 0.6em advance + 0.22em tracking
  separatorPx: 8,
  gapPx: 28, // 1.75rem
};

/**
 * Widest viewport the loop is guaranteed gap-free at. Covers every QA
 * viewport (1920 max) plus headroom for 2048/2304 logical widths. Raising
 * it only adds DOM; it does not change velocity, because duration scales
 * with the distance travelled.
 */
export const MIN_COPY_PX = 2400;

/**
 * The width estimate is treated as 25% optimistic when deciding how many
 * times to repeat the sequence, so a font metric that is wider in reality
 * than estimated can never produce a blank gap.
 */
export const WIDTH_SAFETY = 1.25;

/**
 * Estimated rendered width, in px, of one run of the phrase sequence at the
 * band's type ceiling. A run is: for each phrase, the phrase plus its
 * trailing separator, laid out in a flex row with `gapPx` between every
 * item and one trailing `gapPx` before the next run.
 */
export function estimateRunWidth(
  phrases: readonly string[],
  preset: BandPreset,
): number {
  if (phrases.length === 0) return 0;
  const glyphs = phrases.reduce((sum, phrase) => sum + phrase.length, 0);
  const text = glyphs * preset.fontCeilingPx * preset.advanceRatio;
  const separators = phrases.length * preset.separatorPx;
  // 2 items per phrase (text + separator), each followed by a gap.
  const gaps = phrases.length * 2 * preset.gapPx;
  return text + separators + gaps;
}

/**
 * How many times the sequence repeats inside a single loop copy. Always at
 * least 1, and never more than needed to clear MIN_COPY_PX.
 */
export function runRepeatCount(
  phrases: readonly string[],
  preset: BandPreset,
): number {
  const width = estimateRunWidth(phrases, preset) / WIDTH_SAFETY;
  if (width <= 0) return 1;
  return Math.max(1, Math.ceil(MIN_COPY_PX / width));
}

/**
 * Animation duration for a full loop. The track holds two identical copies
 * and translates by exactly 50% of its own width, so the distance covered
 * per iteration is one copy: `runWidth * repeat`.
 */
export function trackDurationSeconds(
  phrases: readonly string[],
  preset: BandPreset,
): number {
  const distance = estimateRunWidth(phrases, preset) * runRepeatCount(phrases, preset);
  const seconds = distance / preset.velocityPxPerSecond;
  return Math.round(seconds * 10) / 10;
}

/**
 * Rendered font size at a given viewport width, resolving the band's
 * `clamp(floor, vw, ceiling)` type scale. Used by the tests to reason about
 * effective velocity per viewport; the browser resolves the real value from
 * app/globals.css.
 */
export function effectiveFontPx(preset: BandPreset, viewportPx: number): number {
  const vwShare = preset.variant === "declaration" ? 0.05 : 0.0105;
  const preferred = viewportPx * vwShare;
  return Math.min(preset.fontCeilingPx, Math.max(preset.fontFloorPx, preferred));
}

/**
 * Duration multiplier applied to the declaration band under 640px in
 * app/globals.css. Its small-viewport type sits at the clamp floor, which
 * would otherwise drift at ~38% of the desktop velocity; this lifts it to a
 * controlled ~21px/s without ever exceeding desktop speed, and stays
 * continuous with the value just above the breakpoint. The technical band is
 * unscaled — its type barely shrinks. Keep in sync with the
 * `max-width: 639px` rule in globals.css.
 */
export const SMALL_VIEWPORT_DURATION_SCALE = 0.75;
