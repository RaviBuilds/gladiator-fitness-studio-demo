import type { BodyMapGroup } from "@/lib/types";

/**
 * Section 07 — BODY MAP geometry.
 *
 * THE FIGURE IS DATA, NOT A PASTED PATH STRING. Every contour below is a table
 * of points that is converted to a smooth cubic path at module load
 * (`smoothPath`). That is deliberate:
 *   - the drawing can be adjusted by moving a coordinate instead of editing
 *     bezier control handles by hand;
 *   - the geometry is verifiable — scripts/between-sessions.test.mjs asserts
 *     every point sits inside the viewBox, that no region escapes the
 *     silhouette's vertical range, and that the label layout never overlaps;
 *   - and each region's vertical extent (used by its dimension bracket) is
 *     DERIVED from the same points that draw it, so a bracket can never drift
 *     away from the shape it measures.
 *
 * ONLY THE RIGHT HALF EXISTS. Every table is authored from the centre axis
 * outward, and the component renders it twice — once mirrored through
 * `MIRROR_TRANSFORM`. This is what makes the chapter's central claim literally
 * true rather than merely asserted: the "without regular training" side and the
 * "with consistent training" side are THE SAME GEOMETRY, and the only
 * difference between them is line weight, region differentiation and a handful
 * of definition marks. There is no morph, no second body, no enlargement, and
 * no way for a future edit to introduce one without deleting the mirror.
 *
 * ART DIRECTION. Simplified athletic anatomy blueprint: one even contour, a
 * small set of muscle regions, sparse construction marks, a floor baseline with
 * graduations and a barbell line across the shoulders. Generic proportions
 * (roughly eight heads, ordinary shoulder-to-waist ratio), no exaggerated
 * musculature, no gendered styling, no face. Not a medical illustration and not
 * a fitness poster.
 *
 * NO PATH IS INTERACTIVE. The figure is an image (`role="img"` plus a
 * visually-hidden region summary); selection happens through the labelled
 * region controls beside it. See components/motion/BodyMap.tsx for why that is
 * the accessible choice rather than a compromise.
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Fixed drawing frame.
 *
 * The frame is WIDER than the figure on purpose: x 83-237 is the body, x 248 is
 * the dimension-bracket column, and x 266-386 is the label gutter. The labels
 * are HTML (so their type scales with CSS, not with the viewBox) but they are
 * positioned INSIDE the figure's own aspect-ratio box using `framePercent`,
 * which means a label, its tie line and the bracket it belongs to share one
 * coordinate system and cannot drift apart at any viewport width.
 *
 * Below 640px the labels move into the readout, so the gutter is dead space.
 * `FIGURE_CROP_W` is the frame with the gutter removed; the CSS uses it to crop
 * the box back to the body at phone widths instead of centring the figure in a
 * third of empty drawing.
 */
export const FRAME_X = 46;
export const FRAME_Y = 6;
export const FRAME_W = 340;
export const FRAME_H = 488;
export const VIEW_BOX = `${FRAME_X} ${FRAME_Y} ${FRAME_W} ${FRAME_H}`;

/** The figure's centre axis. Everything is authored outward from here. */
export const AXIS_X = 160;

/**
 * Places the authored half on the other side of the axis.
 *
 * Applied to the BASE state only. The left of the figure is therefore a mirror
 * of the same anatomy resolved to the untrained contour — not a mirror of the
 * trained geometry that sits opposite it.
 */
export const MIRROR_TRANSFORM = `translate(${AXIS_X * 2} 0) scale(-1 1)`;

/** Floor baseline and the graduated scale along it. */
export const FLOOR_Y = 482;
export const FLOOR_FROM = 54;
export const FLOOR_TO = 262;

/** Barbell line across the shoulders. */
export const BAR_Y = 98;
export const BAR_FROM = 62;
export const BAR_TO = 256;
export const BAR_COLLARS = [84, 236];

/** Dimension column, where its tie ends, and where the HTML label gutter starts. */
export const BRACKET_X = 248;
export const TIE_X = 262;
export const LABEL_ZONE_X = 266;

/** The frame with the label gutter cropped off. See the note above. */
export const FIGURE_CROP_W = LABEL_ZONE_X - FRAME_X;

export type BodyMapView = "front" | "back";
export const BODY_MAP_VIEWS: BodyMapView[] = ["front", "back"];

/**
 * The two drawing states of the one body.
 *
 * `base` is the body that is not training regularly; `trained` is the SAME body
 * training regularly. Neither is the authored geometry — both are derived from
 * one shared anatomy (see `derive`), which is what makes "same body, different
 * training state" a property of the code rather than a claim in the copy.
 */
export type FigureState = "base" | "trained";
export const FIGURE_STATES: FigureState[] = ["base", "trained"];

/**
 * One authored point of the shared anatomy.
 *
 * `s` is a signed CONTOUR SWELL in drawing units: how far this point moves for
 * the trained state. Positive values push an outer contour further from the
 * axis; negative values pull an inner contour (the inside of an arm, the
 * adductor line of a thigh, the waist) the other way. Omitted means zero, which
 * is how every skeletal landmark is pinned.
 *
 * THE SWELL IS HORIZONTAL ONLY, AND THAT IS THE POINT. No `y` is ever touched,
 * so both states are guaranteed — by construction, not by care — to have
 * identical height, identical head size, identical joint heights and identical
 * limb placement. The only thing that can differ between the two sides of the
 * figure is the fullness and curvature of a muscle contour.
 */
interface BasePoint {
  x: number;
  y: number;
  s?: number;
}

/**
 * How far the swell is taken in each direction.
 *
 * The authored anatomy sits BETWEEN the two states rather than at either of
 * them: the trained side takes the full swell outward and the untrained side
 * takes a little over half of it inward. A named muscle belly therefore differs
 * by roughly 1.55x its swell in total thickness — about a fifth on a limb,
 * which reads immediately without becoming a physique claim. Raising these two
 * numbers is the single lever for the whole effect.
 */
export const TRAINED_GAIN = 1;
export const SOFT_GAIN = -0.55;

/** Apply the swell for one state. `y` is never touched. */
export function derive(points: BasePoint[], state: FigureState): Point[] {
  const gain = state === "trained" ? TRAINED_GAIN : SOFT_GAIN;
  return points.map((point) => ({
    x: round(point.x + (point.s ?? 0) * gain),
    y: point.y,
  }));
}

/* ===========================================================================
 * The shared anatomy — right half only, in drawing order, as [x, y, swell].
 *
 * Read the third number as "how much muscle is here". Zero on the skull, the
 * neck, every joint, both wrists, both ankles, the sole and every point that
 * touches the centre axis; largest at the deltoid cap, the biceps belly, the
 * chest, the quadriceps and the calf. Negative at the waist and along the
 * inside of the limbs, so the trained state reads as SHAPED rather than merely
 * bigger.
 * ======================================================================== */

/**
 * Right half of the skull, crown to chin. Open: the axis edge is not stroked.
 * Every swell is zero — the head is identical in both states, deliberately, so
 * the viewer reads one person rather than two.
 */
const HEAD: BasePoint[] = p([
  [160, 20], [172, 22], [180, 32], [182, 46], [179, 60], [172, 71], [165, 77], [160, 79],
]);

/**
 * Right half of the neck and torso, from the base of the neck at the axis, over
 * the shoulder, down the flank, to the crotch at the axis. Open, so the fill
 * closes along the axis while the stroke never draws a seam there.
 *
 * The chest swells outward and the waist pulls inward, so the trained side
 * carries a visibly stronger shoulder-to-waist taper while both sides keep the
 * same shoulder position and the same hip width family.
 */
const TORSO: BasePoint[] = p([
  [160, 80], [170, 82], [173, 90], [178, 96, 0.8], [189, 102, 2], [198, 112, 2.8],
  [202, 126, 3], [201, 142, 2.6], [197, 160, 1.8], [192, 178, 0.4], [188, 196, -1.2],
  [187, 210, -1.6], [190, 228, -0.8], [195, 244, 0.8], [196, 258, 1.2], [192, 268, 0.8],
  [178, 272], [160, 273],
]);

/**
 * Right arm, hanging with a slight outward lean (roughly 10 degrees off
 * vertical) and reaching mid-thigh. Closed: the arm does not touch the axis.
 * Outer edge from the shoulder to the hand, then back up the inner edge.
 *
 * The belly of the upper arm swells on the outside and pulls in on the inside
 * while the elbow and wrist stay pinned, so what changes is the CURVE of the
 * arm rather than its length or its joints.
 *
 * Drawn IN FRONT of the torso (see SILHOUETTE_PARTS). Its inner edge runs up
 * inside the torso at the shoulder — which is what makes the deltoid attach and
 * the armpit read — and the torso's flank is masked out behind it, so the two
 * contours can never cross each other.
 */
const ARM: BasePoint[] = p([
  [213, 110, 1.4], [219, 152, 1.6], [225, 194, 0.4], [231, 230, 1.2], [234, 267],
  [236, 282], [234, 296], [230, 302], [226, 299], [223, 284], [221, 267],
  [212, 230, -1], [205, 194, -0.3], [198, 152, -1.2], [188, 112], [189, 104, 0.6],
]);

/**
 * Right leg, from the hip down the outer edge, across the sole, back up the
 * inner edge to the crotch at the axis, then along the groin back to the hip.
 * Closed — it meets the axis at a single point.
 *
 * Knee and ankle are pinned at zero. The quadriceps and the calf are the two
 * largest swells in the figure, which is what makes a trained leg read as a
 * shaped leg instead of a thicker one.
 *
 * The groin edge deliberately sits ABOVE the torso's lower boundary and the leg
 * is drawn BEHIND the torso, so that edge is masked away instead of printing a
 * stray arc across the hips.
 */
const LEG: BasePoint[] = p([
  [196, 252, 1.2], [199, 272, 1.6], [199, 300, 2], [196, 326, 1.4], [192, 348, 0.4],
  [190, 360], [193, 380, 1.8], [194, 398, 1.4], [190, 420, 0.4], [186, 440],
  [184, 452], [190, 470], [191, 478], [184, 481], [172, 481], [168, 478], [170, 470],
  [174, 452], [175, 440], [174, 420, -0.3], [173, 398, -1], [172, 380, -1.2],
  [172, 360], [171, 348, -0.6], [175, 326, -1.2], [172, 300, -1.6], [166, 284, -1],
  [160, 273], [175, 268], [196, 250, 0.9],
]);

/**
 * Definition marks: the short internal contours that describe where one muscle
 * region ends and the next begins.
 *
 * `shared` is drawn on BOTH halves — softly on the untrained one — because the
 * muscles are present in both bodies and the left side must not read as an
 * empty outline. `trained` is the extra separation that only appears on the
 * training side, so "more distinct muscle-region separation" is structural
 * rather than a matter of opacity alone.
 *
 * Every mark sits well inside the narrower of the two contours, and the layer
 * is clipped to the silhouette regardless.
 */
const DEFINITION: Record<BodyMapView, { shared: BasePoint[][]; trained: BasePoint[][] }> = {
  front: {
    shared: [
      p([[168, 142], [181, 147], [192, 139]]),
      p([[169, 170], [182, 169]]),
      p([[174, 356], [190, 354]]),
    ],
    trained: [
      p([[169, 188], [181, 187]]),
      p([[169, 206], [179, 205]]),
      p([[185, 158], [187, 180], [183, 204]]),
      p([[196, 106], [203, 118], [200, 131]]),
      p([[178, 290], [186, 308], [187, 332]]),
      p([[180, 382], [184, 400]]),
    ],
  },
  back: {
    shared: [
      p([[172, 118], [186, 126], [196, 140]]),
      p([[168, 276], [182, 274], [194, 262]]),
    ],
    trained: [
      p([[170, 186], [184, 180], [196, 166]]),
      p([[166, 204], [168, 232]]),
      p([[180, 296], [186, 316], [186, 338]]),
      p([[168, 114], [182, 108], [192, 116]]),
      p([[181, 382], [185, 400]]),
    ],
  },
};

/**
 * Construction guides. Drawn ONCE, across the whole frame, not per half —
 * they belong to the drawing, not to either state, so they must not double up
 * on the axis.
 */
export const CONSTRUCTION_LINES: Array<{ y: number; from: number; to: number }> = [
  { y: 104, from: 100, to: 220 },
  { y: 210, from: 126, to: 194 },
  { y: 256, from: 118, to: 202 },
  { y: 356, from: 122, to: 198 },
];

/* ===========================================================================
 * Point table -> smooth path.
 * ======================================================================== */

function p(triples: Array<[number, number] | [number, number, number]>): BasePoint[] {
  return triples.map(([x, y, s]) => (s === undefined ? { x, y } : { x, y, s }));
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Centripetal-style Catmull-Rom through the given points, emitted as cubic
 * beziers. Uniform tension (1/6) — the tables are dense enough that uniform
 * parameterisation does not overshoot, and it keeps the conversion trivially
 * verifiable.
 */
export function smoothPath(points: Point[], closed = false): string {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M ${round(points[0].x)} ${round(points[0].y)}`;

  const at = (i: number): Point =>
    closed
      ? points[((i % n) + n) % n]
      : points[Math.min(Math.max(i, 0), n - 1)];

  let d = `M ${round(points[0].x)} ${round(points[0].y)}`;
  const segments = closed ? n : n - 1;

  for (let i = 0; i < segments; i += 1) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(p2.x)} ${round(p2.y)}`;
  }

  if (closed) d += " Z";
  return d;
}

function extentOf(points: Point[]): { top: number; bottom: number } {
  let top = Infinity;
  let bottom = -Infinity;
  for (const point of points) {
    if (point.y < top) top = point.y;
    if (point.y > bottom) bottom = point.y;
  }
  return { top, bottom };
}

/* ===========================================================================
 * The silhouette, resolved once.
 * ======================================================================== */

export interface SilhouettePart {
  id: string;
  d: string;
  /** Open parts fill against the axis; closed parts are self-contained. */
  closed: boolean;
  /**
   * The parts drawn in front of this one, whose shapes are subtracted from it.
   *
   * Without this, four separately stroked parts produce crossing contours: the
   * torso's flank runs straight through the arm, and the torso's lower boundary
   * prints a continuous arc across both hips that reads as underwear rather than
   * as anatomy. The component builds one mask per occluded part, so the figure
   * reads as a single assembled body with clean joints instead of a wireframe.
   */
  occludedBy?: string[];
}

/**
 * The parts, in BACK-TO-FRONT DRAW ORDER.
 *
 * torso -> leg -> arm -> head, with the torso subtracting both the leg and the
 * arm. The leg in front means the only line left at the hip is the LEG's own
 * top edge — a short diagonal groin crease on each side forming a V, which is
 * what an anatomy drawing shows. The arm in front means the deltoid attaches
 * over the shoulder and the armpit reads. The head closes the neck.
 */
const SILHOUETTE_PARTS: Array<{
  id: string;
  points: BasePoint[];
  closed: boolean;
  occludedBy?: string[];
}> = [
  { id: "torso", points: TORSO, closed: false, occludedBy: ["leg", "arm"] },
  { id: "leg", points: LEG, closed: true },
  { id: "arm", points: ARM, closed: true },
  { id: "head", points: HEAD, closed: false },
];

function resolveSilhouette(state: FigureState): SilhouettePart[] {
  return SILHOUETTE_PARTS.map((part) => ({
    id: part.id,
    closed: part.closed,
    occludedBy: part.occludedBy,
    d: smoothPath(derive(part.points, state), part.closed),
  }));
}

/**
 * The body itself, resolved once per state.
 *
 * Identical for both views — front and back differ only in their muscle regions
 * and definition marks, which is both true of a simplified blueprint figure and
 * the reason the two views cannot drift apart.
 *
 * The component draws `base` mirrored onto the left of the axis and `trained`
 * on the right. Note what that means: the left half is NOT a mirror of the
 * right half's geometry, it is a mirror of the SAME ANATOMY resolved to the
 * other state. Same skeleton, same proportions, different contour.
 */
export const SILHOUETTE: Record<FigureState, SilhouettePart[]> = {
  base: resolveSilhouette("base"),
  trained: resolveSilhouette("trained"),
};

/**
 * Definition-mark paths per view, split into the marks both bodies carry and
 * the extra separation only the training side shows.
 */
export const DEFINITION_PATHS: Record<
  BodyMapView,
  { shared: string[]; trained: string[] }
> = {
  front: {
    shared: DEFINITION.front.shared.map((line) => smoothPath(derive(line, "trained"))),
    trained: DEFINITION.front.trained.map((line) => smoothPath(derive(line, "trained"))),
  },
  back: {
    shared: DEFINITION.back.shared.map((line) => smoothPath(derive(line, "trained"))),
    trained: DEFINITION.back.trained.map((line) => smoothPath(derive(line, "trained"))),
  },
};

/* ===========================================================================
 * Muscle regions.
 * ======================================================================== */

export interface RegionGeometry {
  view: BodyMapView;
  /** One path per state, so a highlight always follows that side's contour. */
  d: Record<FigureState, string>;
  /** Vertical extent, derived from the region's own points. */
  top: number;
  bottom: number;
}

/**
 * Muscle regions, as the same shared-anatomy point tables with their own swell.
 *
 * A region's swell tracks the silhouette's swell where it meets it, so a
 * highlighted biceps on the training side genuinely fills the revised arm
 * contour instead of floating inside the old one — and the same shape on the
 * untrained side sits flatter against the softer contour.
 */
const REGION_POINTS: Record<string, { view: BodyMapView; points: BasePoint[] }> = {
  "front-deltoids": {
    view: "front",
    points: p([
      [187, 101, 0.8], [197, 103, 2.2], [207, 111, 3], [212, 124, 3.2],
      [206, 135, 2.6], [196, 132, 1.6], [189, 122, 0.8], [185, 110, 0.4],
    ]),
  },
  "front-chest": {
    view: "front",
    points: p([
      [168, 110], [177, 108, 1.2], [186, 114, 2], [189, 128, 2.4], [184, 142, 2],
      [174, 147, 1], [169, 143],
    ]),
  },
  "front-core": {
    view: "front",
    points: p([
      [168, 154], [183, 152, 1], [188, 170, 0.2], [187, 190, -0.8], [183, 208, -1.2],
      [179, 222, -0.6], [169, 224],
    ]),
  },
  "front-biceps": {
    view: "front",
    points: p([
      [203, 126, 1.2], [213, 132, 1.6], [217, 150, 1.6], [216, 168, 1.2],
      [208, 176, 0.6], [202, 162, -0.6], [199, 142, -0.8],
    ]),
  },
  "front-forearms": {
    view: "front",
    points: p([
      [219, 206, 0.8], [227, 216, 1.2], [230, 232, 1.2], [227, 246, 0.8],
      [220, 240, -0.4], [216, 222, -0.6],
    ]),
  },
  "front-quads": {
    view: "front",
    points: p([
      [170, 280, -0.6], [182, 276, 0.8], [194, 288, 1.8], [193, 312, 2],
      [188, 336, 1.2], [180, 350, 0.2], [174, 346, -0.4], [172, 310, -1.4],
    ]),
  },
  "front-calves": {
    view: "front",
    points: p([
      [176, 376, -1], [187, 374, 1.4], [191, 392, 1.8], [189, 410, 1], [182, 422, 0.2],
      [178, 406, -0.8], [176, 390, -1.2],
    ]),
  },
  "back-traps": {
    view: "back",
    points: p([
      [167, 88], [175, 93, 0.6], [183, 102, 1.8], [188, 114, 2.2], [178, 123, 1.4],
      [170, 117, 0.4], [167, 102],
    ]),
  },
  "back-rear-delts": {
    view: "back",
    points: p([
      [192, 100, 2], [203, 109, 3], [209, 123, 3.2], [203, 133, 2.6], [192, 130, 1.4],
      [188, 114, 1],
    ]),
  },
  "back-lats": {
    view: "back",
    points: p([
      [169, 132], [180, 130, 1.4], [190, 142, 2.4], [193, 160, 2], [188, 180, 1],
      [178, 194], [170, 194],
    ]),
  },
  "back-lower": {
    view: "back",
    points: p([
      [169, 202], [182, 200, -0.6], [186, 218, -1.2], [186, 236, -0.4], [170, 238],
    ]),
  },
  "back-triceps": {
    view: "back",
    points: p([
      [201, 128, 1.2], [211, 134, 1.6], [216, 154, 1.6], [214, 174, 1.2],
      [206, 180, 0.6], [198, 160, -0.6], [196, 140, -0.8],
    ]),
  },
  "back-glutes": {
    view: "back",
    points: p([
      [167, 242], [181, 238, 1.2], [194, 248, 2.2], [196, 266, 2.4], [188, 282, 1.6],
      [174, 284, 0.4], [167, 268],
    ]),
  },
  "back-hamstrings": {
    view: "back",
    points: p([
      [172, 292, -0.4], [184, 288, 1], [195, 300, 2], [193, 324, 2], [187, 344, 1],
      [178, 344, -0.2], [175, 318, -1.2],
    ]),
  },
  "back-calves": {
    view: "back",
    points: p([
      [176, 376, -1], [188, 374, 1.4], [192, 392, 1.8], [190, 410, 1], [183, 422, 0.2],
      [178, 406, -0.8], [176, 390, -1.2],
    ]),
  },
};

/**
 * Every region the figure can draw, keyed by the id the data file references.
 *
 * `top` and `bottom` are state-independent because the swell is horizontal
 * only — so a dimension bracket measures the same extent on either side of the
 * figure and can never disagree with the shape it belongs to.
 */
export const REGION_GEOMETRY: Record<string, RegionGeometry> = Object.fromEntries(
  Object.entries(REGION_POINTS).map(([id, entry]) => {
    const { top, bottom } = extentOf(entry.points);
    return [
      id,
      {
        view: entry.view,
        top,
        bottom,
        d: {
          base: smoothPath(derive(entry.points, "base"), true),
          trained: smoothPath(derive(entry.points, "trained"), true),
        },
      },
    ];
  })
);

/** All region ids, in authored order. Front regions first, then back. */
export const REGION_IDS: string[] = Object.keys(REGION_POINTS);

/* ===========================================================================
 * Resolving the data file against the geometry.
 * ======================================================================== */

export interface ResolvedRegion {
  id: string;
  label: string;
  view: BodyMapView;
  top: number;
  bottom: number;
}

export interface ResolvedGroup {
  id: string;
  /** 1-based, zero-padded. Assigned after filtering, so there are no gaps. */
  index: string;
  label: string;
  note: string;
  regions: ResolvedRegion[];
  /** Views in which this group has at least one region. */
  views: BodyMapView[];
}

function padIndex(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Resolve the configured groups against the geometry table.
 *
 * A region id with no geometry is DROPPED and a group left with no regions at
 * all is dropped with it. A typo in a clone's data file therefore costs one
 * label, never a broken figure or an empty selector entry.
 */
export function resolveGroups(groups: BodyMapGroup[]): ResolvedGroup[] {
  const resolved: ResolvedGroup[] = [];

  for (const group of groups) {
    if (!group.enabled) continue;

    const regions: ResolvedRegion[] = [];
    for (const region of group.regions) {
      const geometry = REGION_GEOMETRY[region.id];
      if (!geometry) continue;
      regions.push({
        id: region.id,
        label: region.label,
        view: geometry.view,
        top: geometry.top,
        bottom: geometry.bottom,
      });
    }

    if (regions.length === 0) continue;

    const views = BODY_MAP_VIEWS.filter((view) =>
      regions.some((region) => region.view === view)
    );

    resolved.push({
      id: group.id,
      index: padIndex(resolved.length + 1),
      label: group.label,
      note: group.note,
      regions,
      views,
    });
  }

  return resolved;
}

/** The active group's regions that belong to the view currently on screen. */
export function regionsForView(
  group: ResolvedGroup | undefined,
  view: BodyMapView
): ResolvedRegion[] {
  if (!group) return [];
  return group.regions.filter((region) => region.view === view);
}

/**
 * Which view to show for a group.
 *
 * Keeps the current view when the group has anything to show there — selecting
 * "Legs" while looking at the back must not snap the figure to the front. When
 * it does not (selecting "Chest" from the back view), the figure turns to the
 * view that can actually answer, because silently highlighting nothing would be
 * the worse outcome.
 */
export function viewForGroup(
  group: ResolvedGroup | undefined,
  currentView: BodyMapView
): BodyMapView {
  if (!group || group.views.length === 0) return currentView;
  if (group.views.includes(currentView)) return currentView;
  return group.views[0];
}

/* ===========================================================================
 * Label layout.
 * ======================================================================== */

export interface LabelPlacement extends ResolvedRegion {
  /** Vertical centre of the region — where its dimension bracket is measured. */
  bracketY: number;
  /** Where the label actually sits, after collision resolution. */
  labelY: number;
}

export const LABEL_MIN_SPACING = 34;
export const LABEL_TOP_BOUND = 30;
export const LABEL_BOTTOM_BOUND = 470;

/**
 * Place the active regions' labels down the dimension column.
 *
 * Each label wants to sit at its region's vertical centre. Two regions of the
 * same group can be close together (traps and rear delts are ~11 units apart),
 * so labels are pushed apart to `LABEL_MIN_SPACING` in region order and the
 * whole stack is then shifted back inside the frame if the last one overran.
 * The BRACKET never moves — it keeps measuring the real extent — so the tie
 * line between bracket and label is what absorbs the offset.
 */
export function layoutLabels(regions: ResolvedRegion[]): LabelPlacement[] {
  if (regions.length === 0) return [];

  const ordered = [...regions]
    .map((region) => ({ region, bracketY: (region.top + region.bottom) / 2 }))
    .sort((a, b) => a.bracketY - b.bracketY);

  const placed: LabelPlacement[] = [];
  let cursor = -Infinity;

  for (const { region, bracketY } of ordered) {
    const labelY = Math.max(bracketY, cursor + LABEL_MIN_SPACING, LABEL_TOP_BOUND);
    cursor = labelY;
    placed.push({ ...region, bracketY, labelY });
  }

  const overflow = cursor - LABEL_BOTTOM_BOUND;
  if (overflow > 0) {
    // Shift the stack up by the overrun, then re-separate downward from the
    // top bound so a very tall stack cannot be pushed off the top instead.
    let previous = -Infinity;
    for (const item of placed) {
      const shifted = Math.max(
        item.labelY - overflow,
        previous + LABEL_MIN_SPACING,
        LABEL_TOP_BOUND
      );
      item.labelY = shifted;
      previous = shifted;
    }
  }

  return placed;
}

/** A y coordinate in the drawing frame as a percentage of the frame's height. */
export function framePercent(y: number): string {
  return `${round(((y - FRAME_Y) / FRAME_H) * 100)}%`;
}

/**
 * Left edge of the HTML label gutter, as a percentage of the figure box.
 * Consumed as a custom property so the value lives here, with the geometry,
 * rather than being duplicated as a magic number in CSS.
 */
export const LABEL_GUTTER_LEFT = `${round(((LABEL_ZONE_X - FRAME_X) / FRAME_W) * 100)}%`;

/**
 * Where the centre axis falls across the cropped body region, as a percentage.
 *
 * The state labels above the figure are split on exactly this line, so
 * "NOT TRAINING REGULARLY" sits over the untrained half and "TRAINING
 * REGULARLY" over the trained half at every viewport width, rather than being
 * centred on a box that also contains the label gutter.
 */
export const AXIS_SPLIT = `${round(((AXIS_X - FRAME_X) / FIGURE_CROP_W) * 100)}%`;

/* ===========================================================================
 * Accessible summary.
 * ======================================================================== */

/**
 * Sentence listing every labelled region per view.
 *
 * Rendered visually-hidden beside the figure. A screen-reader user gets the
 * figure's content — which regions it labels, on which view — rather than a
 * single alt string that describes a drawing they cannot explore.
 */
export function buildFigureSummary(
  groups: ResolvedGroup[],
  labels: { front: string; back: string }
): string {
  const parts: string[] = [];

  for (const view of BODY_MAP_VIEWS) {
    const names: string[] = [];
    for (const group of groups) {
      for (const region of group.regions) {
        if (region.view !== view) continue;
        if (!names.includes(region.label)) names.push(region.label);
      }
    }
    if (names.length === 0) continue;
    parts.push(`${labels[view]}: ${names.join(", ")}.`);
  }

  return parts.join(" ");
}

/** Graduation positions along the floor baseline. Derived, never hand-listed. */
export function floorTicks(step = 24): number[] {
  const ticks: number[] = [];
  for (let x = FLOOR_FROM + step; x < FLOOR_TO; x += step) ticks.push(x);
  return ticks;
}
