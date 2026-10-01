# Master Pass 1 — Design Direction (Header / Hero / Kinetic Strip)

This document records the visual DNA established in Pass 1 so later passes
(About, Programs, Why Us, Transformations, Reviews, Membership, Gallery,
Instagram, FAQ, Contact, Location, Final CTA, Footer) inherit it instead of
re-deriving a new language. Scope fence: **only Header, Hero, and the new
Kinetic Identity Strip were rebuilt this pass.** Everything else keeps its
current implementation; only shared tokens defined here are available to
future passes.

## 1. References inspected

All 12 images in `docs/references/` were opened and visually reviewed (not
inferred from filenames). Two are the locked influences for this pass:

- **gym-reference-05** (Recess Fitness Club) — dark athletic-editorial hero:
  an oversized, stacked, left-aligned headline (five short lines, one line
  set in the accent color), floating rating/stat chips overlaid directly on
  the photograph, a vertical badge on the frame edge, and a full-width stat
  bar anchored to the bottom of the hero. Informs: display type scale,
  floating metadata chips, bottom metadata bar.
- **gym-reference-11** (PulseFit) — headline typography interleaved with the
  athlete's silhouette (text sits both behind and in front of the subject,
  implying depth), a thin single-pixel rule crossing the composition, a
  floating pill-shaped nav bar detached from the viewport edge, and a
  vertical "Scroll" cue with a short animated line. Informs: header
  treatment (floating bar, not full-bleed), thin rule motif, scroll cue.
- **gym-reference-08** (GYMX) — two marquee text bands directly under the
  hero, running in opposite directions, each word pair separated by a small
  glyph (star/dot), set at a slight opposing skew. Informs: the Kinetic
  Identity Strip.

Anti-patterns observed across the other 9 references and deliberately
avoided: rounded "card soup" hero panels, dead-centered symmetric hero
copy, neon/glow accent treatment, small or mid-weight H1s that don't
dominate the fold.

## 2. Type system

- New fixed display scale utility class `.factory-display` —
  `clamp(3rem, 9vw, 8.5rem)`, `line-height: 0.92`, `letter-spacing: -0.02em`.
  Replaces the previous hero H1 sizing (`clamp(2.75rem,7.5vw,6.5rem)`), which
  read as "large body type" rather than an editorial statement headline.
- Headline lines continue to be authored with `\n` in `lib/hero.ts` (no data
  contract change) and rendered as stacked `<span class="block">` lines, one
  of which (the last line of each slide) is rendered in `--accent` to match
  the single-accent-line pattern from reference 05.
- `.factory-index` — a new monospace numeral utility (`00` styled with the
  existing `--font-geist-mono`, larger tracking, dimmed to `--text-secondary`
  at rest) used for the hero's chapter numbering and can be reused by any
  future numbered list section (Programs, FAQ, etc.).


## 3. Rule & metadata language

- `.factory-hairline` — a 1px `--border` colored rule with a short animated
  accent-colored "fill-in" on state change, used under the eyebrow/chapter
  label in the hero. Distinct from the existing full-width `.factory-rule`
  section divider, which is unchanged.
- Floating metadata chips (verified review count, locality) sit as
  absolutely-positioned overlays on the hero image rather than inline text
  under the CTA row, echoing reference 05's chip placement. Content is
  unchanged (still sourced from `Hero.tsx`'s existing data reads); only the
  layout position moved.

## 4. Header

- Rebuilt as a floating inset bar (`inset-x-4 top-4` on a rounded, bordered,
  translucent `--surface` panel) rather than a full-bleed bar pinned flush to
  the viewport edge, matching reference 11's floating-pill language while
  keeping it rectangular (not a pill) to stay consistent with the Factory's
  non-rounded shape language elsewhere in the system.
- Still a Server Component. No scroll listener was added — the floating
  panel already has its own background/border so it stays legible over any
  hero image without JS-driven scroll state, preserving the previous
  approach's rationale.
- `MobileNav` interaction logic is unchanged; only its trigger's visual
  container moved with the new header shell.

## 5. Hero

- `HeroSlider` keeps its existing architecture (clip-path directional wipe,
  6s autoplay, keyboard/touch/reduced-motion support, data-driven slides) —
  Pass 1 rebuilds its visual composition, not its interaction model.
- Each slide now renders a chapter number + name derived from the existing
  `eyebrow` field (no data contract change): `01 — THE PLACE`, `02 — THE
  COACHING`, `03 — THE TRAINING`, reusing `lib/hero.ts`'s current eyebrow
  copy. (Requested labels STATEMENT/COACHING/MOVEMENT are the *conceptual*
  slide roles for this doc; the on-screen label stays sourced from real data
  in `lib/hero.ts` rather than hardcoding new marketing copy not present in
  the data file.)
- Headline uses `.factory-display`; final authored line of each headline
  renders in `--accent`.
- The copy block already sat over the full-bleed image (bottom-anchored,
  gradient-scrimmed) before this pass; Pass 1 keeps that stacking model as
  is and pushes the integration further only through scale — the display
  type is now large enough that it reads as part of the photographic
  composition rather than a caption sitting on top of it. Chip-style
  metadata (trust motif, locality) moved out of the copy flow into
  absolutely-positioned corners of the image, echoing reference 05.
- Entrance is a CSS-only staggered reveal (`animation-delay` on the eyebrow,
  headline, subheadline, CTA row) triggered on slide change — no JS
  animation timeline, consistent with the "CSS/IntersectionObserver only"
  constraint.
- A vertical "Scroll" cue (short animated line + rotated label) sits at the
  bottom-right of the hero on `lg:` and up, echoing reference 11.

## 6. Kinetic Identity Strip — two-band athletic editorial motion

Superseded revision (this section replaces the original single-treatment
marquee description). The strip is now two deliberately unequal bands, not
one treatment applied twice.

- `components/sections/KineticStrip.tsx` renders directly under `Hero` in
  `app/page.tsx`, before `Trust`. One `Band` implementation serves both
  bands; everything that differs comes from a preset in
  `components/sections/kineticBands.ts` (fixed motion/typography system):
  direction, target velocity, typography variant, density, separator, and
  which phrase index carries the recessed/accent tone.
- **Band 01 — declaration.** `business.name` ✦ `business.tagline` at
  `clamp(1.6rem, 5vw, 4.25rem)`/800 weight, uppercase, on `--bg-primary`
  with no top border, so it reads as the hero's own type continuing off the
  fold. Moves **left** at a target 42 px/s. The brand phrase is recessed via
  `color-mix` toward the background so the statement line dominates without
  a second accent color.
- **Band 02 — technical.** locality ✦ `Est. Training Floor` ✦
  `business.name` in Geist Mono at `clamp(0.6875rem, 1.05vw, 0.8125rem)`,
  `0.22em` tracking, tighter gap, on `--bg-secondary`. Moves **right** at a
  target 60 px/s (≈1.43×), reading as a second, independent motion field and
  a quiet step down into `Trust` (whose own top border supplies the closing
  rule).
- Content still comes only from existing verified business facts in
  `lib/kinetic-strip.ts` (which is now content-only) — no invented
  superlatives, so a fresh clone stays Source-First compliant.
- **Seamless loop.** The track holds exactly two identical copies and
  animates `translate3d(0,0,0)` → `translate3d(-50%,0,0)` (reversed for band
  02), so the seam is exact and drift-free. Inside each copy the sequence
  repeats the *minimum* number of times needed for one copy to exceed
  `MIN_COPY_PX` (2400) — otherwise a copy narrower than the viewport scrolls
  a visible blank gap through on large screens. Repeat count and duration are
  computed from character-count width estimates at the type ceiling, so
  duration = distance ÷ target velocity rather than a magic seconds value.
- **Responsive.** One `clamp()` scale per band, no breakpoint ladder. Because
  duration is fixed while type scales with the viewport, narrow viewports
  move *slower*, never faster; a single `max-width: 639px` rule shortens only
  the declaration band's duration (×0.75) so it does not fall below ~21 px/s
  at its clamp floor. Verified 42→21 px/s (band 01) and 60→51 px/s (band 02)
  across 1920→375.
- **Reduced motion.** `animation: none`, duplicate runs `display: none`, the
  remaining run wraps (`white-space: normal`, `flex-wrap: wrap`, container
  padding, trailing separator dropped) — the complete phrase sequence stays
  readable in a stable, non-shifting layout.
- **Accessibility.** Only the first run of each band is in the accessibility
  tree; every duplicate run and every separator glyph is `aria-hidden`, so
  the meaningful content is announced exactly once per band. No interactive
  elements, so no focus traps and no skip target needed.
- **Performance.** Server Component, zero client JS, transform-only
  animation with `will-change: transform`, `overflow: hidden` clipping so the
  oversized track can never widen the document. No animation library.
- Geometry and motion invariants are locked by
  `scripts/kinetic-strip.test.mjs` (`node --test`).

## 7. Tokens added (fixed, available to later passes)

All added to `app/globals.css`'s fixed primitives section:
`.factory-display`, `.factory-index`, `.factory-hairline`,
`factory-strip-left`/`factory-strip-right` keyframes +
`.factory-strip-viewport` / `.factory-strip-track` / `.factory-strip-run` /
`.factory-strip-phrase` / `.factory-strip-sep` and the
`.factory-strip--declaration` / `.factory-strip--technical` variants,
`.factory-stagger-in` keyframes + `[style] animation-delay` convention for
staggered children.

## 8. Explicitly out of scope this pass

About, Programs, Why Choose Us, Transformations, Reviews, Membership,
Gallery, Instagram, FAQ, Contact, Location, Final CTA, Footer, WhatsApp
floating button, Contact dialog. These keep their current implementation
and only inherit the new tokens above if a future pass opts in. (About was
later rebuilt in its own pass — see section 9.)

## 9. Pass 3 — Section 01 (facility / training-floor editorial)

Scope fence: **only `components/sections/About.tsx` was rebuilt.** Header,
hero, both kinetic strips and the trust rail are frozen and untouched;
Section 02 (Programs) onward is untouched. Every CSS rule added is new and
consumed only by Section 01, and `SectionHeading` / `IndexNumeral` were
deliberately left alone because Section 02 depends on them.

- **Composition.** Three interlocking bands, not "two columns with cards
  underneath": a dossier head (mono index + accent rule + eyebrow spine,
  display heading left, narrative deck right), a plate band (training-
  environment index left, the single photograph right, its column pulled back
  across the index gutter), then a closing technical row (support metadata +
  derived schedule) above a single rule.
- **Image.** One asymmetric editorial frame: clipped top-right corner
  (`.factory-frame-notch`, notch scales with the viewport), an empty offset
  outline plane behind it, an accent rule entering from outside the top-left, a
  vertical mono label crossing the left edge on a section-surface plate, and a
  technical caption chip on the photograph. Recomposed per breakpoint (`4/5`
  phone → `3/2` tablet → `16/11` desktop) with a fixed `object-position`, so
  the crop stays meaningful instead of being scaled.
- **Hierarchy.** Primary modules are ruled index rows (mono index + geometric
  icon + uppercase label + one factual line); secondary attributes are quiet
  mono tokens with a short accent tick. Nothing is a rounded card, and the two
  levels are deliberately different objects.
- **Icons.** `components/ui/TrainingIcon.tsx` — five geometric line marks on
  one 24px grid, 1.5px square-capped stroke, `currentColor`, always
  `aria-hidden`. No icon library.
- **Type.** `.factory-section-display` (`clamp(2.125rem, 4.6vw, 4rem)`) — one
  deliberate step below `.factory-display`, with the final authored headline
  line in `--accent`, matching the hero's single-accent-line rule.
- **Motion.** Existing `Reveal` observer plus CSS only: a clip-path mask wipe
  with a 1.04 → 1 settle on the photograph, and `.factory-stagger-child`
  (inline `transition-delay` per item) for the module sequence, so a list can
  stagger inside one observer without breaking `ul > li`. One pass, no idle
  animation, no parallax, full `prefers-reduced-motion` opt-out.
- **Data.** New `lib/about.ts` + types: labels, image, zones and attributes are
  customizable; `verified: false` rows never render; the narrative stays
  `business.description`; the opening schedule is *derived* from
  `business.hours` by `scheduleWindows()` (consecutive day ranges sharing one
  window; nothing renders above three distinct windows). Invariants locked by
  `scripts/about-section.test.mjs` (`node --test`).

## 10. Pass 6 — Section 03 (Why Choose Us / PERFORMANCE BLUEPRINT)

Scope fence: **only `components/sections/WhyChooseUs.tsx` and its client island
were rebuilt.** Header, hero, both kinetic strips, the trust rail, Section 01
and Section 02 are frozen and untouched. The superseded Section-03-only CSS
(the Pass 5 `.factory-dossier-*` / `.factory-principle-*` rules) was removed
rather than edited, and every rule added is new and consumed only by Section 03
— no shared primitive was modified.

Why it was rebuilt: the previous composition was Section 02's grammar mirrored
(indexed rows in one column, a photo panel in the other, one selection driving
the image). Two adjacent sections cannot share a structural grammar.

- **Concept.** A technical sheet: the athlete is the centre column, the
  manifesto crosses the top of the frame, and the principles are indexed
  annotations in the space around him, each wired to the subject by a connector
  hairline that terminates in a crosshair riding the frame's edge.
- **Composition.** Three columns at 1280+ (annotations · subject ·
  annotations) with the figure spanning the sheet header and both annotation
  rows and pulled up into the statement. The first four principles take the
  perimeter slots at four deliberately different heights; a trailing fifth
  lands on the centre axis under the subject (`annotationSlot()` in
  `components/motion/blueprintField.ts`, placement passed to CSS as
  `--wcu-row` / `--wcu-col`). 768–1279 recomposes: centred anchor plate, sheet
  header above, two-column annotation field below with an offset rhythm.
  Phones: full-bleed athlete, floor line drawn on the frame itself, and the
  first annotation crossing the photograph's lower edge.
- **Annotations, not cards.** No border box, no fill, no radius, no icon. Mono
  index + derived `nn / NN` ref + uppercase title + the existing description,
  ragged toward the figure (right-aligned on the left, left-aligned on the
  right, centred on the axis).
- **Surface.** A black blueprint plate — a step away from Section 01's
  `--bg-secondary` and Section 02's flat graphite: two-axis 5rem training grid,
  centre axis, edge measurement graduations, a lit column behind the subject,
  and concentric plate rings anchored to the figure (so they can never land as
  stray arcs). Existing tokens only; the section still reads as a gym sheet
  with the photograph removed.
- **Image.** One anchor photograph, never swapped. All four edges dissolve into
  the sheet (`.factory-blueprint-scrim`) so it reads as campaign photography
  rather than a panel, and so the statement and the crossing annotation stay
  legible over it.
- **Interaction.** Hover, focus and click share one state. Active moves
  `--wcu-aim` (measured against the active annotation's index row at 1280+, so
  connector and crosshair form one continuous leader; derived from
  `targetOffset()` below that and on the server) and `--wcu-scan` (the floor
  line's tick). The connector grows, the index steps to accent, the description
  brightens, and the subject drifts 0.9% toward the annotation being read. No
  zoom, no glow, no card lift. Each title is a real `<button>` inside its own
  `<h4>` (the accordion-header pattern), so the accessible name is the
  principle and every description stays visible at all times.
- **Motion.** Existing `Reveal` + CSS: statement lines stagger, the photograph
  wipes up from the floor line with a 1.06 → 1.02 settle, the floor line draws,
  then the annotations stagger. One pass, no idle animation, no parallax.
  `prefers-reduced-motion` drops the mask entirely and removes every transition
  while keeping the active state fully usable.
- **Data.** `whyChooseUsConfiguration` in `lib/why-choose-us.ts` (manifesto,
  deck, label, anchor + crop) with the five principles unchanged. Invariants
  locked by `scripts/why-choose-us.test.mjs` (`node --test`): slot geometry for
  1–9 principles, aim range, one `<Image>`, alt text that never restates a
  claim, heading hierarchy, hover/focus/click parity, reduced motion, and that
  the superseded dossier rules are gone.


## 11. Pass 11 — Section 07 (Between Sessions / interval log + body map)

Scope fence: **only `components/sections/BetweenSessions.tsx` and its three
client islands were added.** Header, hero, both kinetic strips, the trust rail
and Sections 01–06 are frozen and untouched — the only edits outside Section 07
are three additive lines (a `betweenSessions` flag in `lib/sections.ts`, the
flag's type in `lib/types.ts`, and the render + import in `app/page.tsx`). Every
CSS rule added is new, namespaced `.s07-`, appended after the Pass 10 block, and
consumed only by this section. The navigation was deliberately left alone, since
Section 05 is not in it either.

Why the section exists: Section 05 answers "how does my goal change how I
train?". Section 07 answers what happens in the hours and days *around* a
session, and closes on an original anatomy blueprint.

- **Signature object A — a vertical graduated time spine.** The interval log
  descends from `LAST REP` to `NEXT SESSION` with four stations clamped onto one
  continuous spine at their own RELATIVE interval markers (`T+ 0-2 H`,
  `That night`, `Next day`, `Before next session` — never clock times, because
  the factory cannot know when anyone trains). Each station is a different
  *shape*: `RECOVER` carries a ruled "watch for" note the others do not, so the
  descent has real rhythm instead of four identical blocks. The whole log is
  static and server-rendered. It is not Section 02's grammar: that is a uniform
  interactive index that swaps a preview image; this is a non-uniform,
  non-interactive log sheet hung off a measured time axis.
- **Signature object B — one figure split down its own centre axis.** The left
  half is the drawing without regular training, the right half is the *same
  geometry* with a firmer contour, region differentiation and a few definition
  marks. Only the right half is authored (`components/sections/bodyMap.ts`); the
  left is a mirror transform of it, so "same body, different routine" is
  literally true rather than asserted — nothing is enlarged, nothing morphs, and
  the state change is a crossfade of line work. This also removes the need for a
  before/consistent toggle (comparison is simultaneous, not remembered) and is
  the only version of the idea that survives 375px: two bodies at that width are
  two illegible bodies, one body is simply a narrower body.
- **The figure is data, not a pasted path string.** Every contour is a table of
  points converted to smooth cubics at module load, so the drawing is adjusted
  by moving a coordinate, each region's dimension bracket is *derived* from the
  same points that draw it, and `scripts/between-sessions.test.mjs` can assert
  every coordinate stays in frame, that nothing crosses the centre axis, and
  that no label stack overlaps. A shared `<clipPath>` built from the same
  silhouette table clips the region and definition layers, so a region can never
  bleed past the contour even after a future edit.
- **Labels are a dimension schedule, not Section 03's radial annotations.** Each
  active region gets a bracket over its *real vertical extent* plus a tie out to
  a label gutter that is part of the drawing frame — so an HTML label (CSS type
  scale) always meets the SVG tie arriving at it, at any viewport width.
  `layoutLabels()` pushes colliding labels apart while the bracket stays on the
  region. Below 640px the gutter is too narrow to set type in, so the labels move
  into the readout as a mono row, the ties withdraw, and the box crops back to
  the body rather than centring the figure in a third of blank drawing.
- **Surface.** Cool graphite steel — a deliberate opposite to Section 05's warm
  chalk, and not a third black plate. Two large masked shapes (an enormous sweep
  arc and an oversized dimension bracket), sparse edge calibration, a fine grain
  and four registration marks. Nothing on the field animates. Achieved by
  re-pointing `--text-primary` / `--text-secondary` / `--border` on
  `.s07-surface` itself; `:root` is untouched.
- **Zero raster images.** There is no `<img>`, no `next/image` and no `url()` in
  the chapter. The gym reads through drawn equipment geometry: a barbell line
  with collars laid across the figure's shoulders, a floor baseline with
  graduations, construction guides, tape-style spine ticks and measurement
  brackets. `artifact` exists in the contract and is disabled in the master
  template.
- **Three restrained interactions, all keyboard-complete.** A week-pattern radio
  group, a front/back radio group, a region tab list, plus three native
  checkboxes. The figure itself is `role="img"` with a visually-hidden region
  summary — deliberately *not* interactive, because making 15 muscle shapes
  clickable would add duplicate tab stops and sub-minimum touch targets for
  actions the labelled controls already provide. No information is hover-gated,
  and the chapter teaches fully with zero interaction (first pattern and first
  region group are selected on the server).
- **Content governance.** Every sentence is the reviewed global library in
  `lib/between-sessions.ts`. The tests assert that no educational sentence
  contains a numeral of any kind, no dose/target/guarantee vocabulary, no
  scoring vocabulary in the pre-session check, exactly one escalating prompt
  that defers to a coach and a clinician, and that the body map never promises a
  physique. The check stores nothing: three booleans, no `localStorage`, no
  network call, no score — the contract has no field to put one in.
- **Motion.** Existing `Reveal` plus CSS: the chapter rule draws, headline lines
  stagger, each station reveals on its own (the log is taller than a viewport,
  so one observer on the whole list would fire the sequence off-screen) and its
  spine node rotates to a diamond, region state is a fill/stroke crossfade, and
  the dimension bracket and label fade in. No bounce, no loop, no parallax, no
  scroll-jacking. `prefers-reduced-motion` removes all of it while leaving every
  active state fully expressed.
- **Invariants** locked by `scripts/between-sessions.test.mjs` (`node --test`):
  110 tests covering gap derivation, figure geometry, label layout, data-to-
  geometry resolution, content governance, semantics, wiring, CSS namespacing
  and the reduced-motion contract.

Verification performed this pass: `npm run lint` clean, `npm run build`
succeeds, `node --test scripts/*.test.mjs` 241/241 pass (no regression in any
frozen section's suite), and the prerendered `index.html` was inspected
directly — one `<h2>`, two `<h3>`, five `<h4>`, no `<h5>`/`<h6>`, zero `<img>`,
one `<svg>` with 76 paths and the clip path, `role="img"` with a 241-character
accessible label, two radio groups, one tab list with six tabs and one tab
panel, three checkboxes, two polite live regions, four stations with the correct
relative markers, and a CTA href carrying the chapter's message. The figure's
geometry was additionally rasterised to ASCII and read directly during
development, which is how an over-splayed arm was caught and corrected.
**Not verified:** rendered pixel appearance and colour, because no browser or
screenshot tooling was available in this environment — the aesthetic claims
above rest on the geometry, computed CSS and DOM evidence, not on a screenshot.


### 11a. Pass 11a — Body Map art-direction refinement

Scope fence: **only the Body Map was touched.** The Interval Log, the training
week strip, all four stations, the pre-session check, the safety language, the
CTA, the Section 07 architecture and every Section 01–06 file are unchanged;
frozen-section mtimes were checked to confirm it. Everything below lives in
`components/sections/bodyMap.ts`, `components/motion/BodyMap.tsx`, the
`bodyMap` block of `lib/between-sessions.ts` and the `.s07-` CSS.

Why: the first version communicated the comparison only through line weight and
region opacity, so the two halves were anatomically identical and the viewer had
to read the paragraph to know which side was which.

- **One shared anatomy, two derived contours.** Every authored point now carries
  a third number — a signed horizontal CONTOUR SWELL. `derive(points, state)`
  applies the full swell outward for the trained state and 0.55 of it inward for
  the untrained one, so the authored table sits *between* the two states and
  neither is privileged. The left half is still a mirror, but it is a mirror of
  the same anatomy resolved to the *other* state, not a mirror of the geometry
  opposite it.
- **The swell is horizontal only, and that is the guarantee.** No `y` is ever
  touched, so identical height, identical head, identical joint heights and
  identical limb placement are properties of the code rather than of care. The
  head's path is byte-identical between states; the hands — the figure's widest
  point — are identical; knees, ankles and wrists measure identical. Fullness is
  therefore unambiguously muscle, not a bigger body.
- **Shaped, not just bigger.** The chest swells out while the waist pulls in, so
  the trained side carries a measurably stronger taper (locked at >1.25x the
  untrained taper). Limb bellies are 10–35% thicker — the test asserts both
  bounds, so the effect can neither disappear nor drift into a physique claim.
  Overall shoulder width differs by under 6%.
- **The assembly problem, fixed.** The figure is four overlapping parts, and
  stroking them independently printed the torso's flank straight through the arm
  and a continuous arc across both hips that read as underwear. Parts now
  declare `occludedBy`, the component emits one SVG `<mask>` per occluded part,
  and the draw order is torso → leg → arm → head. The torso subtracts both the
  leg and the arm: the deltoid attaches over the shoulder, the armpit reads, and
  the only line left at the hip is the leg's own short diagonal groin crease.
- **Regions follow their own side's contour.** `REGION_GEOMETRY[id].d` is now
  keyed by state, so a highlighted biceps fills the revised arm instead of
  floating inside the old one. Extents stay state-independent (the swell is
  horizontal), so a dimension bracket can never disagree with the shape it
  measures. Arm and back regions were reshaped from full-length lozenges into
  muscle bellies, and every region was pulled clear of the centre axis — a test
  samples the drawn curve, not the bezier handles, to prove it.
- **Both bodies show muscle.** The untrained half keeps the shared definition
  marks at 0.3 opacity and keeps faint region boundaries, so it reads as *less
  pronounced* rather than empty. The trained half adds a second set of marks
  that only it carries, so "more distinct separation" is structural.
- **Labels over their own halves.** `NOT TRAINING REGULARLY` and `TRAINING
  REGULARLY` are real `<p>` elements in a row directly above the figure, split
  on `AXIS_SPLIT` — the axis's true position across the cropped body region — so
  the association holds at every width. Captions carry the drawing convention
  and are hidden below 640px rather than stacking wrapped lines. The axis note
  reads "Same body · different training state". A test forbids the words
  before/after/transformation/results/guaranteed anywhere in this copy.
- **More authority.** The figure is sized by an explicit `--s07-fig-h` (32–38rem)
  from which the wrap derives its width, so the label row and the figure share
  one measurement. The rendered body went from ~160px to 159–189px wide and is
  now monotonic across viewports — previously a laptop showed a *smaller* figure
  than a phone.

Verification performed this pass: `npm run lint` clean, `npm run build`
succeeds, `node --test scripts/*.test.mjs` **259/259 pass** (no regression in any
frozen section's suite), frozen-section mtimes unchanged, and the prerendered
`index.html` inspected — 1 `<h2>` / 2 `<h3>` / 5 `<h4>`, no `<h5>`/`<h6>`, zero
`<img>`, one `<svg>` with 73 paths, two clip paths and two occlusion masks, both
state labels present as text ahead of the figure, a 365-character accessible
figure description, two radio groups, one tab list with six tabs, three
checkboxes and two live regions.

**This pass was verified visually.** A throwaway rasterizer (`node:zlib` only)
rendered the composed figure to PNG at 2.4x and the images were inspected
directly. That is how the crossing torso/arm contours, the hip arc, the deltoid
region spilling onto the neck, the rib-like abdominal bars, the bandage-shaped
arm regions and the regions bulging across the axis were all found and fixed —
none of them were visible from the geometry alone. Resolved figure geometry was
computed at 375, 390, 430, 768, 1024, 1366, 1440 and 1920 and fits the container
at every one. **Not verified:** the section rendered in a real browser, since no
browser is available here — the rasterizer reproduces the SVG composition and the
palette but not CSS layout, font rendering or the surrounding section.
