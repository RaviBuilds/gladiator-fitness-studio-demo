// Zero-dependency tests for the hero zone helper.
// Run: node --test scripts/hero-zone.test.mjs  (Node >= 22.18 / 23.6 type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeZoneOffset,
  ZONE_GAP_PCT,
  ZONE_MIN_PCT,
  ZONE_MAX_PCT,
} from "../components/motion/heroZone.ts";

test("390x844 reference: offset measured from copy top", () => {
  // section 776px, copy top 449px above the bottom
  const v = computeZoneOffset(776, 776, 327);
  assert.ok(Math.abs(v - ((449 / 776) * 100 + 2)) < 1e-9);
  assert.ok(Math.abs(v - 59.86) < 0.01);
});

test("floor clamp returns the minimum", () => {
  assert.equal(computeZoneOffset(800, 800, 790), ZONE_MIN_PCT);
});

test("ceiling clamp returns the maximum", () => {
  assert.equal(computeZoneOffset(613, 613, 0), ZONE_MAX_PCT);
});

test("zero section height returns null", () => {
  assert.equal(computeZoneOffset(0, 0, 0), null);
});

// Seeded PRNG (mulberry32) so the random property loop is reproducible.
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// **Validates: Requirements 2.1, 2.3**
test("property: clamped to range, exact in range, non-increasing in copyTop", () => {
  const rand = mulberry32(0x5eed);
  for (let i = 0; i < 2000; i++) {
    const secH = 560 + rand() * 840; // [560, 1400]
    const secTop = rand() * 200 - 100;
    const secB = secTop + secH;
    const copyTopA = secTop + rand() * secH;
    const copyTopB = copyTopA + rand() * (secB - copyTopA);

    const a = computeZoneOffset(secB, secH, copyTopA);
    const b = computeZoneOffset(secB, secH, copyTopB);
    const ctx = JSON.stringify({ secH, secTop, copyTopA, copyTopB });

    assert.ok(a >= ZONE_MIN_PCT && a <= ZONE_MAX_PCT, `range ${ctx}`);
    const unclamped = ((secB - copyTopA) / secH) * 100 + ZONE_GAP_PCT;
    if (unclamped >= ZONE_MIN_PCT && unclamped <= ZONE_MAX_PCT) {
      assert.ok(Math.abs(a - unclamped) < 1e-9, `exact ${ctx}`);
    }
    assert.ok(b <= a, `monotonic ${ctx}`);
  }
});

// Data check on authored hero compositions: front-layer type (~3.3em wide
// for a 7-char word like "POWER." or "INTENT." in Geist 800 at -0.035em
// tracking) must end by 96% of the width. Uses the front layer's *effective*
// size (frontSize override when authored, else the shared typeSize), which
// is what app/globals.css actually resolves via
// `var(--hero-*-front-size, var(--hero-*-type-size))`.
// **Validates: Requirements 2.10**
test("data: every composition frame keeps frontLeft + 3.3*frontSize <= 96", async () => {
  const { heroConfiguration } = await import("../lib/hero.ts");
  let frames = 0;
  for (const [i, slide] of heroConfiguration.slides.entries()) {
    if (!slide.composition) continue;
    for (const [name, f] of Object.entries(slide.composition)) {
      const left = parseFloat(f.frontLeft);
      const size = parseFloat(f.frontSize ?? f.typeSize);
      assert.ok(
        left + 3.3 * size <= 96,
        `slide ${i} ${name}: ${left} + 3.3*${size} = ${left + 3.3 * size}`,
      );
      frames++;
    }
  }
  assert.ok(frames > 0);
});
