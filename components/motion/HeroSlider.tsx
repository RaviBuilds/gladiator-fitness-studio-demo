"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HeroSlide, HeroSlideComposition } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { computeZoneOffset } from "./heroZone";

const AUTOPLAY_MS = 6000;
const TRANSITION_MS = 850;

/**
 * Copy-side continuation of the layered slide's depth-staged entrance. The
 * three depth layers (back headline -> athlete -> front headline) are timed
 * in CSS because they animate as layers; these delays keep the supporting
 * copy, CTA and metadata strictly behind them so the depth relationship is
 * established before any secondary content appears.
 */
const STAGE_DELAY_MS = {
  eyebrow: 700,
  headline: 700,
  subheadline: 800,
  cta: 880,
  metadata: 960,
} as const;

/** Entrance delays for the original (non-layered) slide composition. */
const BASE_DELAY_MS = {
  eyebrow: 0,
  headline: 90,
  subheadline: 180,
  cta: 260,
  metadata: 0,
} as const;

type Direction = 1 | -1;

/**
 * Flattens an authored per-breakpoint composition into inline custom
 * properties. Keeping every number in `lib/hero.ts` and passing it through as
 * CSS variables is what lets the stage be a reusable primitive: the component
 * holds no slide-specific coordinates, and `.factory-hero-stage` in
 * globals.css only decides which authored frame is active per breakpoint.
 */
function compositionVars(composition: HeroSlideComposition): CSSProperties {
  const frames = {
    m: composition.mobile,
    s: composition.mobileShort ?? composition.mobile,
    t: composition.tablet,
    l: composition.laptop,
    d: composition.desktop,
  };
  const vars: Record<string, string> = {};
  for (const [key, frame] of Object.entries(frames)) {
    vars[`--hero-${key}-subject-h`] = frame.subjectHeight;
    vars[`--hero-${key}-subject-w`] = frame.subjectWidth;
    vars[`--hero-${key}-subject-x`] = frame.subjectCenterX;
    vars[`--hero-${key}-subject-b`] = frame.subjectBottom;
    vars[`--hero-${key}-type-size`] = frame.typeSize;
    vars[`--hero-${key}-back-top`] = frame.backTop;
    vars[`--hero-${key}-back-left`] = frame.backLeft;
    vars[`--hero-${key}-back-word-display`] =
      frame.backWordLayout === "stack" ? "block" : "inline-block";
    if (frame.middleTop) vars[`--hero-${key}-middle-top`] = frame.middleTop;
    if (frame.middleLeft) vars[`--hero-${key}-middle-left`] = frame.middleLeft;
    if (frame.middleSize) vars[`--hero-${key}-middle-size`] = frame.middleSize;
    vars[`--hero-${key}-front-top`] = frame.frontTop;
    vars[`--hero-${key}-front-left`] = frame.frontLeft;
    if (frame.frontSize) vars[`--hero-${key}-front-size`] = frame.frontSize;
    if (frame.frontSecondaryTop)
      vars[`--hero-${key}-front2-top`] = frame.frontSecondaryTop;
    if (frame.frontSecondaryLeft)
      vars[`--hero-${key}-front2-left`] = frame.frontSecondaryLeft;
    if (frame.frontSecondarySize)
      vars[`--hero-${key}-front2-size`] = frame.frontSecondarySize;
  }
  return vars as CSSProperties;
}

/**
 * Cinematic hero slider (Pass 1 visual system). Native browser APIs only
 * (CSS clip-path mask, transforms, opacity, touch events, CSS keyframe
 * stagger) — no carousel/animation library. Each slide is a numbered
 * chapter revealed with a directional wipe (mask reveal), ~6s autoplay,
 * keyboard/touch/reduced-motion support, and an optional data-driven trust
 * motif + locality chip passed in from the Server Component wrapper. See
 * docs/MASTER-PASS-1-DESIGN-DIRECTION.md section 5.
 */
export function HeroSlider({
  slides,
  whatsappHref,
  motif,
  locality,
}: {
  slides: HeroSlide[];
  whatsappHref: string;
  motif?: { value: string; label: string };
  locality?: string;
}) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<Direction>(1);
  // Lazy initializer reads the media query once on first client render
  // (guarded for SSR); the effect below only subscribes to changes rather
  // than calling setState synchronously in the effect body.
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );
  const touchStartX = useRef<number | null>(null);
  // Explicit user pause from the visible pause/play control (WCAG 2.2.2).
  const [userPaused, setUserPaused] = useState(false);
  // Per-slide activation counter. The progress fill is keyed on it, so the
  // fill restarts only when its slide becomes active; a slide that becomes
  // inactive keeps its element and collapses smoothly instead of snapping.
  const [runIds, setRunIds] = useState<number[]>(() => slides.map(() => 0));
  const sectionRef = useRef<HTMLElement | null>(null);
  const copyRef = useRef<HTMLDivElement | null>(null);
  // Zone bottom offset as a % of the section, measured from the copy block's
  // top edge (rendered as --hero-copy-h). Below 1024px the composition zone
  // is lifted by this amount so the oversized type and the athlete sit above
  // the copy, controls and padding, whatever the copy length.
  const [copyHeight, setCopyHeight] = useState<string | null>(null);

  // Autoplay pause sources (WCAG 2.2.2). Refs hold the raw signals so
  // handlers can update them without re-rendering; `paused` is the single
  // derived state the interval effect and progress fill react to. Initial
  // hidden state is read lazily and guarded for SSR, like reducedMotion.
  const hoverRef = useRef(false);
  const focusRef = useRef(false);
  const hiddenRef = useRef(
    typeof document !== "undefined" ? document.hidden : false
  );
  const [paused, setPaused] = useState(() =>
    typeof document !== "undefined" ? document.hidden : false
  );
  const syncPause = useCallback(() => {
    setPaused(hoverRef.current || focusRef.current || hiddenRef.current);
  }, []);

  const total = slides.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Pause autoplay while the tab is hidden. Subscribe only; the initial
  // value comes from the lazy initializers above.
  useEffect(() => {
    const handler = () => {
      hiddenRef.current = document.hidden;
      syncPause();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [syncPause]);

  // Measure the copy top against the hero section. ResizeObserver covers
  // viewport resizes, font loading and slide-to-slide copy length changes.
  useEffect(() => {
    const section = sectionRef.current;
    const copy = copyRef.current;
    if (!section || !copy) return;

    const measure = () => {
      const rect = section.getBoundingClientRect();
      // Measured from the copy block's TOP edge, so the slide controls and
      // container padding below it are included in the offset. Clamped
      // inside computeZoneOffset so the zone never collapses.
      const v = computeZoneOffset(
        rect.bottom,
        rect.height,
        copy.getBoundingClientRect().top
      );
      if (v === null) return;
      setCopyHeight(`${v.toFixed(2)}%`);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(section);
    ro.observe(copy);
    return () => ro.disconnect();
  }, [index]);

  const goTo = useCallback(
    (next: number, direction: Direction) => {
      const target = ((next % total) + total) % total;
      setDir(direction);
      setIndex(target);
      setRunIds((ids) => ids.map((v, j) => (j === target ? v + 1 : v)));
    },
    [total]
  );

  const next = useCallback(() => goTo(index + 1, 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1, -1), [goTo, index]);

  // Autoplay clock = the active indicator's CSS fill animation (see
  // .factory-hero-progress-run). It advances the slide on `animationend` and
  // is frozen via animation-play-state while paused, so the visible progress
  // and the slide change can never drift apart. No autoplay under reduced
  // motion (the fill class is not applied at all).
  const autoplayEnabled = total > 1 && !reducedMotion;
  const autoplayOn = autoplayEnabled && !paused && !userPaused;

  const onProgressEnd = (e: React.AnimationEvent) => {
    if (e.animationName !== "factory-hero-progress") return;
    next();
  };

  const toggleUserPause = () => {
    if (userPaused) {
      // Explicit "play" is clear intent: drop the implicit hover/focus
      // pauses (they re-arm on the next pointer enter / focus move).
      hoverRef.current = false;
      focusRef.current = false;
      syncPause();
    }
    setUserPaused((p) => !p);
  };

  const onPointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    hoverRef.current = true;
    syncPause();
  };

  const onPointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    hoverRef.current = false;
    syncPause();
  };

  const onFocus = () => {
    focusRef.current = true;
    syncPause();
  };

  const onBlur = (e: React.FocusEvent) => {
    // Moving focus between controls inside the hero keeps it paused.
    if (sectionRef.current?.contains(e.relatedTarget as Node | null)) return;
    focusRef.current = false;
    syncPause();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  const slide = slides[index];
  // The active slide drives the copy block. When the slide is composed as a
  // layered stage, the headline is already drawn by the two type layers, so
  // the h1 stays visually hidden while remaining the single semantic H1.
  const activeIsStage = Boolean(slide.headlineLayers && slide.composition);
  const delays = activeIsStage ? STAGE_DELAY_MS : BASE_DELAY_MS;

  return (
    <section
      ref={sectionRef}
      // Phones get a taller floor (680px) so short screens such as 375x667
      // keep room for the athlete between the fixed header and the copy;
      // from ~740px tall 92vh already exceeds it, so nothing changes there.
      className="relative h-[92vh] min-h-[680px] w-full overflow-hidden bg-(--bg-primary) sm:min-h-[560px]"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured highlights"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {slides.map((s, i) => {
        // Directional clip-path wipe: the incoming slide reveals from the
        // side matching the navigation direction, rather than a plain
        // crossfade. Collapses to a simple opacity swap under reduced motion.
        const closedClip = dir === -1 ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)";
        // Athlete cutout + back ghost type share the same horizontal zone
        // so the ghost word reads as sitting "behind" the subject.
        const justifyClass =
          s.subjectAlign === "left"
            ? "justify-start"
            : s.subjectAlign === "right"
              ? "justify-end"
              : "justify-center";
        // A slide opts into the three-layer campaign stage by authoring both
        // headline layers and a per-breakpoint composition. Slides without
        // them keep the previous composition untouched.
        const layers = s.headlineLayers;
        const stageComposition = layers && s.composition ? s.composition : undefined;
        const animateStage = i === index && !reducedMotion;
        return (
          <div
            key={s.image}
            aria-hidden={i !== index}
            className="absolute inset-0"
            style={{
              opacity: i === index ? 1 : 0,
              clipPath: reducedMotion
                ? "inset(0 0 0 0)"
                : i === index
                  ? "inset(0 0 0 0)"
                  : closedClip,
              transform: reducedMotion ? "none" : i === index ? "scale(1)" : "scale(1.05)",
              transition: reducedMotion
                ? "opacity 200ms linear"
                : `opacity ${TRANSITION_MS}ms ease, clip-path ${TRANSITION_MS}ms cubic-bezier(0.65,0,0.35,1), transform ${
                    TRANSITION_MS + 300
                  }ms ease`,
              pointerEvents: i === index ? "auto" : "none",
            }}
          >
            {/* Layer 1 (slides without an authored composition): solid
                backdrop + vignette, unchanged. */}
            {!stageComposition && (
              <>
                <div className="absolute inset-0 bg-(--bg-primary)" />
                <div className="absolute inset-0 factory-hero-vignette" />
              </>
            )}

            {/* Pass 1A — three-layer campaign stage. Depth order is real DOM
                stacking, not opacity: back headline (z-10) -> athlete cutout
                (z-20) -> grounding scrim (z-25) -> front headline (z-30). The
                opaque cutout is what occludes the back words. Both type
                layers are decorative duplicates of the single semantic h1
                rendered once in the copy block below, so both are
                aria-hidden. */}
            {stageComposition && layers && (
              <div
                className="factory-hero-stage absolute inset-0 overflow-hidden"
                style={{
                  ...compositionVars(stageComposition),
                  ...(copyHeight ? { "--hero-copy-h": copyHeight } : {}),
                } as CSSProperties}
              >
                {/* Depth zone 1 — base atmosphere. */}
                <div className="absolute inset-0 factory-hero-atmosphere" />

                {/* Depth zone 2 — architectural/graphic layer: vertical
                    rules, one oversized arc running off-frame, and a few
                    small technical marks. */}
                <div className="absolute inset-0 factory-hero-grid" />
                <svg
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full text-(--border)"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  <ellipse
                    cx="62"
                    cy="74"
                    rx="46"
                    ry="52"
                    stroke="currentColor"
                    strokeWidth="0.18"
                    vectorEffect="non-scaling-stroke"
                  />
                  <line
                    x1="4"
                    y1="88"
                    x2="20"
                    y2="88"
                    stroke="currentColor"
                    strokeWidth="0.12"
                    vectorEffect="non-scaling-stroke"
                  />
                  <line
                    x1="4"
                    y1="86"
                    x2="4"
                    y2="90"
                    stroke="currentColor"
                    strokeWidth="0.12"
                    vectorEffect="non-scaling-stroke"
                  />
                  <line
                    x1="20"
                    y1="86"
                    x2="20"
                    y2="90"
                    stroke="currentColor"
                    strokeWidth="0.12"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <span
                  aria-hidden="true"
                  className="absolute right-[6%] top-[22%] hidden h-[1px] w-[7%] bg-(--brand-secondary) opacity-40 lg:block"
                />

                {/* Depth zone 3 — grain. */}
                <div className="absolute inset-0 factory-hero-grain" />

                {/* Composition zone (behind the scrim): key light, contact
                    shadow, BACK type + athlete. All live in the same box so
                    their authored percentages stay locked to each other. */}
                <div className="factory-hero-zone factory-hero-zone--behind">
                  {/* Zone-relative key light + contact shadow. No z-index,
                      so both paint beneath the back type and subject. */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 factory-hero-key-light"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 factory-hero-subject-contact-shadow"
                  />

                  {/* BACK layer — behind the athlete. Solid, full weight. */}
                  <p
                    aria-hidden="true"
                    className={`factory-hero-type factory-hero-type--back ${
                      animateStage ? "factory-hero-animate" : ""
                    }`}
                  >
                    {layers.back.map((word) => (
                      <span key={word} className="factory-hero-back-word">
                        {word}
                      </span>
                    ))}
                  </p>

                  {/* BRIDGE layer — sits BETWEEN the back type (z10) and the
                      athlete (z20) inside this same stacking context, which is
                      what lets the opaque cutout genuinely occlude part of it.
                      It must stay in this zone: in the front zone (z30) it
                      would paint over the athlete and could never be
                      interrupted. Only slides authoring `headlineLayers.middle`
                      render it at all. */}
                  {layers.middle && layers.middle.length > 0 && (
                    <p
                      aria-hidden="true"
                      className={`factory-hero-type factory-hero-type--middle ${
                        animateStage ? "factory-hero-animate" : ""
                      }`}
                    >
                      {layers.middle.join(" ")}
                    </p>
                  )}

                  {/* MIDDLE layer — transparent athlete cutout. Opaque, so it
                      is what physically occludes the BACK and BRIDGE words. */}
                  <div className="factory-hero-subject-box">
                    <div
                      className={`factory-hero-subject-inner ${
                        animateStage ? "factory-hero-subject-reveal" : ""
                      }`}
                    >
                      <Image
                        src={s.image}
                        alt={s.imageAlt ?? s.headline}
                        fill
                        priority={i === 0}
                        sizes="(min-width: 1440px) 56vw, (min-width: 1024px) 70vw, (min-width: 768px) 96vw, 108vw"
                        className="object-contain object-bottom factory-hero-subject-img"
                      />
                    </div>
                  </div>
                </div>

                <div className="factory-hero-scrim" />

                {/* Composition zone (in front of the scrim): FRONT type layer,
                    sharing the same geometry as the zone above. */}
                <div className="factory-hero-zone factory-hero-zone--front">
                  {layers.frontSecondary && layers.frontSecondary.length > 0 && (
                    <p
                      aria-hidden="true"
                      className={`factory-hero-type factory-hero-type--front-2 ${
                        animateStage ? "factory-hero-animate" : ""
                      }`}
                    >
                      {layers.frontSecondary.join(" ")}
                    </p>
                  )}
                  <p
                    aria-hidden="true"
                    className={`factory-hero-type factory-hero-type--front ${
                      animateStage ? "factory-hero-animate" : ""
                    }`}
                  >
                    {layers.front.join(" ")}
                  </p>
                </div>
              </div>
            )}

            {/* Layer 2: oversized back typography, genuinely behind the
                subject — bold and fully legible where it isn't occluded by
                the cutout (see .factory-display-back), not a faded
                watermark. Decorative duplicate of part of the h1's text, so
                stays aria-hidden; the h1 itself carries the complete,
                accessible headline (see aria-label below). */}
            {/* Bottom-anchored, matching the subject layer below, with
                padding-bottom tuned so the word's vertical center lands
                inside the subject's torso band (not the section's overall
                center) — this is what makes the cutout actually occlude the
                middle of the word instead of floating disconnected from it. */}
            {!stageComposition && s.headlineLayers && s.headlineLayers.back.length > 0 && (
              <div
                aria-hidden="true"
                className={`absolute inset-0 flex items-end overflow-hidden pb-[30%] sm:pb-[36%] ${justifyClass}`}
              >
                <span
                  className={`factory-display-back px-[4vw] ${
                    i === index && !reducedMotion ? "factory-stagger-in" : ""
                  }`}
                  style={i === index && !reducedMotion ? { animationDelay: "0ms" } : undefined}
                >
                  {s.headlineLayers.back.join(" ")}
                </span>
              </div>
            )}

            {/* Layer 3: transparent athlete cutout, bottom-anchored. Sized
                so a substantial portion of the figure's torso crosses
                through the back-text band above for a genuine occlusion
                effect. */}
            {!stageComposition && (
              <>
                <div
                  className={`pointer-events-none absolute inset-0 flex items-end ${justifyClass}`}
                >
                  <div
                    className={`relative h-[82%] w-[68%] max-w-[640px] sm:h-[96%] sm:w-[50%] ${
                      reducedMotion ? "" : "factory-hero-subject-float"
                    }`}
                  >
                    <Image
                      src={s.image}
                      alt={s.imageAlt ?? s.headline.replace(/\n/g, " ")}
                      fill
                      priority={i === 0}
                      sizes="(min-width: 640px) 50vw, 68vw"
                      className="object-contain object-bottom"
                    />
                  </div>
                </div>

                {/* Bottom scrim so the front copy block stays legible over the
                    subject/back-type layers. */}
                <div className="absolute inset-0 bg-gradient-to-t from-(--bg-primary) via-(--bg-primary)/15 to-transparent" />
              </>
            )}
          </div>
        );
      })}

      {/* Top-utility metadata row. Both items share the hero's container spine
          (the same one the header bar and the copy block below resolve to), so
          the locality chip sits under the logo and the trust card under the
          header CTA instead of floating against the viewport edges. z-40 keeps
          them above every stage layer; they enter last in the depth-staged
          sequence. Hidden below 1024px, as before. */}
      {(motif || locality) && (
        <div
          className="factory-container pointer-events-none absolute inset-x-0 top-[calc(var(--header-h)+1.375rem)] z-40 hidden lg:block"
        >
          <div className="flex items-start justify-between gap-6">
            {locality && (
              <div
                className={`factory-meta-chip ${reducedMotion ? "" : "factory-stagger-in"}`}
                style={reducedMotion ? undefined : { animationDelay: `${delays.metadata}ms` }}
              >
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-(--success)" />
                <span>{locality}</span>
              </div>
            )}

            {motif && (
              <div
                className={`factory-meta-card ml-auto ${reducedMotion ? "" : "factory-stagger-in"}`}
                style={reducedMotion ? undefined : { animationDelay: `${delays.metadata}ms` }}
              >
                <p className="font-mono text-[clamp(1.5rem,2.1vw,2rem)] font-semibold leading-none text-(--brand-secondary)">
                  {motif.value}
                </p>
                <p className="mt-2 max-w-[8.5rem] text-[0.5625rem] uppercase leading-[1.6] tracking-[0.2em] text-(--text-secondary)">
                  {motif.label}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vertical scroll marker — frame furniture, so it stays on the outer
          frame edge (20px) rather than the content spine. Kept clear of the
          front headline layer horizontally at every viewport; decorative
          only. */}
      <div
        aria-hidden="true"
        className="absolute bottom-10 right-5 z-40 hidden flex-col items-center gap-3 lg:flex"
      >
        <span className="font-mono text-[0.5625rem] uppercase tracking-[0.25em] text-(--text-secondary) [writing-mode:vertical-rl]">
          Scroll
        </span>
        <span
          className={`h-12 w-px bg-(--brand-secondary) ${reducedMotion ? "" : "factory-scroll-cue-line"}`}
        />
      </div>

      {/* Copy block. z-40 keeps it above every stage layer (front type is
          z-30/z-35) so the supporting copy and CTAs are never crossed by the
          oversized type. On large viewports it is a narrow left column, which
          is what lets the front headline occupy the right of the frame.

          pointer-events are OFF on this full-height wrapper and back ON for
          its two real content blocks. The wrapper covers the whole hero,
          including the strip the fixed header (z-30) sits over, so while it
          captured pointer events it swallowed every click on the logo, nav and
          header CTA. Layer order is deliberately left untouched — the wrapper
          must stay above the artwork — so the fix is hit-testing, not z-index. */}
      {/* Bottom padding is tighter below 1024px (and on short laptops) so the
          copy and controls sit lower and the space above them goes to the
          composition instead of empty space under the controls. */}
      <div className="factory-container pointer-events-none relative z-40 flex h-full flex-col justify-end pb-10 pt-32 sm:pb-14 lg:pb-28 lg:[@media(max-height:740px)]:pb-16">
        <div
          ref={copyRef}
          key={index}
          className={`pointer-events-auto ${
            activeIsStage ? "max-w-[30rem] lg:max-w-[26rem]" : "max-w-[52rem]"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`factory-index ${reducedMotion ? "" : "factory-stagger-in"}`}
              style={reducedMotion ? undefined : { animationDelay: `${delays.eyebrow}ms` }}
            >
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
            {slide.eyebrow && (
              <span
                className={`factory-eyebrow ${reducedMotion ? "" : "factory-stagger-in"}`}
                style={reducedMotion ? undefined : { animationDelay: `${delays.eyebrow}ms` }}
              >
                {slide.eyebrow}
              </span>
            )}
          </div>
          <div className="factory-hairline mt-4 max-w-[180px]" />

          {/* The single semantic H1 for the page. On a layered slide the
              headline is already drawn at display size by the two depth type
              layers, so the H1 is visually hidden (still exposed to assistive
              tech and crawlers) and carries the complete headline exactly
              once — the visual layers are aria-hidden, so nothing is read
              twice. On non-layered slides it renders as the visible headline,
              unchanged. */}
          {activeIsStage && slide.headlineLayers ? (
            <h1 className="sr-only">
              {slide.spokenHeadline ??
                [
                  ...slide.headlineLayers.back,
                  ...(slide.headlineLayers.middle ?? []),
                  ...slide.headlineLayers.front,
                ].join(" ")}
            </h1>
          ) : (
            <h1
              className={`factory-display relative z-30 mt-6 text-(--text-primary) ${
                reducedMotion ? "" : "factory-stagger-in"
              }`}
              style={reducedMotion ? undefined : { animationDelay: `${delays.headline}ms` }}
              aria-label={
                slide.headlineLayers
                  ? [
                      ...slide.headlineLayers.back,
                      ...(slide.headlineLayers.middle ?? []),
                      ...slide.headlineLayers.front,
                    ].join(" ")
                  : undefined
              }
            >
              {(slide.headlineLayers?.front ?? slide.headline.split("\n")).map(
                (line, li, lines) => (
                  <span
                    key={li}
                    className={li === lines.length - 1 ? "block text-(--accent)" : "block"}
                  >
                    {line}
                  </span>
                )
              )}
            </h1>
          )}
          {slide.subheadline && (
            <p
              className={`max-w-xl text-lg leading-8 text-(--text-secondary) ${
                activeIsStage ? "mt-0" : "mt-6"
              } ${reducedMotion ? "" : "factory-stagger-in"}`}
              style={reducedMotion ? undefined : { animationDelay: `${delays.subheadline}ms` }}
            >
              {slide.subheadline}
            </p>
          )}
          <div
            className={`mt-8 flex flex-wrap items-center gap-4 ${
              reducedMotion ? "" : "factory-stagger-in"
            }`}
            style={reducedMotion ? undefined : { animationDelay: `${delays.cta}ms` }}
          >
            <Button href={slide.primaryCtaHref ?? whatsappHref} variant="primary">
              {slide.primaryCtaLabel ?? "Chat on WhatsApp"}
              {slide.primaryCtaArrow && <span aria-hidden="true">→</span>}
            </Button>
            {slide.secondaryCtaLabel && slide.secondaryCtaHref && (
              <Button href={slide.secondaryCtaHref} variant="secondary">
                {slide.secondaryCtaLabel}
                {slide.secondaryCtaArrow && <span aria-hidden="true">→</span>}
              </Button>
            )}
          </div>
        </div>

        {/* Slightly tighter on phones so the row (now with pause/play)
            stays clear of the fixed WhatsApp button on short screens. */}
        {total > 1 && (
          <div className="pointer-events-auto mt-8 flex items-center gap-4 sm:mt-10 sm:gap-6 lg:mt-14">
            <div className="flex gap-2" role="tablist" aria-label="Slides">
              {/* Segment button. The visible mark stays a 3px editorial rule,
                  but the control itself is a 24px-tall transparent hit area
                  (WCAG 2.5.8 target size) centred in the 36px control row, so
                  the row's height — and therefore the measured copy block the
                  hero composition zone is derived from — is unchanged. */}
              {slides.map((s, i) => (
                <button
                  key={s.image}
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Show slide ${i + 1} of ${total}`}
                  onClick={() => goTo(i, i > index ? 1 : -1)}
                  className="factory-focus group flex h-6 w-10 items-center sm:w-12"
                >
                  <span className="block h-[3px] w-full overflow-hidden bg-(--border) transition-colors group-hover:bg-(--text-secondary)">
                    {/* Outer span: shows/hides the fill (smooth collapse when
                        the slide becomes inactive). Inner span: the 6s fill
                        that doubles as the autoplay clock. It is keyed on the
                        slide's activation count, so it restarts only when its
                        slide becomes active, and it freezes in place (never
                        jumps) while paused. Reduced motion: static full fill
                        as a plain "current slide" marker. */}
                    <span
                      className="block h-full origin-left"
                      style={{
                        transform: i === index ? "scaleX(1)" : "scaleX(0)",
                        transition: reducedMotion ? "none" : "transform 300ms ease",
                      }}
                    >
                      <span
                        key={runIds[i]}
                        className={`block h-full origin-left bg-(--accent) ${
                          autoplayEnabled ? "factory-hero-progress-run" : ""
                        }`}
                        style={
                          autoplayEnabled
                            ? {
                                animationDuration: `${AUTOPLAY_MS}ms`,
                                animationPlayState:
                                  i === index && autoplayOn ? "running" : "paused",
                              }
                            : undefined
                        }
                        onAnimationEnd={i === index ? onProgressEnd : undefined}
                      />
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {autoplayEnabled && (
                <button
                  type="button"
                  onClick={toggleUserPause}
                  aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
                  className="factory-focus flex h-9 w-9 items-center justify-center border border-(--border) text-(--text-primary) transition-colors hover:border-(--brand-secondary) hover:text-(--brand-secondary)"
                >
                  <svg aria-hidden="true" viewBox="0 0 10 12" className="h-3 w-2.5" fill="currentColor">
                    {userPaused ? (
                      <path d="M0 0 L10 6 L0 12 Z" />
                    ) : (
                      <>
                        <rect x="0" y="0" width="3" height="12" />
                        <rect x="7" y="0" width="3" height="12" />
                      </>
                    )}
                  </svg>
                </button>
              )}
              {/* Arrows drawn as strokes rather than "←"/"→" glyphs, so the
                  three controls share one optical weight and one icon size. */}
              <button
                type="button"
                onClick={prev}
                aria-label="Previous slide"
                className="factory-focus flex h-9 w-9 items-center justify-center border border-(--border) text-(--text-primary) transition-colors hover:border-(--brand-secondary) hover:text-(--brand-secondary)"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 12 10"
                  className="h-2.5 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                >
                  <path d="M11.5 5H0.5M4.5 1L0.5 5l4 4" />
                </svg>
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next slide"
                className="factory-focus flex h-9 w-9 items-center justify-center border border-(--border) text-(--text-primary) transition-colors hover:border-(--brand-secondary) hover:text-(--brand-secondary)"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 12 10"
                  className="h-2.5 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                >
                  <path d="M0.5 5h11M7.5 1l4 4-4 4" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
