// Zero-dependency tests for the /first-30-days ("Plan Your First 30 Days") logic layer.
// Run: node --test scripts/first-30-days.test.mjs  (Node >= 22.18 type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  CONTENT_BUDGET,
  DAYS,
  EXPERIENCE_OPTIONS,
  FEELING_OPTIONS,
  OBSTACLE_OPTIONS,
  QUESTION_PROMPTS,
  STEP_IDS,
  SUPPORT_OPTIONS,
  TIME_OPTIONS,
  VARIABLE_COUNT_OPTIONS,
  buildFirst30Message,
  buildFirst30Plan,
  deriveProfile,
  hoursForDays,
  isDraftComplete,
  isStepComplete,
  mapHandoffDays,
  mapHandoffExperience,
  mapHandoffTime,
  normalizeAnswers,
  resolveCapabilities,
  sanitizeDraft,
  sortDays,
} from "../components/sections/first30DaysLogic.ts";
import { first30DaysConfiguration as config } from "../lib/first-30-days.ts";
import { business } from "../lib/business.ts";
import { services } from "../lib/services.ts";
import { appendWhatsAppMessage, buildWhatsAppHref, isUsableWhatsAppNumber } from "../lib/whatsapp.ts";

const GYM = business.name;
const VERIFIED_SERVICE_IDS = services.filter((s) => s.verified).map((s) => s.id);
const NO_CAPS = resolveCapabilities(config.capabilities, VERIFIED_SERVICE_IDS);
const ALL_CAPS = resolveCapabilities(
  config.capabilities.map((c) => ({ ...c, verified: true, source: "test fixture" })),
  VERIFIED_SERVICE_IDS
);
const inputs = (caps) => ({ gymName: GYM, capabilities: caps, facts: config.firstVisitFacts, hours: business.hours });

/** Workout / medical / pricing / outcome language that must never appear. */
const FORBIDDEN = [
  /\breps?\b/i,
  /\bsets\b/i,
  /\bkg\b/i,
  /calori/i,
  /\bbmi\b/i,
  /guarantee/i,
  /₹|\bRs\.?\b|\bINR\b|\/month|per month/i,
  /diagnos/i,
  /transform/i,
  /lose \d|weight[- ]loss/i,
  /body[- ]?fat/i,
  /supplement/i,
  /macros?\b/i,
  /\bworkout (plan|programme|program)\b/i,
  /\bsquat|deadlift|bench press|cardio session/i,
  /\bheart rate\b/i,
];

/** Service-claim phrases that must not appear unless the capability is verified. */
const UNVERIFIED_CLAIMS = [
  /free trial/i,
  /trial session is/i,
  /your trainer/i,
  /a trainer will/i,
  /orientation (is|will)/i,
  /floor orientation/i,
  /assessment (will|is)/i,
  /starting assessment/i,
  /we'll check in|will check in|check in with new members/i,
  /tour (is|will)/i,
  /look-around visit/i,
  /introduced to/i,
  /walkthrough/i,
];

function allStrings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => allStrings(v, out));
  else if (value instanceof Set) return out;
  else if (value && typeof value === "object") Object.values(value).forEach((v) => allStrings(v, out));
  return out;
}

const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;

/** Every schedule: 127 non-empty fixed day subsets + 4 variable counts. */
function* schedules() {
  const ids = DAYS.map((d) => d.id);
  for (let mask = 1; mask < 128; mask++) {
    yield { scheduleMode: "fixed", days: ids.filter((_, i) => mask & (1 << i)) };
  }
  for (const o of VARIABLE_COUNT_OPTIONS) yield { scheduleMode: "variable", variableCount: o.value, days: [] };
}

function* combos() {
  for (const schedule of schedules())
    for (const time of TIME_OPTIONS)
      for (const feeling of FEELING_OPTIONS)
        for (const obstacle of OBSTACLE_OPTIONS)
          for (const support of SUPPORT_OPTIONS)
            for (const experience of EXPERIENCE_OPTIONS)
              yield {
                ...schedule,
                time: time.value,
                feeling: feeling.value,
                obstacle: obstacle.value,
                support: support.value,
                experience: experience.value,
              };
}

const base = {
  experience: "new",
  scheduleMode: "fixed",
  days: ["tue", "thu", "sat"],
  time: "evening",
  feeling: "unsure",
  obstacle: "time",
  support: "whereToStart",
};

// ------------------------------------------------------------ questions ---

test("five steps with the approved wording and options", () => {
  assert.deepEqual(STEP_IDS, ["experience", "schedule", "feeling", "obstacle", "support"]);
  assert.equal(QUESTION_PROMPTS.experience.prompt, "What's your gym experience like?");
  assert.equal(QUESTION_PROMPTS.schedule.prompt, "Which days could you realistically train?");
  assert.equal(QUESTION_PROMPTS.schedule.hint, "Pick what fits your actual week, not your ideal one.");
  assert.equal(QUESTION_PROMPTS.feeling.prompt, "Picture your first visit. How would it feel?");
  assert.equal(QUESTION_PROMPTS.obstacle.prompt, "What's most likely to get in your way?");
  assert.equal(QUESTION_PROMPTS.support.prompt, "What would make your first month easier?");
  assert.deepEqual(EXPERIENCE_OPTIONS.map((o) => o.label), [
    "I'm completely new to gyms",
    "I've tried before and stopped",
    "I know my way around",
  ]);
  assert.deepEqual(FEELING_OPTIONS.map((o) => o.label), ["Nervous", "A bit unsure", "Comfortable"]);
  assert.equal(OBSTACLE_OPTIONS.length, 4);
  assert.equal(SUPPORT_OPTIONS.length, 5);
  assert.deepEqual(TIME_OPTIONS.map((o) => o.label), ["Morning", "Afternoon", "Evening", "It varies"]);
  assert.deepEqual(VARIABLE_COUNT_OPTIONS.map((o) => o.label), ["1–2 days", "3 days", "4 days", "5+ days"]);
});

test("step completeness: schedule needs days (or a count) AND a time", () => {
  assert.equal(isStepComplete("schedule", { days: [] , time: "evening" }), false);
  assert.equal(isStepComplete("schedule", { days: ["mon"] }), false);
  assert.equal(isStepComplete("schedule", { days: ["mon"], time: "evening" }), true);
  assert.equal(isStepComplete("schedule", { scheduleMode: "variable", time: "morning" }), false);
  assert.equal(isStepComplete("schedule", { scheduleMode: "variable", variableCount: "3", time: "morning" }), true);
  assert.equal(isStepComplete("experience", { experience: "bogus" }), false);
  assert.equal(isDraftComplete(base), true);
  assert.equal(isDraftComplete({ ...base, support: undefined }), false);
});

// -------------------------------------------------------- normalisation ---

test("normalizeAnswers: malformed input falls back to a valid set", () => {
  for (const raw of [undefined, null, 42, "x", [], {}, { days: "mon", time: 3, experience: "pro" }]) {
    const a = normalizeAnswers(raw);
    assert.equal(a.experience, "new");
    assert.equal(a.scheduleMode, "variable");
    assert.equal(a.variableCount, "3");
    assert.deepEqual(a.days, []);
    assert.equal(a.time, "varies");
  }
});

test("sanitizeDraft keeps valid values and never invents answers", () => {
  assert.deepEqual(sanitizeDraft(null), {});
  assert.deepEqual(sanitizeDraft({ experience: "pro", days: ["sun", "mon", "x"], time: "evening", feeling: 1 }), {
    days: ["mon", "sun"],
    time: "evening",
  });
  assert.deepEqual(sanitizeDraft(base), base);
});

test("normalizeAnswers: days are unique and in Mon→Sun order", () => {
  assert.deepEqual(sortDays(["sat", "tue", "sat", "xyz", "mon"]), ["mon", "tue", "sat"]);
  const a = normalizeAnswers({ ...base, days: ["sun", "wed", "wed"] });
  assert.deepEqual(a.days, ["wed", "sun"]);
  assert.equal(a.variableCount, undefined);
  // Variable mode discards stale day selections.
  const v = normalizeAnswers({ ...base, scheduleMode: "variable", variableCount: "5+" });
  assert.deepEqual(v.days, []);
});

// -------------------------------------------------------------- profile ---

test("profile: first-visit depth rules", () => {
  const depth = (experience, feeling) => deriveProfile(normalizeAnswers({ ...base, experience, feeling })).firstVisitDepth;
  assert.equal(depth("new", "comfortable"), "full");
  assert.equal(depth("knows", "nervous"), "full");
  assert.equal(depth("knows", "comfortable"), "compact");
  assert.equal(depth("stopped", "unsure"), "standard");
  assert.equal(depth("stopped", "comfortable"), "standard");
  assert.equal(depth("knows", "unsure"), "standard");
});

test("profile: restart-friendly, guidance emphasis and counts", () => {
  const p = (o) => deriveProfile(normalizeAnswers({ ...base, ...o }));
  assert.equal(p({ experience: "stopped" }).restartFriendly, true);
  assert.equal(p({ experience: "new" }).restartFriendly, false);
  assert.equal(p({ obstacle: "unknown", support: "notSure" }).guidanceEmphasis, true);
  assert.equal(p({ obstacle: "time", support: "whereToStart" }).guidanceEmphasis, true);
  assert.equal(p({ obstacle: "time", support: "notSure" }).guidanceEmphasis, false);
  assert.equal(p({}).weeklyVisitCount, 3);
  const v = p({ scheduleMode: "variable", variableCount: "1-2" });
  assert.equal(v.weeklyVisitCount, 2);
  assert.equal(v.countLabel, "1–2");
});

// --------------------------------------------------------- capabilities ---

test("Gladiator: zero verified onboarding capabilities; PT only as a service flag", () => {
  assert.equal(config.capabilities.length, 6);
  assert.ok(config.capabilities.every((c) => c.verified === false));
  assert.equal(NO_CAPS.verified.size, 0);
  assert.deepEqual(NO_CAPS.items, []);
  assert.equal(NO_CAPS.personalTrainingService, true);
});

test("capabilities need verified:true AND a source", () => {
  const caps = resolveCapabilities(
    [
      { id: "orientation", verified: true, label: "A", detail: "a", source: "owner email" },
      { id: "tour", verified: true, label: "B", detail: "b" },
      { id: "checkIns", verified: true, label: "C", detail: "c", source: "  " },
      { id: "assessment", verified: false, label: "D", detail: "d", source: "x" },
    ],
    []
  );
  assert.deepEqual([...caps.verified], ["orientation"]);
  assert.equal(caps.personalTrainingService, false);
});

// -------------------------------------------------- every combination ---

test("every answer combination builds a valid, safe, on-budget plan (both capability sets)", () => {
  let count = 0;
  const noneStrings = new Set();
  const allStringsSeen = new Set();
  for (const answers of combos()) {
    for (const [capsName, caps] of [["none", NO_CAPS], ["all", ALL_CAPS]]) {
      const plan = buildFirst30Plan(answers, inputs(caps));
      count++;
      const where = `${capsName} ${JSON.stringify(answers)}`;

      // Days reflected exactly and in order.
      if (answers.scheduleMode === "fixed") {
        const expected = DAYS.filter((d) => answers.days.includes(d.id));
        assert.deepEqual(plan.answers.days, expected.map((d) => d.id), where);
        assert.deepEqual(plan.rhythm.strip.filter((c) => c.selected).map((c) => c.id), plan.answers.days, where);
        assert.equal(plan.rhythm.daysLine, expected.map((d) => d.short).join(" · "), where);
        assert.equal(plan.profile.weeklyVisitCount, expected.length, where);
      } else {
        assert.equal(plan.rhythm.strip.some((c) => c.selected), false, where);
      }

      // No empty slots.
      assert.ok(plan.rhythm.headline && plan.rhythm.note, where);
      assert.ok(plan.beforeDay1.length >= 3, where);
      assert.equal(plan.firstVisit.steps.length, 4, where);
      assert.ok(plan.firstVisit.questions.length >= 2, where);
      assert.equal(plan.roadmap.length, 4, where);
      for (const w of plan.roadmap) assert.ok(w.line && w.points.length > 0, where);
      assert.ok(plan.hard.title && plan.hard.line && plan.hard.step, where);
      assert.ok(plan.support.items.length > 0, where);
      assert.ok(plan.rhythm.hours.length > 0, where);

      // Budgets.
      assert.ok(plan.beforeDay1.length <= CONTENT_BUDGET.beforeDay1Items, where);
      assert.ok(plan.firstVisit.questions.length <= CONTENT_BUDGET.questions, where);
      assert.ok(plan.support.items.length <= CONTENT_BUDGET.supportItems, where);
      for (const w of plan.roadmap) {
        assert.ok(w.points.length <= CONTENT_BUDGET.weekPoints, where);
        assert.ok(words(w.line) <= CONTENT_BUDGET.lineWords, where);
        for (const pt of w.points) assert.ok(words(pt) <= CONTENT_BUDGET.itemWords, where);
      }
      for (const s of [plan.rhythm.note, plan.hard.line]) assert.ok(words(s) <= CONTENT_BUDGET.lineWords, `${where} ${s}`);
      for (const s of [...plan.beforeDay1, ...plan.firstVisit.questions, plan.hard.step, ...plan.firstVisit.steps.map((x) => x.title)])
        assert.ok(words(s) <= CONTENT_BUDGET.itemWords, `${where} ${s}`);

      // The obstacle card is Q4's.
      const obstacleLabel = OBSTACLE_OPTIONS.find((o) => o.value === answers.obstacle).label;
      assert.equal(plan.hard.title, obstacleLabel, where);

      // Content safety — collected once per unique string, scanned after the loop.
      const bucket = capsName === "none" ? noneStrings : allStringsSeen;
      for (const s of allStrings(plan)) bucket.add(s);
      if (capsName === "none") {
        assert.equal(plan.support.mode, "ask", where);
        assert.equal(plan.support.title, "Things worth asking about", where);
        assert.ok(plan.support.items.every((i) => i.kind !== "verified"), where);
      } else {
        assert.equal(plan.support.mode, "verified", where);
        assert.equal(plan.support.title, `What ${GYM} can help with`, where);
      }
    }
  }
  assert.equal(count, 524 * 3 * 4 * 5 * 3 * 2);

  for (const s of [...noneStrings, ...allStringsSeen]) {
    for (const re of FORBIDDEN) assert.equal(re.test(s), false, `"${s}" matched ${re}`);
    // Personal training only ever appears as the conservative service line.
    if (/personal train/i.test(s)) assert.equal(s, "Personal training is offered. Ask how it works for new members.");
  }
  for (const s of noneStrings) {
    for (const re of UNVERIFIED_CLAIMS) assert.equal(re.test(s), false, `"${s}" claimed ${re}`);
  }
});

// ---------------------------------------------------------- personas ---

test("persona: completely new + nervous gets the full first visit", () => {
  const plan = buildFirst30Plan({ ...base, feeling: "nervous" }, inputs(NO_CAPS));
  assert.equal(plan.firstVisit.depth, "full");
  assert.ok(plan.firstVisit.steps.every((s) => s.detail));
  assert.equal(plan.firstVisit.questions.length, 5);
  assert.ok(plan.firstVisit.questions.includes("Can I bring someone with me?"));
  assert.match(plan.firstVisit.healthNote, /injury or health condition/);
});

test("persona: experienced + comfortable gets a compact first visit", () => {
  const plan = buildFirst30Plan({ ...base, experience: "knows", feeling: "comfortable" }, inputs(NO_CAPS));
  assert.equal(plan.firstVisit.depth, "compact");
  assert.ok(plan.firstVisit.steps.every((s) => !s.detail));
  assert.equal(plan.firstVisit.questions.length, 2);
  assert.match(plan.roadmap[0].line, /layout/);
});

test("persona: tried before and stopped gets restart-friendly framing", () => {
  const plan = buildFirst30Plan({ ...base, experience: "stopped" }, inputs(NO_CAPS));
  assert.match(plan.roadmap[1].line, /slipped before/);
  assert.match(plan.rhythm.note, /restart/);
});

test("unsupported capability becomes a question; verified becomes a statement", () => {
  const ask = buildFirst30Plan(base, inputs(NO_CAPS));
  assert.equal(ask.firstVisit.steps[1].title, "Ask who can help you get started");
  assert.ok(ask.beforeDay1.includes("Ask who to speak to when you arrive."));
  assert.equal(ask.support.items[0].text, "Can someone help me understand where to start?");

  const full = buildFirst30Plan(base, inputs(ALL_CAPS));
  assert.equal(full.firstVisit.steps[1].title, "Floor orientation");
  assert.equal(full.support.items[0].kind, "verified");
  assert.equal(full.support.items[0].label, "Trainer introduction");
});

test("verified-only extras are omitted, not asked, when unconfirmed", () => {
  const plan = buildFirst30Plan(base, inputs(NO_CAPS));
  const text = allStrings(plan).join(" ");
  assert.equal(/trial|assessment/i.test(text), false);
});

test("rhythm notes: single day, most days, variable, time varies", () => {
  const note = (o) => buildFirst30Plan({ ...base, ...o }, inputs(NO_CAPS)).rhythm.note;
  assert.match(note({ days: ["wed"] }), /One fixed day/);
  assert.match(note({ days: ["mon", "tue", "wed", "thu", "fri", "sat"] }), /fewer happen/);
  assert.match(note({ scheduleMode: "variable", variableCount: "4" }), /week changes/);
  assert.match(note({ time: "varies" }), /appointment/);
});

test("rhythm headline + hours for the chosen days", () => {
  const plan = buildFirst30Plan(base, inputs(NO_CAPS));
  assert.equal(plan.rhythm.headline, "3 evenings a week");
  assert.equal(plan.rhythm.daysLine, "Tue · Thu · Sat");
  assert.equal(plan.rhythm.timeLabel, "Evenings");
  assert.deepEqual(plan.rhythm.hours, [{ days: "Tue · Thu · Sat", range: "05:30 AM–10:00 PM" }]);
  assert.deepEqual(hoursForDays(["sat", "sun"], business.hours), [
    { days: "Sat", range: "05:30 AM–10:00 PM" },
    { days: "Sun", range: "06:00 AM–10:00 PM" },
  ]);
  assert.deepEqual(hoursForDays([], business.hours), [
    { days: "Mon–Sat", range: "05:30 AM–10:00 PM" },
    { days: "Sun", range: "06:00 AM–10:00 PM" },
  ]);
  assert.deepEqual(hoursForDays(["mon"], []), []);
  assert.equal(buildFirst30Plan({ ...base, days: ["mon"] }, inputs(NO_CAPS)).rhythm.headline, "1 evening a week");
  assert.equal(
    buildFirst30Plan({ ...base, scheduleMode: "variable", variableCount: "1-2", time: "varies" }, inputs(NO_CAPS)).rhythm.headline,
    "1–2 days a week"
  );
});

test("summary chips carry the inputs that shaped the plan", () => {
  const plan = buildFirst30Plan(base, inputs(NO_CAPS));
  assert.deepEqual(
    plan.summary.map((c) => c.value),
    ["3 days a week", "Tue · Thu · Sat", "Evenings", "Completely new to gyms", "A bit unsure", "Needs some guidance"]
  );
});

// ------------------------------------------------------------ message ---

test("message: natural, first-person, built from answers", () => {
  const plan = buildFirst30Plan({ ...base, support: "showAround" }, inputs(NO_CAPS));
  const msg = buildFirst30Message(GYM, plan, NO_CAPS);
  assert.equal(
    msg,
    `Hi ${GYM}, I tried the First 30 Days planner on your website. I'm new to gyms and I'm looking at training three evenings a week (Tue, Thu, Sat). Could I come in and have a look around first?`
  );
});

test("message: every combination stays short, safe and excludes the feeling", () => {
  const banned = [/nervous/i, /unsure/i, /comfortable/i, /journey/i, /embark/i, /transform/i, /assessment/i, /committed/i, /personali[sz]ed/i, /trial/i, /trainer/i, /orientation/i];
  for (const answers of combos()) {
    if (answers.scheduleMode === "fixed" && answers.days.length > 3 && answers.days.length < 7) continue; // sample
    const plan = buildFirst30Plan(answers, inputs(NO_CAPS));
    for (const includeObstacle of [false, true]) {
      const msg = buildFirst30Message(GYM, plan, NO_CAPS, { includeObstacle });
      const where = `${includeObstacle} ${JSON.stringify(answers)} → ${msg}`;
      assert.ok(msg.length <= CONTENT_BUDGET.messageChars, where);
      for (const re of [...banned, ...FORBIDDEN]) assert.equal(re.test(msg), false, `${where} ${re}`);
      if (answers.scheduleMode === "fixed") {
        const shorts = DAYS.filter((d) => answers.days.includes(d.id)).map((d) => d.short).join(", ");
        assert.ok(msg.includes(`(${shorts})`), where);
      }
      assert.match(msg, /\?$/, where);
    }
  }
});

test("message: obstacle only when the visitor opts in", () => {
  const plan = buildFirst30Plan({ ...base, obstacle: "energy" }, inputs(NO_CAPS));
  assert.equal(/energy/i.test(buildFirst30Message(GYM, plan, NO_CAPS)), false);
  assert.match(buildFirst30Message(GYM, plan, NO_CAPS, { includeObstacle: true }), /Low energy is what usually gets in my way\./);
});

test("message: variable schedule and verified wording", () => {
  const plan = buildFirst30Plan({ ...base, scheduleMode: "variable", variableCount: "4", time: "morning", support: "checkIn" }, inputs(ALL_CAPS));
  const msg = buildFirst30Message(GYM, plan, ALL_CAPS);
  assert.match(msg, /4 mornings a week, though my week changes/);
  assert.match(msg, /How do the new-member check-ins work\?/);
  assert.match(buildFirst30Message(GYM, plan, NO_CAPS), /Do you do any check-ins with new members\?/);
});

test("message: becomes a valid wa.me link", () => {
  const plan = buildFirst30Plan(base, inputs(NO_CAPS));
  const msg = buildFirst30Message(GYM, plan, NO_CAPS);
  const href = appendWhatsAppMessage(buildWhatsAppHref(business.whatsapp), msg);
  const url = new URL(href);
  assert.equal(url.hostname, "wa.me");
  assert.equal(url.pathname, "/919948313442");
  assert.equal(url.searchParams.get("text"), msg);
  assert.equal(href.includes("+"), false, "spaces encoded as %20");
});

test("isUsableWhatsAppNumber", () => {
  assert.equal(isUsableWhatsAppNumber(business.whatsapp.number), true);
  assert.equal(isUsableWhatsAppNumber("+91 99483 13442"), true);
  assert.equal(isUsableWhatsAppNumber(""), false);
  assert.equal(isUsableWhatsAppNumber("1234567"), false);
  assert.equal(isUsableWhatsAppNumber("1234567890123456"), false);
  assert.equal(isUsableWhatsAppNumber("TBD"), false);
  assert.equal(isUsableWhatsAppNumber(undefined), false);
});

// ------------------------------------------------------------ handoff ---

test("handoff mapping from Tool 1 and Tool 2 values", () => {
  assert.equal(mapHandoffDays("2"), "1-2");
  assert.equal(mapHandoffDays("5+"), "5+");
  assert.equal(mapHandoffDays("9"), undefined);
  assert.equal(mapHandoffExperience("new"), "new");
  assert.equal(mapHandoffExperience("returning"), "stopped");
  assert.equal(mapHandoffExperience("on-off"), "stopped");
  for (const v of ["occasional", "regular", "consistent"]) assert.equal(mapHandoffExperience(v), "knows");
  assert.equal(mapHandoffExperience("x"), undefined);
  assert.equal(mapHandoffTime("early-morning"), "morning");
  assert.equal(mapHandoffTime("evening"), "evening");
  assert.equal(mapHandoffTime("varies"), "varies");
  assert.equal(mapHandoffTime(null), undefined);
});

// ------------------------------------------------------ module hygiene ---

test("logic + config modules are gym-agnostic / hex-free and import no runtime @/ modules", () => {
  const logic = readFileSync(new URL("../components/sections/first30DaysLogic.ts", import.meta.url), "utf8");
  assert.equal(/from "@\//.test(logic), false);
  assert.equal(/Gladiator/.test(logic), false);
  assert.equal(/#[0-9a-fA-F]{6}\b/.test(logic), false);
  assert.match(logic, /^import type \{/m);
});

test("config images point at the supplied assets with real alt text", () => {
  const files = ["first-30-days-hero", "first-visit-gym", "weekly-rhythm", "first-month-reflection"];
  const imgs = Object.values(config.images);
  assert.deepEqual(imgs.map((i) => i.src).sort(), files.map((f) => `/assets/first-30-days/${f}.webp`).sort());
  for (const img of imgs) {
    assert.ok(existsSync(new URL(`../public${img.src}`, import.meta.url)), img.src);
    assert.ok(img.alt.split(" ").length >= 6, img.src);
    assert.equal(/gladiator/i.test(img.alt), false, "campaign images make no facility claim");
  }
});
