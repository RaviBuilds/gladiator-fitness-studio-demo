import Image from "next/image";
import { services } from "@/lib/services";
import {
  trainingGoals,
  trainingIntelligenceConfiguration,
} from "@/lib/training-intelligence";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { TrainingLoadout } from "@/components/motion/TrainingLoadout";
import { buildGoalViews } from "@/components/sections/trainingLoadout";

/**
 * Section 05 — TRAINING INTELLIGENCE.
 *
 * The site's teaching chapter, and a deliberate rhythm break. Hero through
 * Section 04 are five dark plates in a row; this one steps onto a warm chalk /
 * training-paper surface with charcoal type, so scrolling out of Section 04
 * reads as entering a different MODE of the site rather than the next panel of
 * the same one. Nothing else on the page changes: the reset is achieved by
 * overriding the surface/ink/border tokens LOCALLY on this section (see the
 * "Pass 9" block in app/globals.css), never by editing the global palette.
 *
 * THE SIGNATURE OBJECT IS AN INSTRUMENT, NOT A LAYOUT. The chapter is built
 * around the TRAINING LOADOUT: a calibrated horizontal rail with indexed
 * positions, a travelling lime selector pin, and plate markers that load and
 * unload per training lever. Its axis is horizontal, so it cannot be confused
 * with Section 02's vertical ruled index, Section 03's centred annotated
 * subject or Section 04's stacked evidence sheets — and it is the only
 * interactive device in the chapter.
 *
 * GYM DNA WITHOUT PHOTOGRAPHY. Delete the artifact below and the section still
 * reads unmistakably as a gym: a machine selector rail with calibration ticks,
 * plate-ring markers loading and unloading, indexed positions, a position
 * readout, a barbell-sleeve hairline and a bumper-plate ring pressed faintly
 * into the paper. That is the acceptance test for this chapter, and it is why
 * `artifact` is optional in the contract — a future gym with no usable
 * photograph loses a supporting detail, not the design.
 *
 * THE PHOTOGRAPH IS SUBORDINATE BY CONSTRUCTION. It is rendered here, on the
 * server, as a small fixed-width editorial insert beside the coach's note
 * (width clamped, capped at 15rem on desktop, height derived from a 4/5 frame)
 * and passed into the client island as a ready-made node. It has no way to
 * grow: no viewport units, no percentage of the section, no full-bleed path.
 *
 * SOURCE-FIRST. Every sentence is the reviewed global educational library in
 * lib/training-intelligence.ts verbatim — principles only, and not one
 * calorie, macro, percentage, heart-rate zone or guaranteed timeframe anywhere
 * in the contract to type one into. The only cross-section claim the chapter
 * makes is the program handoff, and that is filtered through
 * `verified: true` in lib/services.ts, so a goal can never point at a program
 * the gym does not actually run.
 *
 * Server Component. The single client island is the loadout's selection state
 * (components/motion/TrainingLoadout.tsx); entrance motion is the existing
 * Reveal primitive plus CSS. No animation library, no new dependency.
 */
export function TrainingIntelligence({ whatsappHref }: { whatsappHref: string }) {
  const {
    index,
    eyebrow,
    headlineLines,
    accentLastLine,
    deck,
    selectorLabel,
    loadoutLabel,
    emphasisLabel,
    prioritiesLabel,
    mistakesLabel,
    trackLabel,
    coachNoteLabel,
    gymNoteLabel,
    handoffLabel,
    primaryCtaLabel,
    secondaryCtaLabel,
    ctaMessageTemplate,
    disclaimer,
    reviewedBy,
    artifact,
    levers,
  } = trainingIntelligenceConfiguration;

  const goalViews = buildGoalViews({
    goals: trainingGoals,
    levers,
    services,
    ctaBaseHref: whatsappHref,
    ctaMessageTemplate,
  });

  // No enabled goal means there is no chapter to teach — never an empty
  // "Training Intelligence" heading over a dead instrument.
  if (goalViews.length === 0) return null;

  return (
    <section
      id="training-intelligence"
      aria-labelledby="training-intelligence-heading"
      className="s05-surface relative overflow-hidden border-b border-(--border) py-20 scroll-mt-[calc(var(--header-h)+0.5rem)] sm:py-24 lg:py-28"
    >
      {/* Chapter surface: warm paper tone, one bumper-plate ring pressed into
          it, a barbell-sleeve hairline, platform registration marks and a
          micro grain. All decorative, aria-hidden and static. */}
      <div className="s05-field" aria-hidden="true" />
      <div className="s05-grain" aria-hidden="true" />

      <Container className="relative">
        {/* ------------------------------------------------- chapter intro */}
        <Reveal>
          <div className="s05-chapter">
            <div className="s05-chapter-head">
              <div className="s05-chapter-mark">
                <span className="s05-chapter-index" aria-hidden="true">
                  {index}
                </span>
                <span className="s05-chapter-rule" aria-hidden="true" />
                <span className="s05-chapter-eyebrow">{eyebrow}</span>
              </div>

              <h2 id="training-intelligence-heading" className="s05-display">
                {headlineLines.map((line, i) => (
                  <span
                    key={line}
                    className="s05-display-line factory-stagger-child"
                    data-accent={
                      accentLastLine && i === headlineLines.length - 1
                        ? "true"
                        : undefined
                    }
                    style={{ transitionDelay: `${80 + i * 90}ms` }}
                  >
                    {line}
                  </span>
                ))}
              </h2>
            </div>

            {/* Offset deck: sits low and to the outside of the headline on
                desktop, so the chapter opens asymmetrically instead of as a
                centred title block. */}
            <div className="s05-deck">
              <span className="s05-deck-rule" aria-hidden="true" />
              <p className="s05-deck-text">{deck}</p>
            </div>
          </div>
        </Reveal>

        {/* ----------------------------------------- the instrument itself */}
        <Reveal delayMs={120}>
          <TrainingLoadout
            goals={goalViews}
            selectorLabel={selectorLabel}
            loadoutLabel={loadoutLabel}
            emphasisLabel={emphasisLabel}
            prioritiesLabel={prioritiesLabel}
            mistakesLabel={mistakesLabel}
            trackLabel={trackLabel}
            coachNoteLabel={coachNoteLabel}
            gymNoteLabel={gymNoteLabel}
            handoffLabel={handoffLabel}
            primaryCtaLabel={primaryCtaLabel}
            secondaryCtaLabel={secondaryCtaLabel}
            artifact={
              artifact && (
                // The figure is rendered here on the server and handed to the
                // island as a node, where it sits in a children list beside the
                // keyed coach's-note block. It therefore carries its own stable
                // semantic key rather than relying on position.
                <figure key="training-intelligence-artifact" className="s05-artifact">
                  <div className="s05-artifact-frame">
                    <Image
                      src={artifact.src}
                      alt={artifact.alt}
                      fill
                      loading="lazy"
                      sizes="(min-width: 1280px) 15rem, (min-width: 768px) 24vw, 60vw"
                      className="object-cover"
                    />
                    <span className="s05-artifact-marks" aria-hidden="true" />
                  </div>
                  <figcaption className="s05-artifact-caption">
                    {artifact.caption}
                  </figcaption>
                </figure>
              )
            }
          />
        </Reveal>

        {/*
          Standing scope line. Educational, explicitly not medical advice.

          Deliberately NOT wrapped in Reveal. Every other block in the chapter
          enters on scroll, but .reveal's resting state is opacity: 0 and only
          JavaScript adds .reveal-visible — so a scroll-gated disclaimer is a
          disclaimer that never appears if the observer does not fire. This one
          piece of copy renders unconditionally.
        */}
        <p className="s05-scope">
          <span className="s05-scope-tag" aria-hidden="true">
            Scope
          </span>
          {disclaimer}
          {reviewedBy && <span className="s05-scope-review">{reviewedBy}</span>}
        </p>
      </Container>
    </section>
  );
}
