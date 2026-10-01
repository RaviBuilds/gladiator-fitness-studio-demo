// Zero-dependency tests for Section 05 (Training Intelligence / Training Loadout).
// Run: node --test scripts/training-intelligence.test.mjs  (Node >= 22.18 type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import {
  trainingGoals,
  trainingIntelligenceConfiguration as config,
} from "../lib/training-intelligence.ts";
import { services } from "../lib/services.ts";
import { sections } from "../lib/sections.ts";
import {
  EMPHASIS_SLOTS,
  EMPHASIS_WORD,
  buildGoalViews,
  enabledGoals,
  goalCtaHref,
  goalCtaMessage,
  pad,
  railPosition,
  resolveEmphasis,
  resolveGoalProgram,
} from "../components/sections/trainingLoadout.ts";

const SECTION_SRC = readFileSync(
  new URL("../components/sections/TrainingIntelligence.tsx", import.meta.url),
  "utf8"
);
const LOADOUT_SRC = readFileSync(
  new URL("../components/motion/TrainingLoadout.tsx", import.meta.url),
  "utf8"
);
const CSS_SRC = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const PAGE_SRC = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

/**
 * Comment-free views of the sources.
 *
 * Several assertions below are about what the code DOES, and both components
 * document at length what they deliberately do NOT do ("no sticky panel", "not
 * Section 04's ledger", "raw var(--accent)"). Matching those prose mentions
 * would make the tests fail on their own documentation, so structural checks
 * run against the code with comments removed.
 */
const stripJs = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const stripCss = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "");

const SECTION_CODE = stripJs(SECTION_SRC);
const LOADOUT_CODE = stripJs(LOADOUT_SRC);
const CSS_CODE = stripCss(CSS_SRC);

/**
 * Section 05's stylesheet block, BOUNDED AT BOTH ENDS.
 *
 * FREEZE LOCK. Every assertion about Section 05's CSS runs against this slice,
 * never against the whole file and never against an open-ended slice to EOF.
 * An unbounded slice silently absorbs every block appended after Pass 9, so the
 * first commit of Section 06 would turn this suite red — the namespace test
 * would see `.s06-*` selectors, the accent-usage count would pick up Section
 * 06's declarations, and the ink-tint audit would police another chapter's
 * palette. That exact failure mode had to be repaired in
 * scripts/transformations.test.mjs, whose Section 04 slice ran to EOF and was
 * broken by Section 05 being written. Bounding it here is what makes this
 * suite survive the next chapter.
 */
const S5_MARKER = CSS_SRC.indexOf("Pass 9 \u2014 Section 05");
// Anchor on the comment DELIMITERS, not on the marker text: a slice that starts
// mid-comment cannot be comment-stripped cleanly, and the header's own prose
// (which discusses "var(--accent)" and the frozen sections by name) would then
// leak into every structural assertion below.
const S5_START = CSS_SRC.lastIndexOf("/*", S5_MARKER);
const S5_NEXT_MARKER = CSS_SRC.indexOf("\n * Pass ", S5_MARKER + 1);
const S5_END =
  S5_NEXT_MARKER === -1 ? CSS_SRC.length : CSS_SRC.lastIndexOf("/*", S5_NEXT_MARKER);
const S5_SRC = CSS_SRC.slice(S5_START, S5_END);
const S5_CSS = stripCss(S5_SRC);

assert.ok(S5_MARKER > 0 && S5_START > 0, "the Section 05 CSS block was located");
assert.ok(S5_SRC.length > 8000, "the Section 05 CSS block looks complete");
assert.ok(S5_SRC.startsWith("/*"), "the slice starts at a comment boundary");
assert.ok(CSS_CODE.includes(S5_CSS), "the bounded block is a verbatim slice of the file");

const VIEWS = buildGoalViews({
  goals: trainingGoals,
  levers: config.levers,
  services,
  ctaBaseHref: "https://wa.me/15555550100?text=Hi%2C%20I%27d%20like%20to%20know%20more.",
  ctaMessageTemplate: config.ctaMessageTemplate,
});

// ===========================================================================
// 1. FACTUAL INTEGRITY — the acceptance bar for an educational section.
// ===========================================================================

/** Every visitor-facing string in the educational library, flattened. */
function allCopy() {
  const out = [config.deck, config.disclaimer];
  for (const goal of trainingGoals) {
    out.push(goal.label, goal.premise, goal.path, goal.coachNote);
    if (goal.gymNote) out.push(goal.gymNote);
    for (const p of goal.priorities) out.push(p.title, p.detail);
    for (const m of goal.mistakes) out.push(m.mistake, m.instead);
    out.push(...goal.track);
  }
  return out;
}

test("no fabricated measurement appears anywhere in the educational library", () => {
  // A percentage, a calorie/macro/gram figure, a rep-max claim, a duration
  // promise or a body-fat target would all be invented data — this section has
  // no source for any of them.
  const banned = [
    /\d\s*%/,
    /\bpercent\b/i,
    /\bcalorie/i,
    /\bkcal\b/i,
    /\bmacro/i,
    /\bgrams?\b/i,
    /\bg\s+of\s+protein\b/i,
    /\bbody\s*fat\b/i,
    /\bbmi\b/i,
    /\bbpm\b/i,
    /\bheart[- ]rate\s+zone/i,
    /\bguarantee/i,
    /\bin\s+\d+\s+(days?|weeks?|months?)\b/i,
    /\b\d+\s*(kg|lbs?|kilos?)\b/i,
    /\b\d+\s*(hours?|litres?|liters?)\b/i,
  ];

  for (const line of allCopy()) {
    for (const pattern of banned) {
      assert.equal(
        pattern.test(line),
        false,
        `"${line}" must not contain ${pattern}`
      );
    }
  }
});

test("the library contains no bare digits at all, so no figure can hide in it", () => {
  for (const line of allCopy()) {
    assert.equal(/\d/.test(line), false, `"${line}" contains a numeral`);
  }
});

test("the scope line states the educational limit and is not medical advice", () => {
  const scope = config.disclaimer.toLowerCase();
  assert.ok(scope.includes("not medical"), "explicitly not medical advice");
  assert.ok(scope.includes("coach"), "directs the visitor to a coach");
  assert.ok(config.disclaimer.trim().length >= 60);
  // Rendered, never optional.
  assert.match(SECTION_SRC, /\{disclaimer\}/);
});

test("emphasis is ordinal teaching weight, never presented as a measurement", () => {
  assert.equal(EMPHASIS_SLOTS, 3);
  assert.deepEqual(Object.keys(EMPHASIS_WORD).sort(), ["1", "2", "3"]);
  for (const word of Object.values(EMPHASIS_WORD)) {
    assert.equal(/\d|%/.test(word), false, `"${word}" is qualitative`);
  }
  // The caveat is visible copy in the instrument, not a tooltip or a title
  // attribute, and the word is always rendered beside the markers.
  assert.match(LOADOUT_SRC, /Relative emphasis, not a measurement/);
  assert.match(LOADOUT_SRC, /\{row\.word\}/);
});

// ===========================================================================
// 2. DATA CONTRACT + FACTORY REUSABILITY
// ===========================================================================

test("every goal is complete and internally consistent", () => {
  assert.ok(trainingGoals.length >= 3, "the taxonomy is a real set of goals");
  const ids = new Set();

  for (const goal of trainingGoals) {
    assert.equal(ids.has(goal.id), false, `${goal.id} is unique`);
    ids.add(goal.id);
    assert.match(goal.id, /^[a-z0-9-]+$/, "ids are slugs");
    assert.ok(goal.label.trim().length > 0);
    assert.ok(goal.premise.trim().length >= 40, `${goal.id} premise is substantial`);
    assert.ok(goal.path.trim().length > 0);
    assert.ok(goal.coachNote.trim().length >= 40);
    assert.equal(typeof goal.enabled, "boolean");

    assert.ok(goal.priorities.length >= 3, `${goal.id} teaches at least 3 priorities`);
    for (const p of goal.priorities) {
      assert.ok(p.title.trim().length > 0);
      assert.ok(p.detail.trim().length >= 40, `"${p.title}" explains itself`);
    }

    assert.ok(goal.mistakes.length >= 2, `${goal.id} lists at least 2 corrections`);
    for (const m of goal.mistakes) {
      assert.ok(m.mistake.trim().length > 0);
      // A mistake is never shown without the better approach beside it.
      assert.ok(m.instead.trim().length >= 20, `"${m.mistake}" has a correction`);
    }

    assert.ok(goal.track.length >= 3, `${goal.id} names at least 3 signals`);
    for (const signal of goal.track) assert.ok(signal.trim().length > 0);
  }
});

test("the lever taxonomy is the constant spine of the comparison", () => {
  assert.ok(config.levers.length >= 3);
  const ids = new Set(config.levers.map((l) => l.id));
  assert.equal(ids.size, config.levers.length, "lever ids are unique");

  // Every enabled goal must weight EVERY lever, otherwise the stack would
  // silently shorten and the goals would stop being comparable.
  for (const goal of enabledGoals(trainingGoals)) {
    for (const lever of config.levers) {
      const level = goal.emphasis[lever.id];
      assert.ok(
        level === 1 || level === 2 || level === 3,
        `${goal.id} must weight "${lever.id}" as 1, 2 or 3 (got ${level})`
      );
    }
    // And must not weight a lever that does not exist.
    for (const key of Object.keys(goal.emphasis)) {
      assert.ok(ids.has(key), `${goal.id} references unknown lever "${key}"`);
    }
  }
});

test("goals are genuinely differentiated, not five copies of one profile", () => {
  const profiles = enabledGoals(trainingGoals).map((goal) =>
    config.levers.map((l) => goal.emphasis[l.id]).join("")
  );
  assert.equal(
    new Set(profiles).size,
    profiles.length,
    "no two goals share an identical emphasis profile"
  );
  // At least one lever must actually move across the taxonomy, or the display
  // would teach nothing.
  for (const lever of config.levers) {
    const levels = new Set(
      enabledGoals(trainingGoals).map((g) => g.emphasis[lever.id])
    );
    assert.ok(levels.size >= 2, `"${lever.id}" varies between goals`);
  }
});

test("a lever a goal does not weight is omitted, never defaulted or dashed", () => {
  const partial = {
    ...trainingGoals[0],
    emphasis: { [config.levers[0].id]: 2 },
  };
  const rows = resolveEmphasis(partial, config.levers);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, config.levers[0].id);
  assert.equal(rows[0].word, EMPHASIS_WORD[2]);

  // Out-of-range / malformed values are dropped rather than coerced.
  const bogus = { ...trainingGoals[0], emphasis: { [config.levers[0].id]: 9 } };
  assert.deepEqual(resolveEmphasis(bogus, config.levers), []);

  // No placeholder glyph exists in the component at all.
  assert.equal(/["'>]\s*(—|–|-{1,2}|n\/a)\s*[<"']/i.test(LOADOUT_SRC), false);
});

test("rows carry a short label so the stack survives a narrow viewport", () => {
  for (const row of resolveEmphasis(trainingGoals[0], config.levers)) {
    assert.ok(row.shortLabel.trim().length > 0);
    assert.ok(row.shortLabel.length <= row.label.length);
  }
  // Exactly one of the two variants is ever displayed (display:none also
  // removes it from the accessibility tree, so nothing is announced twice).
  assert.match(CSS_SRC, /\.s05-emphasis-long \{\s*display: none;/);
  assert.match(CSS_SRC, /\.s05-emphasis-short \{\s*display: none;/);
});

test("only enabled goals reach the instrument, and none means no section", () => {
  assert.deepEqual(
    enabledGoals([
      { ...trainingGoals[0], enabled: false },
      { ...trainingGoals[1], enabled: true },
    ]).map((g) => g.id),
    [trainingGoals[1].id]
  );

  const none = buildGoalViews({
    goals: trainingGoals.map((g) => ({ ...g, enabled: false })),
    levers: config.levers,
    services,
    ctaBaseHref: "https://wa.me/1?text=x",
    ctaMessageTemplate: config.ctaMessageTemplate,
  });
  assert.equal(none.length, 0);
  // ...and the server component bails out rather than rendering an empty
  // "Training Intelligence" heading over a dead instrument.
  assert.match(SECTION_SRC, /if \(goalViews\.length === 0\) return null;/);
});

test("the rail geometry is correct for any number of goals, with no redesign", () => {
  for (const total of [3, 4, 5, 6, 8]) {
    const centres = Array.from({ length: total }, (_, i) =>
      Number.parseFloat(railPosition(i, total))
    );
    assert.equal(new Set(centres).size, total, "every position is distinct");
    for (const c of centres) assert.ok(c > 0 && c < 100, `${c}% is on the rail`);
    for (let i = 1; i < centres.length; i += 1) {
      assert.ok(centres[i] > centres[i - 1], "positions ascend left to right");
    }
    // Evenly pitched: the gap between centres equals one position width.
    // railPosition rounds to 4 decimals, so compare at that resolution.
    const pitch = 100 / total;
    assert.ok(Math.abs(centres[0] - pitch / 2) < 1e-3, "first centre is half a pitch in");
    assert.ok(
      Math.abs(centres[total - 1] - (100 - pitch / 2)) < 1e-3,
      "last centre is half a pitch from the end"
    );
    for (let i = 1; i < centres.length; i += 1) {
      assert.ok(
        Math.abs(centres[i] - centres[i - 1] - pitch) < 1e-3,
        "the pitch is uniform across the rail"
      );
    }
  }
  // Out-of-range indices clamp instead of leaving the rail.
  assert.equal(railPosition(-3, 5), railPosition(0, 5));
  assert.equal(railPosition(99, 5), railPosition(4, 5));
  assert.equal(railPosition(0, 0), "50%");
});

test("the pin travels by whole position widths, derived from the data", () => {
  // --s05-count / --s05-index / --s05-pin are the only geometry inputs; there
  // is no measured layout, no ResizeObserver and no getBoundingClientRect.
  assert.match(LOADOUT_SRC, /"--s05-count": total/);
  assert.match(LOADOUT_SRC, /"--s05-index": active/);
  assert.match(LOADOUT_SRC, /"--s05-pin": railPosition\(active, total\)/);
  assert.equal(/getBoundingClientRect|ResizeObserver|offsetWidth/.test(LOADOUT_SRC), false);

  assert.match(CSS_SRC, /width: calc\(100% \/ var\(--s05-count\)\);/);
  assert.match(CSS_SRC, /transform: translateX\(calc\(var\(--s05-index\) \* 100%\)\);/);
  assert.match(
    CSS_SRC,
    /grid-template-columns: repeat\(var\(--s05-count\), minmax\(0, 1fr\)\);/
  );
  // The calibration band is pitched from the same count.
  assert.match(CSS_SRC, /calc\(100% \/ var\(--s05-count\)\) 100%/);
});

test("pad produces two-digit position numerals", () => {
  assert.equal(pad(1), "01");
  assert.equal(pad(10), "10");
  assert.equal(pad(0), "00");
});

// ===========================================================================
// 3. SOURCE-FIRST CROSS-SECTION HANDOFF + CTA
// ===========================================================================

test("a goal can only link to a genuinely verified Section 02 program", () => {
  for (const goal of trainingGoals) {
    if (!goal.programId) continue;
    const match = services.find((s) => s.id === goal.programId);
    assert.ok(match, `${goal.id} maps to a real service id ("${goal.programId}")`);
  }

  // Unverified or missing programs resolve to null, and the secondary CTA is
  // then not rendered at all — Section 05 can never advertise a program the
  // gym does not run.
  const unverified = services.map((s) => ({ ...s, verified: false }));
  assert.equal(resolveGoalProgram(trainingGoals[0], unverified), null);
  assert.equal(resolveGoalProgram({ ...trainingGoals[0], programId: "nope" }, services), null);
  assert.equal(resolveGoalProgram({ ...trainingGoals[0], programId: undefined }, services), null);

  const views = buildGoalViews({
    goals: trainingGoals,
    levers: config.levers,
    services: unverified,
    ctaBaseHref: "https://wa.me/1?text=x",
    ctaMessageTemplate: config.ctaMessageTemplate,
  });
  for (const view of views) assert.equal(view.programName, null);
  assert.match(LOADOUT_SRC, /\{goal\.programName && \(/);
});

test("verification is resolved on the server, not in the client island", () => {
  // The island receives resolved views only: no services array, no verified
  // filtering, no business data.
  assert.equal(/lib\/services/.test(LOADOUT_CODE), false);
  assert.equal(/\.verified\b|verified:/.test(LOADOUT_CODE), false);
  assert.equal(/lib\/business/.test(LOADOUT_CODE), false);
  assert.match(SECTION_SRC, /from "@\/lib\/services"/);
  assert.match(SECTION_SRC, /buildGoalViews\(\{/);
});

test("the CTA inherits the selected goal and never carries a gym's number", () => {
  const base = "https://wa.me/15555550100?text=Hi%2C%20I%27d%20like%20to%20know%20more.";
  const href = goalCtaHref(base, config.ctaMessageTemplate, "Fat loss");
  const url = new URL(href);
  assert.equal(url.host, "wa.me");
  assert.equal(url.pathname, "/15555550100", "the site-wide number is preserved");
  assert.equal(
    url.searchParams.get("text"),
    "Hi, I'd like to discuss my fat loss training goal."
  );

  // Every view gets its own contextual message.
  const texts = VIEWS.map((v) => new URL(v.ctaHref).searchParams.get("text"));
  assert.equal(new Set(texts).size, VIEWS.length);
  for (const view of VIEWS) {
    assert.ok(
      new URL(view.ctaHref).searchParams.get("text").includes(view.label.toLowerCase())
    );
  }

  // Template substitution is total, and the label is lower-cased so the
  // message reads as a sentence rather than a shouted field value.
  assert.equal(goalCtaMessage("a {goal} b {goal}", "X"), "a x b x");
  assert.equal(config.ctaMessageTemplate.includes("{goal}"), true);

  // Spaces are percent-encoded, matching the site-wide href built with
  // encodeURIComponent in app/page.tsx — never "+" form encoding.
  assert.ok(href.includes("%20"), "spaces are %20 encoded");
  assert.equal(href.includes("+"), false, "no + form encoding");
  assert.match(PAGE_SRC, /encodeURIComponent\(business\.whatsapp\.message\)/);

  // No phone number, wa.me host or message text is hardcoded in Section 05.
  for (const src of [SECTION_CODE, LOADOUT_CODE]) {
    assert.equal(/wa\.me|\+?\d{7,}/.test(src), false);
  }
  // The base href comes from the existing site-wide action in app/page.tsx.
  assert.match(PAGE_SRC, /<TrainingIntelligence whatsappHref=\{whatsappHref\} \/>/);
});

test("a CTA href with no text parameter is returned untouched, not broken", () => {
  assert.equal(goalCtaHref("tel:+15555550100", config.ctaMessageTemplate, "Strength"), "tel:+15555550100");
  assert.equal(goalCtaHref("/contact", config.ctaMessageTemplate, "Strength"), "/contact");
  assert.equal(goalCtaHref("", config.ctaMessageTemplate, "Strength"), "");
  assert.equal(
    goalCtaHref("https://example.com/enquire", config.ctaMessageTemplate, "Strength"),
    "https://example.com/enquire"
  );
});

// ===========================================================================
// 4. ACCESSIBILITY
// ===========================================================================

test("the section has exactly one heading of its own, wired to the region", () => {
  assert.equal((SECTION_SRC.match(/<h2/g) ?? []).length, 1);
  assert.match(SECTION_SRC, /id="training-intelligence-heading"/);
  assert.match(SECTION_SRC, /aria-labelledby="training-intelligence-heading"/);
  assert.equal((LOADOUT_SRC.match(/<h2/g) ?? []).length, 0);
  // The only sub-headings are the three real teaching columns.
  assert.equal((LOADOUT_SRC.match(/<h3/g) ?? []).length, 3);
  assert.equal((LOADOUT_SRC.match(/<h4/g) ?? []).length, 0);
  // Micro labels are labels, not headings.
  assert.equal(/<h[3-6][^>]*className="s05-label"/.test(LOADOUT_SRC), false);
});

test("the goal selector is a real keyboard-operable control set", () => {
  assert.match(LOADOUT_SRC, /role="tablist"/);
  assert.match(LOADOUT_SRC, /aria-label=\{selectorLabel\}/);
  assert.match(LOADOUT_SRC, /role="tab"/);
  assert.match(LOADOUT_SRC, /aria-selected=\{isActive\}/);
  assert.match(LOADOUT_SRC, /aria-controls="s05-readout"/);
  assert.match(LOADOUT_SRC, /role="tabpanel"/);
  assert.match(LOADOUT_SRC, /aria-labelledby=\{`s05-goal-\$\{goal\.id\}`\}/);
  // Real buttons with an explicit type, never a clickable div.
  assert.match(LOADOUT_SRC, /type="button"/);
  assert.equal(/onClick=\{[^}]*\}\s*\n?\s*className="s05-(?!goal)/.test(LOADOUT_SRC), false);

  // Roving tabindex keeps the group one tab stop.
  assert.match(LOADOUT_SRC, /tabIndex=\{isActive \? 0 : -1\}/);

  // Arrow/Home/End all move AND select, and focus follows selection, so
  // keyboard and pointer reach identical state.
  for (const key of ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"]) {
    assert.ok(LOADOUT_SRC.includes(`case "${key}"`), `${key} is handled`);
  }
  assert.match(LOADOUT_SRC, /tabRefs\.current\[index\]\?\.focus\(\)/);
  assert.match(LOADOUT_SRC, /event\.preventDefault\(\)/);

  // Visible focus is the shared primitive, not removed.
  assert.match(LOADOUT_SRC, /className="s05-goal factory-focus"/);
  assert.match(CSS_SRC, /\.factory-focus:focus-visible \{/);
});

test("selected state is never carried by colour alone", () => {
  // Programmatic state.
  assert.match(LOADOUT_SRC, /aria-selected=\{isActive\}/);
  // Plus four non-colour visual signals: the pin's position, a heavier stem,
  // a heavier label and an underline (inverted fill on the mobile chip).
  assert.match(CSS_SRC, /\.s05-goal\[data-active\] \.s05-goal-stem \{[^}]*width: 2px;/);
  assert.match(CSS_SRC, /\.s05-goal\[data-active\] \.s05-goal-label \{[^}]*font-weight: 600;/);
  assert.match(CSS_SRC, /\.s05-goal\[data-active\]::after \{\s*transform: scaleX\(1\);/);
  assert.match(CSS_SRC, /\.s05-goal\[data-active\] \{\s*background: var\(--s05-ink\);/);

  // Emphasis level: fill-vs-outline (a shape difference) AND a word.
  assert.match(CSS_SRC, /\.s05-plate \{[^}]*background: transparent;/);
  assert.match(CSS_SRC, /\.s05-plate\[data-loaded\] \{[^}]*background: var\(--s05-accent-ink\);/);
});

test("decorative geometry is hidden and no educational content is hover-gated", () => {
  for (const cls of ["s05-field", "s05-grain"]) {
    const pattern = new RegExp(`className="${cls}" aria-hidden="true"`);
    assert.match(SECTION_SRC, pattern, `${cls} is aria-hidden`);
  }
  for (const cls of [
    "s05-rail-ticks",
    "s05-rail",
    "s05-rail-pin",
    "s05-goal-stem",
    "s05-goal-index",
    "s05-plates",
  ]) {
    const pattern = new RegExp(`className="${cls}"[^>]*aria-hidden="true"`);
    assert.match(LOADOUT_SRC, pattern, `${cls} is aria-hidden`);
  }
  // Nothing is revealed by hover, and no essential text is in a title/tooltip.
  assert.equal(/onMouseEnter|onMouseOver|title=/.test(LOADOUT_SRC), false);
  // No hover-only display rule inside the section's own namespace.
  assert.equal(/:hover[^{]*\{[^}]*\bdisplay:\s*(?!none)/.test(S5_SRC), false);
  assert.equal(/\.s05-[\w-]*:hover[^{]*\{[^}]*opacity:\s*1/.test(S5_SRC), false);
});

test("reduced motion shows the assembled instrument with nothing withheld", () => {
  // Section 05's reduced-motion block, found INSIDE Section 05's bounded CSS.
  // Taking the file's last such block would silently switch to another
  // chapter's the moment one is appended (verified: a simulated Pass 10 broke
  // exactly this assertion before it was bounded).
  const blocks = S5_CSS.split("@media (prefers-reduced-motion: reduce)");
  assert.equal(blocks.length, 2, "Section 05 declares exactly one reduced-motion block");
  const s05 = blocks[1];
  assert.ok(s05.includes(".s05-rail-pin"), "Section 05 has its own reduced-motion block");
  for (const expected of [
    ".s05-rail-ticks",
    ".s05-artifact-frame",
    ".s05-rail-pin",
    ".s05-plate",
    ".s05-swap",
    ".s05-emphasis-row.factory-stagger-child",
  ]) {
    assert.ok(s05.includes(expected), `${expected} settles under reduced motion`);
  }
  // Staggered rows must not be left at opacity: 0.
  assert.match(s05, /\.s05-emphasis-row\.factory-stagger-child \{\s*opacity: 1;/);
});

// ===========================================================================
// 5. PERFORMANCE + THE IMAGE RULE
// ===========================================================================

test("the chapter is a Server Component with one small client island", () => {
  assert.equal(SECTION_SRC.startsWith('"use client"'), false);
  assert.equal(SECTION_SRC.includes('"use client"'), false);
  assert.ok(LOADOUT_SRC.startsWith('"use client"'));
  // Exactly one island imported by the section.
  const clientImports = SECTION_SRC.match(/@\/components\/motion\/\w+/g) ?? [];
  assert.deepEqual([...new Set(clientImports)].sort(), [
    "@/components/motion/Reveal",
    "@/components/motion/TrainingLoadout",
  ]);
  // State is one index. No effects, no observers, no timers in the island.
  assert.match(LOADOUT_SRC, /useState\(0\)/);
  assert.equal(/useEffect|useLayoutEffect|setInterval|setTimeout|requestAnimationFrame/.test(LOADOUT_SRC), false);
});

test("no animation, carousel or UI library was introduced", () => {
  const pkg = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8")
  );
  assert.deepEqual(Object.keys(pkg.dependencies).sort(), ["next", "react", "react-dom"]);
  for (const src of [SECTION_SRC, LOADOUT_SRC]) {
    assert.equal(/gsap|framer-motion|swiper|aos|lenis|chart\.js|recharts/i.test(src), false);
  }
});

test("the artifact exists, is described, and is rendered on the server", () => {
  assert.ok(config.artifact, "the master template supplies an artifact");
  const { src, alt, caption } = config.artifact;
  assert.equal(
    src,
    "/assets/education/training-intelligence-weight-plate-loading-editorial.webp"
  );
  assert.ok(
    existsSync(new URL(`../public${src}`, import.meta.url)),
    "the artifact file is actually present in the repository"
  );
  assert.ok(alt.trim().length >= 40, "alt describes the photograph");
  assert.ok(caption.trim().length > 0);

  // Rendered by the Server Component and passed into the island as a node, so
  // next/image stays out of the client boundary.
  assert.match(SECTION_SRC, /import Image from "next\/image"/);
  assert.equal(LOADOUT_SRC.includes("next/image"), false);
  assert.equal(LOADOUT_SRC.includes("<Image"), false);
  assert.match(LOADOUT_SRC, /artifact\?: ReactNode/);
  assert.match(SECTION_SRC, /artifact=\{/);

  // Below the fold: lazy, never priority/preloaded, with a real sizes value.
  assert.match(SECTION_SRC, /loading="lazy"/);
  assert.equal(/priority/.test(SECTION_SRC), false);
  assert.match(SECTION_SRC, /sizes="\(min-width: 1280px\) 15rem,/);
});

test("the artifact is structurally incapable of dominating the section", () => {
  // Fixed clamped WIDTH capped at 15rem; height derived from a 4/5 frame. No
  // viewport-height unit, no percentage of the section, no full-bleed path.
  assert.match(CSS_SRC, /\.s05-artifact \{\s*width: clamp\(7\.5rem, 34vw, 15rem\);/);
  assert.match(CSS_SRC, /\.s05-artifact-frame \{[^}]*aspect-ratio: 4 \/ 5;/);
  const artifactRules = CSS_CODE.match(/\.s05-artifact[^{]*\{[^}]*\}/g) ?? [];
  assert.ok(artifactRules.length >= 3);
  for (const rule of artifactRules) {
    // No viewport-height unit, no 100vw, and no explicit `height` declaration
    // at all (`line-height` is not a box dimension) — the frame's height can
    // only ever come from its aspect-ratio.
    assert.equal(/\d+vh\b/.test(rule), false, rule);
    assert.equal(/100vw/.test(rule), false, rule);
    assert.equal(/(?<![\w-])height:/.test(rule), false, rule);
  }
  // Exactly one image in the whole chapter — this is not a gallery.
  assert.equal((SECTION_SRC.match(/<Image/g) ?? []).length, 1);
});

test("the chapter survives the artifact being deleted — the standing factory rule", () => {
  // The contract makes it optional, the component guards it, and the CSS keeps
  // the instrument's own gym geometry independent of any image.
  assert.match(SECTION_SRC, /artifact && \(/);
  assert.match(LOADOUT_SRC, /\{artifact\}/);

  const noArtifact = { ...config, artifact: undefined };
  assert.equal(noArtifact.artifact, undefined);

  // Gym DNA that does not depend on a photograph: plate ring, rack elevation,
  // calibration ticks, the rail, the pin and the plate markers with hubs.
  for (const selector of [
    ".s05-field::before",
    ".s05-field::after",
    ".s05-rail-ticks",
    ".s05-rail",
    ".s05-rail-pin",
    ".s05-plate",
  ]) {
    assert.ok(CSS_SRC.includes(selector), `${selector} draws gym geometry in CSS`);
  }
  assert.match(CSS_SRC, /\.s05-plate::after \{[^}]*border-radius: 50%;/);
});

// ===========================================================================
// 6. DISTINCTNESS + NON-REGRESSION
// ===========================================================================

test("Section 05 owns its own namespace and touches no frozen selector", () => {
  // Every rule in the BOUNDED block is an .s05-* rule (optionally scoped by the
  // shared .reveal-visible state hook), a keyframe or a media query — nothing
  // reaches back into a frozen section or redefines a shared primitive.
  const selectors = S5_CSS.match(/^\.[a-zA-Z][\w-]*[^{]*\{/gm) ?? [];
  assert.ok(selectors.length > 40, "the block actually contains the section");
  for (const selector of selectors) {
    assert.match(
      selector,
      /^\.(s05-|reveal-visible \.s05-)/,
      `"${selector.trim()}" must be namespaced to Section 05`
    );
  }
  // Within the block, .reveal-visible is only ever used as an ancestor hook,
  // never redefined.
  assert.equal(/^\.reveal(-visible)? \{/m.test(S5_CSS), false);
  // The block only ever appears once.
  assert.equal((CSS_SRC.match(/Pass 9 — Section 05/g) ?? []).length, 1);

  // FREEZE LOCK, the other direction: no rule ANYWHERE ELSE in the stylesheet
  // may target Section 05. If a later chapter reaches into .s05-* to borrow a
  // look, this section stops being frozen.
  const outside = CSS_CODE.replace(S5_CSS, "");
  assert.equal(
    /\.s05-/.test(outside),
    false,
    "no stylesheet block outside Pass 9 may reference Section 05"
  );
});

test("the surface reset is local, so the global palette is untouched", () => {
  // --text-primary / --text-secondary / --border are re-pointed ON the section,
  // never in :root.
  const rootBlock = CSS_SRC.slice(CSS_SRC.indexOf(":root {"), CSS_SRC.indexOf("@theme inline"));
  assert.equal(rootBlock.includes("--s05-"), false, ":root knows nothing about Section 05");
  assert.match(CSS_SRC, /\.s05-surface \{[\s\S]*?--text-primary: var\(--s05-ink\);/);
  assert.match(CSS_SRC, /\.s05-surface \{[\s\S]*?--border: var\(--s05-line\);/);
  // The fixed dark tokens still hold their original values.
  assert.match(rootBlock, /--bg-primary: #09090b;/);
  assert.match(rootBlock, /--text-primary: #f5f5f5;/);
  assert.match(rootBlock, /--border: #27272a;/);
});

test("the accent is derived into paper-legible forms, never painted raw on chalk", () => {
  // A bright accent is almost exactly as light as chalk, so accent text/marks
  // must go through --s05-accent-ink (mixed toward near-black) and accent fills
  // that sit on charcoal through --s05-accent-face (mixed toward paper).
  assert.match(CSS_SRC, /--s05-accent-ink: color-mix\(in srgb, var\(--accent\) 28%, #23281a\);/);
  assert.match(CSS_SRC, /--s05-accent-face: color-mix\(in srgb, var\(--accent\) 82%, var\(--s05-paper-lift\)\);/);

  // Inside the Pass 9 block, raw var(--accent) is only allowed in those two
  // derivations — every other accent usage goes through them.
  const rawUses = (S5_CSS.match(/var\(--accent\)/g) ?? []).length;
  assert.equal(rawUses, 2, "raw var(--accent) appears only in the two derivations");

  // The secondary CTA's inherited hover colour is redirected away from raw
  // accent, which would otherwise drop to ~1:1 on paper.
  assert.match(CSS_SRC, /\.s05-cta-alt:hover,\s*\.s05-cta-alt:focus-visible \{[^}]*color: var\(--s05-accent-ink\);/);
  // The primary accent block gets a charcoal edge so it has a boundary on paper.
  assert.match(CSS_SRC, /\.s05-cta \{\s*border: 1px solid var\(--s05-ink\);/);
});

test("the composition is not a reuse of Sections 01-04's layouts", () => {
  // No sticky panel (Section 01/02), no per-item image swap (Section 02), no
  // annotation connectors (Section 03), no metric ledger (Section 04).
  for (const src of [SECTION_CODE, LOADOUT_CODE]) {
    assert.equal(/sticky/.test(src), false);
    assert.equal(/factory-program|factory-blueprint|factory-evidence|factory-zone/.test(src), false);
  }
  // And none of Section 05's own classes leak into a frozen component.
  for (const file of [
    "../components/sections/About.tsx",
    "../components/sections/Programs.tsx",
    "../components/sections/ProgramIndex.tsx",
    "../components/sections/WhyChooseUs.tsx",
    "../components/sections/Transformations.tsx",
    "../components/sections/Hero.tsx",
    "../components/sections/Header.tsx",
    "../components/sections/KineticStrip.tsx",
    "../components/sections/Trust.tsx",
  ]) {
    const src = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.equal(/s05-|TrainingIntelligence|TrainingLoadout/.test(src), false, `${file} is untouched`);
  }
});

test("the chapter is wired into the page in order and behind its own toggle", () => {
  assert.equal(typeof sections.trainingIntelligence, "boolean");
  assert.match(PAGE_SRC, /\{sections\.trainingIntelligence && \(/);
  const after04 = PAGE_SRC.indexOf("<Transformations />");
  const s05 = PAGE_SRC.indexOf("<TrainingIntelligence");
  const reviews = PAGE_SRC.indexOf("<Reviews />");
  assert.ok(after04 < s05 && s05 < reviews, "Section 05 sits between 04 and Reviews");

  // A real landmark with a scroll offset that clears the fixed header.
  assert.match(SECTION_SRC, /id="training-intelligence"/);
  assert.match(SECTION_SRC, /scroll-mt-\[calc\(var\(--header-h\)\+0\.5rem\)\]/);
});

test("the chapter opens with its own typographic treatment", () => {
  const { index, eyebrow, headlineLines, accentLastLine } = config;
  assert.equal(index, "05");
  assert.ok(eyebrow.trim().length > 0);
  assert.ok(headlineLines.length >= 2 && headlineLines.length <= 4);
  for (const line of headlineLines) {
    assert.ok(line.trim().length > 0);
    assert.equal(line.includes("\n"), false);
    assert.ok(line.length <= 24, `"${line}" stays on one display line`);
  }
  assert.equal(accentLastLine, true);

  // Uppercase is applied in CSS, so the accessible heading text stays natural
  // sentence case in the DOM.
  assert.match(CSS_SRC, /\.s05-display \{[^}]*text-transform: uppercase;/);
  assert.equal(/[A-Z]{4,}/.test(headlineLines.join(" ")), false);
  // Section 05 does not reuse .factory-section-display — the case and scale
  // change is the chapter break.
  assert.equal(SECTION_SRC.includes("factory-section-display"), false);
  // The accented line is an inked stamp, not accent-coloured text on chalk.
  assert.match(CSS_SRC, /\.s05-display-line\[data-accent="true"\] \{[^}]*background: var\(--s05-ink\);/);
});

test("mobile recomposes the selector instead of shrinking the desktop rail", () => {
  const mobile = S5_SRC.slice(S5_SRC.indexOf("@media (max-width: 767px) {"));
  assert.match(mobile, /\.s05-selector \{[^}]*overflow-x: auto;/);
  assert.match(mobile, /scroll-snap-type: x mandatory;/);
  assert.match(mobile, /scroll-snap-align: start;/);
  // Thumb-sized targets.
  assert.match(mobile, /min-height: 2\.75rem;/);
  // The pin is withdrawn (chip widths no longer match the rail pitch) but the
  // calibration band stays, so the gym DNA remains on screen.
  assert.match(mobile, /\.s05-rail-pin \{\s*display: none;/);
  assert.match(mobile, /\.s05-rail-ticks \{/);
});

test("all copy is data-driven, never hardcoded into JSX", () => {
  // Every goal-specific string is rendered from the view model.
  for (const token of [
    "{goal.label}",
    "{goal.premise}",
    "{goal.path}",
    "{goal.coachNote}",
    "{item.title}",
    "{item.detail}",
    "{item.mistake}",
    "{item.instead}",
    "{row.label}",
    "{row.word}",
  ]) {
    assert.ok(LOADOUT_SRC.includes(token), `${token} is rendered from data`);
  }
  // Every label comes from the configuration, not a literal.
  for (const token of [
    "{loadoutLabel}",
    "{emphasisLabel}",
    "{prioritiesLabel}",
    "{mistakesLabel}",
    "{trackLabel}",
    "{coachNoteLabel}",
    "{gymNoteLabel}",
    "{handoffLabel}",
    "{primaryCtaLabel}",
    "{secondaryCtaLabel}",
  ]) {
    assert.ok(LOADOUT_SRC.includes(token), `${token} comes from configuration`);
  }
  // No goal name is written into the components.
  for (const goal of trainingGoals) {
    assert.equal(LOADOUT_SRC.includes(goal.label), false, `"${goal.label}" is not hardcoded`);
    assert.equal(SECTION_SRC.includes(goal.label), false, `"${goal.label}" is not hardcoded`);
  }
});

test("the optional gym note is genuinely optional in both directions", () => {
  const withNote = trainingGoals.filter((g) => g.gymNote);
  const without = trainingGoals.filter((g) => !g.gymNote);
  // The master data deliberately proves both paths compose.
  assert.ok(withNote.length >= 1, "at least one goal exercises the note");
  assert.ok(without.length >= 1, "at least one goal exercises its absence");
  assert.match(LOADOUT_SRC, /\{goal\.gymNote && \(/);
});

// ===========================================================================
// 7. DEFECT REGRESSIONS
//
// Each test below locks a defect that actually shipped and was caught in the
// browser. They are behavioural invariants, not style preferences.
// ===========================================================================

test("every teaching child is pinned to the content column, not auto-placed", () => {
  // THE BUG: .s05-teach-item is a two-track grid (1.625rem numeral + content).
  // Only the numeral was explicitly placed, so auto-placement put the FIRST
  // content child at (row 1, col 2) and then wrapped the SECOND one to
  // (row 2, col 1) — into the 1.625rem numeral track. Measured result: every
  // description and correction rendered 26px wide and wrapped one word per
  // line, at 21 lines for a 20-word sentence, in two of the three columns.
  // "What to track" has a single content child, which is exactly why it was
  // the only column that looked correct.
  assert.match(CSS_CODE, /\.s05-teach-item \{[^}]*grid-template-columns: 1\.625rem minmax\(0, 1fr\);/);
  assert.match(CSS_CODE, /\.s05-teach-index \{[^}]*grid-column: 1;[^}]*grid-row: 1;/);

  for (const cls of ["s05-teach-title", "s05-teach-detail", "s05-teach-fix", "s05-teach-signal"]) {
    const rule = CSS_CODE.match(new RegExp(`\\.${cls} \\{[^}]*\\}`));
    assert.ok(rule, `.${cls} has a rule`);
    assert.match(rule[0], /grid-column: 2;/, `.${cls} must be pinned to the content column`);
  }
});

test("the teaching sheet guarantees three equal columns, never intrinsic widths", () => {
  const block = S5_CSS.slice(S5_CSS.indexOf(".s05-teach {"));

  // Desktop: three EQUAL tracks. An `fr` weighting plus padding-based rules
  // gave the middle column a measurably shorter reading measure. (lastIndexOf:
  // an earlier 1100px query in this block sizes the signal type.)
  const dIdx = block.lastIndexOf("@media (min-width: 1100px)");
  const desktop = block.slice(dIdx, dIdx + 900);
  assert.match(desktop, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);

  // Tablet: two columns + the signal list spanning beneath (2+1).
  const tIdx = block.indexOf("@media (min-width: 768px)");
  const tablet = block.slice(tIdx, tIdx + 900);
  assert.match(tablet, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(tablet, /\.s05-teach-col\[data-compact="true"\] \{\s*grid-column: 1 \/ -1;/);

  // minmax(0, …) on the tracks and min-width: 0 on the column are what stop a
  // long token from pushing a track past its share.
  assert.match(CSS_CODE, /\.s05-teach-col \{[^}]*min-width: 0;/);
  // Real gutters, one shared token.
  assert.match(CSS_CODE, /--s05-teach-gutter: clamp\(/);
  assert.match(CSS_CODE, /column-gap: var\(--s05-teach-gutter\);/);
  // No arbitrary width override was used to paper over the collapse. (The
  // divider pseudo-element is legitimately 1px, so only the real column and
  // container boxes are audited.)
  const boxRules = CSS_CODE.match(/\.s05-teach(?:-col)?(?:\[[^\]]*\])? \{[^}]*\}/g) ?? [];
  assert.ok(boxRules.length >= 2);
  for (const rule of boxRules) {
    assert.equal(/(?<![\w-])width:\s*\d/.test(rule), false, `no fixed width in ${rule.slice(0, 40)}`);
  }
});

test("the column divider never appears in a single-column stack", () => {
  // Drawn as a pseudo-element centred in the gutter (so all three measures stay
  // equal), which means it must be explicitly switched off when the columns
  // stack and for the tablet row-spanning third column.
  assert.match(CSS_CODE, /\.s05-teach-col::before \{\s*content: "";\s*display: none;/);
  assert.match(CSS_CODE, /\.s05-teach-col:nth-child\(2\)::before \{\s*display: block;/);
  const desktop = S5_CSS.slice(S5_CSS.lastIndexOf("@media (min-width: 1100px)"));
  assert.match(desktop, /\.s05-teach-col:nth-child\(3\)::before/);
});

test("every mapped list in Section 05 carries an explicit key", () => {
  for (const [label, src] of [["section", SECTION_CODE], ["loadout", LOADOUT_CODE]]) {
    // Every .map( / Array.from( that returns JSX must have a key= within the
    // returned element.
    const iterators = [...src.matchAll(/(\.map\(|Array\.from\()/g)];
    assert.ok(iterators.length > 0, `${label} has mapped lists`);
    for (const m of iterators) {
      const chunk = src.slice(m.index, m.index + 420);
      assert.match(chunk, /\bkey=/, `${label}: list at offset ${m.index} needs a key`);
    }
  }
  // The artifact is handed across the server/client boundary into a children
  // list beside a keyed sibling, so it carries its own stable key.
  assert.match(SECTION_CODE, /<figure key="training-intelligence-artifact"/);
  // Keys are semantic, not bare array indices.
  assert.equal(/key=\{i\}|key=\{index\}|key=\{slot\}/.test(LOADOUT_CODE), false);
  assert.match(LOADOUT_CODE, /key=\{`\$\{row\.id\}-plate-\$\{slot \+ 1\}`\}/);
});

test("the disclaimer is never gated behind a scroll reveal", () => {
  // .reveal rests at opacity: 0 and only JavaScript adds .reveal-visible, so a
  // Reveal-wrapped disclaimer is a disclaimer that can fail to appear. It was
  // measured invisible (1.08:1) in the browser before this was fixed.
  assert.match(CSS_CODE, /\.reveal \{[^}]*opacity: 0;/);
  const scopeAt = SECTION_CODE.indexOf('className="s05-scope"');
  assert.ok(scopeAt > 0);
  // Nothing between the last Reveal and the scope line may wrap it: the scope
  // paragraph must be a direct child of the Container.
  const tail = SECTION_CODE.slice(SECTION_CODE.lastIndexOf("</Reveal>"));
  assert.ok(tail.includes('className="s05-scope"'), "the scope line sits after every Reveal");
  assert.equal(/<Reveal[^>]*>\s*<p className="s05-scope"/.test(SECTION_CODE), false);
});

test("essential text is never tinted below a readable contrast", () => {
  // The emphasis WORD is the channel that makes the plate markers
  // non-colour-dependent; an 80% tint measured 3.93:1 at 9px. It, the caveat
  // and the figcaption are now on full or near-full ink.
  assert.match(CSS_CODE, /\.s05-emphasis-word \{[^}]*color: var\(--s05-ink-soft\);/);
  assert.match(CSS_CODE, /\.s05-emphasis-key \{[^}]*color: var\(--s05-ink-soft\);/);
  // Lower emphasis levels are differentiated by weight/accent, never by fading
  // the word out.
  assert.match(CSS_CODE, /\[data-level="2"\] \.s05-emphasis-word \{[^}]*color: var\(--s05-ink-soft\);/);
  // No TEXT colour in the section tints ink below 88%. (Background tints — the
  // paper grain, the plate-ring geometry — are deliberately far fainter and are
  // not text, so only `color:` declarations are audited.)
  const block = S5_CSS;
  for (const m of block.matchAll(
    /(?<![\w-])color:\s*color-mix\(in srgb, var\(--s05-ink(?:-soft)?\) (\d+)%, transparent\)/g
  )) {
    const pct = Number(m[1]);
    assert.ok(pct >= 88, `text ink tinted to ${pct}% is too faint`);
  }
});
