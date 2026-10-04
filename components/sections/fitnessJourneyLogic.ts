/**
 * /journey — "Fitness Journey" logic layer.
 *
 * Every question, phase boundary, ruler tick, checkpoint, focus statement,
 * milestone, example week, support mapping and WhatsApp message the Fitness
 * Journey renders is computed here, in one pure deterministic module with no
 * React, no DOM and no `@/` imports (so scripts/fitness-journey.test.mjs can
 * import it directly under Node type stripping). The client component
 * (components/motion/FitnessJourney.tsx) only holds interaction state and
 * renders the plan this module returns.
 *
 * COMPOSABLE, NOT AUTHORED PER COMBINATION. The 4 goals × 4 starting points ×
 * 4 frequencies × 3 horizons (192 journeys) are derived from small reusable
 * tables:
 *
 *   STARTING POINT → foundation length, frequency cap, focus headline
 *   GOAL           → phase emphasis, focus line, week session labels, support
 *   FREQUENCY      → example week (after the starting-point cap)
 *   HORIZON        → timeline scale, ruler ticks, checkpoints, framing
 *
 * The rule that matters most in this file: PROCESS, NEVER OUTCOMES. There is
 * no weight, body-fat, BMI, calorie, strength number, exercise, set, rep or
 * date anywhere in it, and no string promises a result. Phases are stages of
 * focus; milestones are behaviours (consistency, review), not physical
 * predictions.
 *
 * GYM-AGNOSTIC. No gym name, service or fact is hardcoded: the gym name and
 * the verified service list are passed in as arguments.
 */

// ---------------------------------------------------------------- types ---

export type JourneyGoal = "fat-loss" | "strength" | "muscle" | "general";
export type JourneyStart = "new" | "returning" | "on-off" | "consistent";
export type JourneyDays = "2" | "3" | "4" | "5+";
export type JourneyHorizon = 3 | 6 | 12;
export type JourneyPhaseId = "foundation" | "build" | "progress";

export interface JourneyAnswers {
  goal: JourneyGoal;
  start: JourneyStart;
  days: JourneyDays;
}

export interface JourneyQuestionOption {
  value: string;
  label: string;
}

export interface JourneyQuestion {
  id: keyof JourneyAnswers;
  prompt: string;
  /** "tiles" = 2×2 bordered tile grid; "scale" = 4-segment measuring scale. */
  control: "tiles" | "scale";
  options: JourneyQuestionOption[];
}

export interface JourneyServiceInput {
  id: string;
  name: string;
  description: string;
  verified: boolean;
}

export interface JourneySupportItem {
  id: string;
  name: string;
  description: string;
}

export interface JourneyPhase {
  id: JourneyPhaseId;
  index: string;
  label: string;
  startWeek: number;
  endWeek: number;
  weekRange: string;
  /** Left / top position of the band on the rule, 0–100. */
  startPos: number;
  /** Right / bottom position of the band on the rule, 0–100. */
  endPos: number;
}

export interface JourneyTick {
  week: number;
  major: boolean;
  label?: string;
  pos: number;
}

export type JourneyCheckpointKind = "milestone" | "review" | "reassess";

export interface JourneyCheckpoint {
  week: number;
  label: string;
  kind: JourneyCheckpointKind;
  pos: number;
}

export interface JourneyPhaseDetail {
  id: JourneyPhaseId;
  index: string;
  label: string;
  weekRange: string;
  focusPoints: string[];
  checkpoint: string;
  goalEmphasis: string;
  horizonNote: string;
}

export interface JourneyFocus {
  headline: string;
  line: string;
}

export interface JourneyMilestone {
  text: string;
  week: number;
}

export type JourneyDayKind = "train" | "rest" | "optional";

export interface JourneyDay {
  day: string;
  fullDay: string;
  kind: JourneyDayKind;
  label: string;
  short: string;
  /** 1-based session index for training days. */
  index?: number;
}

export interface JourneyPlan {
  answers: JourneyAnswers;
  horizon: JourneyHorizon;
  horizonLabel: string;
  summary: { label: string; value: string }[];
  availableDays: number;
  startingDays: number;
  frequencyNote: string | null;
  focus: JourneyFocus;
  milestone: JourneyMilestone;
  totalWeeks: number;
  scaleLabel: string;
  phases: JourneyPhase[];
  phaseDetails: Record<JourneyPhaseId, JourneyPhaseDetail>;
  ticks: JourneyTick[];
  checkpoints: JourneyCheckpoint[];
  week: JourneyDay[];
  weekLabel: string;
  support: JourneySupportItem[];
}

// ------------------------------------------------------------ questions ---

/**
 * The three questions, in order. Ids are stable keys referenced by
 * JourneyAnswers and the summary/message builders — never rename them.
 */
export const JOURNEY_QUESTIONS: JourneyQuestion[] = [
  {
    id: "goal",
    prompt: "WHAT ARE YOU WORKING TOWARD?",
    control: "tiles",
    options: [
      { value: "fat-loss", label: "FAT LOSS" },
      { value: "strength", label: "BUILD STRENGTH" },
      { value: "muscle", label: "BUILD MUSCLE" },
      { value: "general", label: "GENERAL FITNESS" },
    ],
  },
  {
    id: "start",
    prompt: "WHERE ARE YOU STARTING FROM?",
    control: "tiles",
    options: [
      { value: "new", label: "NEW TO TRAINING" },
      { value: "returning", label: "BACK AFTER A BREAK" },
      { value: "on-off", label: "ON AND OFF" },
      { value: "consistent", label: "TRAINING CONSISTENTLY" },
    ],
  },
  {
    id: "days",
    prompt: "HOW OFTEN CAN YOU ACTUALLY TRAIN?",
    control: "scale",
    options: [
      { value: "2", label: "2 DAYS / WEEK" },
      { value: "3", label: "3 DAYS / WEEK" },
      { value: "4", label: "4 DAYS / WEEK" },
      { value: "5+", label: "5+ DAYS / WEEK" },
    ],
  },
];

export const JOURNEY_HORIZONS: { value: JourneyHorizon; label: string }[] = [
  { value: 3, label: "3 MONTHS" },
  { value: 6, label: "6 MONTHS" },
  { value: 12, label: "12 MONTHS" },
];

const TOTAL_WEEKS: Record<JourneyHorizon, number> = { 3: 12, 6: 26, 12: 52 };

const GOALS: JourneyGoal[] = ["fat-loss", "strength", "muscle", "general"];
const STARTS: JourneyStart[] = ["new", "returning", "on-off", "consistent"];
const DAYS: JourneyDays[] = ["2", "3", "4", "5+"];

/** Coerce any (possibly partial / invalid) input to a valid answer set. */
export function normalizeAnswers(input: Partial<Record<string, unknown>>): JourneyAnswers {
  const goal = GOALS.includes(input.goal as JourneyGoal) ? (input.goal as JourneyGoal) : "general";
  const start = STARTS.includes(input.start as JourneyStart)
    ? (input.start as JourneyStart)
    : "new";
  const days = DAYS.includes(input.days as JourneyDays) ? (input.days as JourneyDays) : "3";
  return { goal, start, days };
}

export function normalizeHorizon(input: unknown): JourneyHorizon {
  return input === 6 || input === 12 ? input : 3;
}

export function getTotalWeeks(horizon: JourneyHorizon): number {
  return TOTAL_WEEKS[normalizeHorizon(horizon)];
}

function horizonLabel(horizon: JourneyHorizon): string {
  return JOURNEY_HORIZONS.find((h) => h.value === horizon)?.label ?? "3 MONTHS";
}

// ------------------------------------------------------------ frequency ---

const AVAILABLE_DAYS: Record<JourneyDays, number> = { "2": 2, "3": 3, "4": 4, "5+": 5 };

export function getAvailableDays(days: JourneyDays): number {
  return AVAILABLE_DAYS[days] ?? 3;
}

/**
 * DAYS AVAILABLE ≠ A SENSIBLE STARTING FREQUENCY. Newer and returning
 * trainees are capped so the first phase starts at a rhythm they can repeat;
 * consistent trainees start at what they selected.
 */
export function getStartingDays(start: JourneyStart, days: JourneyDays): number {
  const available = getAvailableDays(days);
  switch (start) {
    case "new":
      return Math.min(available, 3);
    case "returning":
      return available === 5 ? 4 : Math.min(available, 3);
    case "on-off":
      return Math.min(available, 4);
    default:
      return available;
  }
}

/** One concise line when the starting rhythm is lower than availability. */
export function getFrequencyNote(start: JourneyStart, days: JourneyDays): string | null {
  const available = getAvailableDays(days);
  const starting = getStartingDays(start, days);
  if (starting >= available) return null;
  const availableLabel = days === "5+" ? "5+" : String(available);
  return `You have ${availableLabel} days available. A more manageable starting rhythm is ${starting} training days, building from there.`;
}

// --------------------------------------------------------------- phases ---

/** Week Foundation ends, by horizon × starting point. */
const FOUNDATION_END: Record<JourneyHorizon, Record<JourneyStart, number>> = {
  3: { new: 5, returning: 4, "on-off": 4, consistent: 3 },
  6: { new: 8, returning: 6, "on-off": 6, consistent: 4 },
  12: { new: 12, returning: 10, "on-off": 10, consistent: 6 },
};

/** Week Build ends, by horizon (independent of starting point). */
const BUILD_END: Record<JourneyHorizon, number> = { 3: 9, 6: 16, 12: 28 };

const PHASE_META: Record<JourneyPhaseId, { index: string; label: string }> = {
  foundation: { index: "01", label: "FOUNDATION" },
  build: { index: "02", label: "BUILD" },
  progress: { index: "03", label: "PROGRESS" },
};

export const PHASE_IDS: JourneyPhaseId[] = ["foundation", "build", "progress"];

function pos(week: number, total: number): number {
  return Math.round((week / total) * 10000) / 100;
}

function weekRange(startWeek: number, endWeek: number): string {
  return `WEEKS ${startWeek}\u2013${endWeek}`;
}

export function getPhases(start: JourneyStart, horizon: JourneyHorizon): JourneyPhase[] {
  const h = normalizeHorizon(horizon);
  const total = TOTAL_WEEKS[h];
  const foundationEnd = FOUNDATION_END[h][start] ?? FOUNDATION_END[h].new;
  const buildEnd = BUILD_END[h];
  const bounds: [JourneyPhaseId, number, number][] = [
    ["foundation", 1, foundationEnd],
    ["build", foundationEnd + 1, buildEnd],
    ["progress", buildEnd + 1, total],
  ];
  return bounds.map(([id, s, e]) => ({
    id,
    index: PHASE_META[id].index,
    label: PHASE_META[id].label,
    startWeek: s,
    endWeek: e,
    weekRange: weekRange(s, e),
    startPos: pos(s - 1, total),
    endPos: pos(e, total),
  }));
}

// ---------------------------------------------------------------- ruler ---

const SCALE_LABEL: Record<JourneyHorizon, string> = {
  3: "1 TICK = 1 WEEK",
  6: "1 TICK = 2 WEEKS",
  12: "1 TICK = 1 MONTH",
};

/**
 * The ruler is NOT the same graphic stretched: each horizon has its own tick
 * density and labelling. 3 months = weekly ticks / monthly labels; 6 months =
 * fortnightly ticks / monthly labels; 12 months = monthly ticks / quarterly
 * labels.
 */
export function getRulerTicks(horizon: JourneyHorizon): JourneyTick[] {
  const h = normalizeHorizon(horizon);
  const total = TOTAL_WEEKS[h];
  const majors = new Map<number, string>();
  const minors = new Set<number>([0]);

  if (h === 3) {
    for (let w = 0; w <= total; w += 1) minors.add(w);
    for (let m = 1; m <= 3; m += 1) majors.set(m * 4, `M${m}`);
  } else if (h === 6) {
    for (let w = 0; w <= total; w += 2) minors.add(w);
    for (let m = 1; m <= 6; m += 1) majors.set(Math.round((m * total) / 6), `M${m}`);
  } else {
    for (let m = 1; m <= 12; m += 1) minors.add(Math.round((m * total) / 12));
    for (let q = 1; q <= 4; q += 1) majors.set(q * 13, `Q${q}`);
  }

  const weeks = Array.from(new Set([...minors, ...majors.keys()])).sort((a, b) => a - b);
  return weeks.map((week) => ({
    week,
    major: majors.has(week),
    label: majors.get(week),
    pos: pos(week, total),
  }));
}

export function getScaleLabel(horizon: JourneyHorizon): string {
  return SCALE_LABEL[normalizeHorizon(horizon)];
}

// ---------------------------------------------------------- checkpoints ---

export function getCheckpoints(start: JourneyStart, horizon: JourneyHorizon): JourneyCheckpoint[] {
  const h = normalizeHorizon(horizon);
  const total = TOTAL_WEEKS[h];
  const foundationEnd = FOUNDATION_END[h][start] ?? FOUNDATION_END[h].new;
  const buildEnd = BUILD_END[h];
  const list: Omit<JourneyCheckpoint, "pos">[] = [
    { week: foundationEnd, label: "FOUNDATION COMPLETE", kind: "milestone" },
  ];

  if (h === 3) {
    list.push({ week: buildEnd, label: "BUILD REVIEW", kind: "review" });
    list.push({ week: total, label: "3-MONTH CHECKPOINT", kind: "review" });
  } else if (h === 6) {
    list.push({
      week: Math.round((foundationEnd + buildEnd) / 2),
      label: "MID-BUILD REVIEW",
      kind: "review",
    });
    list.push({ week: buildEnd, label: "BUILD REVIEW", kind: "review" });
    list.push({ week: total, label: "6-MONTH CHECKPOINT", kind: "review" });
  } else {
    // Quarterly reassessment. Foundation ends ≤ week 12, so it never collides
    // with the first quarter mark (week 13).
    for (let q = 1; q <= 4; q += 1) {
      list.push({
        week: q * 13,
        label: q === 4 ? "12-MONTH REASSESSMENT" : `Q${q} REASSESSMENT`,
        kind: "reassess",
      });
    }
  }

  return list
    .sort((a, b) => a.week - b.week)
    .map((c) => ({ ...c, pos: pos(c.week, total) }));
}

// ---------------------------------------------------------- phase detail ---

const PHASE_FOCUS: Record<JourneyPhaseId, string[]> = {
  foundation: ["Build consistency", "Learn the training rhythm", "Establish basic movement habits"],
  build: ["Add structure to each session", "Develop training capacity", "Progress the routine gradually"],
  progress: ["Keep progressing what works", "Review the routine regularly", "Adjust the approach over time"],
};

const GOAL_EMPHASIS: Record<JourneyGoal, Record<JourneyPhaseId, string>> = {
  "fat-loss": {
    foundation: "Pair simple strength work with regular conditioning.",
    build: "Keep conditioning regular as sessions gain structure.",
    progress: "Review the balance of strength and conditioning.",
  },
  strength: {
    foundation: "Learn a few core lifts you can repeat.",
    build: "Progress those core lifts steadily, week to week.",
    progress: "Review which lifts are progressing and adjust.",
  },
  muscle: {
    foundation: "Train each major area across the week.",
    build: "Repeat key resistance movements often enough to progress them.",
    progress: "Review your training split and recovery between sessions.",
  },
  general: {
    foundation: "Keep a balanced mix of strength and cardio.",
    build: "Build capacity in both strength and conditioning.",
    progress: "Choose what to emphasise next.",
  },
};

const HORIZON_NOTE: Record<JourneyHorizon, Record<JourneyPhaseId, string>> = {
  3: {
    foundation: "A short, concrete first block.",
    build: "A compact build — keep it simple.",
    progress: "Ends with a 3-month checkpoint.",
  },
  6: {
    foundation: "More runway to settle the habit.",
    build: "Room to progress steadily.",
    progress: "A longer block to refine what works.",
  },
  12: {
    foundation: "An unhurried start — the year is long.",
    build: "The longest phase — steady structure.",
    progress: "Reassess and re-set direction each quarter.",
  },
};

function phaseCheckpoint(id: JourneyPhaseId, phase: JourneyPhase, horizon: JourneyHorizon): string {
  const length = phase.endWeek - phase.startWeek + 1;
  if (id === "foundation") return `Train your planned days for ${length} weeks in a row.`;
  if (id === "build") return `Review the routine with the gym at week ${phase.endWeek}.`;
  return horizon === 12
    ? "Reassess your direction every quarter."
    : "Review the full block and choose the next focus.";
}

export function getPhaseDetail(
  id: JourneyPhaseId,
  goal: JourneyGoal,
  horizon: JourneyHorizon,
  start: JourneyStart
): JourneyPhaseDetail {
  const h = normalizeHorizon(horizon);
  const phase = getPhases(start, h).find((p) => p.id === id) ?? getPhases(start, h)[0];
  return {
    id: phase.id,
    index: phase.index,
    label: phase.label,
    weekRange: phase.weekRange,
    focusPoints: PHASE_FOCUS[phase.id],
    checkpoint: phaseCheckpoint(phase.id, phase, h),
    goalEmphasis: (GOAL_EMPHASIS[goal] ?? GOAL_EMPHASIS.general)[phase.id],
    horizonNote: HORIZON_NOTE[h][phase.id],
  };
}

// ---------------------------------------------------- focus + milestone ---

const FOCUS_HEADLINE: Record<JourneyStart, string> = {
  new: "LEARN THE RHYTHM.",
  returning: "REBUILD THE ROUTINE.",
  "on-off": "MAKE IT REPEATABLE.",
  consistent: "GIVE IT DIRECTION.",
};

const FOCUS_START_LINE: Record<JourneyStart, string> = {
  new: "Your first phase is about a training pattern you can keep",
  returning: "Your first phase is about returning gradually, not where you left off",
  "on-off": "Your first phase is about turning occasional training into a routine",
  consistent: "Your first phase is about giving your training clear structure",
};

const FOCUS_GOAL_LINE: Record<JourneyGoal, string> = {
  "fat-loss": "simple strength work with regular conditioning.",
  strength: "built around a few core lifts you can repeat.",
  muscle: "consistent resistance work across the week.",
  general: "a balanced mix of strength and cardio.",
};

export function getCurrentFocus(goal: JourneyGoal, start: JourneyStart): JourneyFocus {
  return {
    headline: FOCUS_HEADLINE[start] ?? FOCUS_HEADLINE.new,
    line: `${FOCUS_START_LINE[start] ?? FOCUS_START_LINE.new} \u2014 ${
      FOCUS_GOAL_LINE[goal] ?? FOCUS_GOAL_LINE.general
    }`,
  };
}

export function getNextMilestone(start: JourneyStart, horizon: JourneyHorizon): JourneyMilestone {
  const h = normalizeHorizon(horizon);
  const week = FOUNDATION_END[h][start] ?? FOUNDATION_END[h].new;
  const text =
    start === "consistent"
      ? `COMPLETE ONE STRUCTURED ${week}-WEEK BLOCK, THEN REVIEW.`
      : `COMPLETE YOUR FIRST ${week} CONSISTENT WEEKS.`;
  return { text, week };
}

// ----------------------------------------------------------------- week ---

const WEEKDAYS: { day: string; fullDay: string }[] = [
  { day: "MON", fullDay: "Monday" },
  { day: "TUE", fullDay: "Tuesday" },
  { day: "WED", fullDay: "Wednesday" },
  { day: "THU", fullDay: "Thursday" },
  { day: "FRI", fullDay: "Friday" },
  { day: "SAT", fullDay: "Saturday" },
  { day: "SUN", fullDay: "Sunday" },
];

/** Which weekday indexes (0 = Mon) carry a session, by session count. */
const PLACEMENT: Record<number, number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
};

export type SessionCategory = "FULL BODY" | "UPPER" | "LOWER" | "STRENGTH" | "CONDITIONING";

export const SESSION_CATEGORIES: SessionCategory[] = [
  "FULL BODY",
  "UPPER",
  "LOWER",
  "STRENGTH",
  "CONDITIONING",
];

const SESSION_SHORT: Record<SessionCategory, string> = {
  "FULL BODY": "FULL",
  UPPER: "UPPER",
  LOWER: "LOWER",
  STRENGTH: "STR.",
  CONDITIONING: "COND.",
};

/** Session-category labels only — never exercises, sets, reps or loads. */
const SESSIONS: Record<JourneyGoal, Record<number, SessionCategory[]>> = {
  "fat-loss": {
    2: ["FULL BODY", "FULL BODY"],
    3: ["FULL BODY", "CONDITIONING", "FULL BODY"],
    4: ["LOWER", "CONDITIONING", "UPPER", "CONDITIONING"],
    5: ["LOWER", "UPPER", "CONDITIONING", "FULL BODY", "CONDITIONING"],
  },
  strength: {
    2: ["FULL BODY", "FULL BODY"],
    3: ["LOWER", "UPPER", "FULL BODY"],
    4: ["LOWER", "UPPER", "LOWER", "UPPER"],
    5: ["LOWER", "UPPER", "CONDITIONING", "LOWER", "UPPER"],
  },
  muscle: {
    2: ["FULL BODY", "FULL BODY"],
    3: ["UPPER", "LOWER", "FULL BODY"],
    4: ["UPPER", "LOWER", "UPPER", "LOWER"],
    5: ["UPPER", "LOWER", "CONDITIONING", "UPPER", "LOWER"],
  },
  general: {
    2: ["STRENGTH", "CONDITIONING"],
    3: ["STRENGTH", "CONDITIONING", "FULL BODY"],
    4: ["LOWER", "CONDITIONING", "UPPER", "FULL BODY"],
    5: ["LOWER", "UPPER", "CONDITIONING", "FULL BODY", "CONDITIONING"],
  },
};

/** Preferred weekday indexes for the optional light-movement day. */
const OPTIONAL_ORDER = [5, 6, 2, 3];

export function getWeek(goal: JourneyGoal, start: JourneyStart, days: JourneyDays): JourneyDay[] {
  const sessions = getStartingDays(start, days);
  const capped = sessions < getAvailableDays(days);
  const placement = PLACEMENT[sessions] ?? PLACEMENT[3];
  const labels = (SESSIONS[goal] ?? SESSIONS.general)[sessions] ?? SESSIONS.general[3];
  const optionalIndex = capped ? OPTIONAL_ORDER.find((i) => !placement.includes(i)) : undefined;

  return WEEKDAYS.map(({ day, fullDay }, i) => {
    const slot = placement.indexOf(i);
    if (slot >= 0) {
      const label = labels[slot];
      return { day, fullDay, kind: "train", label, short: SESSION_SHORT[label], index: slot + 1 };
    }
    if (i === optionalIndex) {
      return { day, fullDay, kind: "optional", label: "OPTIONAL · LIGHT MOVEMENT", short: "OPT." };
    }
    return { day, fullDay, kind: "rest", label: "REST", short: "REST" };
  });
}

// -------------------------------------------------------------- support ---

const SUPPORT_MAP: Record<JourneyGoal, string[]> = {
  "fat-loss": ["weight-loss", "conditioning", "personal-training"],
  strength: ["strength-training", "functional-training", "personal-training"],
  muscle: ["bodybuilding", "strength-training", "personal-training"],
  general: ["functional-training", "conditioning", "strength-training"],
};

/**
 * Up to three VERIFIED services relevant to the goal. A clone whose service
 * ids differ still gets a safe result: if none of the mapped ids exist, the
 * first three verified services are used. Unverified services never appear.
 */
export function getJourneySupport(
  goal: JourneyGoal,
  services: JourneyServiceInput[]
): JourneySupportItem[] {
  const verified = services.filter((s) => s.verified);
  const mapped = (SUPPORT_MAP[goal] ?? SUPPORT_MAP.general)
    .map((id) => verified.find((s) => s.id === id))
    .filter((s): s is JourneyServiceInput => Boolean(s));
  const chosen = mapped.length > 0 ? mapped : verified;
  return chosen.slice(0, 3).map(({ id, name, description }) => ({ id, name, description }));
}

// -------------------------------------------------------------- summary ---

function optionLabel(id: keyof JourneyAnswers, value: string): string {
  const q = JOURNEY_QUESTIONS.find((x) => x.id === id);
  return q?.options.find((o) => o.value === value)?.label ?? "NOT SPECIFIED";
}

export function getAnswerSummary(answers: JourneyAnswers): { label: string; value: string }[] {
  return [
    { label: "GOAL", value: optionLabel("goal", answers.goal) },
    { label: "STARTING POINT", value: optionLabel("start", answers.start) },
    { label: "TRAINING DAYS", value: optionLabel("days", answers.days) },
  ];
}

// ------------------------------------------------------------- WhatsApp ---

const MESSAGE_LABELS: {
  goal: Record<JourneyGoal, string>;
  start: Record<JourneyStart, string>;
  days: Record<JourneyDays, string>;
} = {
  goal: {
    "fat-loss": "Fat loss",
    strength: "Build strength",
    muscle: "Build muscle",
    general: "General fitness",
  },
  start: {
    new: "New to training",
    returning: "Back after a break",
    "on-off": "On and off",
    consistent: "Training consistently",
  },
  days: { "2": "2 days/week", "3": "3 days/week", "4": "4 days/week", "5+": "5+ days/week" },
};

function sentenceCase(text: string): string {
  const lower = text.trim().toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * The WhatsApp message a visitor sends from the result. Only the three
 * answers, the horizon and the current focus — no personal data, no
 * preference field. Encoding is left to lib/whatsapp.ts.
 */
export function buildJourneyWhatsAppMessage(
  gymName: string,
  answers: Partial<JourneyAnswers>,
  horizon: JourneyHorizon,
  focus: JourneyFocus
): string {
  const goal = MESSAGE_LABELS.goal[answers.goal as JourneyGoal] ?? "Not specified";
  const start = MESSAGE_LABELS.start[answers.start as JourneyStart] ?? "Not specified";
  const days = MESSAGE_LABELS.days[answers.days as JourneyDays] ?? "Not specified";
  const h = normalizeHorizon(horizon);
  const name = gymName.trim() || "there";

  return [
    `Hi ${name},`,
    "",
    "I used your Fitness Journey tool.",
    "",
    `Goal: ${goal}`,
    `Starting point: ${start}`,
    `Training days: ${days}`,
    `Journey horizon: ${h} months`,
    "",
    `My current focus: ${sentenceCase(focus.headline)}`,
    "",
    "I'd like to know how I can get started.",
  ].join("\n");
}

// ---------------------------------------------------------- entry point ---

export function buildJourney(
  rawAnswers: Partial<Record<string, unknown>>,
  rawHorizon: unknown,
  services: JourneyServiceInput[]
): JourneyPlan {
  const answers = normalizeAnswers(rawAnswers);
  const horizon = normalizeHorizon(rawHorizon);
  const { goal, start, days } = answers;
  const startingDays = getStartingDays(start, days);

  const phaseDetails = Object.fromEntries(
    PHASE_IDS.map((id) => [id, getPhaseDetail(id, goal, horizon, start)])
  ) as Record<JourneyPhaseId, JourneyPhaseDetail>;

  return {
    answers,
    horizon,
    horizonLabel: horizonLabel(horizon),
    summary: getAnswerSummary(answers),
    availableDays: getAvailableDays(days),
    startingDays,
    frequencyNote: getFrequencyNote(start, days),
    focus: getCurrentFocus(goal, start),
    milestone: getNextMilestone(start, horizon),
    totalWeeks: TOTAL_WEEKS[horizon],
    scaleLabel: getScaleLabel(horizon),
    phases: getPhases(start, horizon),
    phaseDetails,
    ticks: getRulerTicks(horizon),
    checkpoints: getCheckpoints(start, horizon),
    week: getWeek(goal, start, days),
    weekLabel: `${startingDays} TRAINING DAYS`,
    support: getJourneySupport(goal, services),
  };
}
