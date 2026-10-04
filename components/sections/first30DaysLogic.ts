/**
 * /first-30-days — "Plan Your First 30 Days" logic layer.
 *
 * Every question, derived profile value, content block, plan field and the
 * WhatsApp message the tool renders is computed here, in one pure,
 * deterministic module with no React, no DOM and no runtime `@/` imports (so
 * scripts/first-30-days.test.mjs can import it directly under Node type
 * stripping). components/motion/First30Days.tsx only holds interaction state.
 *
 * WHAT THIS IS: a first-month ONBOARDING plan — schedule, first visit,
 * obstacles, support, next action. WHAT IT IS NOT: a workout, calorie,
 * membership or medical tool. There is no exercise, set, rep, weight, calorie,
 * price or outcome anywhere in this file, and the tests enforce that.
 *
 * CLAIM GATE. Content is a table of rules:
 *
 *   { id, slot, when?(profile), requires?: capability[], content(ctx), askInstead?(ctx) }
 *
 * A rule whose `requires` is not met by the gym's VERIFIED capabilities
 * renders its `askInstead` (a question for the visitor to ask) or is dropped.
 * Every slot ends with a default rule that has no requirement, so no answer
 * combination can produce an empty module.
 *
 * GYM-AGNOSTIC: the gym name, capabilities, facts and hours are arguments.
 */

import type {
  BusinessHours,
  First30DaysFact,
  OnboardingCapability,
  OnboardingCapabilityId,
} from "../../lib/types";

// ---------------------------------------------------------------- types ---

export type First30Experience = "new" | "stopped" | "knows";
export type First30Day = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type First30Time = "morning" | "afternoon" | "evening" | "varies";
export type First30VariableCount = "1-2" | "3" | "4" | "5+";
export type First30ScheduleMode = "fixed" | "variable";
export type First30Feeling = "nervous" | "unsure" | "comfortable";
export type First30Obstacle = "time" | "energy" | "motivation" | "unknown";
export type First30Support = "showAround" | "whereToStart" | "checkIn" | "selfDirected" | "notSure";
export type First30StepId = "experience" | "schedule" | "feeling" | "obstacle" | "support";
export type First30Depth = "full" | "standard" | "compact";

/** Answers while the flow is in progress — any field may be missing. */
export interface First30Draft {
  experience?: First30Experience;
  scheduleMode?: First30ScheduleMode;
  days?: First30Day[];
  variableCount?: First30VariableCount;
  time?: First30Time;
  feeling?: First30Feeling;
  obstacle?: First30Obstacle;
  support?: First30Support;
}

/** A complete, valid answer set (always produced by normalizeAnswers). */
export interface First30Answers {
  experience: First30Experience;
  scheduleMode: First30ScheduleMode;
  /** Mon→Sun order, unique. Empty when scheduleMode is "variable". */
  days: First30Day[];
  /** Set only when scheduleMode is "variable". */
  variableCount?: First30VariableCount;
  time: First30Time;
  feeling: First30Feeling;
  obstacle: First30Obstacle;
  support: First30Support;
}

export interface First30Option<V extends string = string> {
  value: V;
  label: string;
}

export interface First30Profile {
  /** Planned visits per week (variable "1-2" → 2, "5+" → 5). */
  weeklyVisitCount: number;
  /** Display form of the count: "3", "1–2", "5+". */
  countLabel: string;
  scheduleMode: First30ScheduleMode;
  timeBand: First30Time;
  firstVisitDepth: First30Depth;
  /** Tried before and stopped → restart-friendly framing. */
  restartFriendly: boolean;
  /** Emphasise "who to ask". */
  guidanceEmphasis: boolean;
  isNew: boolean;
  isExperienced: boolean;
  feeling: First30Feeling;
  obstacle: First30Obstacle;
  support: First30Support;
}

export interface ResolvedCapabilities {
  verified: Set<OnboardingCapabilityId>;
  /** Verified capabilities, in config order, for display. */
  items: { id: OnboardingCapabilityId; label: string; detail: string }[];
  /** The gym lists a verified personal-training service (NOT an onboarding promise). */
  personalTrainingService: boolean;
}

export interface First30Step {
  title: string;
  detail?: string;
}

export interface First30SupportItem {
  /** verified = confirmed gym capability; ask = a question to ask; service = conservative service mention. */
  kind: "verified" | "ask" | "service";
  text: string;
  label?: string;
}

export interface First30Week {
  id: "w1" | "w2" | "w3" | "w4";
  index: number;
  label: string;
  range: string;
  line: string;
  points: string[];
}

export interface First30DayCell {
  id: First30Day;
  short: string;
  full: string;
  selected: boolean;
}

export interface First30Plan {
  answers: First30Answers;
  profile: First30Profile;
  summary: { id: string; label: string; value: string }[];
  rhythm: {
    /** "3 evenings a week" — the single most important line. */
    headline: string;
    countLabel: string;
    daysLine: string;
    timeLabel: string;
    strip: First30DayCell[];
    mode: First30ScheduleMode;
    hours: { days: string; range: string }[];
    note: string;
  };
  beforeDay1: string[];
  firstVisit: {
    depth: First30Depth;
    steps: First30Step[];
    facts: First30Fact[];
    questions: string[];
    healthNote: string;
  };
  roadmap: First30Week[];
  hard: { title: string; line: string; step: string };
  support: { mode: "verified" | "ask"; title: string; items: First30SupportItem[] };
}

type First30Fact = First30DaysFact;

// ------------------------------------------------------------ constants ---

export const DAYS: { id: First30Day; short: string; full: string }[] = [
  { id: "mon", short: "Mon", full: "Monday" },
  { id: "tue", short: "Tue", full: "Tuesday" },
  { id: "wed", short: "Wed", full: "Wednesday" },
  { id: "thu", short: "Thu", full: "Thursday" },
  { id: "fri", short: "Fri", full: "Friday" },
  { id: "sat", short: "Sat", full: "Saturday" },
  { id: "sun", short: "Sun", full: "Sunday" },
];

const DAY_IDS = DAYS.map((d) => d.id);

export const STEP_IDS: First30StepId[] = ["experience", "schedule", "feeling", "obstacle", "support"];

export const STEP_LABELS: Record<First30StepId, string> = {
  experience: "About you",
  schedule: "Schedule",
  feeling: "First visit",
  obstacle: "Obstacle",
  support: "Support",
};

export const QUESTION_PROMPTS: Record<First30StepId, { prompt: string; hint?: string }> = {
  experience: { prompt: "What's your gym experience like?" },
  schedule: {
    prompt: "Which days could you realistically train?",
    hint: "Pick what fits your actual week, not your ideal one.",
  },
  feeling: { prompt: "Picture your first visit. How would it feel?" },
  obstacle: { prompt: "What's most likely to get in your way?" },
  support: { prompt: "What would make your first month easier?" },
};

export const EXPERIENCE_OPTIONS: First30Option<First30Experience>[] = [
  { value: "new", label: "I'm completely new to gyms" },
  { value: "stopped", label: "I've tried before and stopped" },
  { value: "knows", label: "I know my way around" },
];

/** Short chip form of each experience answer (carried chip, summary). */
export const EXPERIENCE_SHORT: Record<First30Experience, string> = {
  new: "Completely new to gyms",
  stopped: "Tried before and stopped",
  knows: "Knows their way around",
};

export const TIME_OPTIONS: First30Option<First30Time>[] = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "varies", label: "It varies" },
];

export const VARIABLE_COUNT_OPTIONS: First30Option<First30VariableCount>[] = [
  { value: "1-2", label: "1–2 days" },
  { value: "3", label: "3 days" },
  { value: "4", label: "4 days" },
  { value: "5+", label: "5+ days" },
];

export const FEELING_OPTIONS: First30Option<First30Feeling>[] = [
  { value: "nervous", label: "Nervous" },
  { value: "unsure", label: "A bit unsure" },
  { value: "comfortable", label: "Comfortable" },
];

export const OBSTACLE_OPTIONS: First30Option<First30Obstacle>[] = [
  { value: "time", label: "Finding the time" },
  { value: "energy", label: "Low energy" },
  { value: "motivation", label: "Staying motivated" },
  { value: "unknown", label: "Not knowing what to do there" },
];

export const SUPPORT_OPTIONS: First30Option<First30Support>[] = [
  { value: "showAround", label: "Someone to show me around" },
  { value: "whereToStart", label: "Help working out where to start" },
  { value: "checkIn", label: "A check-in now and then" },
  { value: "selfDirected", label: "I'd rather get on with it myself" },
  { value: "notSure", label: "Not sure yet" },
];

/** Content budgets — enforced by scripts/first-30-days.test.mjs. */
export const CONTENT_BUDGET = {
  lineWords: 22,
  itemWords: 12,
  beforeDay1Items: 4,
  firstVisitSteps: 4,
  questions: 5,
  weekPoints: 3,
  supportItems: 6,
  messageChars: 400,
} as const;

const EXPERIENCES = EXPERIENCE_OPTIONS.map((o) => o.value);
const TIMES = TIME_OPTIONS.map((o) => o.value);
const COUNTS = VARIABLE_COUNT_OPTIONS.map((o) => o.value);
const FEELINGS = FEELING_OPTIONS.map((o) => o.value);
const OBSTACLES = OBSTACLE_OPTIONS.map((o) => o.value);
const SUPPORTS = SUPPORT_OPTIONS.map((o) => o.value);

const COUNT_NUMBER: Record<First30VariableCount, number> = { "1-2": 2, "3": 3, "4": 4, "5+": 5 };
const COUNT_LABEL: Record<First30VariableCount, string> = { "1-2": "1–2", "3": "3", "4": "4", "5+": "5+" };

const TIME_PLURAL: Record<First30Time, string> = {
  morning: "mornings",
  afternoon: "afternoons",
  evening: "evenings",
  varies: "days",
};

const TIME_LABEL: Record<First30Time, string> = {
  morning: "Mornings",
  afternoon: "Afternoons",
  evening: "Evenings",
  varies: "Times vary",
};

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven"];

function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

// -------------------------------------------------------- normalisation ---

/** Unique days in Mon→Sun order; anything unknown is dropped. */
export function sortDays(input: unknown): First30Day[] {
  if (!Array.isArray(input)) return [];
  const set = new Set(input.filter((d): d is First30Day => isOneOf(DAY_IDS, d)));
  return DAY_IDS.filter((d) => set.has(d));
}

/** Coerce any (partial, stale or malformed) input into a complete answer set. */
export function normalizeAnswers(input: unknown): First30Answers {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const days = sortDays(raw.days);
  const variableCount = isOneOf(COUNTS, raw.variableCount) ? raw.variableCount : undefined;
  let scheduleMode: First30ScheduleMode = raw.scheduleMode === "variable" ? "variable" : "fixed";
  if (scheduleMode === "fixed" && days.length === 0) scheduleMode = "variable";

  return {
    experience: isOneOf(EXPERIENCES, raw.experience) ? raw.experience : "new",
    scheduleMode,
    days: scheduleMode === "fixed" ? days : [],
    variableCount: scheduleMode === "variable" ? (variableCount ?? "3") : undefined,
    time: isOneOf(TIMES, raw.time) ? raw.time : "varies",
    feeling: isOneOf(FEELINGS, raw.feeling) ? raw.feeling : "unsure",
    obstacle: isOneOf(OBSTACLES, raw.obstacle) ? raw.obstacle : "time",
    support: isOneOf(SUPPORTS, raw.support) ? raw.support : "notSure",
  };
}

/**
 * Keep only valid values from a partial (possibly stored, possibly stale)
 * draft. Unlike normalizeAnswers it never invents an answer — a missing or
 * invalid field stays unanswered so the visitor is asked again.
 */
export function sanitizeDraft(input: unknown): First30Draft {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const draft: First30Draft = {};
  if (isOneOf(EXPERIENCES, raw.experience)) draft.experience = raw.experience;
  if (raw.scheduleMode === "fixed" || raw.scheduleMode === "variable") draft.scheduleMode = raw.scheduleMode;
  const days = sortDays(raw.days);
  if (days.length > 0) draft.days = days;
  if (isOneOf(COUNTS, raw.variableCount)) draft.variableCount = raw.variableCount;
  if (isOneOf(TIMES, raw.time)) draft.time = raw.time;
  if (isOneOf(FEELINGS, raw.feeling)) draft.feeling = raw.feeling;
  if (isOneOf(OBSTACLES, raw.obstacle)) draft.obstacle = raw.obstacle;
  if (isOneOf(SUPPORTS, raw.support)) draft.support = raw.support;
  return draft;
}

/** Map a handoff days-per-week value ("2" | "3" | "4" | "5+") to the variable-week count. */
export function mapHandoffDays(value: unknown): First30VariableCount | undefined {
  switch (value) {
    case "1":
    case "2":
      return "1-2";
    case "3":
      return "3";
    case "4":
      return "4";
    case "5+":
      return "5+";
    default:
      return undefined;
  }
}

/** Has the visitor answered this step? (Next is disabled until true.) */
export function isStepComplete(step: First30StepId, draft: First30Draft): boolean {
  switch (step) {
    case "experience":
      return isOneOf(EXPERIENCES, draft.experience);
    case "schedule": {
      const hasDays =
        draft.scheduleMode === "variable"
          ? isOneOf(COUNTS, draft.variableCount)
          : sortDays(draft.days).length > 0;
      return hasDays && isOneOf(TIMES, draft.time);
    }
    case "feeling":
      return isOneOf(FEELINGS, draft.feeling);
    case "obstacle":
      return isOneOf(OBSTACLES, draft.obstacle);
    case "support":
      return isOneOf(SUPPORTS, draft.support);
  }
}

export function isDraftComplete(draft: First30Draft): boolean {
  return STEP_IDS.every((s) => isStepComplete(s, draft));
}

// -------------------------------------------------------------- profile ---

export function deriveProfile(answers: First30Answers): First30Profile {
  const variable = answers.scheduleMode === "variable";
  const count = variable ? COUNT_NUMBER[answers.variableCount ?? "3"] : answers.days.length;
  const countLabel = variable ? COUNT_LABEL[answers.variableCount ?? "3"] : String(count);
  const isNew = answers.experience === "new";
  const isExperienced = answers.experience === "knows";

  let firstVisitDepth: First30Depth = "standard";
  if (isNew || answers.feeling === "nervous") firstVisitDepth = "full";
  else if (isExperienced && answers.feeling === "comfortable") firstVisitDepth = "compact";

  return {
    weeklyVisitCount: count,
    countLabel,
    scheduleMode: answers.scheduleMode,
    timeBand: answers.time,
    firstVisitDepth,
    restartFriendly: answers.experience === "stopped",
    guidanceEmphasis: answers.obstacle === "unknown" || answers.support === "whereToStart",
    isNew,
    isExperienced,
    feeling: answers.feeling,
    obstacle: answers.obstacle,
    support: answers.support,
  };
}

// --------------------------------------------------------- capabilities ---

/**
 * Only capabilities that are `verified: true` AND carry a non-empty `source`
 * count. Personal training is reported separately: it is a verified SERVICE,
 * never evidence of an onboarding capability.
 */
export function resolveCapabilities(
  capabilities: OnboardingCapability[],
  verifiedServiceIds: string[]
): ResolvedCapabilities {
  const items = capabilities
    .filter((c) => c.verified === true && typeof c.source === "string" && c.source.trim().length > 0)
    .map(({ id, label, detail }) => ({ id, label, detail }));
  return {
    verified: new Set(items.map((i) => i.id)),
    items,
    personalTrainingService: verifiedServiceIds.includes("personal-training"),
  };
}

// --------------------------------------------------------- rule engine ---

interface RuleContext {
  profile: First30Profile;
  caps: ResolvedCapabilities;
  gymName: string;
}

export interface ContentRule<T> {
  id: string;
  when?: (p: First30Profile) => boolean;
  requires?: OnboardingCapabilityId[];
  content: (ctx: RuleContext) => T;
  askInstead?: (ctx: RuleContext) => T;
}

/** Every matching rule, gated by verified capabilities. */
function selectAll<T>(rules: ContentRule<T>[], ctx: RuleContext): T[] {
  const out: T[] = [];
  for (const rule of rules) {
    if (rule.when && !rule.when(ctx.profile)) continue;
    const met = (rule.requires ?? []).every((id) => ctx.caps.verified.has(id));
    if (met) out.push(rule.content(ctx));
    else if (rule.askInstead) out.push(rule.askInstead(ctx));
  }
  return out;
}

/** The first matching rule that can render (rules end with a default). */
function selectFirst<T>(rules: ContentRule<T>[], ctx: RuleContext): T {
  for (const rule of rules) {
    if (rule.when && !rule.when(ctx.profile)) continue;
    const met = (rule.requires ?? []).every((id) => ctx.caps.verified.has(id));
    if (met) return rule.content(ctx);
    if (rule.askInstead) return rule.askInstead(ctx);
  }
  throw new Error("Content slot has no default rule");
}

const capDetail = (ctx: RuleContext, id: OnboardingCapabilityId) =>
  ctx.caps.items.find((i) => i.id === id)?.detail ?? "";
const capLabel = (ctx: RuleContext, id: OnboardingCapabilityId) =>
  ctx.caps.items.find((i) => i.id === id)?.label ?? "";

// ------------------------------------------------------ content: rules ---

const BEFORE_DAY1_RULES: ContentRule<string>[] = [
  {
    id: "calendar-fixed",
    when: (p) => p.scheduleMode === "fixed",
    content: () => "Put your training days in your calendar.",
  },
  {
    id: "calendar-variable",
    when: (p) => p.scheduleMode === "variable",
    content: () => "Each week, pick your days and put them in your calendar.",
  },
  { id: "travel", content: () => "Check your travel time at your usual training time." },
  { id: "questions", content: () => "Note the questions you want to ask." },
  {
    id: "who-to-ask",
    requires: ["trainerIntro"],
    content: () => "Know who you'll be introduced to when you arrive.",
    askInstead: () => "Ask who to speak to when you arrive.",
  },
];

const FIRST_VISIT_STEP_RULES: ContentRule<First30Step>[] = [
  {
    id: "arrive",
    content: () => ({ title: "Arrive and check in", detail: "Say it's your first visit when you arrive." }),
  },
  {
    id: "orientation",
    requires: ["orientation"],
    content: (ctx) => ({ title: capLabel(ctx, "orientation"), detail: capDetail(ctx, "orientation") }),
    askInstead: () => ({
      title: "Ask who can help you get started",
      detail: "Ask whether someone can walk you through the equipment.",
    }),
  },
  {
    id: "space",
    content: () => ({
      title: "Get familiar with the space",
      detail: "Walk the floor first and note where things are.",
    }),
  },
  {
    id: "questions",
    content: () => ({
      title: "Ask any questions before starting",
      detail: "Use the questions below. Nothing is too basic to ask.",
    }),
  },
];

const QUESTION_RULES: ContentRule<string>[] = [
  { id: "who", content: () => "Who should I ask if I'm unsure?" },
  { id: "bring", content: () => "What should I bring?" },
  {
    id: "quiet",
    when: (p) => p.feeling !== "comfortable" || p.isNew,
    content: () => "Are there quieter times for new members?",
  },
  {
    id: "companion",
    when: (p) => p.feeling === "nervous",
    content: () => "Can I bring someone with me?",
  },
  { id: "know", content: () => "Is there anything I should know before my first session?" },
];

const QUESTION_LIMIT: Record<First30Depth, number> = { full: 5, standard: 3, compact: 2 };

const RHYTHM_NOTE_RULES: ContentRule<string>[] = [
  {
    id: "variable",
    when: (p) => p.scheduleMode === "variable",
    content: () => "Your week changes, so choose your days each weekend and put them in your calendar.",
  },
  {
    id: "single",
    when: (p) => p.weeklyVisitCount === 1,
    content: () => "One fixed day is a real start. Keep it the same each week.",
  },
  {
    id: "most-days",
    when: (p) => p.weeklyVisitCount >= 6,
    content: () => "That's most of your week. Plan for the weeks where fewer happen.",
  },
  {
    id: "five",
    when: (p) => p.weeklyVisitCount === 5,
    content: () => "A full week. Decide now which day gives way first when things get busy.",
  },
  {
    id: "restart",
    when: (p) => p.restartFriendly,
    content: () => "Same days each week. If a week slips, restart on the next planned day.",
  },
  {
    id: "time-varies",
    when: (p) => p.timeBand === "varies",
    content: () => "Your times vary, so book each visit into your calendar like an appointment.",
  },
  { id: "default", content: () => "Same days, same time each week. That's the whole rhythm." },
];

type WeekContent = Pick<First30Week, "line" | "points">;

const WEEK_RULES: Record<First30Week["id"], ContentRule<WeekContent>[]> = {
  w1: [
    {
      id: "w1-knows",
      when: (p) => p.isExperienced,
      content: () => ({
        line: "Get set up: learn this gym's layout and when it's busy.",
        points: ["Go on your planned days", "Find out the quieter times", "Note anything you'd like help with"],
      }),
    },
    {
      id: "w1-default",
      content: () => ({
        line: "Make your first visit and learn where things are.",
        points: ["Go on your planned days", "Ask your questions early", "Note what felt unfamiliar"],
      }),
    },
  ],
  w2: [
    {
      id: "w2-restart",
      when: (p) => p.restartFriendly,
      content: () => ({
        line: "This is often where it slipped before. Just keep the days.",
        points: ["Arrive at the same time", "Pack your bag the night before"],
      }),
    },
    {
      id: "w2-default",
      content: () => ({
        line: "Same days, same time. Let it start to feel normal.",
        points: ["Arrive at the same time", "Pack your bag the night before"],
      }),
    },
  ],
  w3: [
    {
      id: "w3-default",
      content: () => ({
        line: "Things will come up. Move a session rather than skip the week.",
        points: ["Spot the day most at risk", "Keep a back-up slot in mind"],
      }),
    },
  ],
  w4: [
    {
      id: "w4-default",
      content: () => ({
        line: "Count the visits you made and decide what to keep for month two.",
        points: ["Which days worked best?", "What would you change?", "What do you want to ask the gym?"],
      }),
    },
  ],
};

const WEEK_META: { id: First30Week["id"]; label: string; range: string }[] = [
  { id: "w1", label: "Get familiar", range: "Days 1–7" },
  { id: "w2", label: "Settle in", range: "Days 8–14" },
  { id: "w3", label: "Protect the rhythm", range: "Days 15–21" },
  { id: "w4", label: "Look back", range: "Days 22–30" },
];

const HARD_RULES: ContentRule<First30Plan["hard"]>[] = [
  {
    id: "time",
    when: (p) => p.obstacle === "time",
    content: () => ({
      title: "Finding the time",
      line: "Keep your planned days visible in your calendar. If one session slips, move it rather than abandoning the week.",
      step: "Pick a back-up slot for each week now.",
    }),
  },
  {
    id: "energy",
    when: (p) => p.obstacle === "energy",
    content: () => ({
      title: "Low energy",
      line: "Make the decision about whether to go earlier in the day. Keep the first step simple.",
      step: "Pack your bag the night before.",
    }),
  },
  {
    id: "motivation",
    when: (p) => p.obstacle === "motivation",
    content: () => ({
      title: "Staying motivated",
      line: "Use the schedule as your commitment, rather than waiting to feel motivated.",
      step: "Tell someone which days you've planned.",
    }),
  },
  {
    id: "unknown-orientation",
    when: (p) => p.obstacle === "unknown",
    requires: ["orientation"],
    content: (ctx) => ({
      title: "Not knowing what to do there",
      line: `Use the ${capLabel(ctx, "orientation").toLowerCase()} to ask what to do first, then ask again whenever you're unsure.`,
      step: "Write down one question before each visit.",
    }),
  },
  {
    id: "unknown",
    when: (p) => p.obstacle === "unknown",
    content: () => ({
      title: "Not knowing what to do there",
      line: "Ask who you should speak to when you're unsure what to do on the gym floor.",
      step: "Write down one question before each visit.",
    }),
  },
  {
    id: "default",
    content: () => ({
      title: "When it gets hard",
      line: "Keep your planned days in your calendar and move a session rather than drop the week.",
      step: "Pick a back-up slot for each week now.",
    }),
  },
];

const verifiedItem =
  (id: OnboardingCapabilityId) =>
  (ctx: RuleContext): First30SupportItem => ({
    kind: "verified",
    label: capLabel(ctx, id),
    text: capDetail(ctx, id),
  });
const ask = (text: string) => (): First30SupportItem => ({ kind: "ask", text });

/** One rule per support topic. Order is re-ranked by the visitor's preference. */
const SUPPORT_RULES: (ContentRule<First30SupportItem> & { topic: First30Support | "general" })[] = [
  {
    id: "show-around",
    topic: "showAround",
    requires: ["orientation"],
    content: verifiedItem("orientation"),
    askInstead: ask("Is there someone who can show me around?"),
  },
  {
    id: "where-to-start",
    topic: "whereToStart",
    requires: ["trainerIntro"],
    content: verifiedItem("trainerIntro"),
    askInstead: ask("Can someone help me understand where to start?"),
  },
  {
    id: "check-ins",
    topic: "checkIn",
    requires: ["checkIns"],
    content: verifiedItem("checkIns"),
    askInstead: ask("Are there check-ins for new members?"),
  },
  {
    id: "self-directed",
    topic: "selfDirected",
    when: (p) => p.support === "selfDirected",
    content: () => ({ kind: "ask", text: "What's the best way to ask if I get stuck?" }),
  },
  // Verified-only extras: omitted entirely when not confirmed.
  { id: "tour", topic: "general", requires: ["tour"], content: verifiedItem("tour") },
  { id: "trial", topic: "general", requires: ["trialSession"], content: verifiedItem("trialSession") },
  { id: "assessment", topic: "general", requires: ["assessment"], content: verifiedItem("assessment") },
  {
    id: "general",
    topic: "general",
    content: () => ({ kind: "ask", text: "What support is available if I need guidance?" }),
  },
];

// ------------------------------------------------------------ builders ---

function compressDayRun(ids: First30Day[]): string {
  // Consecutive runs of 3+ days collapse to "Mon–Sat"; otherwise "Tue · Thu".
  const idx = ids.map((d) => DAY_IDS.indexOf(d)).sort((a, b) => a - b);
  const parts: string[] = [];
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1] === idx[j] + 1) j++;
    if (j - i >= 2) parts.push(`${DAYS[idx[i]].short}–${DAYS[idx[j]].short}`);
    else for (let k = i; k <= j; k++) parts.push(DAYS[idx[k]].short);
    i = j + 1;
  }
  return parts.join(" · ");
}

/** Opening hours for the chosen days (all days when the week varies), grouped by range. */
export function hoursForDays(days: First30Day[], hours: BusinessHours[]): { days: string; range: string }[] {
  const wanted = days.length > 0 ? days : DAY_IDS;
  const groups = new Map<string, First30Day[]>();
  for (const id of wanted) {
    const full = DAYS.find((d) => d.id === id)!.full;
    const h = hours.find((x) => x.day.toLowerCase() === full.toLowerCase());
    if (!h) continue;
    const range = `${h.open}–${h.close}`;
    groups.set(range, [...(groups.get(range) ?? []), id]);
  }
  return [...groups.entries()].map(([range, ids]) => ({ days: compressDayRun(ids), range }));
}

function rhythmHeadline(profile: First30Profile, answers: First30Answers): string {
  const n = profile.weeklyVisitCount;
  if (answers.scheduleMode === "variable") {
    return `${profile.countLabel} ${answers.time === "varies" ? "days" : TIME_PLURAL[answers.time]} a week`;
  }
  if (n === 1) return answers.time === "varies" ? "1 day a week" : `1 ${answers.time} a week`;
  return `${n} ${TIME_PLURAL[answers.time]} a week`;
}

const SUPPORT_SHORT: Record<First30Support, string> = {
  showAround: "Wants a show-around",
  whereToStart: "Needs some guidance",
  checkIn: "Would like check-ins",
  selfDirected: "Prefers to self-start",
  notSure: "Support: not sure yet",
};

const FEELING_SHORT: Record<First30Feeling, string> = {
  nervous: "Nervous",
  unsure: "A bit unsure",
  comfortable: "Comfortable",
};

export interface First30Inputs {
  gymName: string;
  capabilities: ResolvedCapabilities;
  facts: First30Fact[];
  hours: BusinessHours[];
}

export function buildFirst30Plan(rawAnswers: unknown, inputs: First30Inputs): First30Plan {
  const answers = normalizeAnswers(rawAnswers);
  const profile = deriveProfile(answers);
  const ctx: RuleContext = { profile, caps: inputs.capabilities, gymName: inputs.gymName };

  const variable = answers.scheduleMode === "variable";
  const daysLine = variable ? "Days change week to week" : answers.days.map((d) => DAYS.find((x) => x.id === d)!.short).join(" · ");

  // First visit — depth controls detail and question count.
  const depth = profile.firstVisitDepth;
  const steps = selectAll(FIRST_VISIT_STEP_RULES, ctx)
    .slice(0, CONTENT_BUDGET.firstVisitSteps)
    .map((s) => (depth === "compact" ? { title: s.title } : s));
  const questions = selectAll(QUESTION_RULES, ctx).slice(0, QUESTION_LIMIT[depth]);

  // Support — preferred topic first.
  const ranked = [...SUPPORT_RULES].sort((a, b) => {
    const score = (r: (typeof SUPPORT_RULES)[number]) => (r.topic === profile.support ? 0 : 1);
    return score(a) - score(b);
  });
  let supportItems = selectAll(ranked, ctx);
  if (inputs.capabilities.personalTrainingService) {
    supportItems.push({
      kind: "service",
      text: "Personal training is offered. Ask how it works for new members.",
    });
  }
  supportItems = supportItems.slice(0, CONTENT_BUDGET.supportItems);
  const hasVerified = supportItems.some((i) => i.kind === "verified");

  return {
    answers,
    profile,
    summary: [
      { id: "count", label: "Frequency", value: `${profile.countLabel} ${profile.weeklyVisitCount === 1 && !variable ? "day" : "days"} a week` },
      { id: "days", label: "Days", value: variable ? "Week changes" : daysLine },
      { id: "time", label: "Time", value: TIME_LABEL[answers.time] },
      { id: "experience", label: "Experience", value: EXPERIENCE_SHORT[answers.experience] },
      { id: "feeling", label: "First visit", value: FEELING_SHORT[answers.feeling] },
      { id: "support", label: "Support", value: SUPPORT_SHORT[answers.support] },
    ],
    rhythm: {
      headline: rhythmHeadline(profile, answers),
      countLabel: profile.countLabel,
      daysLine,
      timeLabel: TIME_LABEL[answers.time],
      strip: DAYS.map((d) => ({ ...d, selected: answers.days.includes(d.id) })),
      mode: answers.scheduleMode,
      hours: hoursForDays(answers.days, inputs.hours),
      note: selectFirst(RHYTHM_NOTE_RULES, ctx),
    },
    beforeDay1: selectAll(BEFORE_DAY1_RULES, ctx).slice(0, CONTENT_BUDGET.beforeDay1Items),
    firstVisit: {
      depth,
      steps,
      facts: inputs.facts,
      questions,
      healthNote: "Mention any injury or health condition to the appropriate gym professional.",
    },
    roadmap: WEEK_META.map((w, i) => ({
      ...w,
      index: i + 1,
      ...selectFirst(WEEK_RULES[w.id], ctx),
    })),
    hard: selectFirst(HARD_RULES, ctx),
    support: {
      mode: hasVerified ? "verified" : "ask",
      title: hasVerified ? `What ${inputs.gymName} can help with` : "Things worth asking about",
      items: supportItems,
    },
  };
}

// ------------------------------------------------------------- message ---

const EXPERIENCE_SENTENCE: Record<First30Experience, string> = {
  new: "I'm new to gyms",
  stopped: "I've trained before but stopped",
  knows: "I've trained before",
};

const OBSTACLE_SENTENCE: Record<First30Obstacle, string> = {
  time: "Finding the time is my main worry.",
  energy: "Low energy is what usually gets in my way.",
  motivation: "Staying motivated is what usually gets in my way.",
  unknown: "I'm not always sure what to do on the gym floor.",
};

function scheduleClause(plan: First30Plan): string {
  const { answers, profile } = plan;
  const shortDays = answers.days.map((d) => DAYS.find((x) => x.id === d)!.short).join(", ");
  if (answers.scheduleMode === "variable") {
    const unit = answers.time === "varies" ? "days" : TIME_PLURAL[answers.time];
    return `I'm looking at ${profile.countLabel} ${unit} a week, though my week changes`;
  }
  const n = profile.weeklyVisitCount;
  if (answers.time === "varies") {
    return `I'm looking at training ${NUMBER_WORDS[n]} ${n === 1 ? "day" : "days"} a week (${shortDays})`;
  }
  const unit = n === 1 ? answers.time : TIME_PLURAL[answers.time];
  return `I'm looking at training ${NUMBER_WORDS[n]} ${unit} a week (${shortDays})`;
}

function messageQuestion(plan: First30Plan, caps: ResolvedCapabilities): string {
  switch (plan.answers.support) {
    case "showAround":
      return caps.verified.has("orientation")
        ? "Could I book in for the first-visit walkthrough?"
        : "Could I come in and have a look around first?";
    case "whereToStart":
      return "Is there someone who could help me work out where to start?";
    case "checkIn":
      return caps.verified.has("checkIns")
        ? "How do the new-member check-ins work?"
        : "Do you do any check-ins with new members?";
    case "selfDirected":
      return "When's a good time to come in for a first visit?";
    case "notSure":
      return "How do new members usually get started?";
  }
}

/**
 * The prefilled WhatsApp text. Short, first-person, plain. It never includes
 * the first-visit feeling, prices, unverified services or outcomes; the
 * obstacle is included ONLY when the visitor opts in.
 */
export function buildFirst30Message(
  gymName: string,
  plan: First30Plan,
  caps: ResolvedCapabilities,
  options: { includeObstacle?: boolean } = {}
): string {
  const parts = [
    `Hi ${gymName}, I tried the First 30 Days planner on your website.`,
    `${EXPERIENCE_SENTENCE[plan.answers.experience]} and ${lowerFirst(scheduleClause(plan))}.`,
  ];
  if (options.includeObstacle) parts.push(OBSTACLE_SENTENCE[plan.answers.obstacle]);
  parts.push(messageQuestion(plan, caps));
  return parts.join(" ");
}

function lowerFirst(s: string): string {
  // "I'm …" stays capitalised — the pronoun I.
  return s.startsWith("I") ? s : s.charAt(0).toLowerCase() + s.slice(1);
}

// ----------------------------------------------------------- handoff ---

/** Map a Tool 1 (/start) or Tool 2 (/journey) experience value to this tool's. */
export function mapHandoffExperience(value: unknown): First30Experience | undefined {
  switch (value) {
    case "new":
      return "new";
    case "returning":
    case "on-off":
      return "stopped";
    case "occasional":
    case "regular":
    case "consistent":
      return "knows";
    default:
      return undefined;
  }
}

/** Map Tool 1's preferred-time value to this tool's time band. */
export function mapHandoffTime(value: unknown): First30Time | undefined {
  switch (value) {
    case "early-morning":
    case "morning":
      return "morning";
    case "afternoon":
      return "afternoon";
    case "evening":
      return "evening";
    case "varies":
      return "varies";
    default:
      return undefined;
  }
}
