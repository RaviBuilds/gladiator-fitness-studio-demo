"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Section 04 — case register navigation.
 *
 * The register itself is a native CSS scroll-snap track (see
 * .factory-evidence-track): swipe and trackpad scroll already work with zero
 * JavaScript. This island only adds the keyboard/pointer equivalent and
 * reads back WHICH case is snapped, so the controls can disable themselves at
 * the ends. Scroll position stays the single source of truth — this component
 * never owns an index the track doesn't already have.
 *
 * Deliberately NOT a carousel UI: no dots, no pills, no arrows floating over
 * the photograph, no auto-advance. It renders as one line of dossier
 * instrumentation in the section header — a case-file rail (01 02 03) up to
 * five cases, and a tabular counter ("03 / 12") beyond that, so the same
 * control stays composed whether a gym has two cases or twenty.
 *
 * Not rendered at all for a single case, since there is nothing to navigate.
 */

/** Stroked chevron matching the site's existing icon language — no icon
 *  library. Declared outside the component so it is not recreated on every
 *  render (avoids re-mounting on each scroll-driven state update). */
function Chevron({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      {direction === "prev" ? (
        <path
          d="M10 3L5 8l5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M6 3l5 5-5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

/** Beyond this many cases the numeral rail becomes a counter. */
const RAIL_LIMIT = 5;

export function TransformationNav({ caseCount }: { caseCount: number }) {
  const [active, setActive] = useState(0);
  const trackElRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const track = document.getElementById("transformations-track");
    if (!track) return;
    trackElRef.current = track;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const cases = track.querySelectorAll<HTMLElement>("[data-evidence-case]");
        if (cases.length === 0) return;
        const trackLeft = track.getBoundingClientRect().left;
        // Nearest case to the track's own left edge (its scroll-snap start),
        // not the viewport's — matches which case is actually snapped.
        let closest = 0;
        let closestDist = Infinity;
        cases.forEach((el, i) => {
          const dist = Math.abs(el.getBoundingClientRect().left - trackLeft);
          if (dist < closestDist) {
            closestDist = dist;
            closest = i;
          }
        });
        setActive(closest);
      });
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const track = trackElRef.current;
    if (!track) return;
    const target = track.querySelectorAll<HTMLElement>("[data-evidence-case]")[index];
    if (!target) return;
    // Absolute scrollLeft target (track.scrollLeft + on-screen delta) rather
    // than a relative scrollBy(): a large relative smooth-scroll can get
    // re-snapped mid-animation by the track's own scroll-snap-type, landing
    // short of the intended case. Computing the destination as an absolute
    // offset always lands exactly on the target case's snap position.
    const delta = target.getBoundingClientRect().left - track.getBoundingClientRect().left;
    track.scrollTo({ left: track.scrollLeft + delta, behavior: "smooth" });
  }, []);

  if (caseCount <= 1) return null;

  const atStart = active <= 0;
  const atEnd = active >= caseCount - 1;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="factory-evidence-nav">
      {caseCount <= RAIL_LIMIT ? (
        <div className="factory-evidence-nav-rail" role="group" aria-label="Select a case">
          {Array.from({ length: caseCount }, (_, i) => (
            <button
              key={i}
              type="button"
              className="factory-evidence-nav-tick factory-focus"
              data-active={i === active ? "true" : undefined}
              aria-current={i === active ? "true" : undefined}
              aria-label={`Case ${pad(i + 1)}`}
              onClick={() => scrollToIndex(i)}
            >
              {pad(i + 1)}
            </button>
          ))}
        </div>
      ) : (
        <span className="factory-evidence-nav-counter" aria-hidden="true">
          {pad(active + 1)} / {pad(caseCount)}
        </span>
      )}

      <div className="factory-evidence-nav-steps">
        <button
          type="button"
          className="factory-evidence-nav-btn factory-focus"
          onClick={() => scrollToIndex(active - 1)}
          disabled={atStart}
          aria-label="Previous case"
        >
          <Chevron direction="prev" />
        </button>
        <button
          type="button"
          className="factory-evidence-nav-btn factory-focus"
          onClick={() => scrollToIndex(active + 1)}
          disabled={atEnd}
          aria-label="Next case"
        >
          <Chevron direction="next" />
        </button>
      </div>
    </div>
  );
}
