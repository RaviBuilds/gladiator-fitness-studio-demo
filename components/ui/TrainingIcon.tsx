import type { ReactNode } from "react";
import type { TrainingIconName } from "@/lib/types";

/**
 * Training-floor icon set. Fixed part of the Master Component System.
 *
 * Deliberately not an icon library: five geometric line marks drawn on the
 * same 24x24 grid with the same 1.5px square-capped stroke and `currentColor`,
 * so they read as one technical system (equipment labels / floor signage)
 * rather than a decorative icon pack. No fills, no rounded joins, no circular
 * containers — the module's own rule and index carry the framing.
 *
 * Every icon is decorative: the adjacent text label is the accessible name,
 * so the svg is always aria-hidden.
 */
const MARKS: Record<TrainingIconName, ReactNode> = {
  // Barbell: loaded bar seen from the front — plates outboard, collars inboard.
  strength: (
    <>
      <path d="M2 12h20" />
      <path d="M5 7.5v9" />
      <path d="M19 7.5v9" />
      <path d="M8.5 9.5v5" />
      <path d="M15.5 9.5v5" />
    </>
  ),
  // Cardio: work/rest interval trace — performance readout, not a cartoon runner.
  cardio: (
    <>
      <path d="M2 15h3.5l3-8 3.5 11 3-7h6" />
      <path d="M2 20h20" />
    </>
  ),
  // Dedicated training: a target crossed by its own sight lines.
  coaching: (
    <>
      <path d="M12 4v4" />
      <path d="M12 16v4" />
      <path d="M4 12h4" />
      <path d="M16 12h4" />
      <path d="M8 8h8v8H8z" />
      <path d="M11.25 11.25h1.5v1.5h-1.5z" />
    </>
  ),
  // Equipment: a rack — two uprights, two crossbars, floor line.
  equipment: (
    <>
      <path d="M5 3v16" />
      <path d="M19 3v16" />
      <path d="M5 8h14" />
      <path d="M5 13h14" />
      <path d="M2 19h20" />
    </>
  ),
  // Floor (fallback): a plan-view floor plate with its centre lines.
  floor: (
    <>
      <path d="M3 4h18v16H3z" />
      <path d="M3 12h18" />
      <path d="M12 4v16" />
    </>
  ),
};

export function TrainingIcon({
  name,
  className = "",
}: {
  name: TrainingIconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {MARKS[name] ?? MARKS.floor}
    </svg>
  );
}
