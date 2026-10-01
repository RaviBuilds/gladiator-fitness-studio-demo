import { Fragment } from "react";
import { kineticStripConfiguration } from "@/lib/kinetic-strip";
import {
  DECLARATION_BAND,
  TECHNICAL_BAND,
  runRepeatCount,
  trackDurationSeconds,
  type BandPreset,
} from "./kineticBands";

/**
 * One band: a clipping viewport plus a looping track. Both bands share this
 * implementation; everything that differs (typography variant, direction,
 * velocity, density, separator, which phrase carries which tone) comes from
 * the preset in kineticBands.ts.
 *
 * The track holds exactly two identical copies of the content and animates
 * 0 -> -50% (or -50% -> 0), so the loop point is mathematically seamless and
 * cannot drift. Each copy repeats the phrase sequence `repeat` times — the
 * minimum needed for one copy to be wider than the viewport, which is what
 * prevents a blank gap from scrolling through on large screens.
 *
 * Only the first run is exposed to assistive technology; every duplicate run
 * and every separator glyph is aria-hidden, so the meaningful content is
 * announced exactly once.
 */
function Band({
  phrases,
  preset,
}: {
  phrases: string[];
  preset: BandPreset;
}) {
  if (phrases.length === 0) return null;

  const repeat = runRepeatCount(phrases, preset);
  const duration = trackDurationSeconds(phrases, preset);
  const runs = repeat * 2;

  return (
    <div className={`factory-strip-viewport factory-strip--${preset.variant}`}>
      <div
        className="factory-strip-track"
        data-direction={preset.direction}
        style={{ "--factory-strip-duration": `${duration}s` } as React.CSSProperties}
      >
        {Array.from({ length: runs }, (_, runIndex) => (
          <div
            key={runIndex}
            className="factory-strip-run"
            aria-hidden={runIndex > 0 ? "true" : undefined}
          >
            {phrases.map((phrase, i) => (
              <Fragment key={i}>
                <span
                  className="factory-strip-phrase"
                  data-tone={
                    preset.accentIndices.includes(i)
                      ? "accent"
                      : preset.recessedIndices.includes(i)
                        ? "recessed"
                        : undefined
                  }
                >
                  {phrase}
                </span>
                <span aria-hidden="true" className="factory-strip-sep">
                  {preset.separator}
                </span>
              </Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Kinetic Identity Strip — two-band athletic editorial motion, directly
 * under the hero.
 *
 * Band 01 (declaration) carries the campaign statement at display scale and
 * moves left on the hero's own background, so it reads as the hero's
 * typography continuing off the fold. Band 02 (technical) is a small mono
 * training-floor metadata readout moving right, faster, on the secondary
 * surface — a quieter step down into the Trust section below.
 *
 * Server Component: motion is pure CSS (see the factory-strip-* block in
 * app/globals.css), so the strip ships zero JavaScript and no animation
 * library. Content comes from existing verified business facts via
 * lib/kinetic-strip.ts — never invented copy.
 */
export function KineticStrip() {
  const { primary, secondary } = kineticStripConfiguration;
  if (primary.length === 0 && secondary.length === 0) return null;

  return (
    <div className="bg-(--bg-primary)">
      {primary.length > 0 && (
        <div className="border-b border-(--border) py-2.5 sm:py-3.5">
          <Band phrases={primary} preset={DECLARATION_BAND} />
        </div>
      )}
      {secondary.length > 0 && (
        <div className="bg-(--bg-secondary) py-2 sm:py-2.5">
          <Band phrases={secondary} preset={TECHNICAL_BAND} />
        </div>
      )}
    </div>
  );
}
