import type { ReactNode } from "react";

/**
 * Floor & support facility icon set. Same technical language as
 * components/ui/TrainingIcon.tsx — geometric line marks on a 24x24 grid, a
 * 1.5px square-capped `currentColor` stroke, no fills and no rounded joins —
 * so the facility cards read as part of the same editorial system rather than
 * a bolted-on icon pack. NOT a new icon library.
 *
 * Marks are keyed by the facility `id` from lib/about.ts (data unchanged).
 * Every icon is decorative: the adjacent card label is the accessible name,
 * so the svg is always aria-hidden. An unknown id falls back to a neutral
 * check mark.
 */
const MARKS: Record<string, ReactNode> = {
  // Steam bath: a basin with three rising steam curls.
  "steam-bath": (
    <>
      <path d="M4 15h16" />
      <path d="M5 15a7 7 0 0 0 14 0" />
      <path d="M9 7c0 1.2-1 1.2-1 2.4S9 10.6 9 11.8" />
      <path d="M15 7c0 1.2-1 1.2-1 2.4s1 1.2 1 2.4" />
    </>
  ),
  // Changing rooms: a hanging garment on a rail.
  "changing-rooms": (
    <>
      <path d="M12 4a2 2 0 0 1 2 2c0 1-1 1.5-2 2" />
      <path d="M12 8 4 15h16L12 8Z" />
      <path d="M4 19h16" />
    </>
  ),
  // Showers: a shower head with falling water.
  showers: (
    <>
      <path d="M4 4h8" />
      <path d="M12 4v4" />
      <path d="M6 10h12l-2-2H8l-2 2Z" />
      <path d="M9 13v2" />
      <path d="M12 13v3" />
      <path d="M15 13v2" />
    </>
  ),
  // Lockers: two stacked locker doors with handles.
  lockers: (
    <>
      <path d="M5 3h14v18H5z" />
      <path d="M5 12h14" />
      <path d="M15 7v2" />
      <path d="M15 15v2" />
    </>
  ),
  // On-site parking: a bold "P" plate.
  parking: (
    <>
      <path d="M4 3h16v18H4z" />
      <path d="M9 17V7h3.5a2.5 2.5 0 0 1 0 5H9" />
    </>
  ),
  // Centralized air conditioning: a wall unit emitting airflow lines.
  "air-conditioning": (
    <>
      <path d="M3 5h18v7H3z" />
      <path d="M3 9h18" />
      <path d="M7 16c0 1.5 1.5 1.5 1.5 3" />
      <path d="M12 16c0 1.5 1.5 1.5 1.5 3" />
      <path d="M17 16c0 1.5-1.5 1.5-1.5 3" />
    </>
  ),
  // Wheelchair-accessible entrance: standard accessibility figure.
  accessibility: (
    <>
      <path d="M12 4v1.5" />
      <path d="M9 8h6" />
      <path d="M12 5.5V13h5" />
      <path d="M12 13a5 5 0 1 0 4 2" />
    </>
  ),
  // Drinking water: a water drop.
  "drinking-water": (
    <>
      <path d="M12 3c3 4 5 6.5 5 9a5 5 0 0 1-10 0c0-2.5 2-5 5-9Z" />
    </>
  ),
  // Nutrition consultation: a plate with cutlery.
  "nutrition-consultation": (
    <>
      <path d="M12 6a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z" />
      <path d="M12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />
      <path d="M4 4v6" />
      <path d="M20 4v6" />
    </>
  ),
  // Personal training: a coach figure (head + guiding arm).
  "personal-training": (
    <>
      <path d="M9 6a2 2 0 1 1 0 .01" />
      <path d="M9 9v6" />
      <path d="M9 11h4l3-2" />
      <path d="M9 15l-2 4" />
      <path d="M9 15l3 4" />
    </>
  ),
};

const FALLBACK: ReactNode = (
  <>
    <path d="M4 12l5 5L20 6" />
  </>
);

export function FacilityIcon({
  id,
  className = "",
}: {
  id: string;
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
      {MARKS[id] ?? FALLBACK}
    </svg>
  );
}
