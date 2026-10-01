// Zero-dependency tests for Section 07 (BETWEEN SESSIONS + BODY MAP).
// Run: node --test scripts/between-sessions.test.mjs
//      (Node >= 22.18 / 23.6 type stripping — .ts modules are imported directly)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  WEEK_LENGTH,
  buildStationViews,
  classifyGap,
  describeDay,
  enabledStations,
  normalizePattern,
  pad,
  readWeekPattern,
  sessionNumerals,
  usablePatterns,
  withCtaMessage,
} from "../components/sections/intervalLog.ts";

import {
  AXIS_SPLIT,
  AXIS_X,
  BAR_FROM,
  BAR_TO,
  BAR_Y,
  BODY_MAP_VIEWS,
  BRACKET_X,
  CONSTRUCTION_LINES,
  DEFINITION_PATHS,
  FIGURE_CROP_W,
  FIGURE_STATES,
  FLOOR_FROM,
  FLOOR_TO,
  FLOOR_Y,
  FRAME_H,
  FRAME_W,
  FRAME_X,
  FRAME_Y,
  LABEL_BOTTOM_BOUND,
  LABEL_GUTTER_LEFT,
  LABEL_MIN_SPACING,
  LABEL_TOP_BOUND,
  LABEL_ZONE_X,
  MIRROR_TRANSFORM,
  REGION_GEOMETRY,
  REGION_IDS,
  SILHOUETTE,
  SOFT_GAIN,
  TIE_X,
  TRAINED_GAIN,
  VIEW_BOX,
  buildFigureSummary,
  derive,
  floorTicks,
  framePercent,
  layoutLabels,
  regionsForView,
  resolveGroups,
  smoothPath,
  viewForGroup,
} from "../components/sections/bodyMap.ts";

import { betweenSessionsConfiguration } from "../lib/between-sessions.ts";
import { sections } from "../lib/sections.ts";

const SECTION_SRC = readFileSync(
  new URL("../components/sections/BetweenSessions.tsx", import.meta.url),
  "utf8"
);
const MAP_SRC = readFileSync(
  new URL("../components/motion/BodyMap.tsx", import.meta.url),
  "utf8"
);
const CHECK_SRC = readFileSync(
  new URL("../components/motion/PreSessionCheck.tsx", import.meta.url),
  "utf8"
);
const WEEK_SRC = readFileSync(
  new URL("../components/motion/TrainingWeek.tsx", import.meta.url),
  "utf8"
);
const DATA_SRC = readFileSync(
  new URL("../lib/between-sessions.ts", import.meta.url),
  "utf8"
);
const CSS_SRC = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const PAGE_SRC = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

const CSS_BLOCK = CSS_SRC.slice(CSS_SRC.indexOf("Pass 11 - Section 07"));

/* =========================================================================
 * 1. Interval log derivation
 * ====================================================================== */

test("pad zero-pads to two digits", () => {
  assert.equal(pad(1), "01");
  assert.equal(pad(9), "09");
  assert.equal(pad(12), "12");
});

test("enabledStations drops disabled stations", () => {
  const stations = [
    { id: "a", enabled: true },
    { id: "b", enabled: false },
    { id: "c", enabled: true },
  ];
  assert.deepEqual(
    enabledStations(stations).map((s) => s.id),
    ["a", "c"]
  );
});

test("buildStationViews renumbers AFTER filtering, so the log never shows a gap", () => {
  const views = buildStationViews([
    { id: "a", enabled: true },
    { id: "b", enabled: false },
    { id: "c", enabled: true },
    { id: "d", enabled: true },
  ]);
  assert.deepEqual(
    views.map((v) => v.index),
    ["01", "02", "03"]
  );
  assert.deepEqual(
    views.map((v) => v.id),
    ["a", "c", "d"]
  );
});

test("buildStationViews marks only the final station as last", () => {
  const views = buildStationViews([
    { id: "a", enabled: true },
    { id: "b", enabled: true },
  ]);
  assert.deepEqual(
    views.map((v) => v.last),
    [false, true]
  );
});

test("buildStationViews on an all-disabled list returns nothing to render", () => {
  assert.deepEqual(buildStationViews([{ id: "a", enabled: false }]), []);
});

/* =========================================================================
 * 2. Week pattern derivation
 * ====================================================================== */

const GAP_COPY = {
  short: { label: "Short gap", detail: "short detail" },
  standard: { label: "Standard gap", detail: "standard detail" },
  long: { label: "Long gap", detail: "long detail" },
};

test("classifyGap thresholds are descriptive bands, not a ranking", () => {
  assert.equal(classifyGap(0), "short");
  assert.equal(classifyGap(1), "short");
  assert.equal(classifyGap(2), "standard");
  assert.equal(classifyGap(3), "long");
  assert.equal(classifyGap(6), "long");
});

test("readWeekPattern returns null for a week with no sessions", () => {
  assert.equal(readWeekPattern([false, false, false, false, false, false, false], GAP_COPY), null);
});

test("readWeekPattern counts sessions and rest days", () => {
  const readout = readWeekPattern(
    [true, false, true, false, true, false, false],
    GAP_COPY
  );
  assert.equal(readout.sessions, 3);
  assert.equal(readout.restDays, 4);
});

test("readWeekPattern measures gaps circularly, because a training week repeats", () => {
  // Mon / Wed / Fri -> 1 empty day, 1 empty day, then Sat+Sun back to Mon.
  const readout = readWeekPattern(
    [true, false, true, false, true, false, false],
    GAP_COPY
  );
  assert.deepEqual(readout.gaps, [1, 1, 2]);
  assert.equal(readout.longestGap, 2);
  assert.equal(readout.gapKey, "standard");
  assert.equal(readout.gapLabel, "Standard gap");
});

test("readWeekPattern marks the longest gap's days even when it wraps the week", () => {
  // Sat / Sun only: the gap runs Mon-Fri after wrapping forward from Sunday.
  const readout = readWeekPattern(
    [false, false, false, false, false, true, true],
    GAP_COPY
  );
  assert.equal(readout.longestGap, 5);
  assert.equal(readout.gapKey, "long");
  assert.deepEqual(readout.longestGapDays.slice().sort((a, b) => a - b), [0, 1, 2, 3, 4]);
});

test("readWeekPattern handles a single session without producing NaN", () => {
  const readout = readWeekPattern(
    [true, false, false, false, false, false, false],
    GAP_COPY
  );
  assert.equal(readout.sessions, 1);
  assert.equal(readout.longestGap, WEEK_LENGTH - 1);
  assert.equal(readout.longestGapDays.length, WEEK_LENGTH - 1);
});

test("readWeekPattern marks every day when the week is full of sessions", () => {
  const readout = readWeekPattern(new Array(7).fill(true), GAP_COPY);
  assert.equal(readout.sessions, 7);
  assert.equal(readout.restDays, 0);
  assert.equal(readout.longestGap, 0);
  assert.deepEqual(readout.longestGapDays, []);
  assert.equal(readout.gapKey, "short");
});

test("normalizePattern pads a short pattern and truncates a long one", () => {
  assert.deepEqual(normalizePattern({ id: "x", label: "x", days: [true] }), [
    true,
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
  assert.equal(
    normalizePattern({ id: "x", label: "x", days: new Array(12).fill(true) }).length,
    WEEK_LENGTH
  );
});

test("usablePatterns drops a pattern with no session in it", () => {
  const week = {
    patterns: [
      { id: "empty", label: "Empty", days: new Array(7).fill(false) },
      { id: "one", label: "One", days: [true, false, false, false, false, false, false] },
    ],
  };
  assert.deepEqual(
    usablePatterns(week).map((p) => p.id),
    ["one"]
  );
});

test("sessionNumerals numbers training days in order and leaves rest days null", () => {
  assert.deepEqual(
    sessionNumerals([true, false, true, false, false, false, false]),
    ["01", null, "02", null, null, null, null]
  );
});

test("describeDay states each cell's meaning in words, never by colour alone", () => {
  const week = {
    dayLabels: ["Mon"],
    dayNames: ["Monday"],
    sessionDayLabel: "training day",
    restDayLabel: "no session",
  };
  assert.equal(describeDay(0, true, week), "Monday — training day");
  assert.equal(describeDay(0, false, week), "Monday — no session");
});

/* =========================================================================
 * 3. CTA href
 * ====================================================================== */

test("withCtaMessage swaps only the text parameter of the site-wide href", () => {
  const href = withCtaMessage(
    "https://wa.me/15551234567?text=Hi%20there",
    "Hi, I'd like to discuss my training and recovery routine."
  );
  const url = new URL(href);
  assert.equal(url.host, "wa.me");
  assert.equal(url.pathname, "/15551234567");
  assert.equal(
    url.searchParams.get("text"),
    "Hi, I'd like to discuss my training and recovery routine."
  );
});

test("withCtaMessage encodes spaces as %20, never as +", () => {
  const href = withCtaMessage("https://wa.me/1?text=a", "two words");
  assert.ok(href.includes("%20"));
  assert.ok(!href.includes("+"));
});

test("withCtaMessage leaves a href with no text parameter untouched", () => {
  assert.equal(withCtaMessage("tel:+15551234567", "message"), "tel:+15551234567");
  assert.equal(withCtaMessage("https://example.com/contact", "m"), "https://example.com/contact");
});

test("withCtaMessage returns an unparseable href unchanged rather than throwing", () => {
  assert.equal(withCtaMessage("#contact", "m"), "#contact");
});

/* =========================================================================
 * 4. Figure geometry
 * ====================================================================== */

test("VIEW_BOX matches the exported frame constants", () => {
  assert.equal(VIEW_BOX, `${FRAME_X} ${FRAME_Y} ${FRAME_W} ${FRAME_H}`);
});

test("smoothPath emits a cubic path, and closes only when asked", () => {
  const open = smoothPath([
    { x: 0, y: 0 },
    { x: 10, y: 10 },
    { x: 20, y: 0 },
  ]);
  assert.ok(open.startsWith("M 0 0"));
  assert.ok(open.includes(" C "));
  assert.ok(!open.endsWith("Z"));

  const closed = smoothPath(
    [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 0 },
    ],
    true
  );
  assert.ok(closed.endsWith("Z"));
});

test("smoothPath degrades safely on empty and single-point input", () => {
  assert.equal(smoothPath([]), "");
  assert.equal(smoothPath([{ x: 3, y: 4 }]), "M 3 4");
});

/** Pull every absolute coordinate pair out of a path string. */
function coordsOf(d) {
  const numbers = d.match(/-?\d+(?:\.\d+)?/g) ?? [];
  const points = [];
  for (let i = 0; i + 1 < numbers.length; i += 2) {
    points.push({ x: Number(numbers[i]), y: Number(numbers[i + 1]) });
  }
  return points;
}

const ALL_PATHS = [
  ...FIGURE_STATES.flatMap((state) => SILHOUETTE[state].map((part) => part.d)),
  ...FIGURE_STATES.flatMap((state) =>
    Object.values(REGION_GEOMETRY).map((region) => region.d[state])
  ),
  ...BODY_MAP_VIEWS.flatMap((view) => [
    ...DEFINITION_PATHS[view].shared,
    ...DEFINITION_PATHS[view].trained,
  ]),
];

test("every drawn coordinate — including bezier handles — stays inside the frame", () => {
  for (const d of ALL_PATHS) {
    for (const point of coordsOf(d)) {
      assert.ok(
        point.x >= FRAME_X && point.x <= FRAME_X + FRAME_W,
        `x ${point.x} outside frame in ${d.slice(0, 40)}`
      );
      assert.ok(
        point.y >= FRAME_Y && point.y <= FRAME_Y + FRAME_H,
        `y ${point.y} outside frame in ${d.slice(0, 40)}`
      );
    }
  }
});

/** Sample a path's cubics, so assertions are about the drawn curve. */
function sampleCurve(d, steps = 16) {
  const tokens = d.match(/[MCZ]|-?\d+(?:\.\d+)?/g) ?? [];
  const out = [];
  let i = 0;
  let cx = 0;
  let cy = 0;
  while (i < tokens.length) {
    if (tokens[i] === "M") {
      cx = Number(tokens[i + 1]);
      cy = Number(tokens[i + 2]);
      out.push({ x: cx, y: cy });
      i += 3;
    } else if (tokens[i] === "C") {
      const [x1, y1, x2, y2, x, y] = tokens.slice(i + 1, i + 7).map(Number);
      for (let s = 1; s <= steps; s += 1) {
        const u = s / steps;
        const v = 1 - u;
        out.push({
          x: v * v * v * cx + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x,
          y: v * v * v * cy + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y,
        });
      }
      cx = x;
      cy = y;
      i += 7;
    } else i += 1;
  }
  return out;
}

test("the figure is authored on the right half only, so the mirror is exact", () => {
  assert.equal(MIRROR_TRANSFORM, `translate(${AXIS_X * 2} 0) scale(-1 1)`);
  // Measured on the DRAWN curve, not on bezier handles: a handle may sit a unit
  // or two past the axis at the crotch cusp without the curve ever getting
  // there, and it is the curve the two halves meet along.
  for (const d of ALL_PATHS) {
    for (const point of sampleCurve(d)) {
      assert.ok(
        point.x >= AXIS_X - 0.5,
        `curve reaches x ${point.x.toFixed(2)}, past the axis, in ${d.slice(0, 40)}`
      );
    }
  }
});

test("no muscle region bulges across the centre axis", () => {
  for (const state of FIGURE_STATES) {
    for (const [id, region] of Object.entries(REGION_GEOMETRY)) {
      for (const point of sampleCurve(region.d[state])) {
        assert.ok(
          point.x >= AXIS_X + 1,
          `${id} (${state}) reaches x ${point.x.toFixed(2)}, at the axis ${AXIS_X}`
        );
      }
    }
  }
});

test("the silhouette is four parts in back-to-front draw order", () => {
  for (const state of FIGURE_STATES) {
    assert.deepEqual(
      SILHOUETTE[state].map((part) => part.id),
      ["torso", "leg", "arm", "head"]
    );
  }
});

test("the assembly is occluded, so four parts read as one body", () => {
  for (const state of FIGURE_STATES) {
    const byId = Object.fromEntries(SILHOUETTE[state].map((p) => [p.id, p]));
    // The torso is behind both the leg and the arm, which is what removes the
    // arc across the hips and the flank line running through the arm.
    assert.deepEqual(byId.torso.occludedBy, ["leg", "arm"]);
    assert.ok(!byId.leg.occludedBy);
    assert.ok(!byId.arm.occludedBy);
    assert.ok(!byId.head.occludedBy);
    // Every named occluder must exist, or a mask would silently do nothing.
    for (const part of SILHOUETTE[state]) {
      for (const frontId of part.occludedBy ?? []) {
        assert.ok(byId[frontId], `${part.id} names a missing occluder ${frontId}`);
      }
    }
  }
});

test("the figure spans head to floor", () => {
  const ys = SILHOUETTE.trained.flatMap((part) => coordsOf(part.d).map((p) => p.y));
  assert.ok(Math.min(...ys) < 30, "figure should start near the top of the frame");
  assert.ok(Math.max(...ys) > FLOOR_Y - 10, "figure should stand on the floor line");
});

test("both views draw the same silhouette, so front and back cannot drift apart", () => {
  // The silhouette table is view-independent by construction; this locks it.
  assert.equal(SILHOUETTE.trained.length, 4);
  assert.ok(!/front|back/i.test(SILHOUETTE.trained.map((p) => p.id).join(" ")));
});

test("the region and definition layers are clipped to the silhouette", () => {
  assert.ok(
    MAP_SRC.includes("id={`s07-body-clip-${state}`}"),
    "a clip path per state is required, since the contours differ"
  );
  assert.equal(FIGURE_STATES.length, 2);
  assert.ok(
    MAP_SRC.includes('className="s07-svg-regions"') &&
      MAP_SRC.includes("clipPath={`url(#s07-body-clip-${state})`}"),
    "regions and definition marks must be clipped to their own state's body"
  );
  // The clip is built from the same SILHOUETTE table that draws the body.
  const clip = MAP_SRC.slice(
    MAP_SRC.indexOf("id={`s07-body-clip-${state}`}"),
    MAP_SRC.indexOf("</clipPath>")
  );
  assert.ok(clip.includes("SILHOUETTE[state].map"));
});

test("the occlusion masks are declared and applied", () => {
  assert.ok(MAP_SRC.includes("id={`s07-mask-${state}-${part.id}`}"));
  assert.ok(MAP_SRC.includes('maskUnits="userSpaceOnUse"'));
  assert.ok(MAP_SRC.includes("mask={"));
  assert.ok(MAP_SRC.includes("part.occludedBy?.length"));
  assert.ok(MAP_SRC.includes('fill="#000"'), "the occluder must subtract, not add");
});

test("every region sits within the figure's vertical span", () => {
  const ys = SILHOUETTE.trained.flatMap((part) => coordsOf(part.d).map((p) => p.y));
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  for (const [id, region] of Object.entries(REGION_GEOMETRY)) {
    assert.ok(region.top >= top, `${id} starts above the figure`);
    assert.ok(region.bottom <= bottom, `${id} ends below the figure`);
    assert.ok(region.bottom > region.top, `${id} has no vertical extent`);
  }
});

/** On-curve anchor points only: the M target and each C command's end point. */
function anchorsOf(d) {
  const anchors = [];
  const commands = d.match(/[MC][^MCZ]*/g) ?? [];
  for (const command of commands) {
    const numbers = (command.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    if (numbers.length < 2) continue;
    anchors.push({ x: numbers[numbers.length - 2], y: numbers[numbers.length - 1] });
  }
  return anchors;
}

test("each region's extent is derived from its own geometry, not hand-listed", () => {
  for (const [id, region] of Object.entries(REGION_GEOMETRY)) {
    const ys = anchorsOf(region.d.trained).map((p) => p.y);
    assert.equal(region.top, Math.min(...ys), `${id} top drifted from its geometry`);
    assert.equal(region.bottom, Math.max(...ys), `${id} bottom drifted from its geometry`);
  }
});

test("region ids declare a view, and both views have regions", () => {
  const views = new Set(Object.values(REGION_GEOMETRY).map((r) => r.view));
  assert.deepEqual([...views].sort(), ["back", "front"]);
  for (const id of REGION_IDS) {
    assert.ok(id.startsWith(`${REGION_GEOMETRY[id].view}-`), `${id} view/id mismatch`);
  }
});

test("the dimension column and label gutter sit clear of the figure", () => {
  const maxFigureX = Math.max(
    ...FIGURE_STATES.flatMap((state) =>
      SILHOUETTE[state].flatMap((part) => coordsOf(part.d).map((p) => p.x))
    )
  );
  assert.ok(BRACKET_X > maxFigureX, "bracket column overlaps the figure");
  assert.ok(TIE_X > BRACKET_X);
  assert.ok(LABEL_ZONE_X >= TIE_X);
  assert.ok(LABEL_ZONE_X < FRAME_X + FRAME_W);
});

test("the gym geometry (barbell line, floor baseline, guides) stays in frame", () => {
  assert.ok(BAR_FROM >= FRAME_X && BAR_TO <= FRAME_X + FRAME_W);
  assert.ok(BAR_Y > FRAME_Y && BAR_Y < FRAME_Y + FRAME_H);
  assert.ok(FLOOR_FROM >= FRAME_X && FLOOR_TO <= FRAME_X + FRAME_W);
  assert.ok(FLOOR_Y < FRAME_Y + FRAME_H);
  for (const line of CONSTRUCTION_LINES) {
    assert.ok(line.from < line.to);
    assert.ok(line.from >= FRAME_X && line.to <= FRAME_X + FRAME_W);
  }
});

test("floorTicks are evenly spaced strictly inside the baseline", () => {
  const ticks = floorTicks();
  assert.ok(ticks.length >= 4);
  for (const tick of ticks) {
    assert.ok(tick > FLOOR_FROM && tick < FLOOR_TO);
  }
  const deltas = ticks.slice(1).map((t, i) => t - ticks[i]);
  assert.equal(new Set(deltas).size, 1);
});

test("framePercent maps the frame's own origin and height, not the raw viewBox", () => {
  assert.equal(framePercent(FRAME_Y), "0%");
  assert.equal(framePercent(FRAME_Y + FRAME_H), "100%");
});

test("LABEL_GUTTER_LEFT is derived from the gutter's real position", () => {
  const expected = ((LABEL_ZONE_X - FRAME_X) / FRAME_W) * 100;
  assert.equal(LABEL_GUTTER_LEFT, `${Math.round(expected * 100) / 100}%`);
});

/* =========================================================================
 * 4b. Same body, different training state
 * ====================================================================== */

/** Anchors of the authored table, in order, for one part and state. */
function partAnchors(state, id) {
  const part = SILHOUETTE[state].find((p) => p.id === id);
  return anchorsOf(part.d);
}

test("derive only ever moves x, so nothing about the body's proportions can differ", () => {
  const moved = derive([{ x: 100, y: 200, s: 4 }], "trained");
  assert.equal(moved[0].y, 200);
  assert.equal(moved[0].x, 104);
  const softened = derive([{ x: 100, y: 200, s: 4 }], "base");
  assert.equal(softened[0].y, 200);
  assert.equal(softened[0].x, 100 + 4 * SOFT_GAIN);
  assert.ok(SOFT_GAIN < 0, "the untrained state must soften, not swell");
  assert.equal(TRAINED_GAIN, 1);
});

test("both states share identical height, joint heights and limb placement", () => {
  for (const id of ["torso", "leg", "arm", "head"]) {
    const base = partAnchors("base", id);
    const trained = partAnchors("trained", id);
    assert.equal(base.length, trained.length, `${id} anchor count differs`);
    for (let i = 0; i < base.length; i += 1) {
      assert.equal(base[i].y, trained[i].y, `${id} anchor ${i} moved vertically`);
    }
  }
});

test("the head is byte-identical between states, so it reads as one person", () => {
  const base = SILHOUETTE.base.find((p) => p.id === "head");
  const trained = SILHOUETTE.trained.find((p) => p.id === "head");
  assert.equal(base.d, trained.d);
});

/** Half-width of a part at a given authored y, on one side of the axis. */
function widthAt(state, id, y) {
  const anchors = partAnchors(state, id).filter((a) => Math.abs(a.y - y) < 0.01);
  assert.ok(anchors.length >= 2, `${id} has no pair of anchors at y=${y}`);
  const xs = anchors.map((a) => a.x);
  return Math.max(...xs) - Math.min(...xs);
}

test("the trained state is fuller at the muscle bellies, by a believable margin", () => {
  // Upper arm at the biceps belly, forearm belly — both authored with a pair of
  // anchors at the same y, so the thickness is directly measurable.
  for (const [label, y] of [
    ["biceps belly", 152],
    ["forearm belly", 230],
  ]) {
    const base = widthAt("base", "arm", y);
    const trained = widthAt("trained", "arm", y);
    const ratio = trained / base;
    assert.ok(ratio > 1.1, `${label}: trained only ${ratio.toFixed(2)}x — not visible`);
    assert.ok(ratio < 1.35, `${label}: trained ${ratio.toFixed(2)}x — a physique claim`);
  }

  for (const [label, y] of [
    ["quadriceps", 300],
    ["calf", 380],
  ]) {
    const base = widthAt("base", "leg", y);
    const trained = widthAt("trained", "leg", y);
    const ratio = trained / base;
    assert.ok(ratio > 1.1, `${label}: trained only ${ratio.toFixed(2)}x — not visible`);
    assert.ok(ratio < 1.35, `${label}: trained ${ratio.toFixed(2)}x — a physique claim`);
  }
});

test("the joints are pinned, so fullness reads as muscle and not as a bigger limb", () => {
  // Knee (y=360) and ankle (y=440 / y=452) are authored with zero swell on both
  // edges, so the limb is measurably identical there in both states.
  for (const y of [360, 440, 452]) {
    assert.equal(
      widthAt("base", "leg", y),
      widthAt("trained", "leg", y),
      `leg joint at y=${y} changed between states`
    );
  }
  // Wrist, likewise.
  assert.equal(widthAt("base", "arm", 267), widthAt("trained", "arm", 267));
});

test("the trained state is more shaped, not merely wider", () => {
  const torsoBase = partAnchors("base", "torso");
  const torsoTrained = partAnchors("trained", "torso");
  const at = (anchors, y) => anchors.find((a) => Math.abs(a.y - y) < 0.01).x - AXIS_X;

  // Chest swells outward; the waist pulls IN. That is what produces a taper
  // rather than a uniformly larger torso.
  assert.ok(at(torsoTrained, 126) > at(torsoBase, 126), "chest should be fuller");
  assert.ok(at(torsoTrained, 210) < at(torsoBase, 210), "waist should be tighter");

  const taperTrained = at(torsoTrained, 126) - at(torsoTrained, 210);
  const taperBase = at(torsoBase, 126) - at(torsoBase, 210);
  assert.ok(taperTrained > taperBase * 1.25, "the taper difference should be legible");
});

test("the outer silhouette stays within one body-type family", () => {
  // The figure's widest point is the hand, which carries no swell at all: the
  // two states are identical there, which is the strongest possible statement
  // that this is one body.
  const widest = (state) =>
    Math.max(
      ...SILHOUETTE[state].flatMap((part) => anchorsOf(part.d).map((a) => a.x))
    );
  assert.equal(widest("trained"), widest("base"));

  // Where the body does differ, it differs by a few percent — enough to read,
  // far too little to be a different body type.
  const shoulder = (state) =>
    partAnchors(state, "arm").find((a) => Math.abs(a.y - 110) < 0.01).x - AXIS_X;
  const ratio = shoulder("trained") / shoulder("base");
  assert.ok(ratio > 1.01, "the trained shoulder should read as fuller");
  assert.ok(ratio < 1.06, `shoulder differs by ${((ratio - 1) * 100).toFixed(1)}%`);
});

test("both bodies carry muscle regions; the trained one carries extra separation", () => {
  for (const view of BODY_MAP_VIEWS) {
    assert.ok(DEFINITION_PATHS[view].shared.length >= 2, `${view} shared marks missing`);
    assert.ok(DEFINITION_PATHS[view].trained.length >= 3, `${view} extra marks missing`);
  }
  // The untrained half is softened, never emptied.
  assert.ok(
    /\.s07-svg-half\[data-state="base"\] \.s07-svg-definition \{\s*opacity: 0\.3;/.test(
      CSS_BLOCK
    ),
    "the untrained half must keep its shared marks, softly"
  );
  assert.ok(
    /\.s07-svg-half\[data-state="base"\] \.s07-svg-region \{[\s\S]*?stroke: color-mix/.test(
      CSS_BLOCK
    ),
    "the untrained half must still show muscle boundaries"
  );
});

test("each region has its own geometry per state, so a highlight follows its contour", () => {
  for (const [id, region] of Object.entries(REGION_GEOMETRY)) {
    assert.equal(typeof region.d.base, "string");
    assert.equal(typeof region.d.trained, "string");
    // Every configured region carries swell, so its two shapes must differ —
    // otherwise a highlighted biceps would float inside the revised arm.
    assert.notEqual(region.d.base, region.d.trained, `${id} does not follow the state`);
  }
  assert.equal(Object.keys(REGION_GEOMETRY).length, REGION_IDS.length);
});

test("region extents are state-independent, so a bracket can never disagree with its shape", () => {
  for (const [id, region] of Object.entries(REGION_GEOMETRY)) {
    const baseYs = anchorsOf(region.d.base).map((p) => p.y);
    const trainedYs = anchorsOf(region.d.trained).map((p) => p.y);
    assert.deepEqual(baseYs, trainedYs, `${id} extent moved between states`);
    assert.equal(region.top, Math.min(...trainedYs));
    assert.equal(region.bottom, Math.max(...trainedYs));
  }
});

/* =========================================================================
 * 5. Resolving data against geometry
 * ====================================================================== */

test("resolveGroups drops an unknown region id instead of breaking the figure", () => {
  const resolved = resolveGroups([
    {
      id: "g",
      label: "G",
      enabled: true,
      note: "n",
      regions: [{ id: "front-chest", label: "Chest" }, { id: "nope", label: "Nope" }],
    },
  ]);
  assert.equal(resolved.length, 1);
  assert.deepEqual(
    resolved[0].regions.map((r) => r.id),
    ["front-chest"]
  );
});

test("resolveGroups drops a group left with no drawable region", () => {
  const resolved = resolveGroups([
    { id: "g", label: "G", enabled: true, note: "n", regions: [{ id: "nope", label: "N" }] },
  ]);
  assert.deepEqual(resolved, []);
});

test("resolveGroups drops disabled groups and renumbers the rest", () => {
  const resolved = resolveGroups([
    { id: "a", label: "A", enabled: false, note: "n", regions: [{ id: "front-chest", label: "C" }] },
    { id: "b", label: "B", enabled: true, note: "n", regions: [{ id: "front-core", label: "Core" }] },
    { id: "c", label: "C", enabled: true, note: "n", regions: [{ id: "back-lats", label: "Lats" }] },
  ]);
  assert.deepEqual(
    resolved.map((g) => [g.id, g.index]),
    [
      ["b", "01"],
      ["c", "02"],
    ]
  );
});

test("resolveGroups records which views a group can answer in", () => {
  const resolved = resolveGroups([
    {
      id: "legs",
      label: "Legs",
      enabled: true,
      note: "n",
      regions: [
        { id: "front-quads", label: "Quads" },
        { id: "back-glutes", label: "Glutes" },
      ],
    },
    {
      id: "chest",
      label: "Chest",
      enabled: true,
      note: "n",
      regions: [{ id: "front-chest", label: "Chest" }],
    },
  ]);
  assert.deepEqual(resolved[0].views, ["front", "back"]);
  assert.deepEqual(resolved[1].views, ["front"]);
});

test("regionsForView returns only the regions visible on the current side", () => {
  const [group] = resolveGroups([
    {
      id: "legs",
      label: "Legs",
      enabled: true,
      note: "n",
      regions: [
        { id: "front-quads", label: "Quads" },
        { id: "front-calves", label: "Calves" },
        { id: "back-glutes", label: "Glutes" },
      ],
    },
  ]);
  assert.deepEqual(
    regionsForView(group, "front").map((r) => r.id),
    ["front-quads", "front-calves"]
  );
  assert.deepEqual(
    regionsForView(group, "back").map((r) => r.id),
    ["back-glutes"]
  );
  assert.deepEqual(regionsForView(undefined, "front"), []);
});

test("viewForGroup keeps the current view when the group can answer there", () => {
  const [legs] = resolveGroups([
    {
      id: "legs",
      label: "Legs",
      enabled: true,
      note: "n",
      regions: [
        { id: "front-quads", label: "Quads" },
        { id: "back-glutes", label: "Glutes" },
      ],
    },
  ]);
  assert.equal(viewForGroup(legs, "back"), "back");
  assert.equal(viewForGroup(legs, "front"), "front");
});

test("viewForGroup turns the figure only when the group has nothing on this side", () => {
  const [chest] = resolveGroups([
    {
      id: "chest",
      label: "Chest",
      enabled: true,
      note: "n",
      regions: [{ id: "front-chest", label: "Chest" }],
    },
  ]);
  assert.equal(viewForGroup(chest, "back"), "front");
  assert.equal(viewForGroup(undefined, "back"), "back");
});

/* =========================================================================
 * 6. Label layout
 * ====================================================================== */

function placementsFor(ids) {
  return layoutLabels(
    ids.map((id) => ({
      id,
      label: id,
      view: REGION_GEOMETRY[id].view,
      top: REGION_GEOMETRY[id].top,
      bottom: REGION_GEOMETRY[id].bottom,
    }))
  );
}

test("layoutLabels returns nothing for no active regions", () => {
  assert.deepEqual(layoutLabels([]), []);
});

test("layoutLabels separates labels that would otherwise collide", () => {
  // Traps and rear delts overlap vertically by design.
  const placed = placementsFor(["back-traps", "back-rear-delts"]);
  assert.equal(placed.length, 2);
  const gap = Math.abs(placed[1].labelY - placed[0].labelY);
  assert.ok(gap >= LABEL_MIN_SPACING - 0.001, `labels only ${gap} apart`);
});

test("layoutLabels keeps the bracket on the region's true centre", () => {
  const placed = placementsFor(["back-traps", "back-rear-delts"]);
  for (const item of placed) {
    const region = REGION_GEOMETRY[item.id];
    assert.equal(item.bracketY, (region.top + region.bottom) / 2);
  }
});

test("layoutLabels never overlaps for any configured group in either view", () => {
  const groups = resolveGroups(betweenSessionsConfiguration.bodyMap.groups);
  for (const group of groups) {
    for (const view of BODY_MAP_VIEWS) {
      const placed = layoutLabels(regionsForView(group, view));
      for (let i = 1; i < placed.length; i += 1) {
        const gap = placed[i].labelY - placed[i - 1].labelY;
        assert.ok(
          gap >= LABEL_MIN_SPACING - 0.001,
          `${group.id}/${view}: labels ${gap} apart`
        );
      }
      for (const item of placed) {
        assert.ok(item.labelY >= LABEL_TOP_BOUND - 0.001, `${group.id} label above frame`);
        assert.ok(item.labelY <= LABEL_BOTTOM_BOUND + 0.001, `${group.id} label below frame`);
      }
    }
  }
});

test("layoutLabels pulls an over-long stack back inside the frame", () => {
  const crowded = Array.from({ length: 12 }, (_, i) => ({
    id: `r${i}`,
    label: `R${i}`,
    view: "front",
    top: 440 + i,
    bottom: 450 + i,
  }));
  const placed = layoutLabels(crowded);
  for (const item of placed) {
    assert.ok(item.labelY >= LABEL_TOP_BOUND - 0.001);
    assert.ok(item.labelY <= LABEL_BOTTOM_BOUND + 0.001);
  }
});

test("layoutLabels orders labels top to bottom", () => {
  const placed = placementsFor(["front-calves", "front-deltoids", "front-core"]);
  const ys = placed.map((p) => p.labelY);
  assert.deepEqual(ys, [...ys].sort((a, b) => a - b));
});

/* =========================================================================
 * 7. Accessible summary
 * ====================================================================== */

test("buildFigureSummary lists every labelled region per view", () => {
  const groups = resolveGroups(betweenSessionsConfiguration.bodyMap.groups);
  const summary = buildFigureSummary(groups, { front: "Front", back: "Back" });
  assert.ok(summary.startsWith("Front:"));
  assert.ok(summary.includes("Back:"));
  assert.ok(summary.includes("Chest"));
  assert.ok(summary.includes("Hamstrings"));
});

test("buildFigureSummary names a region once even when two groups share it", () => {
  const groups = resolveGroups([
    { id: "a", label: "A", enabled: true, note: "n", regions: [{ id: "back-traps", label: "Traps" }] },
    { id: "b", label: "B", enabled: true, note: "n", regions: [{ id: "back-traps", label: "Traps" }] },
  ]);
  const summary = buildFigureSummary(groups, { front: "Front", back: "Back" });
  assert.equal(summary.match(/Traps/g).length, 1);
});

test("buildFigureSummary omits a view that has no regions", () => {
  const groups = resolveGroups([
    { id: "a", label: "A", enabled: true, note: "n", regions: [{ id: "front-chest", label: "Chest" }] },
  ]);
  const summary = buildFigureSummary(groups, { front: "Front", back: "Back" });
  assert.ok(!summary.includes("Back:"));
});

/* =========================================================================
 * 8. Content governance — the reviewed educational library
 * ====================================================================== */

/** Every prose string the visitor reads, excluding relative interval markers. */
function prosePool() {
  const c = betweenSessionsConfiguration;
  const strings = [
    c.deck,
    c.ctaNote,
    c.disclaimer,
    c.week.intro,
    c.week.scope,
    c.check.intro,
    c.check.escalation,
    c.check.scope,
    c.bodyMap.deck,
    c.bodyMap.disclaimer,
    c.bodyMap.figureDescription,
  ];
  for (const station of c.stations) {
    strings.push(station.principle, station.why, station.intervalLabel, ...station.practice);
    if (station.watchFor) strings.push(...station.watchFor);
    if (station.gymNote) strings.push(station.gymNote);
  }
  for (const item of c.check.items) strings.push(item.prompt, item.detail);
  for (const group of c.bodyMap.groups) strings.push(group.note);
  for (const gap of Object.values(c.week.gaps)) strings.push(gap.detail);
  return strings;
}

test("no educational sentence contains a numeral of any kind", () => {
  for (const text of prosePool()) {
    assert.ok(!/\d/.test(text), `numeral found in educational copy: "${text}"`);
  }
});

test("no educational sentence makes a dose, target or guarantee claim", () => {
  const banned =
    /\b(calorie|calories|kcal|macro|macros|gram|grams|protein target|litre|liter|millilitre|supplement|dosage|dose|guarantee|guaranteed|body fat percentage|bmi|heart rate zone|diagnos\w*|cure|treat\w* your)\b/i;
  for (const text of prosePool()) {
    assert.ok(!banned.test(text), `unsafe claim in: "${text}"`);
  }
});

test("the pre-session check has no scoring vocabulary anywhere", () => {
  const banned = /\b(score|scored|scoring|rating|points|grade|graded|result)\b/i;
  const c = betweenSessionsConfiguration.check;
  const pool = [c.label, c.intro, c.escalationLabel, c.escalation, c.scope].concat(
    c.items.flatMap((item) => [item.prompt, item.detail])
  );
  for (const text of pool) {
    // Explicit denials are the point ("there is no score here", "nothing here
    // is scored"), so negated forms are removed before the check runs.
    const cleaned = text.replace(
      /\b(no|not|never|nothing\s+\w+\s+is)\s+(scored?|scoring|graded?|rated?|points|results?)\b/gi,
      ""
    );
    assert.ok(!banned.test(cleaned), `scoring vocabulary in: "${text}"`);
  }
});

test("the check has exactly one escalating prompt, and it defers to a clinician", () => {
  const escalating = betweenSessionsConfiguration.check.items.filter((i) => i.escalates);
  assert.equal(escalating.length, 1);
  assert.match(
    betweenSessionsConfiguration.check.escalation,
    /coach|doctor|physiotherapist|clinician/i
  );
});

test("the body map disclaimer states that individual outcomes vary", () => {
  assert.match(
    betweenSessionsConfiguration.bodyMap.disclaimer,
    /individual outcomes vary/i
  );
});

test("the body map never promises a physique", () => {
  const banned = /\b(you will look|guaranteed|transform your body|dream body|six pack|shredded)\b/i;
  const map = betweenSessionsConfiguration.bodyMap;
  const pool = [
    map.deck,
    map.disclaimer,
    map.figureDescription,
    map.baseState.label,
    map.baseState.caption,
    map.trainedState.label,
    map.trainedState.caption,
    ...map.groups.map((g) => g.note),
  ];
  for (const text of pool) {
    assert.ok(!banned.test(text), `physique promise in: "${text}"`);
  }
});

test("the section disclaimer names its scope as education, not medical advice", () => {
  assert.match(betweenSessionsConfiguration.disclaimer, /not medical/i);
  assert.match(betweenSessionsConfiguration.disclaimer, /education/i);
});

test("interval markers are relative to the last rep, never clock times", () => {
  for (const station of betweenSessionsConfiguration.stations) {
    assert.ok(
      !/\b\d{1,2}\s*(am|pm)\b|\b\d{1,2}:\d{2}\b/i.test(station.marker),
      `clock time in marker: ${station.marker}`
    );
  }
});

test("every station answers what, why and what to do with it", () => {
  for (const station of betweenSessionsConfiguration.stations) {
    assert.ok(station.principle.length > 20, `${station.id} principle too thin`);
    assert.ok(station.why.length > 80, `${station.id} explanation too thin`);
    assert.ok(station.practice.length >= 2, `${station.id} needs practical ideas`);
  }
});

test("the stations are not all the same shape, so the log has real rhythm", () => {
  const withWatch = betweenSessionsConfiguration.stations.filter(
    (s) => s.watchFor && s.watchFor.length > 0
  );
  assert.ok(withWatch.length >= 1);
  assert.ok(withWatch.length < betweenSessionsConfiguration.stations.length);
});

test("the gym-specific note is present on at most one station in the master template", () => {
  const withNote = betweenSessionsConfiguration.stations.filter((s) => s.gymNote);
  assert.ok(withNote.length <= 1);
});

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

test("the interval log carries roughly 300-500 words of educational copy", () => {
  const stationWords = betweenSessionsConfiguration.stations
    .flatMap((station) => [
      station.principle,
      station.why,
      ...station.practice,
      ...(station.watchFor ?? []),
      station.gymNote ?? "",
    ])
    .reduce((total, text) => total + wordCount(text), 0);
  assert.ok(stationWords >= 300, `only ${stationWords} words of station copy`);
  assert.ok(stationWords <= 520, `${stationWords} words is past the content target`);
});

test("no single block is a wall of text, at any level of the chapter", () => {
  for (const station of betweenSessionsConfiguration.stations) {
    assert.ok(wordCount(station.why) <= 55, `${station.id} explanation too long`);
    assert.ok(wordCount(station.principle) <= 24, `${station.id} principle too long`);
    for (const item of station.practice) {
      assert.ok(wordCount(item) <= 26, `${station.id} practice point too long`);
    }
    const total = [station.principle, station.why, ...station.practice].reduce(
      (t, text) => t + wordCount(text),
      0
    );
    assert.ok(total <= 130, `${station.id} is ${total} words in one descent step`);
  }
  for (const group of betweenSessionsConfiguration.bodyMap.groups) {
    assert.ok(wordCount(group.note) <= 70, `${group.id} note too long`);
  }
});

test("only one body-map note and one gap description are visible at a time", () => {
  // The chapter's total library is larger than what is on screen: five of six
  // region notes and two of three gap descriptions are always hidden behind the
  // selectors, which is how depth is carried without a wall of text.
  assert.ok(betweenSessionsConfiguration.bodyMap.groups.length > 1);
  assert.equal(Object.keys(betweenSessionsConfiguration.week.gaps).length, 3);
  assert.ok(MAP_SRC.includes("groups[activeIndex]"));
  assert.ok(WEEK_SRC.includes("patterns[activeIndex]"));
});

test("there is exactly one CTA, and its message carries the chapter's context", () => {
  assert.equal(typeof betweenSessionsConfiguration.ctaLabel, "string");
  assert.match(betweenSessionsConfiguration.ctaMessage, /training and recovery/i);
  assert.equal(SECTION_SRC.match(/<Button/g).length, 1);
});

test("the CTA makes no response-time promise", () => {
  const pool = [
    betweenSessionsConfiguration.ctaLabel,
    betweenSessionsConfiguration.ctaMessage,
    betweenSessionsConfiguration.ctaNote,
  ];
  for (const text of pool) {
    assert.ok(!/within \d+|same day|instantly|immediately reply/i.test(text));
  }
});

/* =========================================================================
 * 9. No photography
 * ====================================================================== */

test("the data file documents itself as a reviewed global library, not per-gym facts", () => {
  assert.ok(/GLOBAL\s+(\*\s+)?EDUCATIONAL LIBRARY/.test(DATA_SRC));
  assert.ok(/FACTUAL DISCIPLINE/.test(DATA_SRC));
  // The one gym-specific claim in the template is flagged as demo data.
  assert.ok(/MASTER DEMO DATA/.test(DATA_SRC));
});

test("the optional photographic slot is disabled in the master template", () => {
  assert.equal(betweenSessionsConfiguration.artifact.enabled, false);
});

test("no component in Section 07 imports or renders an image", () => {
  for (const [name, src] of [
    ["BetweenSessions", SECTION_SRC],
    ["BodyMap", MAP_SRC],
    ["TrainingWeek", WEEK_SRC],
    ["PreSessionCheck", CHECK_SRC],
  ]) {
    assert.ok(!/next\/image/.test(src), `${name} imports next/image`);
    assert.ok(!/<Image\b/.test(src), `${name} renders an Image`);
    assert.ok(!/<img\b/.test(src), `${name} renders an img`);
    // url(#...) is an SVG fragment reference (the clip path); a raster asset
    // would be url("/assets/...") or a .webp/.png/.jpg path.
    assert.ok(!/backgroundImage/.test(src), `${name} sets a background image`);
    assert.ok(!/url\(["']?[^#)]/.test(src), `${name} references an external asset`);
    assert.ok(!/\.(webp|png|jpe?g|avif|gif)\b/i.test(src), `${name} names a raster file`);
  }
});

test("the Section 07 stylesheet loads no raster asset either", () => {
  assert.ok(!/url\(/.test(CSS_BLOCK), "the chapter surface must be drawn, not imaged");
  assert.ok(!/\.(webp|png|jpe?g|avif|gif)\b/i.test(CSS_BLOCK));
});

/* =========================================================================
 * 10. Structure, semantics and accessibility
 * ====================================================================== */

test("the section has exactly one h2 and it names the section", () => {
  assert.equal(SECTION_SRC.match(/<h2\b/g).length, 1);
  assert.ok(SECTION_SRC.includes('aria-labelledby="between-sessions-heading"'));
  assert.ok(SECTION_SRC.includes('id="between-sessions-heading"'));
});

test("heading hierarchy is h2 > h3 > h4 with no level skipped", () => {
  const h3s = (SECTION_SRC.match(/<h3\b/g) ?? []).length + (MAP_SRC.match(/<h3\b/g) ?? []).length;
  const h4s =
    (SECTION_SRC.match(/<h4\b/g) ?? []).length + (CHECK_SRC.match(/<h4\b/g) ?? []).length;
  assert.ok(h3s >= 2, "expected a heading for each chapter");
  assert.ok(h4s >= 2, "expected station and check headings");
  assert.ok(!/<h[56]\b/.test(SECTION_SRC + MAP_SRC + CHECK_SRC + WEEK_SRC));
  assert.ok(!/<h1\b/.test(SECTION_SRC + MAP_SRC + CHECK_SRC + WEEK_SRC));
});

test("the figure is an image with an accessible description, not a decorative blob", () => {
  assert.ok(MAP_SRC.includes('role="img"'));
  assert.ok(MAP_SRC.includes("aria-label={bodyMap.figureDescription}"));
  assert.ok(MAP_SRC.includes("bodyMap.summaryLabel"));
  assert.ok(MAP_SRC.includes("sr-only"));
});

test("no path in the figure is interactive, so there are no duplicate controls", () => {
  const svgPortion = MAP_SRC.slice(MAP_SRC.indexOf("<svg"), MAP_SRC.indexOf("</svg>"));
  assert.ok(!/onClick|onMouseEnter|tabIndex|role="button"/.test(svgPortion));
});

test("both figure controls are real ARIA patterns with keyboard support", () => {
  assert.ok(MAP_SRC.includes('role="radiogroup"'));
  assert.ok(MAP_SRC.includes('role="radio"'));
  assert.ok(MAP_SRC.includes('role="tablist"'));
  assert.ok(MAP_SRC.includes('role="tab"'));
  assert.ok(MAP_SRC.includes('role="tabpanel"'));
  assert.ok(MAP_SRC.includes("aria-checked"));
  assert.ok(MAP_SRC.includes("aria-selected"));
  for (const key of ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"]) {
    assert.ok(MAP_SRC.includes(key), `body map selector missing ${key}`);
  }
});

test("the week pattern selector is a keyboard-operable radio group", () => {
  assert.ok(WEEK_SRC.includes('role="radiogroup"'));
  assert.ok(WEEK_SRC.includes('role="radio"'));
  assert.ok(WEEK_SRC.includes("aria-checked"));
  assert.ok(WEEK_SRC.includes("tabIndex={checked ? 0 : -1}"));
  for (const key of ["ArrowRight", "ArrowLeft", "Home", "End"]) {
    assert.ok(WEEK_SRC.includes(key), `week selector missing ${key}`);
  }
});

test("both selectors keep a single tab stop via a roving tabindex", () => {
  assert.ok(MAP_SRC.includes("tabIndex={checked ? 0 : -1}"));
  assert.ok(MAP_SRC.includes("tabIndex={isActive ? 0 : -1}"));
});

test("pointer and keyboard selection reach identical state", () => {
  // Both paths go through the same selector functions.
  assert.ok(MAP_SRC.includes("onClick={() => selectGroup(i, false)}"));
  assert.ok(MAP_SRC.includes("selectGroup(activeIndex + 1, true)"));
  assert.ok(MAP_SRC.includes("onClick={() => selectView(option, false)}"));
  assert.ok(WEEK_SRC.includes("onClick={() => select(i, false)}"));
});

test("the check uses native checkboxes that stay focusable", () => {
  assert.ok(CHECK_SRC.includes('type="checkbox"'));
  assert.ok(CHECK_SRC.includes("htmlFor={inputId}"));
  assert.ok(CHECK_SRC.includes("<label"));
  assert.ok(/\.s07-check-input\s*\{[^}]*opacity:\s*0/.test(CSS_BLOCK));
  assert.ok(!/\.s07-check-input\s*\{[^}]*display:\s*none/.test(CSS_BLOCK));
  assert.ok(/\.s07-check-input:focus-visible \+ \.s07-check-label/.test(CSS_BLOCK));
});

test("the check stores nothing and submits nothing", () => {
  // Comments are stripped first: the docblock deliberately NAMES the APIs it
  // does not use, so scanning the raw file would match its own explanation.
  const code = CHECK_SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.ok(!/localStorage|sessionStorage|document\.cookie|fetch\(|<form/.test(code));
  assert.ok(!/useEffect/.test(code), "the check should have no side effects at all");
});

test("the escalation note is a live region so it is announced when it appears", () => {
  assert.ok(CHECK_SRC.includes('aria-live="polite"'));
  assert.ok(MAP_SRC.includes('aria-live="polite"'));
});

test("decorative marks are aria-hidden", () => {
  for (const [name, src] of [
    ["BetweenSessions", SECTION_SRC],
    ["BodyMap", MAP_SRC],
    ["TrainingWeek", WEEK_SRC],
  ]) {
    assert.ok(/aria-hidden="true"/.test(src), `${name} has no aria-hidden decoration`);
  }
  assert.ok(MAP_SRC.includes('<ul className="s07-label-set" aria-hidden="true">'));
  assert.ok(MAP_SRC.includes('className="s07-region-chips" aria-hidden="true"'));
});

test("every strip cell states its own meaning in text", () => {
  assert.ok(WEEK_SRC.includes("describeDay(i, isSession, week)"));
  assert.ok(WEEK_SRC.includes('className="sr-only"'));
});

test("the disclaimers render unconditionally, outside any scroll reveal", () => {
  const scopeIndex = SECTION_SRC.indexOf('className="s07-scope"');
  const lastReveal = SECTION_SRC.lastIndexOf("<Reveal", scopeIndex);
  const closingReveal = SECTION_SRC.lastIndexOf("</Reveal>", scopeIndex);
  assert.ok(closingReveal > lastReveal, "the scope line must sit outside Reveal");
  // The body map's own disclaimer lives inside the island, which is not gated.
  assert.ok(MAP_SRC.includes('className="s07-map-scope"'));
});

/* =========================================================================
 * 11. Wiring and graceful degradation
 * ====================================================================== */

test("the section is flagged on and rendered after Reviews, before Membership", () => {
  assert.equal(sections.betweenSessions, true);
  assert.ok(PAGE_SRC.includes("sections.betweenSessions && ("));
  const reviews = PAGE_SRC.indexOf("sections.reviews &&");
  const between = PAGE_SRC.indexOf("sections.betweenSessions &&");
  const membership = PAGE_SRC.indexOf("sections.membership &&");
  assert.ok(reviews < between && between < membership);
});

test("the section receives the site-wide WhatsApp action rather than owning a number", () => {
  assert.ok(PAGE_SRC.includes("<BetweenSessions whatsappHref={whatsappHref} />"));
  assert.ok(!/wa\.me|whatsapp\.number/.test(SECTION_SRC));
});

test("the section renders nothing at all when there is no content to teach", () => {
  assert.ok(
    SECTION_SRC.includes("if (stationViews.length === 0 && groups.length === 0) return null;")
  );
});

test("each chapter is independently omitted rather than rendering an empty shell", () => {
  assert.ok(SECTION_SRC.includes("{stationViews.length > 0 && ("));
  assert.ok(SECTION_SRC.includes("{groups.length > 0 && ("));
});

test("region resolution and the CTA href are computed on the server", () => {
  assert.ok(SECTION_SRC.includes("resolveGroups(bodyMap.groups)"));
  assert.ok(SECTION_SRC.includes("withCtaMessage(whatsappHref, ctaMessage)"));
  assert.ok(!MAP_SRC.includes("resolveGroups"));
});

test("only the three interaction islands are client components", () => {
  assert.ok(!SECTION_SRC.includes('"use client"'));
  assert.ok(MAP_SRC.startsWith('"use client"'));
  assert.ok(WEEK_SRC.startsWith('"use client"'));
  assert.ok(CHECK_SRC.startsWith('"use client"'));
});

test("no animation, carousel or chart dependency was introduced", () => {
  const pkg = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8")
  );
  assert.deepEqual(Object.keys(pkg.dependencies).sort(), ["next", "react", "react-dom"]);
  for (const src of [SECTION_SRC, MAP_SRC, WEEK_SRC, CHECK_SRC]) {
    assert.ok(!/gsap|framer-motion|swiper|aos|lenis|chart\.js|recharts/i.test(src));
  }
});

/* =========================================================================
 * 12. CSS scope, surface and motion contract
 * ====================================================================== */

test("the Section 07 CSS block is appended after Pass 10, not spliced into it", () => {
  assert.ok(CSS_SRC.indexOf("Pass 10 additions") < CSS_SRC.indexOf("Pass 11 - Section 07"));
});

test("every rule in the block is namespaced to Section 07", () => {
  // Comments stripped first, then selector heads matched on a single line only
  // (a character class of "not {" would otherwise run across newlines).
  const rules = CSS_BLOCK.replace(/\/\*[\s\S]*?\*\//g, "");
  const selectors = rules.match(/^[^\s@}][^{}\n]*\{/gm) ?? [];
  assert.ok(selectors.length > 80, `only ${selectors.length} rules found`);
  for (const raw of selectors) {
    const selector = raw.replace(/\{$/, "").trim();
    if (/^(from|to|\d+%)$/.test(selector)) continue;
    for (const part of selector.split(",")) {
      const trimmed = part.trim();
      assert.ok(
        trimmed.includes(".s07-"),
        `selector escapes the Section 07 namespace: "${trimmed}"`
      );
    }
  }
});

test("the block redefines no global token and reaches no frozen section", () => {
  assert.ok(!/^:root/m.test(CSS_BLOCK));
  assert.ok(!/^\s*body\s*\{/m.test(CSS_BLOCK));
  for (const frozen of [".s05-", ".factory-signal", ".factory-wcu", ".factory-hero", ".s07-x"]) {
    if (frozen === ".s07-x") continue;
    assert.ok(!CSS_BLOCK.includes(`${frozen}`), `block reaches ${frozen}`);
  }
});

test("the steel surface is achieved with local token remapping", () => {
  const surface = CSS_BLOCK.slice(
    CSS_BLOCK.indexOf(".s07-surface {"),
    CSS_BLOCK.indexOf("/*\n * The field.")
  );
  assert.ok(surface.includes("--text-primary: var(--s07-ink)"));
  assert.ok(surface.includes("--text-secondary: var(--s07-ink-soft)"));
  assert.ok(surface.includes("--border: var(--s07-line)"));
  // Cool, not the warm paper of Section 05 and not a pure black plate.
  assert.ok(surface.includes("--s07-steel: #101318"));
});

test("the background is large masked shapes, not repeating line wallpaper", () => {
  const field = CSS_BLOCK.slice(
    CSS_BLOCK.indexOf(".s07-field {"),
    CSS_BLOCK.indexOf(".s07-grain {")
  );
  assert.ok(field.includes("mask-image"));
  assert.ok(field.includes("radial-gradient"));
  // The only repeating gradient in the field is the sparse edge calibration.
  assert.equal((field.match(/repeating-linear-gradient/g) ?? []).length, 1);
});

test("nothing on the chapter surface animates", () => {
  const field = CSS_BLOCK.slice(
    CSS_BLOCK.indexOf(".s07-field {"),
    CSS_BLOCK.indexOf("/* ------------------------------------------------------- shared primitives")
  );
  assert.ok(!/animation/.test(field));
});

test("the figure box and its phone crop both derive from the drawing frame", () => {
  assert.ok(CSS_BLOCK.includes("aspect-ratio"), "the wrap derives its width from the frame");
  assert.ok(
    CSS_BLOCK.includes(
      "width: calc(var(--s07-fig-h) * var(--s07-frame-w) / var(--s07-frame-h))"
    )
  );
  assert.ok(
    CSS_BLOCK.includes(
      "width: calc(var(--s07-fig-h) * var(--s07-crop-w) / var(--s07-frame-h))"
    )
  );
  assert.ok(
    CSS_BLOCK.includes("width: calc(100% * var(--s07-frame-w) / var(--s07-crop-w))")
  );
  assert.ok(MAP_SRC.includes('"--s07-frame-w": FRAME_W'));
  assert.ok(MAP_SRC.includes('"--s07-crop-w": FIGURE_CROP_W'));
  assert.equal(FIGURE_CROP_W, LABEL_ZONE_X - FRAME_X);
});

test("the figure is sized by height, because a standing figure is height-bound", () => {
  const wrap = CSS_BLOCK.slice(
    CSS_BLOCK.indexOf(".s07-figure-wrap {"),
    CSS_BLOCK.indexOf(".s07-figure {")
  );
  assert.ok(/--s07-fig-h: clamp\(/.test(wrap));
  assert.ok(wrap.includes("max-width: 100%"));
  // Bigger than the pre-refinement 30-34rem band: the figure is the chapter's
  // signature object, not a diagram.
  assert.ok(/--s07-fig-h: clamp\(32rem, 46vw, 38rem\)/.test(wrap));
});

test("the state labels sit over their own half, on the figure's real axis", () => {
  const head = CSS_BLOCK.slice(
    CSS_BLOCK.indexOf(".s07-figure-head {"),
    CSS_BLOCK.indexOf("/*\n * Phones:")
  );
  assert.ok(head.includes("grid-template-columns: var(--s07-axis-split)"));
  assert.ok(head.includes("width: calc(100% * var(--s07-crop-w) / var(--s07-frame-w))"));
  assert.ok(MAP_SRC.includes('"--s07-axis-split": AXIS_SPLIT'));
  // Derived from the axis's real position across the cropped body region.
  assert.equal(
    AXIS_SPLIT,
    `${Math.round(((AXIS_X - FRAME_X) / FIGURE_CROP_W) * 10000) / 100}%`
  );
});

test("the state labels are real text, not SVG decoration", () => {
  assert.ok(MAP_SRC.includes("{bodyMap.baseState.label}"));
  assert.ok(MAP_SRC.includes("{bodyMap.trainedState.label}"));
  assert.ok(MAP_SRC.includes('<p className="s07-state-label">'));
  // And they sit inside the figure column, above the figure itself.
  const headIndex = MAP_SRC.indexOf('className="s07-figure-head"');
  const figureIndex = MAP_SRC.indexOf('className="s07-figure" data-view={view}');
  assert.ok(headIndex > 0 && headIndex < figureIndex);
});

test("the state wording is a training state, never a before/after promise", () => {
  const map = betweenSessionsConfiguration.bodyMap;
  assert.match(map.baseState.label, /^Not training regularly$/i);
  assert.match(map.trainedState.label, /^Training regularly$/i);
  for (const text of [
    map.baseState.label,
    map.trainedState.label,
    map.baseState.caption,
    map.trainedState.caption,
    map.axisLabel,
    map.deck,
  ]) {
    assert.ok(
      !/\b(before|after|transformation|results|guaranteed)\b/i.test(text),
      `forbidden comparison wording in: "${text}"`
    );
  }
  assert.match(map.axisLabel, /same body/i);
});

test("the before/consistent states differ by contour first, never by scale or morph", () => {
  const partRules = CSS_BLOCK.slice(
    CSS_BLOCK.indexOf(".s07-svg-part {"),
    CSS_BLOCK.indexOf(".s07-svg-region {")
  );
  assert.ok(partRules.includes("stroke-width: 1.25"));
  assert.ok(partRules.includes("stroke-width: 1.85"));
  assert.ok(!/scale\(|translate\(|rotate\(/.test(partRules));
});

test("front/back is a crossfade of mounted geometry, so nothing remounts", () => {
  assert.ok(
    CSS_BLOCK.includes('.s07-figure[data-view="front"] .s07-svg-region[data-view="back"]')
  );
  assert.ok(MAP_SRC.includes("REGION_IDS.map"));
  assert.ok(MAP_SRC.includes("BODY_MAP_VIEWS.map((option) => ("));
});

test("no state is carried by colour alone", () => {
  // Week pattern option, view option and group row each change a MARK too.
  assert.ok(/\.s07-week-option\[data-active\]::before \{[\s\S]*?background: var\(--accent\)/.test(CSS_BLOCK));
  assert.ok(/\.s07-view-option\[data-active\] \.s07-view-mark \{[\s\S]*?background: var\(--accent\)/.test(CSS_BLOCK));
  assert.ok(/\.s07-group\[data-active\] \.s07-group-mark \{[\s\S]*?transform: rotate\(45deg\)/.test(CSS_BLOCK));
  assert.ok(/\.s07-week-day\[data-session\] \.s07-week-mark \{[\s\S]*?transform: translateY/.test(CSS_BLOCK));
  assert.ok(/\.s07-week-day\[data-gap\] \.s07-week-mark \{[\s\S]*?border-style: dashed/.test(CSS_BLOCK));
});

test("the log spine is one continuous stroke driven by two variables", () => {
  assert.ok(/\.s07-log-list::before \{[\s\S]*?left: calc\(var\(--s07-spine\)/.test(CSS_BLOCK));
  assert.ok(CSS_BLOCK.includes("--s07-spine: 1.125rem"));
  assert.ok(CSS_BLOCK.includes("--s07-spine: 11.5rem"));
  assert.ok(CSS_BLOCK.includes("--s07-body-gap:"));
});

test("the mobile and desktop layouts derive the node offset from the same variables", () => {
  assert.ok(
    CSS_BLOCK.includes("left: calc(-1 * var(--s07-body-gap) - 0.3125rem)"),
    "mobile node must ride the spine"
  );
  assert.ok(CSS_BLOCK.includes("right: -0.3125rem"), "desktop node must ride the spine");
});

test("the chapter recomposes at laptop height rather than growing taller", () => {
  assert.ok(
    CSS_BLOCK.includes("@media (min-width: 1024px) and (max-width: 1439.98px)")
  );
  assert.ok(CSS_BLOCK.includes("--s07-fig-h: clamp(32rem, 42vw, 34rem)"));
});

test("the figure never shrinks below its phone size on a larger screen", () => {
  // Every breakpoint's clamp floor is the same 32rem, so the figure is
  // monotonic across viewports instead of being smallest on a laptop.
  const floors = [...CSS_BLOCK.matchAll(/--s07-fig-h: clamp\((\d+)rem,/g)].map((m) =>
    Number(m[1])
  );
  assert.ok(floors.length >= 3, "expected a figure height per breakpoint band");
  for (const floor of floors) {
    assert.ok(floor >= 32, `a breakpoint drops the figure to ${floor}rem`);
  }
});

test("region labels move into the readout where the gutter is too narrow for type", () => {
  assert.ok(/@media \(max-width: 639\.98px\) \{[\s\S]*?\.s07-label-set \{[\s\S]*?display: none/.test(CSS_BLOCK));
  assert.ok(/@media \(min-width: 640px\) \{[\s\S]*?\.s07-region-chips \{[\s\S]*?display: none/.test(CSS_BLOCK));
});

test("reduced motion removes entry choreography and every state transition", () => {
  const reduced = CSS_BLOCK.slice(CSS_BLOCK.indexOf("@media (prefers-reduced-motion: reduce)"));
  assert.ok(reduced.length > 200, "no reduced-motion block for Section 07");
  for (const selector of [
    ".s07-chapter-rule",
    ".s07-swap",
    ".s07-svg-dim",
    ".s07-label-item",
    ".s07-check-escalation-body",
    ".s07-svg-part",
    ".s07-svg-region",
    ".s07-svg-definition",
    ".s07-station-node",
  ]) {
    assert.ok(reduced.includes(selector), `${selector} not covered by reduced motion`);
  }
  // The active state must remain fully expressed, not merely un-animated.
  assert.ok(/\.s07-group\[data-active\]::after \{\s*transform: scaleX\(1\);/.test(reduced));
});

test("no bounce, elastic, infinite or continuous animation exists in the block", () => {
  assert.ok(!/infinite|alternate|steps\(|cubic-bezier\([^)]*-\d/.test(CSS_BLOCK));
  const animations = CSS_BLOCK.match(/animation:[^;]+;/g) ?? [];
  for (const rule of animations) {
    assert.ok(!/infinite/.test(rule), `looping animation: ${rule}`);
  }
});
