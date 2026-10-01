# Implementation Plan

Files in scope: `components/motion/HeroSlider.tsx`, `app/globals.css` (hero stage section only), `lib/hero.ts` (slide 0 `composition` + comment). Optional: `components/motion/heroZone.ts`, `scripts/hero-zone.test.mjs`.
Do NOT touch: `lib/types.ts`, `Header.tsx`, `MobileNav.tsx`, `/assets/hero/banner-image-03.png`, `package.json`. No new dependencies.

- [x] 1. Exploratory baseline on UNFIXED code (brief, manual/DevTools)
  - **Property 1: Bug Condition** - Slide 01 stage overlaps copy, reads pasted-on, and autoplay never pauses
  - **CRITICAL**: Run on unfixed code. Failures confirm the bug. Do NOT fix anything in this task.
  - **Scoped approach**: concrete viewports from the design's isBugCondition examples
  - At 390×844 and 768×1024: record inline `--hero-copy-h` vs `(sectionRect.bottom − copyRect.top)/sectionRect.height·100` (expect ~35.7% vs ~57.9%, and 30% vs ~40.9%)
  - At 375×667: note the 58% clamp vs true ≈73%
  - Screenshot Slide 01 at <1024: note the waist crop edge and type/athlete under the subheadline and CTAs
  - At 1366×768: note only "U" occluded; note current `backTop`/`frontTop`/`frontLeft` and the back/front `filter` values
  - At 768×1024: note motif chip overlapping headline/head
  - Autoplay: confirm slides advance while hovered, with focus inside (Tab to CTA), with tab hidden, and with reduced motion emulated
  - Record the counterexamples in a short note (task comment, not a new file)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13, 1.14, 1.15_

- [x] 2. Preservation baseline on UNFIXED code (observe before fixing)
  - **Property 2: Preservation** - Everything outside Slide 01's stage and the autoplay gate
  - **IMPORTANT**: Observation-first. Capture what exists now so task 3.11 can compare.
  - Screenshot Slides 02/03 at each checklist viewport
  - Note entrance order/timings (80/340/620/700+/960ms), idle drift, clip-path wipe, reduced-motion static render
  - Confirm one sr-only H1, stage layers `aria-hidden`, grid + grain present, ≥1024 copy column width, ≥1024 zone = full frame
  - Confirm prev/next, indicators, swipe, ←/→ all change slides
  - **EXPECTED OUTCOME**: all observations recorded; these are the baseline to preserve
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12_

- [x] 3. Fix Slide 01 stage composition and autoplay gating

  - [x] 3.1 Zone measurement fix
    - Add pure `computeZoneOffset(sectionBottom, sectionHeight, copyTop, gap=2, min=30, max=70)` in `components/motion/heroZone.ts` (erasable TS only, no imports; returns `null` when `sectionHeight` is 0)
    - `measure()` in `HeroSlider.tsx`: use `section.getBoundingClientRect()` and `copy.getBoundingClientRect().top`; write `` `${v.toFixed(2)}%` `` into the existing state that renders `--hero-copy-h`; keep `ResizeObserver` on section + copy with `[index]` deps
    - Keep CSS `bottom: var(--hero-copy-h, 46%)` below 1023px; update the comments in `globals.css` and `lib/hero.ts` to the new meaning ("zone bottom offset as % of section")
    - Optional: `scripts/hero-zone.test.mjs` using `node:test` + `node:assert` only, importing `../components/motion/heroZone.ts` (Node v24 type stripping). Run `node --test scripts/hero-zone.test.mjs`
      - Examples: `(776, 776, 327)` ≈ 59.86; floor → 30; ceiling → 70; `sectionHeight 0` → `null`
      - Seeded random loop (PBT stand-in): result ∈ [30, 70]; equals unclamped value when in range; non-increasing in `copyTop`
    - _Bug_Condition: vw < 1024 AND zoneBottomPx < copyTopFromBottomPx_
    - _Expected_Behavior: zoneOffset = clamp(30, (secB − copyTop)/secH·100 + 2, 70)_
    - _Preservation: ≥1024 zone geometry unchanged (`--hero-copy-h` unused there)_
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.8, 3.13_

  - [x] 3.2 Subject crop fade mask, static grade, optional drop-shadow
    - Stage CSS defaults: `--hero-subject-fade: 16%`, `--hero-key-dir: 1`, `--hero-key-offset: 7%`, `--hero-subject-shadow`
    - `.factory-hero-subject-inner`: `mask-image` + `-webkit-mask-image` `linear-gradient(to top, transparent 0, #000 var(--hero-subject-fade))`
    - Add `factory-hero-subject-img` to the `<Image>` className; `filter: saturate(0.9) brightness(0.95) contrast(1.04) var(--hero-subject-shadow)` (drop-shadow last, static)
    - Drop-shadow is tunable; if it shows a halo or dark matte outline, neutralise with `drop-shadow(0 0 0 transparent)`. No `mask-image: url(png)` duplicate
    - Check DevTools Paint Flashing: no per-frame subject repaint during idle drift
    - _Bug_Condition: cropEdgeVisible OR subjectUngraded_
    - _Expected_Behavior: crop edge invisible, subject graded, no halo, no extra image download_
    - _Preservation: entrance/idle transforms on subject inner unchanged_
    - _Requirements: 1.4, 1.6, 2.4, 2.6, 3.3, 3.9_

  - [x] 3.3 Back/front type filter changes
    - `.factory-hero-type--back`: remove `filter`
    - `.factory-hero-type--front`: `filter: drop-shadow(0 0.02em 0.03em rgb(0 0 0 / 0.55))`
    - _Bug_Condition: backTypeHasHeavyShadow OR frontShadowBlur > 0.04em_
    - _Expected_Behavior: back type sits behind athlete; "POWER." crisp_
    - _Requirements: 1.7, 1.11, 2.7, 2.11_

  - [x] 3.4 Key light + contact shadow moved into `zone--behind`
    - Delete `factory-hero-subject-light` and `factory-hero-subject-light--integration` divs and CSS
    - In `.factory-hero-zone--behind`, order children: key light, contact shadow, back type `<p>`, subject box (both new layers `absolute inset-0`, no z-index); grain stays in the stage
    - `.factory-hero-key-light`: radial gradient at `calc(var(--hero-subject-x) - var(--hero-key-offset)) 38%`, neutral-warm graphite with 10% accent at ~12% intensity (tune 10–16%); `factory-hero-key-breathe` 9000ms opacity .85↔1
    - `.factory-hero-subject-contact-shadow`: radial at `var(--hero-subject-x) calc(100% - var(--hero-subject-b))`
    - `@media (prefers-reduced-motion: reduce)`: key light `animation: none; opacity: 1`
    - _Bug_Condition: contactShadowNotAtZoneBottom OR keyLightNotZoneRelative OR keyLightImperceptible_
    - _Expected_Behavior: one soft zone-relative key light left of subject, shadow under subject, no neon halo_
    - _Preservation: stacking back z-10 → subject z-20 → scrim z-25 → front z-30 → UI z-40_
    - _Requirements: 1.5, 1.12, 2.5, 2.12, 2.13, 3.1, 3.6, 3.7_

  - [x] 3.5 Re-author `lib/hero.ts` slide 0 composition
    - Use the design's derivation (lineSep ≈ 0.9 line; `frontTop = backTop + nBackLines·lineSep`; P-inside `frontLeft ≥ imageLeft + ~3vw`; `frontLeft + 3.3·typeSize ≤ 96`; back cap midline in shoulders band at ≥1024)
    - Starting values:
      - desktop: `backTop 32%`, `frontTop 51%`, `frontLeft 45%`, rest unchanged
      - laptop: `backTop 31%`, `frontTop 50%`, `frontLeft 48%`
      - tablet: `backTop 31%`, `frontTop 48%`, `frontLeft 40%`
      - mobile: `subjectHeight 100%`, `subjectCenterX 48%`, `typeSize 17vw`, `backTop 24%`, `stack`, `frontTop 59%`, `frontLeft 27%` (deliberate deviation from ~17% in 2.10 so "P" starts inside the silhouette)
    - Explicit visual tuning step: adjust in small increments at each reference viewport (1440×900, 1366×768, 768×1024, 390×844), then check extremes (1920×1080, 1024×768, 430×932, 375px); keep `frontTop − backTop` ≈ 1 line (×2 when stacked)
    - Update the slide 0 comment to reflect the new zone meaning and values
    - Optional data check in `scripts/hero-zone.test.mjs`: every frame satisfies `frontLeft + 3.3·typeSize ≤ 96`
    - _Bug_Condition: lineSeparation > ~1.1·typeSize OR NOT backTypeLowerHalfCrossesShoulders OR NOT frontPStartsInsideSilhouette_
    - _Expected_Behavior: one lockup, "OU" partly occluded at ≥1024, "P" inside arm/torso, period unclipped, no overflow_
    - _Preservation: `HeroCompositionFrame` contract and `lib/types.ts` unchanged; words, asset, Geist 800 unchanged_
    - _Requirements: 1.8, 1.9, 1.10, 2.2, 2.8, 2.9, 2.10, 3.9, 3.13_

  - [x] 3.6 Motif chip + optional arc stroke
    - Motif chip `sm:block` → `lg:block` (keep `sm:right-10`); locality chip unchanged
    - Optional: ellipse `strokeWidth` 0.12 → 0.18 (≤1.5×); ticks unchanged
    - Confirm chip clears head and headline at 1024 and 1440
    - _Bug_Condition: 768 ≤ vw < 1024 AND motifChipVisible_
    - _Requirements: 1.13, 2.14_

  - [x] 3.7 Autoplay gating + progress fill sync
    - Refs `hoverRef`, `focusRef`, `hiddenRef` + `paused` state via `syncPause()`; lazy SSR-safe initial `document.hidden`; no synchronous setState in effect bodies (hooks lint)
    - Section `onPointerEnter`/`onPointerLeave` (ignore `pointerType === "touch"`), `onFocus`, `onBlur` (clear only when `relatedTarget` is outside the section)
    - `visibilitychange` listener updates `hiddenRef` then `syncPause()`
    - Interval: `if (total <= 1 || paused || reducedMotion) return;` deps `[total, index, paused, reducedMotion]` (fresh 6s interval on resume)
    - Progress: `autoplayOn = total > 1 && !paused && !reducedMotion`; active + on → `factory-hero-progress-run` (6000ms linear scaleX 0→1, origin left); active + off → static `scaleX(1)`; inactive → `scaleX(0)` 200ms; reduced-motion `animation: none`
    - _Bug_Condition: slides.length > 1 AND autoplayAdvances AND (pointerInHero OR focusInHero OR docHidden OR reducedMotion)_
    - _Expected_Behavior: no advance within 7s while paused or under reduced motion; full 6s after resume; fill restarts in sync_
    - _Preservation: manual prev/next, indicators, swipe, ←/→ still work while paused_
    - _Requirements: 1.14, 1.15, 2.15, 2.16, 2.17, 3.10, 3.11_

  - [x] 3.8 Verify bug condition exploration now passes
    - **Property 1: Expected Behavior** - Slide 01 composes above the copy as one lit lockup, and autoplay pauses
    - **IMPORTANT**: Re-run the SAME checks from task 1; do not invent new ones
    - `--hero-copy-h` matches `clamp(30, (secB − copyTop)/secH·100 + 2, 70)` at 390×844, 768×1024, 375×667
    - Run `node --test scripts/hero-zone.test.mjs` if created
    - **EXPECTED OUTCOME**: all task 1 counterexamples resolved (375×667 may retain ≤5% overlap by design of the 70% ceiling)
    - _Requirements: 2.1–2.17_

  - [x] 3.9 Preservation checks (compare to task 2 baseline)
    - **Property 2: Preservation** - Everything outside Slide 01's stage and the autoplay gate
    - **IMPORTANT**: Re-run the SAME observations from task 2
    - Slides 02/03 match baseline screenshots (autoplay pause rules aside)
    - Motion order/timings, idle drift, wipe, reduced-motion static render unchanged
    - Navigation (buttons, indicators, swipe, arrows) works while paused and under reduced motion
    - Exactly one sr-only H1; decorative layers `aria-hidden`
    - ≥1024 zone is full frame; copy column width unchanged
    - `git diff --stat` shows no changes to `lib/types.ts`, `Header.tsx`, `MobileNav.tsx`, the asset, `package.json`
    - **EXPECTED OUTCOME**: no regressions
    - _Requirements: 3.1–3.13_

- [x] 4. Validation
  - Run `npm run lint` and `npm run build`; fix any errors
  - Manual visual checklist at 1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 430×932, 390×844, 375px (375×667 and 375×812):
    - Athlete and both type layers above subheadline/CTAs (<1024); athlete large; no crop line, halo, or dark outline
    - "BUILD YOUR" behind athlete ("OU" partly occluded at ≥1024); "POWER." crisp, ~1 line below, starts over arm/torso, period unclipped
    - Key light soft, left of subject, breathes subtly (static under reduced motion); contact shadow under subject
    - Motif chip hidden <1024, clear at ≥1024
    - No horizontal overflow: `document.documentElement.scrollWidth === innerWidth`
  - Stop tuning once stable. No new concepts, tokens, or layers beyond the design
  - Note for review (not fixed here): phone head overlaps translucent fixed header; visible pause/play button would strengthen 2.2.2
  - _Requirements: 2.2, 2.4, 2.9, 2.10, 2.12, 2.14, 3.14_

- [x] 5. Checkpoint - Ensure all checks pass
  - Lint, build, optional node test, and the full visual/behaviour checklist all pass. Ask the user if questions arise.
