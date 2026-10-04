// Zero-dependency tests for the /journey (Fitness Journey) logic layer.
// Run: node --test scripts/fitness-journey.test.mjs  (Node >= 22.18 type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  JOURNEY_QUESTIONS,
  JOURNEY_HORIZONS,
  PHASE_IDS,
  SESSION_CATEGORIES,
  buildJourney,
  buildJourneyWhatsAppMessage,
  getCheckpoints,
  getCurrentFocus,
  getFrequencyNote,
  getJourneySupport,
  getNextMilestone,
  getPhaseDetail,
  getPhases,
  getRulerTicks,
  getStartingDays,
  getTotalWeeks,
  getWeek,
} from "../components/sections/fitnessJourneyLogic.ts";
import { services } from "../lib/services.ts";
import { appendWhatsAppMessage, buildWhatsAppHref } from "../lib/whatsapp.ts";

const GOALS = ["fat-loss", "strength", "muscle", "general"];
const STARTS = ["new", "returning", "on-off", "consistent"];
const DAYS = ["2", "3", "4", "5+"];
const HORIZONS = [3, 6, 12];
const AVAILABLE = { 2: 2, 3: 3, 4: 4, "5+": 5 };

/** Outcome / prescription language that must never appear in generated copy. */
const FORBIDDEN = [
  /\bkg\b/i,
  /%/,
  /calori/i,
  /\bbmi\b/i,
  /guarantee/i,
  /\breps?\b/i,
  /\bsets\b/i,
  /lose \d/i,
  /body[- ]?fat/i,
  /supplement/i,
  /\babs\b/i,
  /transform/i,
];

function allStrings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => allStrings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => allStrings(v, out));
  return out;
}

function* combos() {
  for (const goal of GOALS)
    for (const start of STARTS)
      for (const days of DAYS)
        for (const horizon of HORIZONS) yield { goal, start, days, horizon };
}

// ------------------------------------------------------------ questions ---

test("exactly three questions with stable ids and the required wording", () => {
  assert.deepEqual(JOURNEY_QUESTIONS.map((q) => q.id), ["goal", "start", "days"]);
  assert.equal(JOURNEY_QUESTIONS[0].prompt, "WHAT ARE YOU WORKING TOWARD?");
  assert.equal(JOURNEY_QUESTIONS[1].prompt, "WHERE ARE YOU STARTING FROM?");
  assert.match(JOURNEY_QUESTIONS[2].prompt, /ACTUALLY/);
  for (const q of JOURNEY_QUESTIONS) assert.equal(q.options.length, 4);
  const labels = JOURNEY_QUESTIONS.flatMap((q) => q.options.map((o) => o.label));
  assert.ok(labels.includes("GENERAL FITNESS"));
  assert.ok(labels.includes("ON AND OFF"));
  assert.ok(!labels.includes("GET BACK INTO TRAINING"));
  assert.ok(!labels.some((l) => /INCONSISTENT/.test(l)));
});

test("horizons are 3 / 6 / 12 months with 12 / 26 / 52 weeks", () => {
  assert.deepEqual(JOURNEY_HORIZONS.map((h) => h.value), [3, 6, 12]);
  assert.deepEqual(HORIZONS.map(getTotalWeeks), [12, 26, 52]);
});

// ------------------------------------------------------------ frequency ---

test("starting days are capped by starting point and never exceed availability", () => {
  const expected = {
    new: [2, 3, 3, 3],
    returning: [2, 3, 3, 4],
    "on-off": [2, 3, 4, 4],
    consistent: [2, 3, 4, 5],
  };
  for (const start of STARTS) {
    DAYS.forEach((days, i) => {
      const s = getStartingDays(start, days);
      assert.equal(s, expected[start][i], `${start} ${days}`);
      assert.ok(s <= AVAILABLE[days]);
    });
  }
});

test("new to training with 5+ days starts at 3 days and explains why", () => {
  assert.equal(getStartingDays("new", "5+"), 3);
  const note = getFrequencyNote("new", "5+");
  assert.ok(note);
  assert.match(note, /5\+ days available/);
  assert.match(note, /3 training days/);
});

test("no frequency note when the starting rhythm equals availability", () => {
  for (const days of DAYS) assert.equal(getFrequencyNote("consistent", days), null);
  assert.equal(getFrequencyNote("new", "2"), null);
});

// --------------------------------------------------------------- phases ---

test("phases are contiguous, ordered and span the whole horizon", () => {
  for (const start of STARTS) {
    for (const horizon of HORIZONS) {
      const phases = getPhases(start, horizon);
      assert.deepEqual(phases.map((p) => p.id), PHASE_IDS);
      assert.equal(phases[0].startWeek, 1);
      assert.equal(phases[2].endWeek, getTotalWeeks(horizon));
      assert.equal(phases[0].startPos, 0);
      assert.equal(phases[2].endPos, 100);
      for (let i = 0; i < phases.length; i += 1) {
        assert.ok(phases[i].endWeek >= phases[i].startWeek);
        if (i > 0) assert.equal(phases[i].startWeek, phases[i - 1].endWeek + 1);
      }
    }
  }
});

test("foundation length follows the horizon × starting-point table", () => {
  const table = {
    3: [5, 4, 4, 3],
    6: [8, 6, 6, 4],
    12: [12, 10, 10, 6],
  };
  for (const horizon of HORIZONS) {
    STARTS.forEach((start, i) => {
      assert.equal(getPhases(start, horizon)[0].endWeek, table[horizon][i]);
    });
  }
});

test("horizons are meaningfully different, not the same graphic stretched", () => {
  const sig = (h) => ({
    bounds: getPhases("returning", h).map((p) => `${p.startPos}-${p.endPos}`).join("|"),
    ticks: getRulerTicks(h).length,
    spacing: getRulerTicks(h)[1].week - getRulerTicks(h)[0].week,
    majors: getRulerTicks(h).filter((t) => t.major).map((t) => t.label).join(","),
    checkpoints: getCheckpoints("returning", h).length,
  });
  const [a, b, c] = HORIZONS.map(sig);
  assert.notEqual(a.bounds, b.bounds);
  assert.notEqual(b.bounds, c.bounds);
  assert.deepEqual([a.spacing, b.spacing], [1, 2]);
  assert.ok(c.spacing >= 4);
  assert.equal(a.majors, "M1,M2,M3");
  assert.equal(b.majors, "M1,M2,M3,M4,M5,M6");
  assert.equal(c.majors, "Q1,Q2,Q3,Q4");
  assert.deepEqual([a.checkpoints, b.checkpoints, c.checkpoints], [3, 4, 5]);
});

test("ticks and checkpoints sit on the rule (0–100) in order", () => {
  for (const horizon of HORIZONS) {
    const ticks = getRulerTicks(horizon);
    assert.equal(ticks[0].pos, 0);
    assert.equal(ticks[ticks.length - 1].pos, 100);
    for (let i = 1; i < ticks.length; i += 1) assert.ok(ticks[i].week > ticks[i - 1].week);
    for (const start of STARTS) {
      const cps = getCheckpoints(start, horizon);
      assert.equal(cps.filter((c) => c.kind === "milestone").length, 1);
      for (const c of cps) assert.ok(c.pos > 0 && c.pos <= 100);
      for (let i = 1; i < cps.length; i += 1) assert.ok(cps[i].week > cps[i - 1].week);
    }
  }
  assert.ok(getCheckpoints("new", 12).some((c) => c.kind === "reassess"));
});

test("next milestone is behavioural and lands on the end of Foundation", () => {
  for (const start of STARTS) {
    for (const horizon of HORIZONS) {
      const m = getNextMilestone(start, horizon);
      assert.equal(m.week, getPhases(start, horizon)[0].endWeek);
      const milestoneCp = getCheckpoints(start, horizon).find((c) => c.kind === "milestone");
      assert.equal(milestoneCp.week, m.week);
      assert.match(m.text, /^COMPLETE /);
    }
  }
});

test("current focus differs by starting point and by goal", () => {
  const headlines = new Set(STARTS.map((s) => getCurrentFocus("general", s).headline));
  assert.equal(headlines.size, 4);
  const lines = new Set(GOALS.map((g) => getCurrentFocus(g, "new").line));
  assert.equal(lines.size, 4);
  assert.equal(getCurrentFocus("muscle", "returning").headline, "REBUILD THE ROUTINE.");
});

test("phase detail stays concise", () => {
  for (const goal of GOALS)
    for (const start of STARTS)
      for (const horizon of HORIZONS)
        for (const id of PHASE_IDS) {
          const d = getPhaseDetail(id, goal, horizon, start);
          assert.ok(d.focusPoints.length >= 2 && d.focusPoints.length <= 3);
          for (const s of [d.checkpoint, d.goalEmphasis, d.horizonNote, ...d.focusPoints]) {
            assert.ok(s.length > 0 && s.length <= 80, `too long: ${s}`);
          }
        }
});

// ----------------------------------------------------------------- week ---

test("example week: 7 cells, exact session count, category labels only", () => {
  for (const goal of GOALS)
    for (const start of STARTS)
      for (const days of DAYS) {
        const week = getWeek(goal, start, days);
        const sessions = getStartingDays(start, days);
        assert.equal(week.length, 7);
        const train = week.filter((d) => d.kind === "train");
        assert.equal(train.length, sessions);
        assert.deepEqual(train.map((d) => d.index), train.map((_, i) => i + 1));
        for (const d of train) assert.ok(SESSION_CATEGORIES.includes(d.label), d.label);
        const optional = week.filter((d) => d.kind === "optional").length;
        assert.equal(optional, sessions < AVAILABLE[days] ? 1 : 0, `${goal} ${start} ${days}`);
      }
});

test("2 / 3 / 4 / 5 day rhythms are visibly different", () => {
  const patterns = DAYS.map((days) =>
    getWeek("muscle", "consistent", days)
      .map((d) => (d.kind === "train" ? "T" : "-"))
      .join("")
  );
  assert.equal(new Set(patterns).size, 4);
  assert.equal(patterns[1], "T-T-T--");
});

// -------------------------------------------------------------- support ---

test("support uses only verified services and maps by goal", () => {
  const support = getJourneySupport("fat-loss", services);
  assert.ok(support.length >= 1 && support.length <= 3);
  const verifiedIds = services.filter((s) => s.verified).map((s) => s.id);
  for (const s of support) assert.ok(verifiedIds.includes(s.id));
});

test("unverified services never appear; unknown ids fall back safely", () => {
  const synthetic = [
    { id: "weight-loss", name: "Hidden", description: "x", verified: false },
    { id: "alpha", name: "Alpha", description: "a", verified: true },
    { id: "beta", name: "Beta", description: "b", verified: true },
    { id: "gamma", name: "Gamma", description: "c", verified: true },
    { id: "delta", name: "Delta", description: "d", verified: true },
  ];
  const support = getJourneySupport("fat-loss", synthetic);
  assert.deepEqual(support.map((s) => s.id), ["alpha", "beta", "gamma"]);
  assert.deepEqual(getJourneySupport("general", []), []);
});

// ------------------------------------------------------------- WhatsApp ---

test("WhatsApp message carries exactly the journey context", () => {
  const answers = { goal: "muscle", start: "returning", days: "3" };
  const msg = buildJourneyWhatsAppMessage("Test Gym", answers, 6, getCurrentFocus("muscle", "returning"));
  assert.match(msg, /^Hi Test Gym,/);
  assert.match(msg, /I used your Fitness Journey tool\./);
  assert.match(msg, /Goal: Build muscle/);
  assert.match(msg, /Starting point: Back after a break/);
  assert.match(msg, /Training days: 3 days\/week/);
  assert.match(msg, /Journey horizon: 6 months/);
  assert.match(msg, /My current focus: Rebuild the routine\./);
  assert.doesNotMatch(msg, /undefined|null|preference|trainer guidance/i);
});

test("WhatsApp message is encoded with %20 and round-trips", () => {
  const plan = buildJourney({ goal: "strength", start: "new", days: "5+" }, 12, services);
  const msg = buildJourneyWhatsAppMessage("Test Gym", plan.answers, plan.horizon, plan.focus);
  const href = appendWhatsAppMessage(buildWhatsAppHref({ number: "+91 99", message: "x" }), msg);
  assert.match(href, /^https:\/\/wa\.me\/9199\?text=/);
  assert.ok(href.includes("%20"));
  assert.ok(!href.includes("+"));
  assert.equal(new URL(href).searchParams.get("text"), msg);
});

// ---------------------------------------------------------- full sweep ---

test("every one of the 192 combinations returns a complete, safe plan", () => {
  let count = 0;
  for (const { goal, start, days, horizon } of combos()) {
    const plan = buildJourney({ goal, start, days }, horizon, services);
    count += 1;
    assert.equal(plan.horizon, horizon);
    assert.equal(plan.summary.length, 3);
    assert.equal(plan.phases.length, 3);
    assert.equal(plan.week.length, 7);
    assert.ok(plan.focus.headline && plan.focus.line);
    assert.ok(plan.milestone.text);
    assert.ok(plan.ticks.length > 5);
    assert.ok(plan.support.length > 0);
    for (const id of PHASE_IDS) assert.ok(plan.phaseDetails[id]);
    const msg = buildJourneyWhatsAppMessage("Gym", plan.answers, plan.horizon, plan.focus);
    for (const s of [...allStrings(plan), msg]) {
      assert.doesNotMatch(s, /undefined|NaN/);
      for (const re of FORBIDDEN) assert.doesNotMatch(s, re, `"${s}" matched ${re}`);
    }
  }
  assert.equal(count, 192);
});

test("invalid inputs fall back to a safe deterministic plan", () => {
  const plan = buildJourney({ goal: "nope", days: "9" }, 99, services);
  assert.deepEqual(plan.answers, { goal: "general", start: "new", days: "3" });
  assert.equal(plan.horizon, 3);
  assert.equal(plan.week.filter((d) => d.kind === "train").length, 3);
});


// ---------------------------------------------------------- page media ---

test("journey image config points at a real asset with factual alt text", async () => {
  const { existsSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { journeyConfiguration } = await import("../lib/journey.ts");
  const { src, alt } = journeyConfiguration.image;
  assert.match(src, /^\/assets\//);
  const file = fileURLToPath(new URL(`../public${src}`, import.meta.url));
  assert.ok(existsSync(file), `missing asset ${file}`);
  assert.ok(alt.trim().length >= 20, "alt text must be descriptive");
  assert.doesNotMatch(alt, /\bAI\b|generated/i);
});
