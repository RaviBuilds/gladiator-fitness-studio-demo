import type { First30DaysConfiguration } from "./types";

/**
 * /first-30-days — "Plan Your First 30 Days" per-gym data.
 *
 * A clone edits THIS file (and the assets in public/assets/first-30-days/),
 * never the component or its logic module.
 *
 * IMAGES — campaign images, NOT photographs of this gym's own floor, so each
 * `alt` describes only what is in the frame (same policy as lib/journey.ts).
 * All four assets are ≈16:9 landscape (1568 × 882). Every image is optional:
 * remove an entry and its card renders text-only.
 *
 * CAPABILITIES — the claim gate. A result block that mentions an onboarding
 * service only renders as a statement when that capability is
 * `verified: true` AND carries a `source`. Until then the tool phrases it as
 * a question the visitor can ask the gym.
 *
 * GLADIATOR FITNESS STUDIO: docs/gladiator-gym-research.md documents NO
 * trial, orientation, tour, assessment, check-in or trainer-introduction
 * policy, and the owner has not confirmed any (2026-10-02). Every capability
 * is therefore `verified: false`. Do not flip one to true without a written
 * owner confirmation recorded in `source`.
 *
 * FACTS — practical first-visit facts. Landmark is VERIFIED_OFFICIAL (Google
 * Business Profile, see lib/business.ts); parking and the accessible entrance
 * are PUBLICLY_REPORTED (lib/faq.ts item 05) and are labelled as such.
 */
export const first30DaysConfiguration: First30DaysConfiguration = {
  images: {
    hero: {
      src: "/assets/first-30-days/first-30-days-hero.webp",
      alt: "Man carrying a gym bag walks past a reception desk into a bright gym with dumbbell racks, benches and squat racks",
      objectPosition: "22% 40%",
      objectPositionMobile: "24% 30%",
    },
    firstVisit: {
      src: "/assets/first-30-days/first-visit-gym.webp",
      alt: "A staff member gestures across a gym floor while talking with a new visitor carrying a bag",
      objectPosition: "42% 35%",
    },
    weeklyRhythm: {
      src: "/assets/first-30-days/weekly-rhythm.webp",
      alt: "Man with a gym bag checks his phone at a gym entrance, with people training in the background",
      objectPosition: "28% 35%",
    },
    reflection: {
      src: "/assets/first-30-days/first-month-reflection.webp",
      alt: "Man with a towel over his shoulder and a water bottle stands on a gym floor between benches and racks",
      objectPosition: "40% 30%",
    },
  },
  capabilities: [
    {
      id: "orientation",
      verified: false,
      label: "Floor orientation",
      detail: "Someone walks new members through the floor and equipment.",
    },
    {
      id: "tour",
      verified: false,
      label: "Look-around visit",
      detail: "You can look around the gym before joining.",
    },
    {
      id: "trainerIntro",
      verified: false,
      label: "Trainer introduction",
      detail: "New members are introduced to a trainer.",
    },
    {
      id: "assessment",
      verified: false,
      label: "Starting assessment",
      detail: "New members can book a starting assessment.",
    },
    {
      id: "trialSession",
      verified: false,
      label: "Trial session",
      detail: "A trial session is available before joining.",
    },
    {
      id: "checkIns",
      verified: false,
      label: "New-member check-ins",
      detail: "Staff check in with new members during the first weeks.",
    },
  ],
  firstVisitFacts: [
    { id: "landmark", label: "Landmark", value: "Opposite Leaf Hospital" },
    { id: "parking", label: "Parking", value: "Car parking publicly reported" },
    { id: "access", label: "Access", value: "Wheelchair-accessible entrance publicly reported" },
  ],
};
