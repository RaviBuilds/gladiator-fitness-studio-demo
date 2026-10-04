import type { TransformationItem } from "./types";

/**
 * Master transformations data. Conditional module. Only items with
 * consentVerified:true render. Never invent kilos lost, timeframe, or body
 * composition figures.
 *
 * Each item's `image` is a single combined before/after diptych photograph
 * — that is the real artifact most gyms will supply. `beforeImage` /
 * `afterImage` are optional and only apply when a gym genuinely has two
 * independent photographs; never derive them by cropping `image` in half.
 *
 * The dossier fields (`journey`, `metrics`, `training`, `nutrition`,
 * `coachNotes`) are ALL optional. Supply only what the member has approved
 * and the gym has actually recorded; anything omitted is not rendered, and
 * never rendered as a dash or placeholder. See lib/types.ts and
 * components/sections/transformationDossier.ts.
 *
 * PLACEHOLDER DATA: populate only with real, consented transformation
 * stories. The two demo entries below exist for visual QA of the multi-case
 * register only.
 */
// MASTER DEMO DATA — placeholder entries for visual QA only.
//
// ⚠ SYNTHETIC FIGURES. Every number below is invented layout-test data for
// the metric ledger and notation blocks. It is NOT a member record and must
// be deleted or replaced with real, member-approved measurements before any
// gym build goes live (see docs/MASTER-GYM-CUSTOMIZATION-SOP.md).
//
// Both demo cases are currently data-COMPLETE. The component also renders a
// sparse case (journey + duration + a couple of training lines only) without
// empty rails, dashes or placeholder cells — omit fields to see that.
export const transformations: TransformationItem[] = [
  {
    image: "/assets/transformations/ironline-demo-transformation-01.webp",
    imageAlt:
      "Fat loss member combined before and after progress photograph, front view",
    beforeLabel: "Before",
    afterLabel: "After",
    mediaAspect: "square",
    personName: "Fat Loss Member",
    journey: "Fat loss",
    story:
      "Placeholder story text used only to test the transformations layout. Not a real member account, and no figures or timeframes are implied.",
    metrics: {
      durationMonths: 6,
      beforeWeightKg: 92,
      afterWeightKg: 78,
      beforeBmi: 29.4,
      afterBmi: 24.9,
      beforeBodyFatPct: 31.2,
      afterBodyFatPct: 21.6,
      sessionsPerWeek: 4,
    },
    training: [
      { label: "Strength", value: "3x / week", note: "Coach-led" },
      { label: "Conditioning", value: "20 min / session" },
      { label: "Mobility", value: "2x / week" },
      { label: "Personal training", value: "1 hr / week" },
    ],
    nutrition: [
      { label: "Protein", value: "High-protein plan" },
      { label: "Added sugar", value: "Reduced" },
      { label: "Meal timing", value: "Consistent" },
    ],
    coachNotes: [
      "Training consistency",
      "Progressive overload",
      "Meal discipline",
      "Sleep consistency",
    ],
    consentVerified: true,
  },
  {
    image: "/assets/transformations/ironline-demo-transformation-02.webp",
    imageAlt:
      "Weight loss member combined before and after progress photograph, front view",
    beforeLabel: "Before",
    afterLabel: "After",
    mediaAspect: "square",
    personName: "Weight Loss Member",
    journey: "Weight loss",
    story:
      "Placeholder story text used only to test the transformations layout. Not a real member account, and no figures or timeframes are implied.",
    // Synthetic layout-test figures, same status as case 01 (see the warning
    // at the top of this file). Replace with real, member-approved data.
    metrics: {
      durationMonths: 4,
      beforeWeightKg: 85,
      afterWeightKg: 74,
      beforeBmi: 28.1,
      afterBmi: 24.5,
      beforeBodyFatPct: 27.8,
      afterBodyFatPct: 20.4,
      sessionsPerWeek: 5,
    },
    training: [
      { label: "Strength", value: "4x / week", note: "Coach-led" },
      { label: "Conditioning", value: "10 min / session" },
      { label: "Mobility", value: "2x / week" },
      { label: "Personal training", value: "1 hr / week" },
    ],
    nutrition: [
      { label: "Protein", value: "Balanced plan" },
      { label: "Added sugar", value: "Reduced" },
      { label: "Meal timing", value: "Consistent" },
    ],
    coachNotes: [
      "Training consistency",
      "Portion control",
      "Daily step target",
      "Sleep consistency",
    ],
    consentVerified: true,
  },
];
