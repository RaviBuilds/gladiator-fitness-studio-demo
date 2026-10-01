import type {
  TrainingGoal,
  TrainingIntelligenceConfiguration,
} from "./types";

/**
 * Section 05 — TRAINING INTELLIGENCE data.
 *
 * This file is DIFFERENT IN KIND from lib/business.ts, lib/services.ts or
 * lib/transformations.ts. Those hold business facts that must be verified per
 * gym. This one holds the factory's GLOBAL EDUCATIONAL LIBRARY: general
 * training principles that are true for any competent gym, written once,
 * reviewed once, and reused across every clone.
 *
 * WHAT A CLONE EDITS HERE
 *   - `enabled` per goal, and the order of the array
 *   - `programId` (must match a `verified: true` id in lib/services.ts)
 *   - `gymNote` — the optional "how we coach this here" line
 *   - the CTA labels and `ctaMessageTemplate` in the configuration
 *   - `artifact` (or delete it — see below)
 *
 * WHAT A CLONE DOES NOT EDIT
 *   The lever taxonomy, the priorities/mistakes/track framework, the coach
 *   notes and the disclaimer. Rewriting the educational copy per gym is how a
 *   factory ends up shipping unreviewed fitness advice at scale.
 *
 * FACTUAL DISCIPLINE — read before adding a line to this file.
 *   Not one sentence below contains a calorie figure, a macro target, a
 *   protein number, a water or sleep target, a body-fat percentage, a
 *   heart-rate zone, a guaranteed timeframe or a physiological mechanism
 *   claim. Every entry explains a PRINCIPLE and defers the individual dose to
 *   a coach. The emphasis values are ordinal teaching weights (1-3), never
 *   percentages. Keep it that way: the section earns authority from structure
 *   and clarity, not from numbers it cannot source.
 *
 * The section renders with 3, 4, 5, 6 or more enabled goals without any
 * layout change — see components/motion/TrainingLoadout.tsx.
 */
export const trainingGoals: TrainingGoal[] = [
  {
    id: "fat-loss",
    label: "Fat loss",
    enabled: true,
    premise:
      "Hold on to the muscle you already have while raising the amount of honest work you can repeat week after week.",
    path: "Strength base + conditioning + activity you can sustain",
    programId: "conditioning",
    emphasis: {
      "strength-work": 2,
      "muscle-volume": 2,
      cardio: 3,
      conditioning: 3,
      "mobility-technique": 1,
    },
    priorities: [
      {
        title: "Protect your strength",
        detail:
          "Keep lifting through a fat-loss phase. Training that only burns energy tends to cost you muscle along with the fat.",
      },
      {
        title: "A week you can repeat",
        detail:
          "A training week you could complete twice in a row beats one that leaves you too sore or too flat to come back.",
      },
      {
        title: "Movement between sessions",
        detail:
          "Walking, cycling and simply being on your feet add up across a week without adding to what you need to recover from.",
      },
    ],
    mistakes: [
      {
        mistake: "Pushing every session to the limit",
        instead: "Alternate hard days with easier ones so the hard days can stay hard.",
      },
      {
        mistake: "Dropping strength work to make room for cardio",
        instead: "Keep lifting slots in the week so what you lose is fat, not muscle.",
      },
      {
        mistake: "Judging the week by the scale alone",
        instead: "Read the scale alongside your training performance and how your clothes fit.",
      },
    ],
    track: [
      "Sessions completed each week",
      "Loads in your main lifts",
      "How the last set of a session feels",
      "Waist measurement over months, not days",
    ],
    coachNote:
      "Fat loss is a training and habit problem long before it is a cardio problem. The people who keep the result are the ones who kept lifting.",
    // ⚠ MASTER DEMO DATA. This line is a gym-specific operational claim and is
    // present on ONE goal only, to prove the layout composes with and without
    // it. Replace it with the gym's real coaching arrangement or delete it.
    gymNote:
      "A coach sets your starting loads in your first week and reviews them with you as the weeks progress.",
  },
  {
    id: "muscle-gain",
    label: "Muscle gain",
    enabled: true,
    premise:
      "Give each muscle enough quality work, often enough, with enough recovery around it for the work to turn into anything.",
    path: "Strength base + progressive volume + technique",
    programId: "strength-training",
    emphasis: {
      "strength-work": 3,
      "muscle-volume": 3,
      cardio: 1,
      conditioning: 1,
      "mobility-technique": 2,
    },
    priorities: [
      {
        title: "Effort near the limit",
        detail:
          "The last few hard reps of a set are what drive the adaptation. A set stopped well short of them mostly costs you time.",
      },
      {
        title: "Coverage across the week",
        detail:
          "Spreading work for a muscle across the week is more productive than one heroic session it then needs a week to recover from.",
      },
      {
        title: "Recovery you actually take",
        detail:
          "Muscle is built between sessions. Sleep and rest days are part of the programme, not a break from it.",
      },
    ],
    mistakes: [
      {
        mistake: "Changing the programme every week",
        instead: "Stay on a programme long enough to beat your own numbers on it.",
      },
      {
        mistake: "Chasing load while technique collapses",
        instead: "Add weight only once the movement still looks the same at the end of the set.",
      },
      {
        mistake: "Cutting sleep to fit another session in",
        instead: "When the week gets tight, trade the session and keep the sleep.",
      },
    ],
    track: [
      "Reps achieved at a given load",
      "Working sets per muscle group each week",
      "Bodyweight trend over months",
      "Whether technique holds on the last set",
    ],
    coachNote:
      "Adding weight to the bar is only progress if the movement did not quietly change to allow it.",
  },
  {
    id: "strength",
    label: "Strength",
    enabled: true,
    premise:
      "Get measurably better at a small number of heavy movements, and let everything else in training exist to support them.",
    path: "Barbell strength + skill practice + supporting volume",
    programId: "strength-training",
    emphasis: {
      "strength-work": 3,
      "muscle-volume": 2,
      cardio: 1,
      conditioning: 1,
      "mobility-technique": 2,
    },
    priorities: [
      {
        title: "Practise the same lifts",
        detail:
          "Strength is a skill. The lifts you want to be strong at need regular, unhurried practice, not constant variety.",
      },
      {
        title: "Plan around the heavy days",
        detail:
          "Heavy work is what you build the week around: fewer of those sessions, with real recovery between them.",
      },
      {
        title: "Positions before load",
        detail:
          "A position you cannot hold under a light bar will not hold under a heavy one. Earn the position first.",
      },
    ],
    mistakes: [
      {
        mistake: "Testing your maximum instead of training",
        instead: "Spend most sessions below your limit and test only occasionally.",
      },
      {
        mistake: "Skipping the supporting work",
        instead: "Keep the accessory work that holds your main lifts together.",
      },
      {
        mistake: "Training heavy through sharp pain",
        instead: "Stop the set and tell a coach, then adjust the movement rather than push through it.",
      },
    ],
    track: [
      "Top sets at a repeatable effort",
      "How the bar moves on working sets",
      "Heavy exposures per week",
      "Technical consistency under load",
    ],
    coachNote:
      "Strength shows up on the days you did not feel strong. Judge it across months, never across one session.",
  },
  {
    id: "endurance",
    label: "Endurance",
    enabled: true,
    premise:
      "Build the capacity to hold a pace comfortably, then extend how long you can hold it for.",
    path: "Aerobic base + conditioning + strength support",
    programId: "conditioning",
    emphasis: {
      "strength-work": 2,
      "muscle-volume": 1,
      cardio: 3,
      conditioning: 3,
      "mobility-technique": 2,
    },
    priorities: [
      {
        title: "A large easy base",
        detail:
          "Most of your cardio should be comfortable enough to hold a conversation through. That is the part that builds the engine.",
      },
      {
        title: "A small amount of genuinely hard work",
        detail:
          "Keep the hard intervals rare and properly hard, rather than turning every session into the same medium grind.",
      },
      {
        title: "Strength to stay durable",
        detail:
          "Lifting keeps joints and tendons ready for repeated mileage, which is what lets you keep training at all.",
      },
    ],
    mistakes: [
      {
        mistake: "Training every session at the same medium effort",
        instead: "Make the easy work easier and the hard work harder.",
      },
      {
        mistake: "Adding distance and intensity in the same week",
        instead: "Change one variable at a time and let the week settle.",
      },
      {
        mistake: "Abandoning the gym once mileage rises",
        instead: "Hold on to a strength slot or two to stay resilient.",
      },
    ],
    track: [
      "Pace at an easy, conversational effort",
      "Time you can hold a target pace",
      "How quickly you recover between intervals",
      "Total work across the week",
    ],
    coachNote:
      "Endurance rewards patience. The easy base you build quietly this month is the pace you hold comfortably in a few months.",
  },
  {
    id: "mobility",
    label: "Mobility",
    enabled: true,
    premise:
      "Earn range of motion you can actually control, then load it so your body has a reason to keep it.",
    path: "Position work + controlled loading + strength through range",
    programId: "personal-training",
    emphasis: {
      "strength-work": 2,
      "muscle-volume": 1,
      cardio: 1,
      conditioning: 1,
      "mobility-technique": 3,
    },
    priorities: [
      {
        title: "Range you can control",
        detail:
          "Reaching a position matters far less than being able to hold it and move through it under your own control.",
      },
      {
        title: "Load the new range",
        detail:
          "Range that is never loaded is range your body gradually gives back. Strength work is what makes it stick.",
      },
      {
        title: "Short exposures, often",
        detail:
          "A few focused minutes on most days does more than one long stretching session once a week.",
      },
    ],
    mistakes: [
      {
        mistake: "Stretching passively and stopping there",
        instead: "Follow the stretch with strength work in the same position.",
      },
      {
        mistake: "Forcing range that feels sharp",
        instead: "Work to a firm stretch, never into pain.",
      },
      {
        mistake: "Treating mobility as a separate hobby",
        instead: "Build it into your warm-up and the gaps between sets.",
      },
    ],
    track: [
      "Positions you can reach and hold",
      "Depth and control in your main lifts",
      "How much warm-up you need",
      "Day-to-day stiffness",
    ],
    coachNote:
      "Mobility is not a stretch you did once. It is range you keep using under load.",
  },
];

/**
 * Section 05 composition, labels and the lever taxonomy.
 *
 * `levers` is the spine of the emphasis display: the SAME rows, in the SAME
 * order, under every goal. That constancy is the entire teaching device — the
 * visitor learns by seeing which markers move when the goal changes, which is
 * impossible if each goal gets its own categories.
 *
 * `artifact` is deliberately optional and deliberately small. Section 05 was
 * composed instrument-first, so a future gym with no usable photography can
 * delete this key and lose a supporting detail, not the chapter.
 */
export const trainingIntelligenceConfiguration: TrainingIntelligenceConfiguration = {
  index: "05",
  eyebrow: "Training intelligence",
  headlineLines: ["Your goal", "changes how", "you train."],
  accentLastLine: true,
  deck:
    "Different goals require different training emphasis. Use the loadout below to see what changes, what stays consistent, and what is worth paying attention to.",
  selectorLabel: "Training goal",
  loadoutLabel: "Training loadout",
  emphasisLabel: "Training emphasis",
  prioritiesLabel: "What to prioritize",
  mistakesLabel: "Common mistakes",
  trackLabel: "What to track",
  coachNoteLabel: "Coach's note",
  gymNoteLabel: "How we coach this here",
  handoffLabel: "Your goal → your training path",
  primaryCtaLabel: "Talk to a coach about this goal",
  secondaryCtaLabel: "See the related program",
  ctaMessageTemplate: "Hi, I'd like to discuss my {goal} training goal.",
  disclaimer:
    "General training principles for education, not medical, physiotherapy or nutrition advice. Tell a coach about any injury or medical condition before you start.",
  // Optional attribution. Leave undefined unless the gym can genuinely stand
  // behind a named reviewer — it is a credibility claim like any other.
  reviewedBy: undefined,
  artifact: {
    src: "/assets/education/training-intelligence-weight-plate-loading-editorial.webp",
    alt:
      "Close view of hands sliding a cast-iron weight plate onto the sleeve of a loaded barbell on a gym floor.",
    caption: "Loading the bar — the same movement, a different weight per goal",
  },
  levers: [
    { id: "strength-work", label: "Strength work", shortLabel: "Strength" },
    { id: "muscle-volume", label: "Muscle-building volume", shortLabel: "Volume" },
    { id: "cardio", label: "Cardio" },
    { id: "conditioning", label: "Conditioning" },
    { id: "mobility-technique", label: "Mobility + technique", shortLabel: "Mobility" },
  ],
};
