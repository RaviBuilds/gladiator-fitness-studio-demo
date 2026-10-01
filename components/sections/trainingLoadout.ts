import type {
  Service,
  TrainingEmphasisLevel,
  TrainingGoal,
  TrainingLever,
} from "@/lib/types";

/**
 * Section 05 — TRAINING LOADOUT derivation layer.
 *
 * Every label, numeral, marker count, rail coordinate and CTA string shown by
 * the instrument is computed here, in one pure module with no React and no
 * DOM. Same reasoning as components/sections/transformationDossier.ts: the
 * data file may only hold facts and principles, the component may only render,
 * and everything derived sits in between where it can be unit-tested
 * (scripts/training-intelligence.test.mjs).
 */

/** Fixed number of plate slots per lever row. The scale is 1-3, always. */
export const EMPHASIS_SLOTS = 3;

/**
 * The emphasis vocabulary — the entire reason this section can teach emphasis
 * without inventing data.
 *
 * Three plate markers on a row mean "primary focus", not "100%", not "60% of
 * your week", not "3 sessions". The word is rendered NEXT TO the markers, so
 * the level is never communicated by fill colour alone (WCAG 1.4.1) and never
 * reads as a measurement.
 */
export const EMPHASIS_WORD: Record<TrainingEmphasisLevel, string> = {
  1: "Maintain",
  2: "Supporting",
  3: "Primary focus",
};

export interface EmphasisRow {
  id: string;
  label: string;
  /** Compact label for the narrow stack; falls back to `label`. */
  shortLabel: string;
  level: TrainingEmphasisLevel;
  /** "Maintain" | "Supporting" | "Primary focus". */
  word: string;
}

/** Two-digit index numeral, e.g. 1 -> "01". Shared by every readout. */
export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Only `enabled: true` goals reach the instrument. */
export function enabledGoals(goals: TrainingGoal[]): TrainingGoal[] {
  return goals.filter((goal) => goal.enabled);
}

/**
 * Build the lever stack for one goal, in the lever taxonomy's own order.
 *
 * A lever the goal does not define is OMITTED — not defaulted to 1, and not
 * rendered as an empty row or a dash. A partially configured goal therefore
 * degrades to fewer rows and never displays an emphasis the gym never stated.
 */
export function resolveEmphasis(
  goal: TrainingGoal,
  levers: TrainingLever[]
): EmphasisRow[] {
  const rows: EmphasisRow[] = [];

  for (const lever of levers) {
    const level = goal.emphasis[lever.id];
    if (level !== 1 && level !== 2 && level !== 3) continue;
    rows.push({
      id: lever.id,
      label: lever.label,
      shortLabel: lever.shortLabel ?? lever.label,
      level,
      word: EMPHASIS_WORD[level],
    });
  }

  return rows;
}

/**
 * Centre of the selector pin along the rail, as a percentage string.
 *
 * The rail is divided into `total` equal indexed positions and the pin sits in
 * the middle of its own position, so the geometry is correct for any number of
 * goals — 3, 5 or 8 — with no per-count special case. Consumed as the
 * `--s05-pin` custom property; the pin itself is centred on it in CSS.
 */
export function railPosition(index: number, total: number): string {
  if (total <= 0) return "50%";
  const clamped = Math.min(Math.max(index, 0), total - 1);
  const value = ((clamped + 0.5) / total) * 100;
  return `${Number(value.toFixed(4))}%`;
}

/**
 * Resolve a goal's mapped Section 02 program — but only if that program is
 * genuinely `verified: true`.
 *
 * This is the Source-First rule applied to a cross-section link: an unverified
 * or discontinued program cannot be surfaced by Section 05 just because a goal
 * still names it. Returns null when there is nothing honest to link to, and
 * the secondary CTA then does not render at all.
 */
export function resolveGoalProgram(
  goal: TrainingGoal,
  services: Service[]
): { id: string; name: string } | null {
  if (!goal.programId) return null;
  const service = services.find((s) => s.id === goal.programId && s.verified);
  return service ? { id: service.id, name: service.name } : null;
}

/** Fill `{goal}` in the CTA template. Lower-cased so it reads as a sentence. */
export function goalCtaMessage(template: string, goalLabel: string): string {
  return template.replace(/\{goal\}/g, goalLabel.toLowerCase());
}

/**
 * Rewrite the site-wide WhatsApp href so the message carries the selected
 * goal.
 *
 * The gym's number is NEVER stored in or known to Section 05 — the base href
 * is the existing site-wide action built once in app/page.tsx. This function
 * only swaps the `text` query parameter, and returns the href untouched if
 * there is no `text` parameter to swap (a `tel:` or custom CTA href), so a
 * gym that routes its CTA elsewhere is never handed a broken link.
 */
export function goalCtaHref(
  baseHref: string,
  template: string,
  goalLabel: string
): string {
  try {
    const url = new URL(baseHref);
    if (!url.searchParams.has("text")) return baseHref;
    url.searchParams.set("text", goalCtaMessage(template, goalLabel));
    // URLSearchParams serialises a space as "+", which not every consumer
    // decodes back to a space. The site-wide WhatsApp href is built with
    // encodeURIComponent (app/page.tsx), so normalise to %20 and keep one
    // encoding across the whole site. A literal "+" in the message is already
    // escaped to %2B by this point, so this cannot corrupt the text.
    url.search = url.search.replace(/\+/g, "%20");
    return url.toString();
  } catch {
    return baseHref;
  }
}

/**
 * Everything the client island needs for one goal, fully resolved.
 *
 * The island receives ONLY this: no services array, no configuration object it
 * does not use, no verification logic. Program verification and CTA href
 * construction both happen on the server, so the rules that decide what may be
 * shown never ship to the browser and can never be bypassed there.
 */
export interface LoadoutGoalView {
  id: string;
  label: string;
  premise: string;
  path: string;
  emphasis: EmphasisRow[];
  priorities: TrainingGoal["priorities"];
  mistakes: TrainingGoal["mistakes"];
  track: string[];
  coachNote: string;
  gymNote?: string;
  /** Name of the verified mapped program, or null when there is none. */
  programName: string | null;
  /** Goal-contextual primary CTA href. */
  ctaHref: string;
}

/** Resolve every enabled goal into its render-ready view. */
export function buildGoalViews({
  goals,
  levers,
  services,
  ctaBaseHref,
  ctaMessageTemplate,
}: {
  goals: TrainingGoal[];
  levers: TrainingLever[];
  services: Service[];
  ctaBaseHref: string;
  ctaMessageTemplate: string;
}): LoadoutGoalView[] {
  return enabledGoals(goals).map((goal) => {
    const program = resolveGoalProgram(goal, services);
    return {
      id: goal.id,
      label: goal.label,
      premise: goal.premise,
      path: goal.path,
      emphasis: resolveEmphasis(goal, levers),
      priorities: goal.priorities,
      mistakes: goal.mistakes,
      track: goal.track,
      coachNote: goal.coachNote,
      gymNote: goal.gymNote,
      programName: program ? program.name : null,
      ctaHref: goalCtaHref(ctaBaseHref, ctaMessageTemplate, goal.label),
    };
  });
}
