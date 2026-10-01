import type {
  IntervalStation,
  TrainingWeekGapCopy,
  TrainingWeekModule,
  TrainingWeekPattern,
} from "@/lib/types";

/**
 * Section 07 — INTERVAL LOG derivation layer.
 *
 * Every numeral, marker, gap classification and CTA string the chapter shows
 * is computed here, in one pure module with no React and no DOM. Same
 * reasoning as components/sections/trainingLoadout.ts and
 * components/sections/transformationDossier.ts: the data file may only hold
 * reviewed principles, the component may only render, and everything derived
 * sits in between where it can be unit-tested
 * (scripts/between-sessions.test.mjs).
 *
 * The rule that matters most in this file: the week strip DERIVES a
 * description of a pattern the visitor selected. It never ranks patterns,
 * never scores them, and never returns a "best" or "recommended" anything —
 * there is no field in any return type here that could carry one.
 */

/** Days in the illustrated week. Fixed: the strip is always one week. */
export const WEEK_LENGTH = 7;

/** Two-digit index numeral, e.g. 1 -> "01". Shared by every readout. */
export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Only `enabled: true` stations reach the log. */
export function enabledStations(stations: IntervalStation[]): IntervalStation[] {
  return stations.filter((station) => station.enabled);
}

/** One rendered station, with its position in the log resolved. */
export interface StationView extends IntervalStation {
  /** 1-based, zero-padded, e.g. "02". */
  index: string;
  /** 0-based position, used for motion delays and the spine graduation. */
  position: number;
  /** True for the final station, which closes the spine. */
  last: boolean;
}

/**
 * Resolve the log. The index is assigned AFTER filtering, so disabling a
 * station renumbers the log (01, 02, 03) instead of leaving a gap in it.
 */
export function buildStationViews(stations: IntervalStation[]): StationView[] {
  const list = enabledStations(stations);
  return list.map((station, i) => ({
    ...station,
    index: pad(i + 1),
    position: i,
    last: i === list.length - 1,
  }));
}

export type GapKey = "short" | "standard" | "long";

/**
 * Classify the longest gap in a week pattern.
 *
 * Descriptive only. "Long gap" is not a warning and "Short gap" is not a
 * recommendation — the copy attached to each key (lib/between-sessions.ts)
 * describes what the spacing means for training and stops there.
 */
export function classifyGap(longestGap: number): GapKey {
  if (longestGap <= 1) return "short";
  if (longestGap === 2) return "standard";
  return "long";
}

export interface WeekReadout {
  /** Training days in the pattern. */
  sessions: number;
  /** Days with no session in them. */
  restDays: number;
  /**
   * Days between each consecutive pair of sessions, in week order, wrapping
   * around the week boundary. `[0, 1, 0, 2]` for Mon/Tue/Thu/Fri.
   */
  gaps: number[];
  /** The largest entry in `gaps`. */
  longestGap: number;
  /**
   * The day indices that make up the longest gap.
   *
   * Marking CELLS rather than drawing a span bracket is deliberate: the longest
   * gap in a repeating week very often crosses the week boundary (Friday to
   * Monday), which no contiguous bracket can draw honestly. A set of indices is
   * correct whether the gap wraps or not, with no special case anywhere.
   */
  longestGapDays: number[];
  gapKey: GapKey;
  gapLabel: string;
  gapDetail: string;
}

/**
 * Read a week pattern into the strip's readout.
 *
 * The week is treated as CIRCULAR, because a training week repeats: the gap
 * between Friday and the following Monday is a real gap and is the one most
 * patterns are actually shaped by. A pattern with no sessions has nothing to
 * describe and returns null, so the readout disappears rather than rendering
 * "0 sessions · — gap".
 */
export function readWeekPattern(
  days: boolean[],
  gaps: Record<GapKey, TrainingWeekGapCopy>
): WeekReadout | null {
  const week = days.slice(0, WEEK_LENGTH);
  const sessionDays: number[] = [];
  for (let i = 0; i < week.length; i += 1) {
    if (week[i]) sessionDays.push(i);
  }

  if (sessionDays.length === 0) return null;

  const spans: number[] = [];
  for (let i = 0; i < sessionDays.length; i += 1) {
    const current = sessionDays[i];
    const next = sessionDays[(i + 1) % sessionDays.length];
    // Wrapping distance from one session day to the next, minus the step
    // itself, gives the number of EMPTY days between them. A single session in
    // the week wraps onto itself and correctly yields WEEK_LENGTH - 1.
    const distance = (next - current + WEEK_LENGTH) % WEEK_LENGTH || WEEK_LENGTH;
    spans.push(distance - 1);
  }

  const longestGap = Math.max(...spans);
  const gapKey = classifyGap(longestGap);

  // First span of maximum length wins, so the marked cells are deterministic
  // when two gaps tie.
  const longestIndex = spans.indexOf(longestGap);
  const longestGapDays: number[] = [];
  for (let step = 1; step <= longestGap; step += 1) {
    longestGapDays.push((sessionDays[longestIndex] + step) % WEEK_LENGTH);
  }

  return {
    sessions: sessionDays.length,
    restDays: week.length - sessionDays.length,
    gaps: spans,
    longestGap,
    longestGapDays,
    gapKey,
    gapLabel: gaps[gapKey].label,
    gapDetail: gaps[gapKey].detail,
  };
}

/**
 * Normalise a pattern to exactly seven days.
 *
 * A short array is padded with non-training days and a long one is truncated,
 * so a mistyped pattern in a clone's data file renders a well-formed week
 * instead of a strip with six or nine cells.
 */
export function normalizePattern(pattern: TrainingWeekPattern): boolean[] {
  const days = pattern.days.slice(0, WEEK_LENGTH).map(Boolean);
  while (days.length < WEEK_LENGTH) days.push(false);
  return days;
}

/**
 * Per-day session numerals: "01" on the first training day of the week, "02" on
 * the second, and null on every day with no session.
 *
 * Derived here rather than counted while the cells render, so the strip stays a
 * pure projection of the pattern.
 */
export function sessionNumerals(days: boolean[]): Array<string | null> {
  let count = 0;
  return days.map((isSession) => {
    if (!isSession) return null;
    count += 1;
    return pad(count);
  });
}

/** Patterns that actually contain at least one session. */
export function usablePatterns(week: TrainingWeekModule): TrainingWeekPattern[] {
  return week.patterns.filter((pattern) =>
    normalizePattern(pattern).some(Boolean)
  );
}

/**
 * Accessible sentence for one day cell, e.g. "Monday — training day".
 *
 * The cell's visual state is a filled block versus a rule, so the state is
 * never carried by colour alone; this string is what assistive technology
 * reads instead of the block.
 */
export function describeDay(
  dayIndex: number,
  isSession: boolean,
  week: TrainingWeekModule
): string {
  const name = week.dayNames[dayIndex] ?? week.dayLabels[dayIndex] ?? `Day ${dayIndex + 1}`;
  return `${name} — ${isSession ? week.sessionDayLabel : week.restDayLabel}`;
}

/**
 * Rewrite the site-wide WhatsApp href so the message carries this chapter's
 * context.
 *
 * The gym's number is NEVER stored in or known to Section 07 — the base href
 * is the existing site-wide action built once in app/page.tsx. This only swaps
 * the `text` query parameter, and returns the href untouched when there is no
 * `text` parameter to swap (a `tel:` or custom CTA href), so a gym that routes
 * its CTA elsewhere is never handed a broken link.
 */
export function withCtaMessage(baseHref: string, message: string): string {
  try {
    const url = new URL(baseHref);
    if (!url.searchParams.has("text")) return baseHref;
    url.searchParams.set("text", message);
    // URLSearchParams serialises a space as "+", which not every consumer
    // decodes back to a space. The site-wide href is built with
    // encodeURIComponent (app/page.tsx), so normalise to %20 and keep one
    // encoding across the whole site.
    url.search = url.search.replace(/\+/g, "%20");
    return url.toString();
  } catch {
    return baseHref;
  }
}
