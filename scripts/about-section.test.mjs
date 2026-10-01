// Zero-dependency tests for Section 01 (facility editorial) data invariants.
// Run: node --test scripts/about-section.test.mjs  (Node >= 22.18 type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { aboutConfiguration, scheduleWindows } from "../lib/about.ts";

const ICONS = new Set(["strength", "cardio", "coaching", "equipment", "floor"]);
const ABOUT_SRC = readFileSync(
  new URL("../components/sections/About.tsx", import.meta.url),
  "utf8"
);

const UNIFORM = Array.from({ length: 7 }, (_, i) => ({
  day: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][i],
  open: "06:00 AM",
  close: "10:00 PM",
}));

// ---------------------------------------------------------------- schedule

test("consecutive days sharing a window collapse into one range", () => {
  const hours = UNIFORM.map((h, i) =>
    i >= 5 ? { ...h, open: "07:00 AM", close: "08:00 PM" } : h
  );
  const windows = scheduleWindows(hours);
  assert.deepEqual(windows, [
    { label: "Mon\u2013Fri", value: "06:00 AM \u2013 10:00 PM" },
    { label: "Sat\u2013Sun", value: "07:00 AM \u2013 08:00 PM" },
  ]);
});

test("a uniform week collapses to a single range", () => {
  assert.deepEqual(scheduleWindows(UNIFORM), [
    { label: "Mon\u2013Sun", value: "06:00 AM \u2013 10:00 PM" },
  ]);
});

test("a single day renders its own label, not a range", () => {
  assert.deepEqual(scheduleWindows([UNIFORM[0]]), [
    { label: "Mon", value: "06:00 AM \u2013 10:00 PM" },
  ]);
});

test("more than three distinct windows renders nothing (stays a module, not a timetable)", () => {
  const fragmented = UNIFORM.map((h, i) => ({
    ...h,
    close: `${String(8 + i).padStart(2, "0")}:00 PM`,
  }));
  assert.deepEqual(scheduleWindows(fragmented), []);
});

test("no hours, or an incomplete row, renders nothing rather than a partial claim", () => {
  assert.deepEqual(scheduleWindows([]), []);
  assert.deepEqual(
    scheduleWindows([{ day: "Monday", open: "", close: "10:00 PM" }]),
    []
  );
  assert.deepEqual(
    scheduleWindows([...UNIFORM, { day: "Holiday", open: "06:00 AM", close: "" }]),
    []
  );
});

// ------------------------------------------------------------------- data

test("section 01 authors exactly one image, with real alt text", () => {
  const { image } = aboutConfiguration;
  assert.ok(image.src.startsWith("/assets/"), "image is a local asset");
  assert.ok(image.alt.trim().length >= 20, "alt text describes the photograph");
  // Section 01 is a single-plate composition, never a gallery.
  assert.equal(ABOUT_SRC.match(/<Image/g).length, 1);
});

test("every zone/attribute has a unique id, a label and a known icon", () => {
  const ids = new Set();
  for (const zone of aboutConfiguration.zones) {
    assert.ok(zone.label.trim().length > 0, `${zone.id} has a label`);
    assert.ok(ICONS.has(zone.icon), `${zone.id} icon is in the fixed set`);
    assert.equal(ids.has(zone.id), false, `${zone.id} is unique`);
    ids.add(zone.id);
    assert.equal(typeof zone.verified, "boolean");
  }
  for (const attribute of aboutConfiguration.attributes) {
    assert.ok(attribute.label.trim().length > 0);
    assert.equal(ids.has(attribute.id), false, `${attribute.id} is unique`);
    ids.add(attribute.id);
    assert.equal(typeof attribute.verified, "boolean");
  }
});

test("the verified gate is what the component renders through", () => {
  assert.match(ABOUT_SRC, /zones\.filter\(\(zone\) => zone\.verified\)/);
  assert.match(
    ABOUT_SRC,
    /attributes\.filter\(\(attribute\) => attribute\.verified\)/
  );
  // The demo data keeps unverified rows in place to prove the gate works.
  assert.ok(
    aboutConfiguration.attributes.some((a) => !a.verified),
    "at least one attribute is intentionally unverified"
  );
});

test("headline is authored as explicit lines, so the break is not accidental", () => {
  const { headlineLines } = aboutConfiguration;
  assert.ok(headlineLines.length >= 1 && headlineLines.length <= 3);
  for (const line of headlineLines) {
    assert.ok(line.trim().length > 0);
    assert.equal(line.includes("\n"), false);
  }
});

test("no business prose is duplicated into lib/about.ts", () => {
  const source = readFileSync(new URL("../lib/about.ts", import.meta.url), "utf8");
  // No runtime business import: the data file carries structure and labels
  // only, so the narrative has exactly one source (business.description,
  // read by the component).
  assert.equal(/^import (?!type )/m.test(source), false);
  assert.match(ABOUT_SRC, /business\.description/);
  // Labels stay short — a paragraph of prose here would mean the narrative
  // had been forked.
  for (const zone of aboutConfiguration.zones) {
    assert.ok((zone.detail ?? "").length <= 90, `${zone.id} detail is one line`);
  }
});
