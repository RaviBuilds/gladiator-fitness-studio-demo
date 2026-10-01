// Zero-dependency tests for Section 03 (Why Choose Us / Performance Blueprint).
// Run: node --test scripts/why-choose-us.test.mjs  (Node >= 22.18 type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { whyChooseUs, whyChooseUsConfiguration } from "../lib/why-choose-us.ts";
import { annotationSlot, targetOffset } from "../components/motion/blueprintField.ts";

const SECTION_SRC = readFileSync(
  new URL("../components/sections/WhyChooseUs.tsx", import.meta.url),
  "utf8"
);
const FIELD_SRC = readFileSync(
  new URL("../components/motion/WhyChooseBlueprint.tsx", import.meta.url),
  "utf8"
);
const CSS_SRC = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

// ------------------------------------------------------------- field geometry

test("the four perimeter slots flank the subject at four distinct positions", () => {
  const slots = [0, 1, 2, 3].map((i) => annotationSlot(i, 5));
  assert.deepEqual(
    slots.map((s) => [s.column, s.row, s.side]),
    [
      [1, 1, "left"],
      [3, 1, "right"],
      [1, 2, "left"],
      [3, 2, "right"],
    ]
  );
});

test("a trailing fifth principle lands on the centre axis under the subject", () => {
  assert.deepEqual(annotationSlot(4, 5), { row: 3, column: 2, side: "base" });
});

test("a sixth principle pairs off below the subject instead of stacking", () => {
  assert.deepEqual(annotationSlot(4, 6), { row: 3, column: 1, side: "left" });
  assert.deepEqual(annotationSlot(5, 6), { row: 3, column: 3, side: "right" });
});

test("no two principles ever share a slot, for any supported count", () => {
  for (let total = 1; total <= 9; total += 1) {
    const seen = new Set();
    for (let i = 0; i < total; i += 1) {
      const { row, column } = annotationSlot(i, total);
      const key = `${row}:${column}`;
      assert.equal(seen.has(key), false, `count ${total}, item ${i} collides at ${key}`);
      seen.add(key);
      assert.ok(column >= 1 && column <= 3);
      assert.ok(row >= 1);
    }
  }
});

test("target offsets stay inside the frame and rise with the index", () => {
  for (const total of [4, 5, 6, 8]) {
    const values = Array.from({ length: total }, (_, i) =>
      Number.parseFloat(targetOffset(i, total))
    );
    assert.equal(new Set(values).size, total, "each principle has its own anchor point");
    for (const value of values) {
      assert.ok(value >= 20 && value <= 76, `${value}% is inside the frame`);
    }
    for (let i = 1; i < values.length; i += 1) {
      assert.ok(values[i] > values[i - 1], "anchor points descend in reading order");
    }
  }
  // A single principle is centred rather than pinned to the top of the frame.
  assert.equal(targetOffset(0, 1), "48%");
});

// --------------------------------------------------------------------- data

test("the section is anchored by exactly one real photograph", () => {
  const { anchor } = whyChooseUsConfiguration;
  assert.ok(anchor.src.startsWith("/assets/"), "anchor is a local asset");
  assert.ok(anchor.alt.trim().length >= 40, "alt text describes the photograph");
  // One <Image> in the whole section: a campaign anchor, never a gallery and
  // never a per-principle preview swap.
  assert.equal((FIELD_SRC.match(/<Image/g) ?? []).length, 1);
  assert.equal(SECTION_SRC.includes("<Image"), false);
  assert.equal(/item\.image/.test(FIELD_SRC), false, "per-item images are not rendered");
});

test("alt text describes the frame, not the differentiators", () => {
  const alt = whyChooseUsConfiguration.anchor.alt.toLowerCase();
  for (const item of whyChooseUs) {
    assert.equal(
      alt.includes(item.title.toLowerCase()),
      false,
      "a principle must not be restated as alt text"
    );
  }
});

test("the manifesto is authored as short explicit lines", () => {
  const { headlineLines } = whyChooseUsConfiguration;
  assert.ok(headlineLines.length >= 1 && headlineLines.length <= 4);
  for (const line of headlineLines) {
    assert.ok(line.trim().length > 0);
    assert.equal(line.includes("\n"), false);
    // Lines cross the photograph on desktop; long ones would run over the
    // subject (see WhyChooseUsConfiguration).
    assert.ok(line.length <= 24, `"${line}" is short enough to cross the frame`);
  }
});

test("principles carry real content and no invented category labels", () => {
  assert.ok(whyChooseUs.length >= 1);
  for (const item of whyChooseUs) {
    assert.ok(item.title.trim().length > 0);
    assert.ok(item.description.trim().length > 0);
  }
  // Titles and descriptions are rendered verbatim from the data.
  assert.match(FIELD_SRC, /\{item\.title\}/);
  assert.match(FIELD_SRC, /\{item\.description\}/);
  // The only other text on the sheet is derived numerals — no hardcoded
  // category label such as COACHING / EQUIPMENT / ENVIRONMENT / SUPPORT.
  for (const invented of ["COACHING", "EQUIPMENT", "ENVIRONMENT", "SUPPORT"]) {
    assert.equal(FIELD_SRC.includes(invented), false, `${invented} is not invented here`);
  }
});

// ------------------------------------------------------------- composition

test("interaction is pointer and keyboard equivalent", () => {
  assert.match(FIELD_SRC, /onMouseEnter=\{\(\) => setActive\(i\)\}/);
  assert.match(FIELD_SRC, /onFocus=\{\(\) => setActive\(i\)\}/);
  assert.match(FIELD_SRC, /onClick=\{\(\) => setActive\(i\)\}/);
  assert.match(FIELD_SRC, /aria-pressed=\{isActive\}/);
  assert.match(FIELD_SRC, /factory-focus/);
});

test("heading hierarchy is h2 > h3 > h4 with one h2", () => {
  assert.equal((SECTION_SRC.match(/<h2/g) ?? []).length, 1);
  assert.match(SECTION_SRC, /id="why-choose-us-heading"/);
  assert.match(SECTION_SRC, /aria-labelledby="why-choose-us-heading"/);
  assert.equal((FIELD_SRC.match(/<h2/g) ?? []).length, 0);
  assert.match(FIELD_SRC, /<h3 className="factory-group-label">/);
  assert.match(FIELD_SRC, /<h4 className="factory-annotation-title">/);
  // List semantics survive display: contents.
  assert.match(FIELD_SRC, /role="list"/);
  assert.match(CSS_SRC, /\.factory-blueprint-annotations \{\s*display: contents;/);
});

test("every decorative graphic is hidden from assistive tech", () => {
  for (const cls of [
    "factory-blueprint-grid",
    "factory-blueprint-marks",
    "factory-blueprint-light",
    "factory-blueprint-scrim",
    "factory-blueprint-target",
    "factory-blueprint-stamp",
    "factory-blueprint-baseline",
    "factory-annotation-connector",
  ]) {
    const src = cls.startsWith("factory-blueprint-grid") || cls === "factory-blueprint-marks"
      ? SECTION_SRC
      : FIELD_SRC;
    const marker = new RegExp(`className="${cls}"[^>]*aria-hidden`);
    assert.match(src, marker, `${cls} is aria-hidden`);
  }
});

test("the superseded dossier composition is fully removed", () => {
  assert.equal(
    existsSync(new URL("../components/motion/WhyChooseInteractive.tsx", import.meta.url)),
    false
  );
  for (const dead of ["factory-dossier", "factory-principle-"]) {
    assert.equal(CSS_SRC.includes(dead), false, `${dead} rules are gone`);
  }
});

test("reduced motion shows the settled composition", () => {
  // Scope to Section 03's OWN stylesheet block: later chapters append their
  // own prefers-reduced-motion blocks, so "the last one in the file" is not
  // this section's.
  const S3_CSS = CSS_SRC.slice(CSS_SRC.indexOf("Pass 6"), CSS_SRC.indexOf("Pass 8"));
  const block = S3_CSS.slice(S3_CSS.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
  assert.match(block, /\.factory-blueprint-mask[\s\S]*clip-path: none/);
  assert.match(block, /\.factory-blueprint-baseline::before[\s\S]*transform: scaleX\(1\)/);
});

test("frozen sections keep their own surfaces and rows", () => {
  // Section 01 / 02 primitives must still exist untouched alongside Pass 6.
  for (const cls of [
    ".factory-programs-surface",
    ".factory-programs-mark",
    ".factory-program-row",
    ".factory-program-panel",
    ".factory-zone-row",
    ".factory-image-mask",
    ".factory-section-display",
  ]) {
    assert.ok(CSS_SRC.includes(cls), `${cls} is still defined`);
  }
});
