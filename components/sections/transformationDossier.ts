/**
 * Section 04 — Member dossier figure derivation.
 *
 * Pure functions, no React: the rule that turns a gym's raw numeric
 * `TransformationMetrics` into the dossier's metric ledger lives here so it
 * can be reasoned about (and tested) independently of the markup, exactly
 * like components/sections/kineticBands.ts and
 * components/motion/blueprintField.ts.
 *
 * Why this module exists at all — data integrity:
 *
 *   1. The DATA layer supplies only numbers. This module owns every label,
 *      unit, arrow and delta. A gym operator therefore cannot type a claim
 *      ("lost tons of fat!") into a metric slot, and cannot mislabel kilos
 *      as pounds.
 *   2. A cell is emitted ONLY when every figure it needs is present. A
 *      before/after pair needs BOTH halves. There is no code path that can
 *      produce "BMI —", "Weight: n/a" or an empty placeholder cell: absent
 *      figures produce no cell, and no cells produce no ledger.
 *   3. Deltas are arithmetic on supplied numbers (after − before), never an
 *      estimate, never a rounded-up marketing figure. Nothing is invented.
 *   4. Nonsense input is dropped rather than rendered: non-numbers, NaN,
 *      Infinity and non-positive values are ignored, so a half-filled CMS
 *      row can never render "0 → 71 kg".
 *
 * Ordering is fixed by commercial value, not by object key order, so every
 * gym's dossier reads in the same hierarchy: how long it took, what the
 * scale said, then composition, then training load. The first cell returned
 * is the LEAD cell — the component renders it at display size.
 *
 * Text is authored in sentence case; the section's CSS uppercases it (the
 * repo's convention), so no SHOUTING strings live in data or logic.
 */

/** Numeric figures for one case. Mirrors lib/types.ts's TransformationMetrics. */
export interface TransformationMetricsInput {
  durationMonths?: number;
  beforeWeightKg?: number;
  afterWeightKg?: number;
  beforeBmi?: number;
  afterBmi?: number;
  beforeBodyFatPct?: number;
  afterBodyFatPct?: number;
  beforeWaistCm?: number;
  afterWaistCm?: number;
  sessionsPerWeek?: number;
}

export type MetricKey = "duration" | "weight" | "bodyFat" | "bmi" | "waist" | "load";

export interface MetricCell {
  key: MetricKey;
  /** Short field name, e.g. "Duration". */
  label: string;
  /** Rendered figure, e.g. "82 → 71 kg". */
  value: string;
  /** Derived change, e.g. "−11 kg". Absent when there is nothing to derive. */
  note?: string;
}

/** Fixed reading order of the ledger. Also the priority when capping cells. */
export const METRIC_ORDER: readonly MetricKey[] = [
  "duration",
  "weight",
  "bodyFat",
  "bmi",
  "waist",
  "load",
];

/** The most cells the ledger will ever show, however much data exists. */
export const MAX_METRIC_CELLS = 6;

/** A usable figure: a real, finite, positive number. Anything else is dropped. */
function isFigure(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * At most one decimal, with a trailing ".0" trimmed — body-composition
 * figures are quoted to one decimal (21.7), whole kilos stay whole (71).
 */
export function formatFigure(value: number): string {
  return String(Math.round(value * 10) / 10);
}

/** Signed change with a true minus sign (U+2212), not a hyphen. */
function formatChange(before: number, after: number, unit?: string): string | undefined {
  const change = Math.round((after - before) * 10) / 10;
  if (change === 0) return undefined;
  const sign = change < 0 ? "\u2212" : "+";
  return `${sign}${formatFigure(Math.abs(change))}${unit ? ` ${unit}` : ""}`;
}

/** before → after, e.g. "82 → 71 kg". */
function formatSpan(before: number, after: number, unit?: string): string {
  const span = `${formatFigure(before)} \u2192 ${formatFigure(after)}`;
  return unit ? `${span} ${unit}` : span;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Build the dossier's metric ledger for one case.
 *
 * Returns [] when there is nothing verified to show — the component then
 * renders no ledger at all rather than an empty rail.
 */
export function buildMetricCells(
  metrics?: TransformationMetricsInput,
  max: number = MAX_METRIC_CELLS
): MetricCell[] {
  if (!metrics) return [];

  const cells: MetricCell[] = [];

  const duration = metrics.durationMonths;
  if (isFigure(duration)) {
    const months = Math.round(duration);
    cells.push({
      key: "duration",
      label: "Duration",
      value: `${pad2(months)} ${months === 1 ? "month" : "months"}`,
    });
  }

  const pairs: {
    key: MetricKey;
    label: string;
    before?: number;
    after?: number;
    unit?: string;
    changeUnit?: string;
  }[] = [
    {
      key: "weight",
      label: "Weight",
      before: metrics.beforeWeightKg,
      after: metrics.afterWeightKg,
      unit: "kg",
      changeUnit: "kg",
    },
    {
      key: "bodyFat",
      label: "Body fat",
      before: metrics.beforeBodyFatPct,
      after: metrics.afterBodyFatPct,
      unit: "%",
      changeUnit: "pts",
    },
    {
      key: "bmi",
      label: "BMI",
      before: metrics.beforeBmi,
      after: metrics.afterBmi,
    },
    {
      key: "waist",
      label: "Waist",
      before: metrics.beforeWaistCm,
      after: metrics.afterWaistCm,
      unit: "cm",
      changeUnit: "cm",
    },
  ];

  for (const pair of pairs) {
    // Both halves required: a lone "after" figure proves no change.
    if (!isFigure(pair.before) || !isFigure(pair.after)) continue;
    cells.push({
      key: pair.key,
      label: pair.label,
      value: formatSpan(pair.before, pair.after, pair.unit),
      note: formatChange(pair.before, pair.after, pair.changeUnit),
    });
  }

  const sessions = metrics.sessionsPerWeek;
  if (isFigure(sessions)) {
    cells.push({
      key: "load",
      label: "Training load",
      value: `${formatFigure(sessions)}\u00d7 / week`,
    });
  }

  const order = new Map(METRIC_ORDER.map((key, index) => [key, index]));
  cells.sort((a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0));

  const cap = Math.max(0, Math.min(Math.floor(max), MAX_METRIC_CELLS));
  return cells.slice(0, cap);
}
