import type { FitnessTool } from "./types";

/**
 * INTERACTIVE FITNESS TOOLS — the single registry.
 *
 * Every guided, personalised experience the site offers is listed here once.
 * Two surfaces read it:
 *   - the hero carousel (a slide references a tool by `id` via `cta` in
 *     lib/hero.ts, resolved in components/sections/fitnessToolsLogic.ts), and
 *   - the Training Intelligence tools block (components/sections/
 *     TrainingIntelligence.tsx renders every AVAILABLE tool, in this order).
 *
 * A tool is AVAILABLE only when `enabled: true` AND `href` is a real route.
 * An unavailable tool renders nowhere, and any hero slide pointing at it shows
 * that slide's configured fallback action instead — never a dead link and
 * never a different tool standing in for it.
 *
 * SOURCE-FIRST: descriptions state only what the tool actually does (question
 * counts and the 3/6/12-month horizon come from the /start, /journey and
 * /first-30-days implementations). No outcome promises.
 *
 * CONNECTING ANOTHER TOOL (when its route exists):
 *   1. Build the route (app/<route>/page.tsx).
 *   2. Add an entry below with `name`, `description`, `meta`, `ctaLabel`, the
 *      route as `href` and `enabled: true`; add its id to FitnessToolId in
 *      lib/types.ts. A hero slide referencing it picks it up automatically.
 *   3. Follow-ups outside this registry: add the route to
 *      MOBILE_NAV_LINKS in lib/nav.ts and to app/sitemap.ts.
 */
export const fitnessTools: FitnessTool[] = [
  {
    id: "starting-point",
    index: "01",
    name: "Find Your Starting Point",
    description:
      "Five quick questions on your goal, experience and schedule, and a practical place to begin.",
    meta: "5 questions",
    ctaLabel: "Find your starting point",
    href: "/start",
    enabled: true,
  },
  {
    id: "journey",
    index: "02",
    name: "Map Your Fitness Journey",
    description:
      "Three questions, then a phased roadmap with checkpoints across a 3, 6 or 12-month view.",
    meta: "3 questions · 3/6/12-month view",
    ctaLabel: "Map your fitness journey",
    href: "/journey",
    enabled: true,
  },
  {
    id: "first-30-days",
    index: "03",
    name: "Plan Your First 30 Days",
    description:
      "Five quick questions, then a realistic first month: your weekly rhythm, a first visit and what to ask.",
    meta: "5 questions · ~1 min",
    ctaLabel: "Plan your first 30 days",
    href: "/first-30-days",
    enabled: true,
  },
];
