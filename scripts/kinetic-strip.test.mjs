// Zero-dependency tests for the kinetic strip band geometry.
// Run: node --test scripts/kinetic-strip.test.mjs  (Node >= 22.18 / 23.6 type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DECLARATION_BAND,
  TECHNICAL_BAND,
  MIN_COPY_PX,
  WIDTH_SAFETY,
  SMALL_VIEWPORT_DURATION_SCALE,
  estimateRunWidth,
  runRepeatCount,
  trackDurationSeconds,
  effectiveFontPx,
} from "../components/sections/kineticBands.ts";
import { business } from "../lib/business.ts";

// lib/kinetic-strip.ts uses an extensionless runtime import ("./business"),
// which node's ESM resolver can't load directly, so the configuration is
// reconstructed here from the same source data and the file's contents are
// asserted below ("strip content matches lib/kinetic-strip.ts").
const locality = business.address.locality || business.address.city;
const primary = [business.name, business.tagline];
const secondary = [locality, "Est. Training Floor", business.name].filter(Boolean);

const BANDS = [
  { name: "declaration", phrases: primary, preset: DECLARATION_BAND },
  { name: "technical", phrases: secondary, preset: TECHNICAL_BAND },
];

// The QA viewport matrix.
const VIEWPORTS = [
  [1920, 1080],
  [1440, 900],
  [1366, 768],
  [1280, 720],
  [1024, 768],
  [785, 1024],
  [768, 1024],
  [490, 900],
  [430, 932],
  [390, 844],
  [375, 812],
  [375, 667],
];

/** Worst-case (pessimistic) width of one loop copy. */
function conservativeCopyWidth(phrases, preset) {
  return (estimateRunWidth(phrases, preset) / WIDTH_SAFETY) * runRepeatCount(phrases, preset);
}

test("seamless loop: one copy is wider than every QA viewport", () => {
  for (const { name, phrases, preset } of BANDS) {
    const copy = conservativeCopyWidth(phrases, preset);
    for (const [w] of VIEWPORTS) {
      assert.ok(
        copy >= w,
        `${name}: copy ${copy.toFixed(0)}px < viewport ${w}px — blank gap would scroll through`,
      );
    }
  }
});

test("seamless loop: one copy clears the MIN_COPY_PX contract", () => {
  for (const { name, phrases, preset } of BANDS) {
    const copy = conservativeCopyWidth(phrases, preset);
    assert.ok(copy >= MIN_COPY_PX, `${name}: ${copy.toFixed(0)}px < ${MIN_COPY_PX}px`);
  }
});

test("repetition is the minimum needed — no keyword stuffing", () => {
  for (const { name, phrases, preset } of BANDS) {
    const repeat = runRepeatCount(phrases, preset);
    assert.ok(repeat >= 1, `${name}: repeat must be >= 1`);
    if (repeat > 1) {
      const oneFewer = (estimateRunWidth(phrases, preset) / WIDTH_SAFETY) * (repeat - 1);
      assert.ok(
        oneFewer < MIN_COPY_PX,
        `${name}: repeat ${repeat} is one more than necessary`,
      );
    }
    // Rendered spans = runs * phrases * 2 (phrase + separator).
    const spans = repeat * 2 * phrases.length * 2;
    assert.ok(spans <= 80, `${name}: ${spans} spans is excessive DOM duplication`);
  }
});

test("directions oppose each other", () => {
  assert.equal(DECLARATION_BAND.direction, "left");
  assert.equal(TECHNICAL_BAND.direction, "right");
  assert.notEqual(DECLARATION_BAND.direction, TECHNICAL_BAND.direction);
});

test("velocities are distinct systems (technical >= 1.35x declaration)", () => {
  const ratio = TECHNICAL_BAND.velocityPxPerSecond / DECLARATION_BAND.velocityPxPerSecond;
  assert.ok(ratio >= 1.35, `velocity ratio ${ratio.toFixed(2)} is too close to parity`);
  assert.equal(DECLARATION_BAND.velocityPxPerSecond, 42);
  assert.equal(TECHNICAL_BAND.velocityPxPerSecond, 60);
});

test("duration is derived from distance / target velocity", () => {
  for (const { name, phrases, preset } of BANDS) {
    const distance = estimateRunWidth(phrases, preset) * runRepeatCount(phrases, preset);
    const duration = trackDurationSeconds(phrases, preset);
    assert.ok(duration > 0, `${name}: duration must be positive`);
    const derived = distance / duration;
    assert.ok(
      Math.abs(derived - preset.velocityPxPerSecond) < 0.5,
      `${name}: derived ${derived.toFixed(2)}px/s vs target ${preset.velocityPxPerSecond}px/s`,
    );
  }
});

test("typography hierarchy: declaration dominates the technical band", () => {
  assert.ok(DECLARATION_BAND.fontCeilingPx >= 4 * TECHNICAL_BAND.fontCeilingPx);
  assert.ok(DECLARATION_BAND.fontFloorPx >= 2 * TECHNICAL_BAND.fontFloorPx);
  // Technical band is denser (smaller gap relative to its own type size).
  assert.ok(TECHNICAL_BAND.gapPx < DECLARATION_BAND.gapPx);
});

test("responsive velocity never exceeds the desktop target and stays controlled", () => {
  for (const { name, phrases, preset } of BANDS) {
    const duration = trackDurationSeconds(phrases, preset);
    const distance = estimateRunWidth(phrases, preset) * runRepeatCount(phrases, preset);
    for (const [w] of VIEWPORTS) {
      const scale = effectiveFontPx(preset, w) / preset.fontCeilingPx;
      const boosted = w < 640 && preset.variant === "declaration";
      const effectiveDuration = boosted
        ? duration * SMALL_VIEWPORT_DURATION_SCALE
        : duration;
      const pxPerSecond = (distance * scale) / effectiveDuration;
      assert.ok(
        pxPerSecond <= preset.velocityPxPerSecond + 0.5,
        `${name} @${w}: ${pxPerSecond.toFixed(1)}px/s exceeds desktop target`,
      );
      assert.ok(
        pxPerSecond >= 20,
        `${name} @${w}: ${pxPerSecond.toFixed(1)}px/s reads as static, not kinetic`,
      );
    }
  }
});

test("content is source-first: only existing business facts", () => {
  assert.deepEqual(primary, [business.name, business.tagline]);
  assert.deepEqual(secondary, [locality, "Est. Training Floor", business.name]);
});

test("strip content matches lib/kinetic-strip.ts", () => {
  const data = readFileSync(new URL("../lib/kinetic-strip.ts", import.meta.url), "utf8");
  assert.ok(data.includes("primary: [business.name, business.tagline]"));
  assert.ok(data.includes('secondary: [locality, "Est. Training Floor", business.name]'));
  // No invented facts: the only literal string in the data file is the
  // existing "Est. Training Floor" label.
  const literals = (data.match(/"[^"]*"/g) ?? []).filter((s) => s.length > 2);
  assert.deepEqual(literals, ['"./business"', '"Est. Training Floor"']);
});

test("CSS type scale stays in sync with the band presets", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  // 1.6rem / 4.25rem and 0.6875rem / 0.8125rem mirror fontFloorPx/fontCeilingPx.
  assert.ok(css.includes("clamp(1.6rem, 5vw, 4.25rem)"), "declaration type scale drifted");
  assert.ok(
    css.includes("clamp(0.6875rem, 1.05vw, 0.8125rem)"),
    "technical type scale drifted",
  );
  assert.equal(DECLARATION_BAND.fontFloorPx, 1.6 * 16);
  assert.equal(DECLARATION_BAND.fontCeilingPx, 4.25 * 16);
  assert.equal(TECHNICAL_BAND.fontFloorPx, 0.6875 * 16);
  assert.equal(TECHNICAL_BAND.fontCeilingPx, 0.8125 * 16);
  // Line-ending agnostic: the literal previously embedded a bare "\n", which
  // never matches this repository's CRLF checkout on Windows. Predates
  // Section 05; the assertion's intent is unchanged.
  assert.match(
    css,
    new RegExp(
      `\\.factory-strip--declaration \\.factory-strip-track \\{\\s*animation-duration: calc\\(var\\(--factory-strip-duration, 48s\\) \\* ${SMALL_VIEWPORT_DURATION_SCALE}\\);`
    ),
    "small-viewport duration scale drifted from globals.css",
  );
});

test("motion is transform-only and compositor friendly", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const block = css.slice(
    css.indexOf("@keyframes factory-strip-left"),
    css.indexOf(".factory-strip--technical .factory-strip-sep"),
  );
  assert.ok(block.length > 0);
  assert.ok(block.includes("translate3d(-50%, 0, 0)"));
  assert.ok(block.includes("will-change: transform"));
  for (const banned of ["left:", "right:", "margin-left", "margin-right", "width: calc"]) {
    assert.ok(!block.includes(banned), `animated block must not touch ${banned}`);
  }
  // Clipping region present, so the oversized track cannot widen the document.
  assert.ok(block.includes("overflow: hidden"));
});

test("reduced motion stops movement and exposes the whole sequence", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
  assert.ok(reduced.includes(".factory-strip-track"));
  assert.ok(/\.factory-strip-track\s*{[^}]*animation:\s*none/.test(reduced));
  assert.ok(/\.factory-strip-track\s*{[^}]*white-space:\s*normal/.test(reduced));
  assert.ok(reduced.includes('.factory-strip-run[aria-hidden="true"]'));
  assert.ok(/\.factory-strip-run\[aria-hidden="true"\]\s*{\s*display:\s*none/.test(reduced));
});

test("strip ships no client JavaScript and no animation library", () => {
  const tsx = readFileSync(
    new URL("../components/sections/KineticStrip.tsx", import.meta.url),
    "utf8",
  );
  assert.ok(!tsx.includes('"use client"'), "KineticStrip must stay a Server Component");
  const pkg = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const banned of ["gsap", "framer-motion", "motion", "swiper", "aos", "lenis"]) {
    assert.ok(!(banned in deps), `${banned} must not be a dependency`);
  }
});

test("accessibility: meaningful content exposed exactly once per band", () => {
  const tsx = readFileSync(
    new URL("../components/sections/KineticStrip.tsx", import.meta.url),
    "utf8",
  );
  // Duplicate runs are hidden; run 0 stays in the accessibility tree.
  assert.ok(tsx.includes('aria-hidden={runIndex > 0 ? "true" : undefined}'));
  // Separator glyphs are always decorative.
  assert.ok(tsx.includes('<span aria-hidden="true" className="factory-strip-sep">'));
  // No interactive elements => no focus traps.
  for (const banned of ["<button", "<a ", "tabIndex", "onClick"]) {
    assert.ok(!tsx.includes(banned), `strip must not add interactive ${banned}`);
  }
});
