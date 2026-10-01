// Zero-dependency tests for the Section 06 (Reviews / MEMBER SIGNAL) helper.
// Run: node --test scripts/review-signal.test.mjs  (Node >= 22.18 / 23.6 type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildSignalSet,
  padRef,
  padCount,
  buildRatingAccessibleName,
  stepIndex,
  getInitials,
} from "../components/sections/reviewSignal.ts";
import { googleReviews } from "../lib/reviews.ts";

const THREE = [
  { name: "A", text: "Text A", rating: 5 },
  { name: "B", text: "Text B", rating: 4 },
  { name: "C", text: "Text C", rating: 5 },
];

test("buildSignalSet returns null for an empty review list", () => {
  assert.equal(buildSignalSet([]), null);
});

test("buildSignalSet with a single review: featured only, no supporting", () => {
  const set = buildSignalSet([{ name: "Solo", text: "Only review" }]);
  assert.ok(set);
  assert.equal(set.total, 1);
  assert.equal(set.featured.name, "Solo");
  assert.equal(set.featured.index, 0);
  assert.deepEqual(set.supporting, []);
});

test("buildSignalSet default active=0 promotes the first review", () => {
  const set = buildSignalSet(THREE);
  assert.ok(set);
  assert.equal(set.featured.name, "A");
  assert.equal(set.supporting.map((r) => r.name).join(","), "B,C");
});

test("buildSignalSet promotes the requested index and preserves order of the rest", () => {
  const set = buildSignalSet(THREE, 1);
  assert.ok(set);
  assert.equal(set.featured.name, "B");
  assert.equal(set.featured.index, 1);
  assert.equal(set.supporting.map((r) => r.name).join(","), "A,C");
});

test("buildSignalSet clamps an out-of-range active index instead of throwing", () => {
  const high = buildSignalSet(THREE, 99);
  assert.ok(high);
  assert.equal(high.featured.name, "C");

  const negative = buildSignalSet(THREE, -5);
  assert.ok(negative);
  assert.equal(negative.featured.name, "A");
});

test("buildSignalSet scales to 5+ reviews with no code changes required", () => {
  const five = [...THREE, { name: "D", text: "Text D" }, { name: "E", text: "Text E" }];
  const set = buildSignalSet(five, 3);
  assert.ok(set);
  assert.equal(set.total, 5);
  assert.equal(set.featured.name, "D");
  assert.equal(set.supporting.length, 4);
});

test("padRef zero-pads a 0-based index into a 2-digit 1-based reference", () => {
  assert.equal(padRef(0), "01");
  assert.equal(padRef(8), "09");
  assert.equal(padRef(11), "12");
});

test("padCount zero-pads a total WITHOUT adding one", () => {
  // Regression: the featured-review counter used to render padRef(total),
  // which showed "01 / 04" for three reviews and "01 / 05" for four — a
  // phantom extra entry that read as a duplicated review.
  assert.equal(padCount(1), "01");
  assert.equal(padCount(3), "03");
  assert.equal(padCount(4), "04");
  assert.equal(padCount(12), "12");
  assert.equal(padCount(0), "00");
});

test("the featured counter never reports more reviews than exist", () => {
  for (const list of [THREE, [...THREE, { name: "D", text: "Text D" }]]) {
    const set = buildSignalSet(list, 0);
    assert.ok(set);
    assert.equal(padCount(set.total), String(list.length).padStart(2, "0"));
    // Last review's 1-based ref must equal the total, not exceed it.
    const last = buildSignalSet(list, list.length - 1);
    assert.equal(padRef(last.featured.index), padCount(set.total));
  }
});

test("the counter the component renders is index/total, both 1-based", () => {
  const src = readFileSync(
    new URL("../components/motion/ReviewSignal.tsx", import.meta.url),
    "utf8"
  );
  // Totals must go through padCount; padRef(total) is the off-by-one bug.
  assert.equal(/padRef\(\s*total\s*\)/.test(src), false, "padRef(total) reintroduces the off-by-one");
  assert.match(src, /padCount\(\s*total\s*\)/);
});

test("configured review data contains no duplicated review object", () => {
  const seen = new Set();
  for (const r of googleReviews.reviews) {
    const fingerprint = `${r.name.trim().toLowerCase()}::${r.text.trim().toLowerCase()}`;
    assert.equal(
      seen.has(fingerprint),
      false,
      `duplicate review entry for "${r.name}" — same name and text twice`
    );
    seen.add(fingerprint);
  }
});

test("buildSignalSet never repeats a review across featured and supporting", () => {
  for (let active = 0; active < googleReviews.reviews.length; active++) {
    const set = buildSignalSet(googleReviews.reviews, active);
    assert.ok(set);
    const indexes = [set.featured.index, ...set.supporting.map((r) => r.index)];
    assert.equal(new Set(indexes).size, indexes.length, "an index appears twice");
    assert.equal(indexes.length, googleReviews.reviews.length, "a review was lost or added");
    assert.equal(set.supporting.some((r) => r.index === set.featured.index), false);
  }
});

test("stepping through every review visits each exactly once and wraps home", () => {
  const total = googleReviews.reviews.length;
  const visited = [];
  let i = 0;
  for (let step = 0; step < total; step++) {
    visited.push(i);
    i = stepIndex(i, 1, total);
  }
  assert.equal(new Set(visited).size, total, "navigation revisits or skips a review");
  assert.equal(i, 0, "navigation does not wrap back to the first review");
});

test("no review carries an invented star rating", () => {
  for (const r of googleReviews.reviews) {
    if (r.rating !== undefined) {
      assert.ok(r.rating >= 1 && r.rating <= 5, `${r.name} has an out-of-range rating`);
    }
  }
});

test("buildRatingAccessibleName renders a fixed one-decimal rating sentence", () => {
  assert.equal(
    buildRatingAccessibleName(4.8, 126),
    "Rated 4.8 out of 5 from 126 Google reviews"
  );
  assert.equal(
    buildRatingAccessibleName(5, 1),
    "Rated 5.0 out of 5 from 1 Google reviews"
  );
});

test("stepIndex wraps forward past the end of the list", () => {
  assert.equal(stepIndex(2, 1, 3), 0);
  assert.equal(stepIndex(0, 1, 3), 1);
});

test("stepIndex wraps backward past the start of the list", () => {
  assert.equal(stepIndex(0, -1, 3), 2);
  assert.equal(stepIndex(1, -1, 3), 0);
});

test("stepIndex on a single-review list always returns 0", () => {
  assert.equal(stepIndex(0, 1, 1), 0);
  assert.equal(stepIndex(0, -1, 1), 0);
});

test("stepIndex on an empty list returns 0 rather than throwing/NaN", () => {
  assert.equal(stepIndex(0, 1, 0), 0);
});

test("getInitials derives two letters from a first+last name", () => {
  assert.equal(getInitials("Demo Reviewer"), "DR");
});

test("getInitials uses the first two letters of a single-word name", () => {
  assert.equal(getInitials("Madonna"), "MA");
});

test("getInitials handles extra whitespace between words", () => {
  assert.equal(getInitials("  Demo   Reviewer  "), "DR");
});

test("getInitials only uses the first two words for a longer name", () => {
  assert.equal(getInitials("Demo Middle Reviewer"), "DM");
});

test("getInitials falls back to a placeholder glyph for an empty name", () => {
  assert.equal(getInitials(""), "?");
  assert.equal(getInitials("   "), "?");
});
