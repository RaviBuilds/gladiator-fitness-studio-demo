# Bugfix Requirements Document

## Introduction

Hero Slide 01 ("BUILD YOUR / POWER.", athlete cutout `/assets/hero/banner-image-03.png`) is the flagship composition of the Master Gym Website template. At widths below 1024px the athlete and oversized headline layers sit underneath the subheadline and CTAs. The PNG's waist crop shows as a hard horizontal line. The subject looks pasted onto the background rather than lit within it. The headline layers barely interlock with the athlete. The accent word reads as a sticker, and the trust chip collides with the headline at tablet. The slider also autoplays with no pause mechanism and keeps autoplaying under reduced motion, which fails WCAG 2.2.2 (Pause, Stop, Hide).

Scope is limited to Slide 01's stage composition and the shared slider autoplay behaviour. Slides 02/03, other sections, the font system (Geist 800), the headline words, the asset, the concept, Header/MobileNav, and `lib/types.ts` are out of scope and must not change. No new dependencies. Composition data stays in `lib/hero.ts`, and new tuning tokens are CSS defaults.

Breakpoints referenced: mobile < 768px, tablet 768–1023px, laptop 1024–1439px, desktop ≥ 1440px.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the viewport is below 1024px THEN the system sizes the composition zone from copy-block height divided by section height only. It ignores the slide controls (top margin plus 36px buttons) and the container bottom padding, so the zone ends roughly 170–200px too low.

1.2 WHEN the viewport is below 1024px THEN the system renders the athlete and the oversized headline layers underneath the subheadline and CTAs, because the measured zone overlaps the copy block.

1.3 WHEN the copy block is tall relative to the section THEN the system clamps the zone offset to a 30–58% range. That range can't hold the true copy-block top at tablet and mobile.

1.4 WHEN the viewport is below 1024px THEN the system shows the cutout's waist crop as a visible hard horizontal edge mid-frame, because the scrim is positioned relative to the frame, not the subject.

1.5 WHEN Slide 01 renders at any breakpoint THEN the system places the contact shadow relative to the frame bottom instead of the composition zone bottom, so it doesn't sit under the subject.

1.6 WHEN Slide 01 renders at any breakpoint THEN the system shows the daylight-lit athlete photo on a near-black stage with no tonal grade or depth cue, so the subject looks pasted on.

1.7 WHEN Slide 01 renders at any breakpoint THEN the system gives the back type ("BUILD YOUR") its own heavy drop-shadow (16px/32px). This makes it float in front of the background instead of sitting behind the athlete.

1.8 WHEN Slide 01 renders at any breakpoint THEN the system separates "BUILD YOUR" and "POWER." by about 1.8× the type size, so the headline reads as two disconnected blocks.

1.9 WHEN Slide 01 renders at laptop width THEN the system places "BUILD YOUR" at head height, so the athlete only meaningfully occludes the letter "U".

1.10 WHEN Slide 01 renders at tablet (frontLeft 34%) or mobile (frontLeft 10%) THEN the system starts "P" of "POWER." outside the athlete silhouette, so the front layer doesn't interlock with the arm/torso.

1.11 WHEN Slide 01 renders at any breakpoint THEN the system applies a large soft drop-shadow to "POWER." (0 8px 24px at 65% black), so the accent word reads as a sticker instead of crisp type.

1.12 WHEN Slide 01 renders at any breakpoint THEN the system renders environmental light fields that are too weak to register. Below 1024px their vertical positions are frame-relative, so they sit behind the copy instead of behind the subject.

1.13 WHEN Slide 01 renders at tablet width THEN the system shows the motif trust chip (126 verified reviews), which collides with the headline and the athlete's head.

1.14 WHEN the slider is active THEN the system advances slides every 6 seconds with no pause on pointer hover, keyboard focus within the hero, or a hidden document tab.

1.15 WHEN the user has prefers-reduced-motion: reduce set THEN the system keeps autoplaying slides every 6 seconds.

### Expected Behavior (Correct)

2.1 WHEN the viewport is below 1024px THEN the system SHALL compute the composition zone bottom from the top of the copy block, as (sectionRect.bottom − copyRect.top) / sectionRect.height plus a small gap. This accounts for slide controls and container padding.

2.2 WHEN the viewport is below 1024px THEN the system SHALL render the athlete and all headline layers entirely above the subheadline and CTAs. The athlete stays large: the fix SHALL NOT shrink the subject, and mobile subject height may increase to about 100% of the zone.

2.3 WHEN the zone offset is computed THEN the system SHALL clamp it to a widened range of about 30–70%, so the true copy-block top can be honoured at tablet and mobile while the zone never collapses.

2.4 WHEN Slide 01 renders at any breakpoint THEN the system SHALL apply a subtle bottom fade mask relative to the subject, set by a CSS variable (e.g. `--hero-subject-fade`, default about 16%). The PNG crop edge SHALL be invisible without hiding a large portion of the body.

2.5 WHEN Slide 01 renders at any breakpoint THEN the system SHALL align the contact shadow to the composition zone bottom, directly beneath the subject.

2.6 WHEN Slide 01 renders at any breakpoint THEN the system SHALL apply a light CSS-only tonal grade to the subject (about saturate 0.9, brightness 0.95, contrast 1.04) without altering image pixels. The system SHALL add a restrained subject drop-shadow only if it's visually convincing, with no dark outline or halo and no duplicate PNG download.

2.7 WHEN Slide 01 renders at any breakpoint THEN the system SHALL remove the back-type drop-shadow, or reduce it to a barely perceptible value, so "BUILD YOUR" reads as sitting behind the athlete.

2.8 WHEN Slide 01 renders at any breakpoint THEN the system SHALL separate "BUILD YOUR" and "POWER." by about one typographic line, so the headline reads as one lockup.

2.9 WHEN Slide 01 renders at laptop and desktop widths THEN the system SHALL place "BUILD YOUR" so its lower half crosses the neck, traps, and shoulders, giving meaningful occlusion (e.g. "OU" partially hidden by the athlete).

2.10 WHEN Slide 01 renders at any breakpoint THEN the system SHALL start "P" of "POWER." inside the athlete's arm/torso region (approximately tablet about 40%, mobile about 17%), using re-authored composition data in `lib/hero.ts`. The period SHALL NOT clip, the page SHALL NOT overflow horizontally, and the type SHALL stay solid with no opacity tricks or duplicated words.

2.11 WHEN Slide 01 renders at any breakpoint THEN the system SHALL render "POWER." with a tight, clean separation shadow (about 0.015–0.04em offset/blur), so the accent type stays crisp.

2.12 WHEN Slide 01 renders at any breakpoint THEN the system SHALL render one soft, broad environmental key light anchored to the subject's position inside the composition zone. It SHALL be offset toward the photo's lit side (viewer's left) and use a neutral-warm graphite tone with no more than about 10% accent. It SHALL NOT look like a halo or neon glow.

2.13 WHEN the key light renders and prefers-reduced-motion is not set THEN the system MAY apply a very subtle opacity breathe of about 9 seconds. WHEN prefers-reduced-motion: reduce is set THEN the system SHALL disable that animation.

2.14 WHEN Slide 01 renders below 1024px THEN the system SHALL hide the motif trust chip. WHEN it renders at 1024px and above THEN the chip SHALL be visible and clear of the athlete's head and the headline. The arc stroke MAY be thickened by up to about 1.5× only if it stays a supporting element.

2.15 WHEN the pointer enters the hero, or focus moves into it THEN the system SHALL pause autoplay. It SHALL resume on pointer leave, or on focus out only when focus leaves the hero entirely.

2.16 WHEN the document becomes hidden THEN the system SHALL pause autoplay. WHEN it becomes visible again THEN the system SHALL resume autoplay, subject to the other pause conditions.

2.17 WHEN the user has prefers-reduced-motion: reduce set THEN the system SHALL NOT autoplay slides.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN Slide 01 renders THEN the system SHALL CONTINUE TO use the three-layer DOM order and stacking: back type z-10, subject z-20, scrim z-25, front type z-30, UI z-40.

3.2 WHEN Slide 01 enters without reduced motion THEN the system SHALL CONTINUE TO play the entrance in the same order and at the same timings: back type 80ms, athlete 340ms, front type 620ms, copy 700ms+, metadata 960ms.

3.3 WHEN Slide 01 is idle without reduced motion THEN the system SHALL CONTINUE TO apply the existing restrained subject idle drift.

3.4 WHEN slides change without reduced motion THEN the system SHALL CONTINUE TO use the clip-path slide wipe transition.

3.5 WHEN any slide renders THEN the system SHALL CONTINUE TO expose exactly one screen-reader-only H1 with the full headline, and keep decorative headline layers aria-hidden.

3.6 WHEN prefers-reduced-motion: reduce is set THEN the system SHALL CONTINUE TO render the final static composition, with no entrance, idle, or wipe animation.

3.7 WHEN Slide 01 renders THEN the system SHALL CONTINUE TO render the background grid and grain.

3.8 WHEN the viewport is 1024px or wider THEN the system SHALL CONTINUE TO render the copy column at its current width.

3.9 WHEN any slide renders THEN the system SHALL CONTINUE TO use the existing color tokens and the single `accentColor` token, the Geist 800 display type, the Slide 01 headline words, and the Slide 01 image asset.

3.10 WHEN Slide 02 or Slide 03 renders THEN the system SHALL CONTINUE TO render through the non-stage path with no visual or behavioural change, apart from the shared autoplay pause rules in 2.15–2.17.

3.11 WHEN the user operates the previous/next/indicator controls, swipes, or presses the arrow keys THEN the system SHALL CONTINUE TO change slides manually, including when autoplay is paused or disabled.

3.12 WHEN the Header or MobileNav renders THEN the system SHALL CONTINUE TO behave and look exactly as before.

3.13 WHEN a future gym supplies a different hero image, headline words, layer allocation, subject position/scale, or accent through `lib/*.ts` data THEN the system SHALL CONTINUE TO support it through the data-driven composition system, with no change to `lib/types.ts` and no new dependencies.

3.14 WHEN `npm run lint` and `npm run build` are run THEN the system SHALL CONTINUE TO pass both without errors.
