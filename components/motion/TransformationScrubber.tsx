"use client";

import Image from "next/image";
import { useId, useState } from "react";

/**
 * Native, keyboard-operable before/after comparison. Only rendered by
 * Transformations.tsx when a case supplies genuinely independent
 * `beforeImage`/`afterImage` photographs — never a fake split built from a
 * single combined diptych.
 *
 * A real <input type="range"> is the control surface, so touch drag,
 * pointer drag, keyboard arrow keys and screen readers all drive the same
 * state. No pointermove/drag-only handler. `prefers-reduced-motion` removes
 * the CSS transition on `--scrub` automatically (see .factory-scrub-* rules
 * in globals.css) while the comparison itself stays fully interactive.
 *
 * Uses object-fit: contain, matching the static diptych path in
 * Transformations.tsx — the fixed plate frame is sized for the photograph,
 * not the other way around, so neither half of the comparison is cropped.
 * A case supplying independent portraits is framed 4/5 (`mediaAspect`
 * defaults to "portrait" for split assets); the frame's height still falls
 * out of its width, never a fixed pixel height.
 */
export function TransformationScrubber({
  beforeImage,
  afterImage,
  beforeAlt,
  afterAlt,
  beforeLabel,
  afterLabel,
}: {
  beforeImage: string;
  afterImage: string;
  beforeAlt: string;
  afterAlt: string;
  beforeLabel: string;
  afterLabel: string;
}) {
  const [value, setValue] = useState(50);
  const labelId = useId();

  return (
    <div className="factory-scrub" style={{ "--scrub": `${value}%` } as React.CSSProperties}>
      <div className="factory-scrub-after">
        <Image
          src={afterImage}
          alt={afterAlt}
          fill
          loading="lazy"
          sizes="(min-width: 1024px) 34rem, (min-width: 768px) 42vw, 92vw"
          className="object-contain object-center"
        />
      </div>
      <div className="factory-scrub-before">
        <Image
          src={beforeImage}
          alt={beforeAlt}
          fill
          loading="lazy"
          sizes="(min-width: 1024px) 34rem, (min-width: 768px) 42vw, 92vw"
          className="object-contain object-center"
        />
      </div>
      <span className="factory-scrub-line" aria-hidden="true" />
      <span className="factory-scrub-handle" aria-hidden="true" />
      <label htmlFor={labelId} className="sr-only">
        Comparison position between {beforeLabel} and {afterLabel}
      </label>
      <input
        id={labelId}
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
        className="factory-scrub-range factory-focus"
        aria-valuetext={`${value}% toward ${afterLabel}`}
      />
    </div>
  );
}
