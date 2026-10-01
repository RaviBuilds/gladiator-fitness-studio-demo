/**
 * Pure geometry for the hero composition zone below 1024px. Kept free of
 * imports and non-erasable TS syntax so it can be unit tested directly with
 * Node's type stripping (see scripts/hero-zone.test.mjs).
 */

/** Breathing room (% of section height) between the zone bottom and the copy top. */
export const ZONE_GAP_PCT = 2;
/** Floor so a short copy block never drops the zone into the bottom UI. */
export const ZONE_MIN_PCT = 30;
/** Ceiling so a very tall copy block can never collapse the zone to nothing. */
export const ZONE_MAX_PCT = 70;

/**
 * Zone bottom offset (% of section height) that lifts the stage above the
 * copy block's top edge. Everything below the copy top (copy, slide
 * controls, container padding) counts toward the offset.
 *
 * Returns `null` when the section has no height (not laid out yet).
 */
export function computeZoneOffset(
  sectionBottom: number,
  sectionHeight: number,
  copyTop: number,
  gap: number = ZONE_GAP_PCT,
  min: number = ZONE_MIN_PCT,
  max: number = ZONE_MAX_PCT
): number | null {
  if (!sectionHeight) return null;
  const pct = ((sectionBottom - copyTop) / sectionHeight) * 100 + gap;
  return Math.min(Math.max(pct, min), max);
}
