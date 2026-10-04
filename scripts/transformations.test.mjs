// Zero-dependency tests for Section 04 (Transformations / Member Dossier).
// Run: node --test scripts/transformations.test.mjs  (Node >= 22.18 type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { transformations } from "../lib/transformations.ts";
import {
  buildMetricCells,
  formatFigure,
  MAX_METRIC_CELLS,
  METRIC_ORDER,
} from "../components/sections/transformationDossier.ts";

const SECTION_SRC = readFileSync(
  new URL("../components/sections/Transformations.tsx", import.meta.url),
  "utf8"
);
const NAV_SRC = readFileSync(
  new URL("../components/motion/TransformationNav.tsx", import.meta.url),
  "utf8"
);
const SCRUB_SRC = readFileSync(
  new URL("../components/motion/TransformationScrubber.tsx", import.meta.url),
  "utf8"
);
const CSS_SRC = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

// The Section 04 stylesheet block only — assertions below must never pass or
// fail because of a frozen section's rules. The slice is bounded at BOTH ends:
// it originally ran to the end of the file, which silently absorbed every
// stylesheet block appended after it (Section 05's `box-shadow` and its own
// reduced-motion block both landed inside "Section 04" and broke these tests).
const S4_START = CSS_SRC.indexOf("Pass 8 \u2014 Section 04");
const S4_NEXT = CSS_SRC.indexOf("\n * Pass ", S4_START + 1);
const S4_CSS = CSS_SRC.slice(S4_START, S4_NEXT === -1 ? undefined : S4_NEXT);
assert.ok(S4_CSS.length > 2000, "the Section 04 CSS block was located");
assert.equal(S4_CSS.includes(".s05-"), false, "the slice stops before Section 05");

/** The declaration body of a top-level rule, e.g. rule(".factory-evidence-media"). */
function rule(selector) {
  const at = S4_CSS.indexOf(`\n${selector} {`);
  assert.notEqual(at, -1, `${selector} is defined`);
  const start = S4_CSS.indexOf("{", at);
  return S4_CSS.slice(start + 1, S4_CSS.indexOf("}", start));
}

// ------------------------------------------------------- figure derivation

test("the ledger reads in one fixed commercial order for every gym", () => {
  const cells = buildMetricCells({
    sessionsPerWeek: 4,
    afterWaistCm: 84,
    beforeWaistCm: 96,
    afterBmi: 21.7,
    beforeBmi: 24.9,
    afterBodyFatPct: 19.1,
    beforeBodyFatPct: 28.4,
    afterWeightKg: 71,
    beforeWeightKg: 82,
    durationMonths: 3,
  });
  assert.deepEqual(
    cells.map((c) => c.key),
    ["duration", "weight", "bodyFat", "bmi", "waist", "load"]
  );
  // Authored key order in the data must not change the rendered order.
  assert.deepEqual([...METRIC_ORDER], cells.map((c) => c.key));
  assert.equal(cells.length, MAX_METRIC_CELLS);
});

test("figures render as before → after with a signed derived change", () => {
  const [weight] = buildMetricCells({ beforeWeightKg: 82, afterWeightKg: 71 });
  assert.equal(weight.value, "82 \u2192 71 kg");
  assert.equal(weight.note, "\u221211 kg", "a true minus sign, not a hyphen");

  const [gain] = buildMetricCells({ beforeWeightKg: 64, afterWeightKg: 70.5 });
  assert.equal(gain.value, "64 \u2192 70.5 kg");
  assert.equal(gain.note, "+6.5 kg", "muscle-building cases read as a gain");

  const [bmi] = buildMetricCells({ beforeBmi: 24.9, afterBmi: 21.7 });
  assert.equal(bmi.value, "24.9 \u2192 21.7", "BMI carries no unit");
  assert.equal(bmi.note, "\u22123.2");

  const [fat] = buildMetricCells({ beforeBodyFatPct: 31.2, afterBodyFatPct: 21.6 });
  assert.equal(fat.value, "31.2 \u2192 21.6 %");
  assert.equal(fat.note, "\u22129.6 pts", "percentage points, never % of %");
});

test("a change of zero produces no derived note rather than '0'", () => {
  const [flat] = buildMetricCells({ beforeWeightKg: 80, afterWeightKg: 80 });
  assert.equal(flat.value, "80 \u2192 80 kg");
  assert.equal(flat.note, undefined);
});

test("duration and training load read as athletic notation", () => {
  assert.equal(buildMetricCells({ durationMonths: 1 })[0].value, "01 month");
  assert.equal(buildMetricCells({ durationMonths: 6 })[0].value, "06 months");
  assert.equal(buildMetricCells({ durationMonths: 12 })[0].value, "12 months");
  assert.equal(buildMetricCells({ sessionsPerWeek: 4 })[0].value, "4\u00d7 / week");
});

test("a half-supplied pair renders nothing at all — never 'BMI —'", () => {
  for (const partial of [
    { beforeWeightKg: 82 },
    { afterWeightKg: 71 },
    { beforeBmi: 24.9 },
    { afterBodyFatPct: 19 },
    { beforeWaistCm: 96 },
  ]) {
    assert.deepEqual(buildMetricCells(partial), [], JSON.stringify(partial));
  }
  assert.deepEqual(buildMetricCells(undefined), []);
  assert.deepEqual(buildMetricCells({}), []);
});

test("unusable numbers are dropped, not rendered", () => {
  assert.deepEqual(
    buildMetricCells({
      durationMonths: 0,
      sessionsPerWeek: Number.NaN,
      beforeWeightKg: Number.POSITIVE_INFINITY,
      afterWeightKg: 71,
      beforeBmi: -24.9,
      afterBmi: 21.7,
    }),
    []
  );
  // A string smuggled in from a CMS must not reach the page.
  assert.deepEqual(buildMetricCells({ durationMonths: "3" }), []);
});

test("the ledger is capped, so 'more data' can never break the composition", () => {
  const everything = {
    durationMonths: 3,
    beforeWeightKg: 82,
    afterWeightKg: 71,
    beforeBodyFatPct: 28,
    afterBodyFatPct: 19,
    beforeBmi: 24.9,
    afterBmi: 21.7,
    beforeWaistCm: 96,
    afterWaistCm: 84,
    sessionsPerWeek: 4,
  };
  assert.equal(buildMetricCells(everything).length, MAX_METRIC_CELLS);
  assert.equal(buildMetricCells(everything, 99).length, MAX_METRIC_CELLS);
  assert.equal(buildMetricCells(everything, 4).length, 4);
  assert.deepEqual(buildMetricCells(everything, 0), []);
  assert.equal(formatFigure(21.749), "21.7");
  assert.equal(formatFigure(71.0), "71");
});

// ------------------------------------------------------------------- data

test("every rendered case is consent verified and photograph backed", () => {
  assert.ok(transformations.length >= 1);
  for (const item of transformations) {
    assert.equal(item.consentVerified, true, "demo data only ships consented cases");
    assert.ok(item.image.startsWith("/assets/transformations/"));
    assert.ok(item.imageAlt.trim().length >= 30, "alt text describes the photograph");
    assert.equal(
      Boolean(item.beforeImage) === Boolean(item.afterImage),
      true,
      "split assets only ever come as a genuine pair"
    );
  }
  // Consent is a hard gate in the component, not a styling choice.
  assert.match(SECTION_SRC, /transformations\.filter\(\(t\) => t\.consentVerified\)/);
  assert.match(SECTION_SRC, /if \(cases\.length === 0\) return null;/);
});

test("demo figures are labelled synthetic and the sparse case proves degradation", () => {
  const DATA_SRC = readFileSync(new URL("../lib/transformations.ts", import.meta.url), "utf8");
  assert.match(DATA_SRC, /SYNTHETIC FIGURES/, "demo numbers are flagged, never presented as real");

  const [complete, second] = transformations;
  assert.equal(buildMetricCells(complete.metrics).length >= 4, true, "a full dossier shows 4+");
  assert.ok(complete.training?.length && complete.nutrition?.length && complete.coachNotes?.length);
  // Both demo cases are now data-complete.
  assert.equal(buildMetricCells(second.metrics).length >= 4, true);
  assert.ok(second.training?.length && second.nutrition?.length && second.coachNotes?.length);

  // Degradation is proven on a synthetic sparse input, not on the demo data:
  // only what was recorded is shown.
  assert.deepEqual(
    buildMetricCells({ durationMonths: 4, sessionsPerWeek: 5 }).map((c) => c.key),
    ["duration", "load"]
  );
});

test("optional dossier blocks are conditionally rendered, never emptied", () => {
  for (const guard of [
    /\{cells\.length > 0 && \(/,
    /\{item\.story && \(/,
    /\{item\.journey && \(/,
    /item\.training && item\.training\.length > 0 && \(/,
    /item\.nutrition && item\.nutrition\.length > 0 && \(/,
    /item\.coachNotes && item\.coachNotes\.length > 0 && \(/,
    /\{hasProtocol && \(/,
  ]) {
    assert.match(SECTION_SRC, guard);
  }
  // Nothing may hardcode a placeholder dash for a missing figure.
  assert.equal(/["'>]\s*\u2014\s*["'<]/.test(SECTION_SRC), false, "no em-dash placeholders");
  assert.equal(SECTION_SRC.includes("N/A"), false);
});

// ------------------------------------------------- media frame (not a crop)

test("the plate is width driven with a derived height at every breakpoint", () => {
  const media = rule(".factory-evidence-media");
  assert.match(media, /aspect-ratio: var\(--evidence-ratio/);
  assert.match(media, /width: 100%/);
  // The whole point: no authored height anywhere in the Section 04 block.
  assert.equal(
    /(^|[\s;{])(height|min-height|max-height):\s*(?!100%)/m.test(
      S4_CSS.replace(/\/\*[\s\S]*?\*\//g, "")
    ),
    true,
    "sanity: the regex below is meaningful"
  );
  const declarations = S4_CSS.replace(/\/\*[\s\S]*?\*\//g, "");
  const mediaRule = declarations.slice(
    declarations.indexOf(".factory-evidence-media {"),
    declarations.indexOf("}", declarations.indexOf(".factory-evidence-media {"))
  );
  for (const banned of ["height:", "min-height:", "max-height:", "vh"]) {
    assert.equal(mediaRule.includes(banned), false, `the plate declares no ${banned}`);
  }
});

test("three frame tokens cover portrait, diptych and landscape uploads", () => {
  assert.match(S4_CSS, /\[data-aspect="portrait"\]\s*\{\s*--evidence-ratio: 4 \/ 5;/);
  assert.match(S4_CSS, /\[data-aspect="square"\]\s*\{\s*--evidence-ratio: 1 \/ 1;/);
  assert.match(S4_CSS, /\[data-aspect="wide"\]\s*\{\s*--evidence-ratio: 3 \/ 2;/);
  // Default frame for a combined diptych, portrait when a split pair exists.
  assert.match(
    SECTION_SRC,
    /item\.mediaAspect \?\? \(hasSplitAssets \? "portrait" : "square"\)/
  );
});

test("photographs are contained, never cover-cropped", () => {
  assert.match(SECTION_SRC, /className="object-contain object-center"/);
  assert.equal(SECTION_SRC.includes("object-cover"), false);
  assert.equal(SCRUB_SRC.includes("object-cover"), false);
  assert.equal((SCRUB_SRC.match(/object-contain/g) ?? []).length, 2);
});

test("the plate height is capped so it cannot dominate a laptop viewport", () => {
  // ONE width token, consumed by the media column AND the ledger's lead cell:
  // that shared value is what puts the headline figure exactly above the
  // photograph, and (via aspect-ratio) is the section's only height control.
  assert.match(rule(".factory-evidence-sheet"), /--evidence-col: clamp\(16rem, 42vw, 34rem\)/);
  assert.equal(
    (S4_CSS.match(/minmax\(0, var\(--evidence-col\)\)/g) ?? []).length,
    2,
    "media column and lead metric cell share one width token"
  );
  // 34rem = 544px: a square frame is then ~544px tall on any display from
  // 1296px up, versus ~915px in the superseded composition. Short laptops
  // lower the CAP (not a height) so the derived height follows.
  assert.match(
    S4_CSS,
    /@media \(min-width: 1024px\) and \(max-height: 800px\) \{\s*\.factory-evidence-sheet \{\s*--evidence-col: clamp\(16rem, 38vw, 30rem\)/
  );
});

test("every case in the register can reach its own snap position", () => {
  // W + M >= C - 2P (see the derivation in globals.css). The peek subtracted
  // from a case is paid back as trailing margin on the last case, so the
  // invariant holds at every viewport instead of per-breakpoint vw arithmetic.
  assert.match(rule(".factory-evidence-track"), /--evidence-peek: clamp\(2rem, 5vw, 6rem\)/);
  assert.match(S4_CSS, /flex-basis: calc\(100% - var\(--evidence-peek\)\)/);
  assert.match(S4_CSS, /margin-inline-end: calc\(var\(--evidence-peek\) \+ 2px\)/);
  // The superseded viewport-width case sizing (short by 42-48px at 1024-1440)
  // must not come back.
  assert.equal(S4_CSS.includes("100vw - 9rem"), false);
  assert.equal(S4_CSS.includes("100vw - 12rem"), false);
});

test("images below the fold stay lazy with real sizes hints", () => {
  assert.match(SECTION_SRC, /loading="lazy"/);
  assert.match(
    SECTION_SRC,
    /sizes="\(min-width: 1024px\) 34rem, \(min-width: 768px\) 42vw, 92vw"/
  );
  assert.match(SCRUB_SRC, /sizes="\(min-width: 1024px\) 34rem/);
});

// ---------------------------------------------------------- the composition

test("the case is one grid: media, ledger and dossier interlock", () => {
  const sheet = rule(".factory-evidence-sheet");
  assert.match(sheet, /display: grid/);
  // Mobile: identity → figures → proof → method. Never "screen = photograph".
  assert.match(sheet, /"head"\s*"ledger"\s*"media"\s*"story"\s*"protocol"\s*"consent"/);
  // Tablet recomposes (notation spans the sheet); desktop runs the dossier
  // down the plate's full height.
  assert.match(S4_CSS, /"media\s+story"\s*"protocol protocol"/);
  assert.match(S4_CSS, /"media  story"\s*"media  protocol"\s*"media  consent"/);
  assert.match(S4_CSS, /grid-template-rows: auto auto auto auto 1fr/);
  assert.match(rule(".factory-evidence-sheet"), /row-gap: 0/);
  for (const area of ["head", "ledger", "media", "story", "protocol", "consent"]) {
    assert.ok(S4_CSS.includes(`grid-area: ${area};`), `${area} is placed`);
  }
});

test("nothing in the section is a card", () => {
  const declarations = S4_CSS.replace(/\/\*[\s\S]*?\*\//g, "");
  // The only radii allowed are the consent dot (50%) and explicit resets (0):
  // no softened plates, no rounded panels, no chips.
  const radii = [...declarations.matchAll(/border-radius:\s*([^;]+);/g)].map((m) => m[1].trim());
  assert.deepEqual([...new Set(radii)].sort(), ["0", "50%"]);
  assert.equal(declarations.includes("box-shadow"), false, "no shadows");
});

// ------------------------------------------------------------- background

test("the horizontal-rule wallpaper is gone and not reintroduced", () => {
  assert.equal(CSS_SRC.includes("factory-ledger"), false, "the old ledger block is deleted");
  assert.equal(CSS_SRC.includes("factory-ledger-rules"), false);
  const declarations = S4_CSS.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.equal(
    declarations.includes("repeating-linear-gradient"),
    false,
    "no line wallpaper in any form"
  );
  assert.equal(declarations.includes("repeating-radial-gradient"), false);
});

test("the athletic motif is one masked weight plate inside the 2-6% band", () => {
  const ring = rule(".factory-evidence-field::before");
  // Outer rim, inner rim, collar and hub — one plate, not an icon grid.
  assert.equal((ring.match(/radial-gradient\(\s*circle at 50% 50%/g) ?? []).length, 4);
  assert.match(ring, /mask-image: linear-gradient/);

  const opacities = [
    rule(".factory-evidence-field::before"),
    rule(".factory-evidence-field::after"),
    rule(".factory-evidence-grain"),
  ].map((body) => Number.parseFloat(body.match(/opacity:\s*([\d.]+)/)[1]));
  for (const value of opacities) {
    assert.ok(value >= 0.02 && value <= 0.06, `${value} sits in the 2-6% band`);
  }
  // Decorative surfaces are hidden from assistive tech.
  for (const cls of ["factory-evidence-field", "factory-evidence-grain"]) {
    assert.match(SECTION_SRC, new RegExp(`className="${cls}" aria-hidden="true"`));
  }
});

// ------------------------------------------------- semantics/accessibility

test("heading hierarchy is one h2, an h3 per case and h4 group labels", () => {
  assert.equal((SECTION_SRC.match(/<h2/g) ?? []).length, 1);
  assert.match(SECTION_SRC, /id="transformations-heading"/);
  assert.match(SECTION_SRC, /aria-labelledby="transformations-heading"/);
  assert.match(SECTION_SRC, /<h3 className="factory-evidence-member">\{memberName\}<\/h3>/);
  assert.ok((SECTION_SRC.match(/<h4 className="factory-group-label">/g) ?? []).length >= 3);
  assert.equal(NAV_SRC.includes("<h"), false, "the register control adds no headings");
});

test("the photograph is a figure whose caption is the before/after axis", () => {
  assert.match(SECTION_SRC, /<figure className="factory-evidence-media"/);
  assert.match(SECTION_SRC, /<figcaption className="factory-evidence-axis">/);
  // The labels are content (they name the halves); only the tick is decorative.
  assert.match(SECTION_SRC, /factory-evidence-axis-tick" aria-hidden="true"/);
  assert.equal(
    /factory-evidence-axis" aria-hidden/.test(SECTION_SRC),
    false,
    "before/after labels stay readable by assistive tech"
  );
  // Figures and notation are description lists, so each value keeps its label.
  assert.ok((SECTION_SRC.match(/<dl /g) ?? []).length >= 2);
  assert.match(SECTION_SRC, /<dt className="factory-evidence-metric-label">/);
  assert.match(SECTION_SRC, /<dd className="factory-evidence-metric-value">/);
  // Value reads above label visually without reordering the DOM.
  assert.match(rule(".factory-evidence-metric"), /flex-direction: column-reverse/);
});

test("case navigation is real buttons, labelled, and keyboard operable", () => {
  assert.equal((NAV_SRC.match(/type="button"/g) ?? []).length, 3);
  assert.match(NAV_SRC, /aria-label=\{`Case \$\{pad\(i \+ 1\)\}`\}/);
  assert.match(NAV_SRC, /aria-current=\{i === active \? "true" : undefined\}/);
  assert.match(NAV_SRC, /aria-label="Previous case"/);
  assert.match(NAV_SRC, /aria-label="Next case"/);
  assert.equal((NAV_SRC.match(/factory-focus/g) ?? []).length, 3);
  assert.match(NAV_SRC, /if \(caseCount <= 1\) return null;/);
  // Editorial instrumentation, not carousel chrome: no arrows over the photo.
  assert.equal(CSS_SRC.includes("factory-evidence-edge"), false);
  assert.equal(NAV_SRC.includes("setInterval"), false, "no auto-advance");
  // The register itself is native scroll-snap, so it works without this island.
  assert.match(rule(".factory-evidence-track"), /scroll-snap-type: x mandatory/);
  assert.match(rule(".factory-evidence-case"), /scroll-snap-align: start/);
});

test("the client boundary stays at two small islands", () => {
  assert.equal(SECTION_SRC.includes('"use client"'), false, "the section is a Server Component");
  assert.match(NAV_SRC, /^"use client";/);
  assert.match(SCRUB_SRC, /^"use client";/);
  assert.equal(SECTION_SRC.includes("useState"), false);
  // No animation or carousel dependency was introduced.
  const PKG = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.deepEqual(Object.keys(PKG.dependencies), ["next", "react", "react-dom"]);
});

test("reduced motion settles the composition and survives no-JS staggering", () => {
  const block = S4_CSS.slice(S4_CSS.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
  assert.match(block, /\.factory-evidence-mask[\s\S]*clip-path: inset\(0 0 0 0\)/);
  assert.match(block, /\.factory-evidence-axis-tick::before[\s\S]*scaleY\(1\)/);
  for (const cls of [
    "factory-evidence-metric",
    "factory-evidence-notation-item",
    "factory-evidence-note",
  ]) {
    assert.ok(block.includes(`.${cls}`), `${cls} settles under reduced motion`);
  }
  // Entrance motion is the shared primitives only — no library, no idle loop.
  const declarations = S4_CSS.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.equal(/animation:/.test(declarations), false, "no keyframe animation in Section 04");
  assert.match(SECTION_SRC, /factory-stagger-child/);
});

// ---------------------------------------------------------- frozen sections

test("frozen sections and shared primitives are untouched", () => {
  for (const cls of [
    ".factory-container",
    ".factory-section-display",
    ".factory-group-label",
    ".factory-index",
    ".factory-eyebrow",
    ".factory-stagger-child",
    ".factory-blueprint-surface",
    ".factory-programs-surface",
    ".factory-program-row",
    ".factory-zone-row",
    ".factory-image-mask",
    ".factory-hero-stage",
  ]) {
    assert.ok(CSS_SRC.includes(cls), `${cls} is still defined`);
  }
  // Section 04's surface no longer borrows another chapter's background.
  assert.match(rule(".factory-evidence-surface"), /linear-gradient\(180deg, #0b0b0d/);
});
