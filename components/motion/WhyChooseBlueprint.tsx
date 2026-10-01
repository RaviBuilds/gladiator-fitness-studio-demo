"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { WhyChooseUsAnchor, WhyChooseUsItem } from "@/lib/types";
import { annotationSlot, targetOffset } from "@/components/motion/blueprintField";

/**
 * Section 03 — the Performance Blueprint field.
 *
 * One athlete standing on a measured floor line at the centre of a technical
 * sheet, with the training principles set as indexed annotations in the space
 * around him. Each annotation is wired to the subject by a connector hairline
 * that terminates in a crosshair riding the figure's edge, so the text reads as
 * an annotation of the photograph rather than a list beside it.
 *
 * Deliberately NOT Section 02's grammar: the subject is the centre column (not
 * a side preview panel), text sits on both sides of it and crosses its upper
 * field, there is exactly ONE photograph that never swaps, and the annotations
 * are ragged-edged callouts at varying vertical offsets instead of full-width
 * ruled rows with icons and arrows.
 *
 * Interaction: hover, focus and click all set the active principle. The active
 * state moves one spatial truth — `--wcu-target` (see blueprintField.ts) —
 * which the crosshair, the local light on the figure and the floor-line tick
 * all read, and steps the annotation's index/title/description contrast. No
 * zoom, no glow, no card lift. Every description stays fully visible at every
 * breakpoint, so nothing is hover-gated.
 *
 * Accessibility: each title is a real <button> inside its own <h4> (the
 * accordion-header pattern), so the accessible name is the principle itself,
 * hover and keyboard focus reach the same state, and the surrounding graphics
 * are decorative and aria-hidden.
 *
 * Client island only because of the active index. Everything static in Section
 * 03 stays in the Server Component (components/sections/WhyChooseUs.tsx).
 */
export function WhyChooseBlueprint({
  items,
  anchor,
  principlesLabel,
  deck,
}: {
  items: WhyChooseUsItem[];
  anchor: WhyChooseUsAnchor;
  principlesLabel: string;
  deck?: string;
}) {
  const [active, setActive] = useState(0);
  const total = items.length;
  const activeSide = annotationSlot(active, total).side;
  const pad = (n: number) => String(n).padStart(2, "0");

  const figureRef = useRef<HTMLDivElement>(null);
  const metaRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [aim, setAim] = useState<string | null>(null);

  /**
   * On the desktop perimeter field, the crosshair and the local light are aimed
   * at the active annotation's own index row, so the connector crossing the
   * gutter and the mark on the figure read as one continuous leader instead of
   * two accent marks at unrelated heights. Below 1280 the annotations sit under
   * the frame, where a measured aim would be meaningless, so the derived
   * offset from blueprintField.ts is used instead (and it is also the
   * server-rendered value, so nothing depends on JavaScript to look right).
   */
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px)");

    const measure = () => {
      const figure = figureRef.current;
      const meta = metaRefs.current[active];
      if (!desktop.matches || !figure || !meta) {
        setAim(null);
        return;
      }
      const frame = figure.getBoundingClientRect();
      const row = meta.getBoundingClientRect();
      if (frame.height === 0) return;
      const y = row.top + row.height / 2 - frame.top;
      const clamped = Math.min(Math.max(y, frame.height * 0.08), frame.height * 0.92);
      setAim(`${Math.round(clamped)}px`);
    };

    measure();
    window.addEventListener("resize", measure);
    desktop.addEventListener("change", measure);
    return () => {
      window.removeEventListener("resize", measure);
      desktop.removeEventListener("change", measure);
    };
  }, [active, total]);

  const scan = targetOffset(active, total);

  return (
    <div
      className="factory-blueprint-plate"
      style={
        {
          "--wcu-aim": aim ?? scan,
          "--wcu-scan": scan,
        } as CSSProperties
      }
    >
      {deck && <p className="factory-blueprint-deck">{deck}</p>}

      <div className="factory-blueprint-sheet-label">
        <h3 className="factory-group-label">{principlesLabel}</h3>
        <span className="factory-index" aria-hidden="true">
          {pad(total)}
        </span>
      </div>

      {/* ---------- The subject ---------- */}
      <div className="factory-blueprint-figure-cell">
        <div className="factory-blueprint-figure" data-side={activeSide} ref={figureRef}>
          <div className="factory-blueprint-mask">
            <Image
              src={anchor.src}
              alt={anchor.alt}
              fill
              sizes="(min-width: 1280px) 32vw, (min-width: 768px) 62vw, 100vw"
              className="object-cover"
              style={{ objectPosition: anchor.objectPosition ?? "50% 26%" }}
            />
            {/* Local light tracking the active principle's anchor point — a
                lighting response on the subject, not an overlay effect. Inside
                the frame so it can never bleed past the photograph. */}
            <span className="factory-blueprint-light" aria-hidden="true" />
            {/* Scrim: dissolves the frame's edges into the sheet so it reads as
                campaign photography rather than a panel, and guarantees
                contrast where the manifesto and the annotations cross it. */}
            <span className="factory-blueprint-scrim" aria-hidden="true" />
          </div>

          {/* Crosshair riding the figure's edge on the active side. */}
          <span className="factory-blueprint-target" aria-hidden="true" />
          {/* Sheet stamp: derived numerals only, never an authored label. */}
          <span className="factory-blueprint-stamp" aria-hidden="true">
            {pad(active + 1)} / {pad(total)}
          </span>
        </div>

        {/* Floor line the subject stands on, graduated like a training-floor
            measurement rule and extended past the figure into the annotation
            gutters. Below xl its accent tick is the active-principle marker. */}
        <span className="factory-blueprint-baseline" aria-hidden="true">
          <span className="factory-blueprint-baseline-tick" />
        </span>
      </div>

      {/* role="list" restores list semantics under display: contents, which is
          what lets the <li> annotations become grid items of the sheet. */}
      <ul role="list" className="factory-blueprint-annotations">
        {items.map((item, i) => {
          const slot = annotationSlot(i, total);
          const isActive = i === active;

          return (
            <li
              key={item.title}
              className="factory-annotation factory-stagger-child"
              data-side={slot.side}
              data-active={isActive || undefined}
              style={
                {
                  "--wcu-row": slot.row,
                  "--wcu-col": slot.column,
                  transitionDelay: `${220 + i * 90}ms`,
                } as CSSProperties
              }
              onMouseEnter={() => setActive(i)}
            >
              <span
                className="factory-annotation-meta"
                ref={(node) => {
                  metaRefs.current[i] = node;
                }}
              >
                <span className="factory-annotation-index" aria-hidden="true">
                  {pad(i + 1)}
                </span>
                <span className="factory-annotation-ref" aria-hidden="true">
                  {pad(i + 1)} / {pad(total)}
                </span>
                <span className="factory-annotation-connector" aria-hidden="true" />
              </span>

              <h4 className="factory-annotation-title">
                <button
                  type="button"
                  className="factory-focus factory-annotation-button"
                  aria-pressed={isActive}
                  onClick={() => setActive(i)}
                  onFocus={() => setActive(i)}
                >
                  {item.title}
                </button>
              </h4>

              <p className="factory-annotation-desc">{item.description}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
