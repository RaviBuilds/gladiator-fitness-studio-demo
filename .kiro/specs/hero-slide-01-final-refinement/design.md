# Hero Slide 01 Final Refinement Bugfix Design

## Overview

Slide 01's layered stage (back type, athlete cutout, front type) breaks in three ways. Below 1024px the composition zone is measured from the wrong thing, so the stage sits under the copy. The waist crop and missing lighting make the athlete look pasted on. The headline layers are authored far apart and barely interlock with the silhouette. Separately, the shared slider autoplays with no pause and ignores reduced motion (WCAG 2.2.2).

The fix is targeted. It corrects the zone measurement in `HeroSlider`, retunes the stage CSS (mask fade, tonal grade, one key light, tighter type shadows, zone-relative light and shadow), re-authors Slide 01 composition data in `lib/hero.ts`, hides the motif chip below `lg`, and adds pause and reduced-motion gating to autoplay. No new dependencies, no change to `lib/types.ts`, no change to Slides 02/03 rendering.

Files touched: `components/motion/HeroSlider.tsx`, `app/globals.css` (hero stage section only), `lib/hero.ts` (slide 0 `composition` and its comment). Optional: a new pure helper `components/motion/heroZone.ts` and `scripts/hero-zone.test.mjs`.

## Glossary

- **Bug_Condition (C)**: A render or interaction state of the hero that hits any defect clause 1.1–1.15.
- **Property (P)**: The correct outcome for those states, per clauses 2.1–2.17.
- **Preservation**: Clauses 3.1–3.14. Everything outside C must behave exactly as before.
- **Stage**: `.factory-hero-stage`. Only rendered for slides with `headlineLayers` and `composition` (Slide 01 today).
- **Composition zone**: `.factory-hero-zone` (`--behind` z-10, `--front` z-30). All authored percentages resolve against it. At ≥1024px it is the full frame. Below 1024px its bottom is `var(--hero-copy-h)`.
- **`--hero-copy-h`**: Inline CSS var set by `measure()` in `HeroSlider`. The name is kept, but it now means "zone bottom offset as % of the section", not "copy height".
- **Copy block**: The `copyRef` div (eyebrow through CTAs). The slide controls (`mt-14` + 36px buttons) and container `pb-20`/`sm:pb-28` sit below it inside `.factory-container`.
- **Subject box / inner**: `.factory-hero-subject-box` (static centering `translateX(-50%)`) and `.factory-hero-subject-inner` (entrance + idle transform).
- **Asset geometry** (`banner-image-03.png`, 961×1442, aspect 0.666): head at 32–62% of image width in the top ~28% of height. Shoulders/traps widen from ~20% to ~95% width at 28–40% height. Torso/arms span nearly full width at 40–70%. Shorts crop at the bottom edge. Key light comes from the viewer's left.

## Bug Details

### Bug Condition

The defects come from four sources. (a) `measure()` uses copy height instead of copy top, clamped 30–58%. (b) Stage CSS: frame-relative scrim, contact shadow and light fields, heavy type drop-shadows, no subject grade. (c) Composition data places the back type at head height and the two layers ~1.8× type size apart. (d) The autoplay effect has no pause or reduced-motion gate.

**Formal Specification:**
```
FUNCTION isBugCondition(X)
  INPUT: X = { vw, vh, slideIndex, reducedMotion, pointerInHero, focusInHero, docHidden }
  OUTPUT: boolean

  stage := slides[X.slideIndex].composition AND slides[X.slideIndex].headlineLayers

  layoutBug := stage AND (
       (X.vw < 1024 AND zoneBottomPx(X) < copyTopFromBottomPx(X))    // 1.1-1.3 zone overlaps copy
    OR cropEdgeVisible(X)                                           // 1.4
    OR contactShadowNotAtZoneBottom(X)                               // 1.5
    OR subjectUngraded OR backTypeHasHeavyShadow OR frontShadowBlur > 0.04em  // 1.6, 1.7, 1.11
    OR lineSeparation(back, front) > ~1.1 * typeSize                 // 1.8
    OR NOT backTypeLowerHalfCrossesShoulders(X)  [vw >= 1024]        // 1.9
    OR NOT frontPStartsInsideSilhouette(X)                           // 1.10
    OR keyLightNotZoneRelative OR keyLightImperceptible              // 1.12
    OR (768 <= X.vw < 1024 AND motifChipVisible)                     // 1.13
  )

  autoplayBug := slides.length > 1 AND autoplayAdvances(X) AND
       (X.pointerInHero OR X.focusInHero OR X.docHidden OR X.reducedMotion)  // 1.14, 1.15

  RETURN layoutBug OR autoplayBug
END FUNCTION
```

### Examples

- 390×844, Slide 01: section 776px. Copy block ≈277px and copy top ≈449px above the section bottom (80 pb + 92 controls + 277). Current `--hero-copy-h` = max(277/776 = 35.7%, 30) = 35.7% (277px), so the zone overlaps the copy by ~172px. Expected: zone bottom ≈ 449/776 + 2% ≈ 59.9%.
- 768×1024: copy top ≈385px above the bottom (112 + 92 + ~181). Current value clamps to 30% (282px), about 100px too low. Expected ≈ 42.9%.
- 1366×768: "BUILD YOUR" at `backTop: 26%` spans head height. Only "U" is occluded. Expected: the lower half crosses the neck and traps, and "OU" is partly hidden.
- Any viewport: "POWER." has a `0 8px 24px` 65% black shadow and reads as a sticker. Expected: a tight ~0.02em separation shadow.
- Hover over the hero: slides still advance every 6s. Expected: no advance while hovered. After leaving, a full fresh 6s interval runs.
- Reduced motion on: slides auto-advance. Expected: no autoplay. Manual controls still work.
- Edge case, 375×667: section 613px, copy top ≈449px (73%) + 2 → clamped to 70%. The zone stays at 184px instead of collapsing. That is up to ~5% overlap on this very short viewport, the intended trade-off of 2.3.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- DOM stacking back z-10 → subject z-20 → scrim z-25 → front z-30 → UI z-40 (3.1). The key light and contact shadow go inside `zone--behind` before the back type, with no z-index, so they paint beneath it.
- Entrance keyframes and delays (80/340/620/700+/960ms), idle drift, clip-path wipe, reduced-motion static composition (3.2–3.4, 3.6).
- One sr-only H1 and aria-hidden decorative layers (3.5). Grid and grain stay in the stage (3.7). Copy column width at ≥1024 (3.8). Tokens, Geist 800, words and asset (3.9).
- The non-stage render path for Slides 02/03 (3.10). Manual prev/next, indicators, swipe and arrow keys, including while paused (3.11). Header and MobileNav (3.12).
- The data-driven composition contract (`HeroCompositionFrame`) is unchanged. New tuning knobs are CSS custom-property defaults on `.factory-hero-stage` (3.13).

**Scope:**
Any input where isBugCondition is false must be unaffected. This includes:
- Rendering and interaction of Slides 02/03, except the shared pause rules 2.15–2.17
- The ≥1024px zone geometry (the full frame, since `--hero-copy-h` only applies below 1024px)
- Keyboard, touch and button navigation behaviour
- All non-hero sections

## Hypothesized Root Cause

1. **Wrong measurement quantity**: `measure()` computes `copy.height / section.height`. The zone bottom must sit at the copy block's top edge. Everything below it counts: controls (56px margin + 36px) and container padding (80/112px). The 58% ceiling also cuts off true values of ~43–60% on phones.
2. **Frame-relative atmosphere**: The scrim, light fields and contact shadow are `inset-0` children of the stage, not the zone. Below 1024px their percentages land behind the copy, and nothing masks the PNG crop edge.
3. **Filter choices**: `drop-shadow(0 16px 32px)` on the back type and `0 8px 24px` on the front give both layers their own depth plane. The subject has no grade to match the dark stage.
4. **Composition data**: The tops are authored ~25% of zone apart, which is ≥1.2× type size at common aspects. The laptop `backTop` is at head height. The tablet/mobile `frontLeft` starts left of the silhouette. Once the zone is lifted below 1024px, the old mobile/tablet values are also measured against a much smaller box.
5. **Unconditional interval**: The autoplay effect depends only on `[total, index]`.
6. **Chip breakpoint**: The motif chip shows from `sm`, so it overlaps the headline at tablet.

## Correctness Properties

Property 1: Bug Condition - Slide 01 stage composes above the copy and reads as one lit lockup, and autoplay pauses

_For any_ hero state X where isBugCondition(X) holds, the fixed hero SHALL behave as follows. It SHALL set the zone bottom to `clamp(30, (sectionRect.bottom − copyRect.top)/sectionRect.height·100 + 2, 70)`% below 1024px. The athlete and all type SHALL sit above the copy block (subject to the 70% ceiling). It SHALL fade the subject's bottom `--hero-subject-fade` via mask. The contact shadow and a single key light SHALL be zone-relative. It SHALL grade the subject with a static filter, remove the back-type shadow, and give the front type a ≤0.04em shadow. It SHALL author the layers ≈1 line apart, with "BUILD YOUR" crossing the shoulders at ≥1024 and "P" starting inside the silhouette with no overflow. It SHALL hide the motif chip below 1024px. It SHALL NOT auto-advance while the pointer is over the hero, focus is within it, the document is hidden, or reduced motion is set.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14, 2.15, 2.16, 2.17**

Property 2: Preservation - Everything outside Slide 01's stage and the autoplay gate is unchanged

_For any_ hero state X where isBugCondition(X) does NOT hold, the fixed hero SHALL produce the same result as the original. That covers stacking order, entrance/idle/wipe motion, the reduced-motion static render, the single sr-only H1, grid and grain, the ≥1024 copy column, Slides 02/03, manual navigation, Header/MobileNav, the `lib/types.ts` contract, and passing lint and build.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14**

## Fix Implementation

### 1. Zone measurement — `HeroSlider.tsx` `measure()`

Pure helper (optional file `components/motion/heroZone.ts`, erasable TS syntax only, no imports):
```ts
export const ZONE_GAP_PCT = 2;
export const ZONE_MIN_PCT = 30;
export const ZONE_MAX_PCT = 70;

/** Zone bottom offset (% of section height) that lifts the stage above the copy top. */
export function computeZoneOffset(
  sectionBottom: number,
  sectionHeight: number,
  copyTop: number,
  gap = ZONE_GAP_PCT,
  min = ZONE_MIN_PCT,
  max = ZONE_MAX_PCT
): number | null {
  if (!sectionHeight) return null;
  const pct = ((sectionBottom - copyTop) / sectionHeight) * 100 + gap;
  return Math.min(Math.max(pct, min), max);
}
```
`measure()` reads `section.getBoundingClientRect()` and `copy.getBoundingClientRect().top` and writes `` `${v.toFixed(2)}%` `` into the existing `copyHeight` state, which renders as `--hero-copy-h`. It keeps observing both `section` and `copy` with `ResizeObserver`, with `[index]` deps, because `copyRef` remounts via `key={index}`.
- Measure the copy div's top, not a wrapper that includes the controls. The controls sit below the copy inside the container, so the copy top is the true upper boundary of all bottom UI.
- `factory-stagger-in` transforms only the copy's children, so the copy div's own rect is stable during entrance.
- The CSS rule `bottom: var(--hero-copy-h, 46%)` below 1023px stays unchanged. Only the value and its meaning change. Update the comments in the CSS and in `lib/hero.ts` to match.

### 2. Subject crop fade, grade and optional shadow — `globals.css` + Image `className`

- Put the mask on `.factory-hero-subject-inner`. It moves rigidly with the image during entrance and idle, so the fade edge always tracks the PNG crop. Mask and transform are separate properties, so there is no conflict:
  ```css
  .factory-hero-stage { --hero-subject-fade: 16%; --hero-key-dir: 1; --hero-key-offset: 7%; }
  .factory-hero-subject-inner {
    -webkit-mask-image: linear-gradient(to top, transparent 0, #000 var(--hero-subject-fade));
            mask-image: linear-gradient(to top, transparent 0, #000 var(--hero-subject-fade));
  }
  ```
  With `object-contain object-bottom` and every authored frame height-limited (box w/h > 0.666), the image bottom equals the inner bottom, so the fade is subject-relative.
- On `<Image className="object-contain object-bottom factory-hero-subject-img">` (next/image forwards `className` to the `<img>`; `fill` makes it absolute within the positioned inner):
  ```css
  .factory-hero-subject-img {
    filter: saturate(0.9) brightness(0.95) contrast(1.04) var(--hero-subject-shadow);
  }
  .factory-hero-stage {
    /* Optional, tunable. Light from viewer's left => shadow falls right/down.
       If it produces a halo or dark matte outline, neutralise it with
       drop-shadow(0 0 0 transparent). Never use a mask-image:url(png) duplicate. */
    --hero-subject-shadow: drop-shadow(calc(var(--hero-key-dir) * 10px) 16px 28px rgb(0 0 0 / 0.32));
  }
  ```
  The filter is static. The idle transform animates the parent's composited layer, so the filter isn't repainted per frame (check with DevTools Paint Flashing). The drop-shadow comes last in the chain, so it isn't graded. The mask clips to the inner's border box. The shadow stays inside because the contained image is narrower than the box and the vertical offset points down into the faded region.

### 3. Type filters — `globals.css`

- `.factory-hero-type--back`: remove `filter`.
- `.factory-hero-type--front`: `filter: drop-shadow(0 0.02em 0.03em rgb(0 0 0 / 0.55));`

### 4. Key light and contact shadow in the zone — JSX + CSS

- Delete the `factory-hero-subject-light` and `factory-hero-subject-light--integration` divs and their CSS. Move the contact-shadow div into `.factory-hero-zone--behind` as its first children, in this order: key light, contact shadow, back type `<p>`, subject box. Both are `absolute inset-0` with no z-index, so they paint under the back type (z-10). Grain stays in the stage.
  ```css
  .factory-hero-key-light {
    position: absolute; inset: 0;
    background: radial-gradient(
      55% 60% at calc(var(--hero-subject-x) - var(--hero-key-offset)) 38%,
      color-mix(in srgb, color-mix(in srgb, var(--text-primary) 90%, var(--accent) 10%) 12%, transparent) 0%,
      transparent 70%);
    animation: factory-hero-key-breathe 9000ms ease-in-out infinite;
  }
  @keyframes factory-hero-key-breathe { 0%,100% { opacity: .85 } 50% { opacity: 1 } }
  .factory-hero-subject-contact-shadow {
    position: absolute; inset: 0;
    background: radial-gradient(42% 14% at var(--hero-subject-x) calc(100% - var(--hero-subject-b)),
      color-mix(in srgb, black 24%, transparent) 0%, transparent 74%);
  }
  @media (prefers-reduced-motion: reduce) { .factory-hero-key-light { animation: none; opacity: 1; } }
  ```
  The 12% intensity is a starting value (tune 10–16%). The accent share is fixed at 10% of the light colour. `--hero-key-offset` and `--hero-key-dir` are CSS defaults that other slides or gyms can override (a right-lit photo would use a negative offset and `--hero-key-dir: -1`).

### 5. Composition data — `lib/hero.ts` slide 0

Derivation (all positions are % of the zone height; `typeSize` is in vw):
```
typePx        = typeSizeVw/100 * vw
zoneH         = heroH (>=1024)   |   heroH * (1 - zoneOffset/100)   (<1024)
heroH         = max(0.92*vh, 560)
lineSep%      = typePx * k / zoneH * 100,  k ≈ 0.82 (line-height) … 1.0 ; target ≈ 0.9
frontTop      = backTop + nBackLines * lineSep%          (nBackLines = 1 inline, 2 stack)
imageH        = subjectHeight * zoneH ; imageW = 0.666 * imageH  (height-limited)
imageLeft%    = subjectCenterX − (imageW / vw * 100) / 2
headZoneY     = [top, top + 0.28*sH], shouldersY = [+0.28, +0.40], torsoY = [+0.40, +0.70] (top = 100% − subjectHeight)
widthPOWER    ≈ 3.3 * typeSize (vw) ; constraint: frontLeft + 3.3*typeSize ≤ 96
P-inside      : frontLeft ≥ imageLeft% + ~3vw
back occlusion: backTop + ~0.36em (cap midline) ∈ shouldersY   (≥1024)
```
Because the vertical values are % of height and the type is in vw, the separation ratio shifts with aspect ratio. Values are tuned at the reference viewport and then checked at the extremes. Below 1024px the zone is much smaller after the fix, so the mobile and tablet values are recomputed against the lifted zone, not reused.

| Frame (ref viewport) | zoneH | lineSep (1 line) | Starting values | Checks |
|---|---|---|---|---|
| desktop (1440×900) | 828 | 166px ≈ 20%/em, ×0.95 ≈ 19% | `backTop 32%`, `frontTop 51%`, `frontLeft 45%` (was 43), rest unchanged | Head 10–35% and shoulders 35–46% of the zone, so the BUILD YOUR cap (32–46%) has its lower half on the traps. "O"/"U" are partly hidden by the head (x 52–62%). Image x 40.8–75.2%, so P sits 4vw inside. POWER ends 45+38 = 83%. At 1920×1080 the image x 42.5–73.5% leaves P 2.5vw inside and the gap to BUILD is ≈0.14em. |
| laptop (1366×768) | 707 | 153px ≈ 21.7%/em, ×0.87 ≈ 19% | `backTop 31%`, `frontTop 50%`, `frontLeft 48%` (was 46) | Shoulders 36.6–47%, cap 31–46.6%. Image x 44.9–75.2%, so P sits ~3vw inside. POWER ends 85%. At 1024×768 the image x 39.8–80.2% and the BUILD-to-POWER gap is ≈0.45em, which still reads as one lockup. |
| tablet (768×1024) | ≈537 (offset ≈43%) | 100px ≈ 18.6%/em, ×0.9 ≈ 17% | `backTop 31%`, `frontTop 48%`, `frontLeft 40%` (was 34) | Image x 36–78%, so P sits 4vw inside. POWER ends 40+43 = 83% (limit ≤53%). BUILD YOUR ends ≈82%. Cap top ≈166px clears the locality chip (≈112–142px). |
| mobile (390×844) | ≈311 (offset ≈60%) | 70px ≈ 22.6%/em, ×0.77 ≈ 17.4% (k = 0.82) | `subjectHeight 100%`, `subjectCenterX 48%`, `typeSize 17vw` (was 18), `backTop 24%`, `stack`, `frontTop 59%`, `frontLeft 27%` | Image x 21.5–74.5%, so P sits 5.5vw inside. At 375×812 it sits ~4vw inside, and at 430×932 (zone ≈454) comfortably inside. POWER ends 27+56 = 83% (limit ≤40%). The BUILD cap top (≈75px) sits at the fixed header's bottom edge (top-3 + h-16 = 76px). |

Notes:
- **Mobile `frontLeft` deviates from the ~17% in 2.10.** Once the zone is lifted, the mobile image is only ~50–70vw wide, so its left edge lands at ~20–28%. A "P" at 17% would start outside the silhouette, which breaks the governing half of 2.10. 17% only works when the rendered image is ≥~75vw wide. I recommend 27% with `subjectCenterX 48%`. Confirm visually.
- **Mobile `typeSize` 18→17vw** keeps the two stacked back lines plus POWER inside the ~311px zone. At 18vw, POWER would end at ≈80% of the zone and run into the fade. Keep 18vw if visual QA prefers it, but then `frontTop` must still equal `backTop` + 2 × lineSep.
- **Existing constraint, not introduced here:** on phones the athlete's head overlaps the translucent fixed header (bottom 76/88px), because the zone starts at the section top. That was already true before this fix. It is flagged for review. Don't fix it silently, since a header-clearance token would shrink the subject further (conflicts with 2.2).
- All `tablet` values assume portrait. Landscape tablets (e.g. 1000×700) give a much shorter zone. Spot-check only.

### 6. Motif chip and arc — `HeroSlider.tsx`

- Motif chip class: `sm:block` → `lg:block`. Keep `sm:right-10`. The locality chip is unchanged.
- Optional: ellipse `strokeWidth` 0.12 → 0.18 (≤1.5×). Tick marks stay unchanged.

### 7. Autoplay gating — `HeroSlider.tsx`

- Add refs `hoverRef`, `focusRef`, `hiddenRef` and a `paused` state. A helper `syncPause()` sets `paused` to `hoverRef.current || focusRef.current || hiddenRef.current`. The initial `hiddenRef` value comes from a lazy read guarded for SSR. No synchronous setState in an effect body (same pattern as `reducedMotion`, to satisfy the React hooks lint rules).
- Section handlers:
  - `onPointerEnter`/`onPointerLeave`: act only when `e.pointerType !== "touch"`, so taps and swipes don't toggle the hover pause.
  - `onFocus`: set focusRef to true.
  - `onBlur`: set focusRef to false only when `!sectionRef.current?.contains(e.relatedTarget as Node | null)`.
- Effect: subscribe to `visibilitychange` and set `hiddenRef = document.hidden`, then call `syncPause()`.
- Interval effect: `if (total <= 1 || paused || reducedMotion) return;` with deps `[total, index, paused, reducedMotion]`. On resume, the effect re-runs and starts a full 6s interval, which is predictable. Index changes still reset the timer.
- Progress fill: `const autoplayOn = total > 1 && !paused && !reducedMotion`.
  - Active and `autoplayOn`: class `factory-hero-progress-run` (`animation: factory-hero-progress 6000ms linear both`, `transform-origin: left`, scaleX 0→1).
  - Active and not `autoplayOn`: static `scaleX(1)`, which acts as a plain "current slide" indicator.
  - Inactive: `scaleX(0)` with a 200ms transition.
  - Removing and re-adding the class on pause and resume restarts the animation, so it stays in sync with the fresh interval.
  - Add a reduced-motion `animation: none` guard.
- Out of scope, noted for review: a visible pause/play button would give a stronger 2.2.2 guarantee than hover/focus pausing alone.

## Testing Strategy

### Validation Approach

There is no test runner in `package.json` (only `next`, `react`, `eslint`, `typescript`, `tailwindcss`), and no dependencies will be added. Validation has three layers:
- `npm run lint` and `npm run build`
- An optional zero-dependency Node test for the pure zone helper. Node v24 is installed and runs `.ts` natively via type stripping.
- A manual visual and behaviour checklist on unfixed code (explore), then on fixed code (fix + preserve)

### Exploratory Bug Condition Checking

**Goal**: Confirm the root causes on UNFIXED code before changing anything.

**Test Plan**: In DevTools device mode, record the `--hero-copy-h` inline value against `sectionRect.bottom − copyRect.top` for each viewport. Screenshot Slide 01. Check autoplay while hovering, while focused, with the tab hidden, and with reduced motion emulated.

**Test Cases**:
1. **Zone vs copy (390×844, 768×1024)**: the zone bottom sits below the copy top by ~170px and ~100px (will fail).
2. **Crop edge (<1024)**: a hard horizontal edge is visible at the waist (will fail).
3. **Laptop occlusion (1366×768)**: only "U" is occluded (will fail).
4. **Autoplay pause and reduced motion**: slides advance in all four conditions (will fail).
5. **Short viewport (375×667)**: note the current clamp at 58% vs the true ≈75% (may fail after the fix too, by design of the 70% ceiling).

**Expected Counterexamples**: the zone offset equals copy height rather than copy top; type and athlete overlap the subheadline and CTAs; the interval fires regardless of state.

### Fix Checking

```
FOR ALL X WHERE isBugCondition(X) DO
  render := HeroSlider_fixed(X)
  ASSERT (X.vw < 1024 ⇒ zoneOffset = clamp(30, (secB − copyTop)/secH·100 + 2, 70))
     AND athlete/type bounding boxes above copyTop (unless clamped at 70)
     AND no visible crop edge AND contact shadow at zone bottom
     AND lineSep ≈ 1 line AND P inside silhouette AND no horizontal overflow
     AND (X.vw < 1024 ⇒ motif chip hidden)
     AND (paused(X) OR X.reducedMotion ⇒ no advance within 7s)
END FOR
```

### Preservation Checking

```
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT HeroSlider_original(X) ≡ HeroSlider_fixed(X)   // visual + behavioural
END FOR
```

**Testing Approach**: Property-based testing is recommended for the pure zone function. It covers the whole input domain, catches clamp edge cases, and gives strong guarantees. Without a PBT library, a seeded loop over random inputs in `node:test` stands in for it. The rest is side-by-side observation on unfixed and fixed builds.

**Test Cases**:
1. **Slides 02/03**: with autoplay otherwise running normally, their layout matches the unfixed screenshots at every viewport.
2. **Motion**: entrance order and timings, idle drift, and clip-path wipe are unchanged. Reduced motion shows the static composition.
3. **Navigation**: prev/next, indicators, swipe and ←/→ change slides while paused and under reduced motion.
4. **Semantics**: exactly one H1 (sr-only), with the stage layers aria-hidden.
5. **≥1024 zone**: full frame, and `--hero-copy-h` has no effect.

### Unit Tests

Optional file `scripts/hero-zone.test.mjs`, run with `node --test scripts/hero-zone.test.mjs`. It uses `node:test` and `node:assert` only, and imports `../components/motion/heroZone.ts`.
- `computeZoneOffset(776, 776, 327)` → 449/776·100 + 2 ≈ 59.86
- The floor clamp returns 30, the ceiling clamp returns 70, and `sectionHeight = 0` returns `null`

### Property-Based Tests

- For random `secH ∈ [560, 1400]` and `copyTop` in the section: result ∈ [30, 70]. When the unclamped value is in range, result = unclamped. The result is monotonic non-increasing in `copyTop`.
- For random authored frames in `lib/hero.ts` × viewport widths within each breakpoint: `frontLeft + 3.3·typeSize ≤ 96` (a pure data check in the same script).

### Integration Tests (manual checklist)

Run at 1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 430×932, 390×844, and 375×667/375×812:
- The athlete and both type layers sit above the subheadline and CTAs (<1024). The athlete stays large. There is no crop line and no halo or dark outline around the cutout.
- "BUILD YOUR" reads behind the athlete, with "OU" partly occluded at ≥1024. "POWER." is crisp, sits ~1 line below, starts over the arm/torso, and the period isn't clipped. `document.documentElement.scrollWidth === innerWidth`.
- The key light is soft, sits left of the subject, and doesn't read as a neon halo. It breathes subtly, and not under reduced motion. The contact shadow sits under the subject.
- The motif chip is hidden below 1024px and clear of the head and headline at 1024 and 1440. The locality chip is unchanged.
- Autoplay pauses on hover, on focus within the hero (Tab through the CTAs), and when the tab is hidden. It resumes with a full 6s interval and the progress fill restarts. Reduced motion means no autoplay and a static fill.
- DevTools Paint Flashing shows no per-frame repaint of the subject during idle drift.
- `npm run lint` and `npm run build` pass.
