"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GalleryItem } from "@/lib/types";

/**
 * Continuous horizontal image rail for the Gallery section.
 *
 * Renders every item supplied in `items` — no slice/limit of any kind — as
 * an editorial film-strip of fixed square frames. The track holds two
 * consecutive copies of the full item list, and a single translateX offset
 * (driven by requestAnimationFrame, not a CSS @keyframes animation) is
 * wrapped modulo one copy's width. That makes pause-on-hover, pause-on-focus
 * and arrow-nudge all simple reads/writes of one number instead of fighting
 * a declarative animation's own timeline — clicking an arrow can never
 * visually conflict with the automatic motion, and hover/blur never resets
 * position.
 *
 * `prefers-reduced-motion` disables the rAF loop entirely: the strip stays
 * static at its current offset and is only ever moved by the arrow controls.
 *
 * The arrow controls are portaled into the server-rendered header row (the
 * `[data-gallery-controls]` node in components/sections/Gallery.tsx) so they
 * sit visually beside the eyebrow/title instead of under the rail, while
 * `nudge()` — which they call — stays co-located with the rest of this
 * component's rAF/offset state. This is the only client island for the
 * Gallery section; Gallery.tsx itself stays a Server Component.
 */
export function GalleryRail({ items }: { items: GalleryItem[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const copyWidthRef = useRef(0);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  // Resolved post-mount only (never during the render that hydration diffs
  // against the server HTML) so the server's "no portal yet" output and the
  // client's first render output match exactly; the portal then attaches
  // once this effect runs. A lazy useState initializer would instead run
  // during hydration's render pass itself and already see the real DOM node,
  // diverging from the server output and triggering a hydration mismatch.
  const [controlsHost, setControlsHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // One-time DOM query for a static portal target (not a value that
    // could cascade or that depends on React state), so the setState here
    // is intentionally synchronous rather than deferred to a callback.
    setControlsHost(document.querySelector<HTMLElement>("[data-gallery-controls]")); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const PX_PER_SECOND = 34;


  const applyOffset = useCallback(() => {
    const track = trackRef.current;
    const copyWidth = copyWidthRef.current;
    if (!track || copyWidth === 0) return;
    // Wrap into [-copyWidth, 0] so the seam between the two rendered copies
    // never becomes visible, regardless of direction or accumulated nudges.
    let o = offsetRef.current % copyWidth;
    if (o > 0) o -= copyWidth;
    offsetRef.current = o;
    track.style.transform = `translate3d(${o}px, 0, 0)`;
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      copyWidthRef.current = track.scrollWidth / 2;
      applyOffset();
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, [applyOffset, items]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = media.matches;
    const onChange = () => {
      reducedMotionRef.current = media.matches;
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const step = (ts: number) => {
      rafRef.current = requestAnimationFrame(step);
      if (pausedRef.current || reducedMotionRef.current) {
        lastTsRef.current = ts;
        return;
      }
      if (lastTsRef.current === null) {
        lastTsRef.current = ts;
        return;
      }
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      offsetRef.current -= PX_PER_SECOND * dt;
      applyOffset();
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [applyOffset]);

  const pause = useCallback(() => {
    pausedRef.current = true;
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
  }, []);

  const nudge = useCallback(
    (direction: 1 | -1) => {
      const viewport = viewportRef.current;
      const step = (viewport?.clientWidth ?? 600) * 0.7;
      offsetRef.current += direction === 1 ? -step : step;
      applyOffset();
    },
    [applyOffset]
  );

  const openAt = (index: number) => setActiveIndex(index);
  const close = () => setActiveIndex(null);
  const showPrev = () =>
    setActiveIndex((i) => (i === null ? null : (i - 1 + items.length) % items.length));
  const showNext = () =>
    setActiveIndex((i) => (i === null ? null : (i + 1) % items.length));

  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;
    lastFocusedRef.current = document.activeElement as HTMLElement;
    dialogRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lastFocusedRef.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  if (items.length === 0) return null;

  const doubled = [...items, ...items];
  const active = activeIndex !== null ? items[activeIndex] : null;

  const controls = (
    <div className="factory-gallery-controls">
      <button
        type="button"
        onClick={() => nudge(-1)}
        className="factory-gallery-arrow factory-focus"
        aria-label="Scroll gallery left"
      >
        <span aria-hidden="true">←</span>
      </button>
      <button
        type="button"
        onClick={() => nudge(1)}
        className="factory-gallery-arrow factory-focus"
        aria-label="Scroll gallery right"
      >
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );

  return (
    <div className="mt-6 sm:mt-8">
      {controlsHost && createPortal(controls, controlsHost)}

      <div
        ref={viewportRef}
        className="factory-gallery-viewport"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onFocus={pause}
        onBlur={resume}
      >
        <div ref={trackRef} className="factory-gallery-track">
          {doubled.map((item, i) => {
            const sourceIndex = i % items.length;
            return (
              <button
                key={`${item.src}-${i}`}
                type="button"
                onClick={() => openAt(sourceIndex)}
                className="factory-gallery-frame"
                aria-label={`Open image: ${item.alt}`}
                tabIndex={i < items.length ? 0 : -1}
                aria-hidden={i >= items.length ? "true" : undefined}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  loading="lazy"
                  sizes="(min-width: 1024px) 12rem, (min-width: 640px) 9rem, 7rem"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      </div>

      {active && (
        <div className="factory-gallery-dialog-backdrop" onClick={close}>
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Gallery image: ${active.alt}`}
            tabIndex={-1}
            className="factory-gallery-dialog factory-dialog-in factory-focus"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close image viewer"
              className="factory-gallery-dialog-close factory-focus"
            >
              <span aria-hidden="true">✕</span>
            </button>
            <div className="factory-gallery-dialog-figure">
              <Image
                src={active.src}
                alt={active.alt}
                fill
                sizes="92vw"
                className="object-contain"
                priority
              />
            </div>
            {active.caption && (
              <p className="factory-gallery-dialog-caption">{active.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
