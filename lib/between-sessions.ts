import type { BetweenSessionsConfiguration } from "./types";

/**
 * Section 07 — BETWEEN SESSIONS + BODY MAP data.
 *
 * Like lib/training-intelligence.ts, this file is the factory's GLOBAL
 * EDUCATIONAL LIBRARY, not per-gym business facts. It is written once,
 * reviewed once, and reused across every clone.
 *
 * WHAT A CLONE EDITS HERE
 *   - `enabled` per station and per body-map group, and their order
 *   - `gymNote` — the optional "how we coach this here" line per station
 *   - `ctaLabel`, `ctaMessage`, `ctaNote`
 *   - `artifact` (leave `enabled: false`; see below)
 *   - the language of every label, for a non-English clone
 *
 * WHAT A CLONE DOES NOT EDIT
 *   The station framework, the interval markers, the muscle-group taxonomy,
 *   the educational copy, the pre-session check wording, the body-map state
 *   captions and the disclaimers. Rewriting this copy per gym is how a factory
 *   ends up publishing unreviewed nutrition, sleep and injury advice at scale.
 *
 * FACTUAL DISCIPLINE — read this before adding a line to this file.
 *   This section talks about food, sleep and pain, so the bar is higher than
 *   anywhere else in the template. Nothing below contains a calorie figure, a
 *   protein or macro number, a hydration volume, a sleep duration, a body-fat
 *   target, a supplement, a heart-rate zone, a guaranteed timeframe, a named
 *   condition, a physiological mechanism claim or a diagnosis. Every entry
 *   explains a PRINCIPLE and defers the individual dose to a coach or, where
 *   the honest answer is medical, to a clinician.
 *
 *   The interval markers are RELATIVE ("T+ 0-2 H", "That night", "Next day"),
 *   never clock times: the factory cannot know when a member trains, so the
 *   log is anchored to the last rep. "T+ 0-2 H" is an interval label on a
 *   timeline, not a nutrition or recovery window claim.
 *
 * NO PHOTOGRAPHY. `artifact` is present and disabled. The section is composed
 * so that the body-map SVG is the primary visual asset and the chapter is
 * complete with zero raster images.
 */
export const betweenSessionsConfiguration: BetweenSessionsConfiguration = {
  index: "07",
  eyebrow: "Between sessions",
  headlineLines: ["What happens outside", "the workout", "matters too."],
  accentLastLine: true,
  deck:
    "A session is the stimulus. The hours and days around it decide how much of that work you keep, how well you recover, and whether you are in a position to train again. This is the part of training that happens without a coach watching.",

  logLabel: "Interval log",
  openLabel: "Last rep",
  closeLabel: "Next session",
  principleLabel: "Principle",
  whyLabel: "Why it matters",
  practiceLabel: "In practice",
  watchLabel: "Watch for",
  gymNoteLabel: "How we coach this here",

  /* ---------------------------------------------------------- week strip */
  week: {
    label: "Your training week",
    intro:
      "Training occupies a small part of a week. Everything below is about the rest of it. The patterns are illustrative — they show how spacing changes, not what your week should be.",
    dayLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    dayNames: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    selectorLabel: "Sample session pattern",
    sessionsLabel: "Sessions",
    restLabel: "Days between sessions",
    gapLabel: "Longest gap",
    sessionDayLabel: "training day",
    restDayLabel: "no session",
    patterns: [
      { id: "two", label: "Two sessions", days: [true, false, false, true, false, false, false] },
      { id: "three", label: "Three sessions", days: [true, false, true, false, true, false, false] },
      { id: "four", label: "Four sessions", days: [true, true, false, true, true, false, false] },
      { id: "weekend", label: "Weekend only", days: [false, false, false, false, false, true, true] },
    ],
    gaps: {
      short: {
        label: "Short gap",
        detail:
          "Sessions land close together, so what you do between them has less room to go wrong — and recovery has less room to happen. Spacing like this usually means alternating what each session asks of you.",
      },
      standard: {
        label: "Standard gap",
        detail:
          "A day or two between sessions is the spacing most people settle into. Long enough to recover from the last session, short enough that the next one still builds on it.",
      },
      long: {
        label: "Long gap",
        detail:
          "A long stretch without a session is where consistency is usually won or lost. Nothing is ruined by it — but the habits in this gap are doing more work than the session did.",
      },
    },
    scope:
      "Illustrative patterns for education. Not a recommended schedule, not a plan, and not generated from anything about you.",
  },

  /* --------------------------------------------------- pre-session check */
  check: {
    label: "Pre-session check",
    intro:
      "Three questions a coach would ask before you start. They are a reminder, not a test — there is no score here and nothing to pass.",
    items: [
      {
        id: "fueled",
        prompt: "Fueled?",
        detail:
          "Have you eaten and drunk something today in a way that lets you work, rather than arriving on empty?",
      },
      {
        id: "recovered",
        prompt: "Recovered?",
        detail:
          "Do you feel ready to repeat honest work, or are you still carrying the last session?",
      },
      {
        id: "sharp",
        prompt: "Anything sharp or new?",
        detail:
          "Not ordinary stiffness — anything that feels sharp, unfamiliar or is getting worse.",
        escalates: true,
      },
    ],
    escalationLabel: "If something feels sharp or new",
    escalation:
      "Say so before you train. Tell a coach so the session can be adjusted around it, and see a doctor or physiotherapist if it persists or worsens. This interface cannot assess it and does not try to.",
    scope: "Nothing here is scored, saved or sent anywhere.",
  },

  /* -------------------------------------------------------- the body map */
  bodyMap: {
    label: "Body map",
    headlineLines: ["The work changes you.", "The routine", "keeps it going."],
    deck:
      "One body, one set of proportions. The left side is drawn with the softer, flatter contours of a body that is not training regularly; the right side is the same body with the firmer, fuller muscle shapes that consistent work produces. Select a region to see what training it involves.",
    viewLabel: "Figure view",
    frontLabel: "Front",
    backLabel: "Back",
    groupLabel: "Muscle group",
    noteLabel: "What training it involves",
    axisLabel: "Same body · different training state",
    baseState: {
      label: "Not training regularly",
      caption: "Softer contours · less regional definition",
    },
    trainedState: {
      label: "Training regularly",
      caption: "Firmer contours · clearer muscle definition",
    },
    figureDescription:
      "Line drawing of a generic human figure on a technical blueprint, split down its centre axis. Both halves share the same height, head, joints and limb placement. The left half is drawn with softer, flatter muscle contours; the right half has firmer, slightly fuller shoulder, chest, arm, core and leg contours, and extra internal lines separating the muscle regions.",
    summaryLabel: "Regions in this figure",
    disclaimer:
      "Illustrative anatomy, not a prediction. Consistent training contributes to changes in strength, muscle and physical capacity; individual outcomes vary with training, nutrition, recovery, consistency and factors outside anyone's control.",
    groups: [
      {
        id: "shoulders",
        label: "Shoulders",
        enabled: true,
        regions: [
          { id: "front-deltoids", label: "Deltoids" },
          { id: "back-rear-delts", label: "Rear delts" },
          { id: "back-traps", label: "Traps" },
        ],
        note:
          "Shoulders carry almost everything you press, pull and hold overhead, so they are trained from several directions rather than one. Work that covers the front, side and rear of the shoulder — and enough control to keep the joint stable under load — tends to hold up better than pressing alone.",
      },
      {
        id: "chest",
        label: "Chest",
        enabled: true,
        regions: [{ id: "front-chest", label: "Chest" }],
        note:
          "Pressing movements train the chest, and they progress by getting harder over time rather than by getting longer. The useful part of a set is the work near the end of it, done with a movement you can repeat the same way on the next rep.",
      },
      {
        id: "back",
        label: "Back",
        enabled: true,
        regions: [
          { id: "back-lats", label: "Lats" },
          { id: "back-traps", label: "Traps" },
          { id: "back-lower", label: "Lower back" },
        ],
        note:
          "The back is trained by pulling — toward you and down from above — and it responds to range as much as to load. It is also the region most people cannot see working, which is why coaching attention usually goes further here than adding weight does.",
      },
      {
        id: "arms",
        label: "Arms",
        enabled: true,
        regions: [
          { id: "front-biceps", label: "Biceps" },
          { id: "front-forearms", label: "Forearms" },
          { id: "back-triceps", label: "Triceps" },
        ],
        note:
          "Arms already work in every press and pull, so direct arm work is an addition to that, not a replacement for it. Progress here shows up over months of repeatable sets rather than in any single session.",
      },
      {
        id: "core",
        label: "Core",
        enabled: true,
        regions: [
          { id: "front-core", label: "Core" },
          { id: "back-lower", label: "Lower back" },
        ],
        note:
          "The core's job in training is to hold a position while something else moves. That makes bracing under load and resisting movement more useful than chasing repetitions, and it is what transfers back into your other lifts.",
      },
      {
        id: "legs",
        label: "Legs",
        enabled: true,
        regions: [
          { id: "front-quads", label: "Quads" },
          { id: "front-calves", label: "Calves" },
          { id: "back-glutes", label: "Glutes" },
          { id: "back-hamstrings", label: "Hamstrings" },
        ],
        note:
          "Legs cover the most muscle of any region, which is why leg sessions cost the most to recover from and are the easiest to quietly skip. They are trained by both squatting and hinging patterns, because those two load the front and the back of the leg differently.",
      },
    ],
  },

  /* ------------------------------------------------------------ closing */
  ctaLabel: "Bring your routine to a coach",
  ctaMessage: "Hi, I'd like to discuss my training and recovery routine.",
  ctaNote:
    "The parts of this that are worth changing depend on the week you actually have. That is a conversation, not a download.",
  disclaimer:
    "General training principles for education. Not medical, physiotherapy, dietetic or nutrition advice, and not personalised to anyone. Tell a coach about any injury, symptom or medical condition before you train, and consult a qualified clinician for anything health-related.",
  // Optional attribution. Leave undefined unless the gym can genuinely stand
  // behind a named reviewer — it is a credibility claim like any other.
  reviewedBy: undefined,
  // Disabled by construction. Section 07 is a zero-photograph chapter.
  artifact: {
    enabled: false,
    src: "",
    alt: "",
    caption: "",
  },

  /* ----------------------------------------------------------- stations */
  stations: [
    {
      id: "fuel",
      name: "Fuel",
      marker: "T+ 0-2 H",
      intervalLabel: "The hours after you finish",
      principle: "Food and fluid are what let you repeat the work, not a reward for having done it.",
      why:
        "Training asks your body to rebuild. Eating enough across the day, with protein spread through it, is what makes that possible. Under-eating rarely shows up as hunger first — it shows up as a session that felt heavier than it should have.",
      practice: [
        "Build meals around a protein source and a carbohydrate source, then add the rest.",
        "Drink across the day rather than catching up at the gym door. Thirst is a late signal.",
        "If sessions feel flat, look at what you ate before you change the programme.",
      ],
      // ⚠ MASTER DEMO DATA. This is a gym-specific operational claim and is
      // present on ONE station only, to prove the layout composes with and
      // without it. Replace it with the gym's real arrangement or delete it.
      gymNote:
        "Ask a coach on the floor and they will walk through your current eating pattern with you before suggesting anything is changed.",
      enabled: true,
    },
    {
      id: "recover",
      name: "Recover",
      marker: "That night",
      intervalLabel: "Sleep, and the day that follows",
      principle: "The session is the request. Recovery is where the body answers it.",
      why:
        "Nothing you did in the gym becomes strength or muscle during the session — it happens in the rest afterwards, and sleep is the largest part of that rest. Training load and recovery are one system: raising the first without raising the second produces less progress, not more.",
      practice: [
        "Protect sleep first when the week gets tight. Trading it for an extra session is usually a net loss.",
        "Treat rest days as part of the programme, not time off from it.",
        "Alternate what sessions demand across the week, so hard days can stay hard.",
      ],
      watchFor: [
        "Performance sliding backwards across several weeks on a programme you used to handle.",
        "Sleep getting consistently worse as training volume goes up.",
        "Losing interest in sessions you normally look forward to.",
      ],
      enabled: true,
    },
    {
      id: "move",
      name: "Move",
      marker: "Next day",
      intervalLabel: "The days with no session in them",
      principle: "Easy movement on non-training days supports training instead of competing with it.",
      why:
        "Walking, cycling and simply being on your feet add up across a week without adding much to what you have to recover from. They keep joints and tissue used to moving, which is part of why the next session feels normal rather than like starting again.",
      practice: [
        "Keep the easy work genuinely easy. If a rest day leaves you needing a rest day, it was a session.",
        "Anchor movement to something you already do — a route, a commute, a time of day.",
        "Spend a few focused minutes on the positions your lifts need, most days.",
      ],
      enabled: true,
    },
    {
      id: "ready",
      name: "Ready?",
      marker: "Before next session",
      intervalLabel: "The few minutes before you start",
      principle: "A short honest check before training changes the session more than anything in it will.",
      why:
        "Coaches ask a version of these questions before every session, because the answers change what the session should be. Arriving unfueled, under-recovered or carrying something sharp does not mean not training — it means training differently, which is easier to decide before you start than mid-session.",
      practice: [
        "Answer for today, not for how the week has gone.",
        "A no is information, not a failure. It usually changes the load, not the plan.",
        "Anything sharp or new goes to a coach before the warm-up, not after the third set.",
      ],
      enabled: true,
    },
  ],
};
