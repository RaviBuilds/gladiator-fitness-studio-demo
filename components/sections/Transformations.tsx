import Image from "next/image";
import { transformations } from "@/lib/transformations";
import type { TransformationNotationItem } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { TransformationScrubber } from "@/components/motion/TransformationScrubber";
import { TransformationNav } from "@/components/motion/TransformationNav";
import { buildMetricCells } from "./transformationDossier";

/**
 * Section 04 — TRANSFORMATION EVIDENCE / MEMBER DOSSIER.
 *
 * A premium athletic progress record, not a testimonial: each consented
 * transformation is one EVIDENCE SHEET — a case header (reference, member,
 * journey), a metric ledger of verified figures, the photograph as proof,
 * and the method beside it (training protocol, nutrition & habits, what
 * changed), closing on a quiet consent line. The photograph proves it, the
 * figures make it commercially useful, the notation explains how.
 *
 * ONE COMPOSITION, NOT IMAGE + CARD. The whole case is a single CSS grid
 * (.factory-evidence-sheet): the header rule and the metric ledger span the
 * full sheet across BOTH columns, the media plate hangs from the ledger's
 * bottom rule, and the dossier column hangs from the same line and closes on
 * the consent rule aligned to the plate's own bottom edge. The lead metric
 * cell is exactly the width of the media plate below it, so figure and
 * photograph read as one stacked object. Nothing floats beside anything.
 *
 * FRAME, NOT CROP — and never a viewport-height photograph. The plate's
 * WIDTH is the factory control (clamped, capped at 34rem on desktop, see
 * globals.css); its HEIGHT always falls out of `aspect-ratio` acting on that
 * width, so no arbitrary desktop height exists and the plate can never grow
 * into a full-screen background image. Three frame tokens
 * (`mediaAspect`: portrait 4/5 | square 1/1 | wide 3/2) cover a phone
 * portrait, a combined before/after diptych and a landscape composite; the
 * photograph is always CONTAINED inside the frame, never cropped, so a
 * future gym's inconsistent uploads never lose a face or the before/after
 * seam. Same container + different source photo = same design behaviour.
 *
 * Deliberately NOT Section 01/02/03's grammar:
 *   - no sticky image + scrolling copy column (Section 01);
 *   - no ruled option list with a swapping side preview (Section 02);
 *   - no centred subject with perimeter annotations on a blueprint grid
 *     (Section 03);
 *   - and no repeated horizontal line wallpaper anywhere — the chapter
 *     surface is a graphite field with soft tonal pools and ONE oversized,
 *     2-5% opacity weight-plate ring, so the section still reads as a gym
 *     with every photograph removed (see the GYM DNA note in globals.css).
 *
 * Data integrity: `metrics` are numbers only, and every label, unit, arrow
 * and delta is derived in ./transformationDossier.ts. A metric cell exists
 * only when both of its figures exist, so there is no code path that renders
 * "BMI —". Missing training/nutrition/notes blocks are omitted, not
 * emptied. Names, stories, journeys and notation are `lib/transformations.ts`
 * verbatim. Only `consentVerified: true` items render, and the section
 * returns null when none do — never an empty "Results" section.
 *
 * Server Component. The only client islands are the optional comparison
 * scrubber (per case, only when genuinely independent before/after assets
 * exist) and the case register's navigation (only when there are 2+ cases).
 * Entrance motion is the existing Reveal primitive plus CSS (see the
 * "Pass 8" block in app/globals.css) — no animation library.
 */
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * One notation group (training protocol / nutrition & habits). Label above
 * value, mono, ruled — training-log notation rather than a spreadsheet, and
 * visually distinct from the metric ledger's value-above-label figures.
 */
function NotationGroup({
  label,
  items,
  baseDelayMs,
}: {
  label: string;
  items: TransformationNotationItem[];
  baseDelayMs: number;
}) {
  return (
    <div className="factory-evidence-group">
      <h4 className="factory-group-label">{label}</h4>
      <dl className="factory-evidence-notation">
        {items.map((item, i) => (
          <div
            key={`${item.label}-${item.value}`}
            className="factory-evidence-notation-item factory-stagger-child"
            style={{ transitionDelay: `${baseDelayMs + i * 60}ms` }}
          >
            <dt className="factory-evidence-notation-label">{item.label}</dt>
            <dd className="factory-evidence-notation-value">
              {item.value}
              {item.note && (
                <span className="factory-evidence-notation-note">{item.note}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function Transformations() {
  const cases = transformations.filter((t) => t.consentVerified);
  if (cases.length === 0) return null;

  const total = cases.length;

  return (
    <section
      id="transformations"
      aria-labelledby="transformations-heading"
      className="factory-evidence-surface relative overflow-hidden border-b border-(--border) py-20 scroll-mt-[calc(var(--header-h)+0.5rem)] sm:py-24 lg:py-24"
    >
      {/* Chapter surface: soft graphite pools + one oversized weight-plate
          ring + a micro chalk grain. Decorative, aria-hidden, static. */}
      <div className="factory-evidence-field" aria-hidden="true" />
      <div className="factory-evidence-grain" aria-hidden="true" />

      <Container className="relative">
        <Reveal>
          <div className="factory-evidence-head">
            <div>
              <div className="flex items-center gap-3">
                <span className="factory-index" aria-hidden="true">
                  04
                </span>
                <span className="h-px w-8 bg-(--accent) sm:w-12" aria-hidden="true" />
                <span className="factory-eyebrow">Results</span>
              </div>
              <h2
                id="transformations-heading"
                className="factory-section-display mt-4 text-(--text-primary)"
              >
                <span className="block">Real members,</span>
                <span className="block text-(--accent)">real consent.</span>
              </h2>
            </div>

            <div className="factory-evidence-head-meta">
              {/* Derived from the data itself — a count and the consent
                  condition every rendered case already satisfies. */}
              <span className="factory-evidence-filenote">
                {pad(total)} consented {total === 1 ? "case" : "cases"} on file
              </span>
              <TransformationNav caseCount={total} />
            </div>
          </div>
        </Reveal>

        <ol
          role="list"
          id="transformations-track"
          className="factory-evidence-track"
          data-single={total === 1 ? "true" : undefined}
        >
          {cases.map((item, i) => {
            const hasSplitAssets = Boolean(item.beforeImage && item.afterImage);
            const cells = buildMetricCells(item.metrics);
            const aspect = item.mediaAspect ?? (hasSplitAssets ? "portrait" : "square");
            const memberName = item.personName ?? `Case ${pad(i + 1)}`;
            const hasProtocol = Boolean(
              item.training?.length || item.nutrition?.length || item.coachNotes?.length
            );

            return (
              <li key={item.image + i} data-evidence-case className="factory-evidence-case">
                <Reveal delayMs={i === 0 ? 0 : 60}>
                  <div className="factory-evidence-sheet">
                    <header className="factory-evidence-case-head">
                      <span className="factory-evidence-ref" aria-hidden="true">
                        Case {pad(i + 1)} / {pad(total)}
                      </span>
                      <h3 className="factory-evidence-member">{memberName}</h3>
                      {item.journey && (
                        <p className="factory-evidence-journey">
                          <span className="factory-evidence-journey-label">Journey</span>
                          <span className="factory-evidence-journey-value">{item.journey}</span>
                        </p>
                      )}
                    </header>

                    {cells.length > 0 && (
                      <dl className="factory-evidence-ledger">
                        {cells.map((cell, ci) => (
                          <div
                            key={cell.key}
                            className="factory-evidence-metric factory-stagger-child"
                            data-lead={ci === 0 ? "true" : undefined}
                            style={{ transitionDelay: `${160 + ci * 70}ms` }}
                          >
                            <dt className="factory-evidence-metric-label">{cell.label}</dt>
                            <dd className="factory-evidence-metric-value">
                              {cell.value}
                              {cell.note && (
                                <span className="factory-evidence-metric-change">{cell.note}</span>
                              )}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}

                    <figure className="factory-evidence-media" data-aspect={aspect}>
                      <span className="factory-evidence-stamp" aria-hidden="true">
                        {pad(i + 1)}
                      </span>
                      <span className="factory-evidence-marks" aria-hidden="true" />

                      {hasSplitAssets ? (
                        <TransformationScrubber
                          beforeImage={item.beforeImage!}
                          afterImage={item.afterImage!}
                          beforeAlt={
                            item.beforeImageAlt ?? `${memberName} before progress photograph`
                          }
                          afterAlt={item.afterImageAlt ?? `${memberName} after progress photograph`}
                          beforeLabel={item.beforeLabel}
                          afterLabel={item.afterLabel}
                        />
                      ) : (
                        <div className="factory-evidence-mask">
                          <Image
                            src={item.image}
                            alt={item.imageAlt}
                            fill
                            loading="lazy"
                            sizes="(min-width: 1024px) 34rem, (min-width: 768px) 42vw, 92vw"
                            className="object-contain object-center"
                          />
                        </div>
                      )}

                      <figcaption className="factory-evidence-axis">
                        <span className="factory-evidence-axis-label">{item.beforeLabel}</span>
                        <span className="factory-evidence-axis-tick" aria-hidden="true" />
                        <span className="factory-evidence-axis-label" data-after="true">
                          {item.afterLabel}
                        </span>
                      </figcaption>
                    </figure>

                    {item.story && (
                      <div className="factory-evidence-story">
                        <h4 className="factory-group-label">Member account</h4>
                        <p className="factory-evidence-story-text">{item.story}</p>
                      </div>
                    )}

                    {hasProtocol && (
                      <div className="factory-evidence-protocol">
                        {item.training && item.training.length > 0 && (
                          <NotationGroup
                            label="Training protocol"
                            items={item.training}
                            baseDelayMs={240}
                          />
                        )}

                        {item.nutrition && item.nutrition.length > 0 && (
                          <NotationGroup
                            label="Nutrition & habits"
                            items={item.nutrition}
                            baseDelayMs={320}
                          />
                        )}

                        {item.coachNotes && item.coachNotes.length > 0 && (
                          <div className="factory-evidence-group">
                            <h4 className="factory-group-label">What changed</h4>
                            <ul role="list" className="factory-evidence-notes">
                              {item.coachNotes.map((note, ni) => (
                                <li
                                  key={note}
                                  className="factory-evidence-note factory-stagger-child"
                                  style={{ transitionDelay: `${400 + ni * 50}ms` }}
                                >
                                  {note}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="factory-evidence-consent">Shared with member consent</p>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
