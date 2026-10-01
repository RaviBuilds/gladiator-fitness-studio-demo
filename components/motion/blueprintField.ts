/**
 * Section 03 — Performance Blueprint field geometry.
 *
 * Pure functions, no React: the annotation field's spatial logic lives here so
 * it can be reasoned about (and tested) independently of the markup, exactly
 * like components/sections/kineticBands.ts and components/motion/heroZone.ts.
 *
 * The composition is a three-column technical sheet on desktop:
 *
 *     column 1            column 2            column 3
 *   ┌──────────────┬────────────────────┬──────────────┐
 *   │ annotation 01│                    │ annotation 02│   row 1
 *   ├──────────────┤      ATHLETE       ├──────────────┤
 *   │ annotation 03│                    │ annotation 04│   row 2
 *   ├──────────────┴────────────────────┴──────────────┤
 *   │              annotation 05 (centre axis)          │   row 3
 *   └───────────────────────────────────────────────────┘
 *
 * The first four principles take the perimeter slots that flank the athlete;
 * anything beyond four continues below the figure on the same alternating
 * left/right logic, and a trailing odd item lands on the centre axis directly
 * under the subject. This is what makes the same composition hold for 4, 5 or
 * 6+ principles without a hand-authored coordinate per gym.
 *
 * Returned rows are 1-based within the annotation field; the CSS adds the
 * sheet-header row offset, so this module never needs to know about it.
 */

/** Which way an annotation's connector points, and how its text is aligned. */
export type AnnotationSide = "left" | "right" | "base";

export interface AnnotationSlot {
  /** 1-based row inside the annotation field. */
  row: number;
  /** Grid column: 1 = left of the athlete, 2 = centre axis, 3 = right. */
  column: number;
  side: AnnotationSide;
}

/** How many principles flank the figure before the field continues below it. */
const PERIMETER_SLOTS = 4;

export function annotationSlot(index: number, total: number): AnnotationSlot {
  if (index < PERIMETER_SLOTS) {
    const onLeft = index % 2 === 0;
    return {
      row: Math.floor(index / 2) + 1,
      column: onLeft ? 1 : 3,
      side: onLeft ? "left" : "right",
    };
  }

  const overflow = index - PERIMETER_SLOTS;
  const row = PERIMETER_SLOTS / 2 + Math.floor(overflow / 2) + 1;

  // A trailing item with no partner sits on the centre axis under the figure
  // instead of hanging alone in the left column.
  const alone = overflow % 2 === 0 && index === total - 1;
  if (alone) return { row, column: 2, side: "base" };

  const onLeft = overflow % 2 === 0;
  return { row, column: onLeft ? 1 : 3, side: onLeft ? "left" : "right" };
}

/**
 * Vertical anchor point on the athlete for a principle, as a CSS percentage.
 *
 * Drives one custom property (--wcu-target) that the crosshair, the local
 * light on the figure and the floor-line tick all read, so the active
 * principle has a single spatial truth. Derived from the item count rather
 * than authored, so it spaces itself for any number of principles, and kept
 * inside 20%–76% so the marker never rides off the top of the frame or into
 * the floor line.
 */
export function targetOffset(index: number, total: number): string {
  if (total <= 1) return "48%";
  const span = 56;
  const value = 20 + (index * span) / (total - 1);
  return `${Math.round(value * 100) / 100}%`;
}
