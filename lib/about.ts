import type { AboutConfiguration, BusinessHours } from "./types";

/**
 * Section 01 — facility / training-floor story content.
 *
 * Customizable per gym (labels, image, attributes, headline). The narrative
 * paragraph is deliberately NOT duplicated here: Section 01 renders
 * `business.description`, so the facility description has exactly one source
 * of truth.
 *
 * Source-First rules that apply to this file:
 * - A zone or attribute with `verified: false` does not render. Leave it in
 *   the file as documentation of what was checked and found absent.
 * - Never add a claim, statistic, equipment count, award or superlative here
 *   to make the section look fuller. The composition carries the density.
 *
 * GLADIATOR FITNESS STUDIO — populated from docs/gladiator-gym-research.md
 * (PROGRAMS.*, ABOUT.facilities, EQUIPMENT.*). Zones reflect the documented
 * weight-training / cardio-fitness program split and the publicly reported
 * equipment list. Attributes are limited to what the research actually
 * verified for the Madhapur branch — unlike the prior ANVI Fitness clone,
 * this research does not document a steam bath, lockers, showers, on-site
 * parking, air conditioning or nutrition consultation for Gladiator, so none
 * of those are claimed here.
 */
export const aboutConfiguration: AboutConfiguration = {
  index: "01",
  eyebrow: "About the gym",
  headlineLines: ["The floor behind", "the brand."],
  accentLastLine: true,
  image: {
    src: "/assets/about/gladiator-fitness-studio-madhapur-about-gym-interior.jpg",
    alt: "Wide view of the Gladiator Fitness Studio training floor in Madhapur, Hitech City",
  },
  imageLabel: "Training floor",
  frameLabel: "Facility",
  zonesLabel: "Training environment",
  attributesLabel: "Floor & support",
  scheduleLabel: "Opening schedule",
  zones: [
    {
      id: "strength",
      label: "Strength",
      detail: "Weight training with dedicated heavy-lifting areas, free weights and resistance machines.",
      icon: "strength",
      verified: true,
    },
    {
      id: "cardio",
      label: "Cardio",
      detail: "Cardio fitness area with commercial treadmills and cardio machines.",
      icon: "cardio",
      verified: true,
    },
    {
      id: "equipment",
      label: "Equipment",
      detail: "Free weights, dumbbells, heavy resistance machines and airbikes.",
      icon: "equipment",
      verified: true,
    },
  ],
  attributes: [
    { id: "spacious", label: "Spacious facilities", verified: true },
    { id: "clean", label: "Clean, well-maintained gym", verified: true },
    { id: "restrooms", label: "Restrooms", verified: true },
    { id: "accessibility", label: "Wheelchair-accessible entrance", verified: true },
    { id: "parking", label: "Car parking", verified: true },
    { id: "personal-training", label: "Personal training", verified: true },
    // Checked and not found in docs/gladiator-gym-research.md: unlike the
    // prior ANVI Fitness clone, no steam bath, locker or shower amenity is
    // documented for Gladiator Fitness Studio's Madhapur branch. Left here,
    // unverified, as the record of what was checked rather than omitted
    // silently — see the Source-First rule in this file's header comment.
    { id: "steam-bath", label: "Steam bath", verified: false },
  ],
  showSchedule: true,
};

/** One grouped opening window, e.g. `Mon–Fri / 05:00 AM – 11:00 PM`. */
export interface ScheduleWindow {
  label: string;
  value: string;
}

/**
 * Beyond this many distinct windows the readout stops being a compact
 * technical module and starts being a timetable, so Section 01 renders
 * nothing and the full hours stay with the location section instead.
 */
const MAX_SCHEDULE_GROUPS = 3;

function shortDay(day: string): string {
  return day.trim().slice(0, 3);
}

/**
 * Collapse a week of opening hours into consecutive day ranges that share the
 * same open/close window. Derived, never authored: the caller passes
 * `business.hours`, so Section 01 can only ever show hours that already exist
 * in lib/business.ts (and therefore in the LocalBusiness structured data) —
 * it cannot invent a schedule. Hours are taken as an explicit argument rather
 * than imported here so this module stays pure and directly testable.
 */
export function scheduleWindows(hours: BusinessHours[]): ScheduleWindow[] {
  if (hours.length === 0) return [];

  const groups: { days: string[]; open: string; close: string }[] = [];

  for (const entry of hours) {
    if (!entry.day || !entry.open || !entry.close) return [];
    const current = groups[groups.length - 1];
    if (current && current.open === entry.open && current.close === entry.close) {
      current.days.push(entry.day);
    } else {
      groups.push({ days: [entry.day], open: entry.open, close: entry.close });
    }
  }

  if (groups.length > MAX_SCHEDULE_GROUPS) return [];

  return groups.map((group) => ({
    label:
      group.days.length === 1
        ? shortDay(group.days[0])
        : `${shortDay(group.days[0])}\u2013${shortDay(group.days[group.days.length - 1])}`,
    value: `${group.open} \u2013 ${group.close}`,
  }));
}
