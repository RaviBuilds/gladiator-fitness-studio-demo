import Image from "next/image";
import { business } from "@/lib/business";
import { aboutConfiguration, scheduleWindows } from "@/lib/about";
import { Container } from "@/components/ui/Container";
import { TrainingIcon } from "@/components/ui/TrainingIcon";
import { FacilityIcon } from "@/components/ui/FacilityIcon";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Section 01 — facility / training-floor editorial story.
 *
 * Three interlocking bands instead of heading + paragraph + image:
 *
 *   1. DOSSIER HEAD — mono index/eyebrow spine, display heading on the left,
 *      the facility narrative set as an editorial deck on the right.
 *   2. THE PLATE — the primary training-environment index (oversized section
 *      numeral, group label, four ruled modules with geometric icons) running
 *      down the left, and the single facility photograph on the right in an
 *      asymmetric frame whose bottom-left corner deliberately overlaps the
 *      index column, with an offset outline layer, a notched corner, an accent
 *      rule and a vertical technical label crossing its edge.
 *   3. TECHNICAL ROW — quiet mono support metadata plus the derived opening
 *      schedule, closed by a single rule so the section hands off cleanly to
 *      Section 02.
 *
 * Source-First: the narrative is `business.description` (unchanged, still the
 * template's placeholder copy), the locality comes from `business.address`,
 * and the schedule is derived from `business.hours`. Zones and attributes only
 * render when `verified: true`. Nothing in this component invents a claim,
 * count or rating.
 *
 * Server Component. Entrance motion is the existing Reveal primitive plus CSS
 * (see the "Pass 3" block in app/globals.css) — no client state, no animation
 * library.
 */
export function About() {
  const {
    index,
    eyebrow,
    headlineLines,
    accentLastLine,
    image,
    imageLabel,
    frameLabel,
    zonesLabel,
    attributesLabel,
    scheduleLabel,
    zones,
    attributes,
    showSchedule,
  } = aboutConfiguration;

  const verifiedZones = zones.filter((zone) => zone.verified);
  const verifiedAttributes = attributes.filter((attribute) => attribute.verified);
  const windows = showSchedule ? scheduleWindows(business.hours) : [];
  const locality = business.address.locality || business.address.city;
  const paragraphs = business.description
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="relative overflow-hidden border-b border-(--border) bg-(--bg-secondary) py-20 sm:py-24 lg:py-28"
    >
      <Container>
        {/* ---------- Band 1 — dossier head ---------- */}
        <Reveal>
          <div className="flex items-center gap-3">
            <span className="factory-index" aria-hidden="true">
              {index}
            </span>
            <span className="h-px w-8 bg-(--brand-secondary) sm:w-12" aria-hidden="true" />
            <span className="factory-eyebrow">{eyebrow}</span>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-7">
            <h2
              id="about-heading"
              className="factory-section-display text-(--text-primary)"
            >
              {headlineLines.map((line, i) => (
                <span
                  key={i}
                  className={
                    accentLastLine && i === headlineLines.length - 1
                      ? "block text-(--accent)"
                      : "block"
                  }
                >
                  {line}
                </span>
              ))}
            </h2>
          </Reveal>

          <Reveal delayMs={90} className="lg:col-span-5 lg:pt-2">
            <div className="flex max-w-[48ch] flex-col gap-4 text-[0.9375rem] leading-7 text-(--text-secondary)">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {locality && <p className="factory-meta-item mt-6">{locality}</p>}
          </Reveal>
        </div>

        {/*
         * Hinge between the two halves: the head's closing rule, with the
         * oversized section numeral pulled up to straddle it on desktop. The
         * numeral sits on the same left spine as the display heading and the
         * eyebrow index above it, so `01` reads as the head's index growing
         * into the plate rather than as a second, unrelated numeral. Rule +
         * index + alignment only — no new graphic.
         */}
        <div className="factory-rule mt-8" aria-hidden="true" />

        {/* ---------- Band 2 — training-environment index + facility plate ---------- */}
        <div className="mt-6 grid gap-10 lg:mt-7 lg:grid-cols-12 lg:items-start lg:gap-0">
          <Reveal className="order-2 lg:order-1 lg:col-span-5 lg:pr-14">
            <span className="factory-plate-numeral lg:-mt-14" aria-hidden="true">
              {index}
            </span>

            <div className="mt-2 flex items-baseline justify-between gap-4 border-b border-(--border) pb-3">
              <h3 className="factory-group-label">{zonesLabel}</h3>
              <span className="factory-index" aria-hidden="true">
                {String(verifiedZones.length).padStart(2, "0")}
              </span>
            </div>

            {verifiedZones.length > 0 && (
              <ul>
                {verifiedZones.map((zone, i) => (
                  <li
                    key={zone.id}
                    className="factory-zone-row factory-stagger-child"
                    style={{ transitionDelay: `${120 + i * 80}ms` }}
                  >
                    <span className="factory-index shrink-0" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <TrainingIcon name={zone.icon} className="factory-zone-icon" />
                    <div className="min-w-0">
                      <h4 className="factory-zone-label">{zone.label}</h4>
                      {zone.detail && (
                        <p className="factory-zone-detail">{zone.detail}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Reveal>

          <Reveal delayMs={60} className="order-1 lg:order-2 lg:col-span-7 lg:-ml-8">
            <div className="relative">
              {/* Offset outline layer — the frame's second, empty plane. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-3 -right-3 left-8 top-10 border border-(--border) sm:-bottom-4 sm:-right-4 sm:left-12"
              />

              <div className="factory-frame-notch relative aspect-[4/5] w-full overflow-hidden bg-(--surface) sm:aspect-[3/2] lg:aspect-[16/11]">
                <div className="factory-image-mask absolute inset-0">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    loading="lazy"
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-cover object-[50%_42%]"
                  />
                </div>
              </div>

              {/* Accent rule entering the frame from outside its top-left. */}
              <span
                aria-hidden="true"
                className="absolute -left-6 top-10 hidden h-px w-14 bg-(--brand-secondary) lg:block"
              />

              {frameLabel && (
                <span
                  aria-hidden="true"
                  className="factory-vlabel absolute bottom-10 left-0 hidden -translate-x-1/2 lg:block"
                >
                  {frameLabel}
                </span>
              )}

              {imageLabel && (
                <span className="factory-meta-chip absolute bottom-4 right-4 sm:bottom-5 sm:right-5">
                  {imageLabel}
                </span>
              )}
            </div>
          </Reveal>
        </div>

        {/* ---------- Band 3 — technical support metadata ---------- */}
        {(verifiedAttributes.length > 0 || windows.length > 0) && (
          <Reveal className="mt-12 lg:mt-14">
            <div className="flex flex-col gap-8 border-t border-(--border) pt-6 lg:flex-row lg:items-start lg:gap-12">
              {verifiedAttributes.length > 0 && (
                <div className="flex-1">
                  {/* Same label / count / rule header as the training-environment
                      plate, so the quiet metadata row reads as the same system
                      one level down rather than as a different component. */}
                  <div className="flex items-baseline justify-between gap-4 border-b border-(--border) pb-3">
                    <h3 className="factory-group-label">{attributesLabel}</h3>
                    <span className="factory-index" aria-hidden="true">
                      {String(verifiedAttributes.length).padStart(2, "0")}
                    </span>
                  </div>
                  <ul className="factory-facility-cards mt-5">
                    {verifiedAttributes.map((attribute, i) => (
                      <li
                        key={attribute.id}
                        className="factory-facility-card factory-stagger-child"
                        style={{ transitionDelay: `${80 + i * 60}ms` }}
                      >
                        <FacilityIcon
                          id={attribute.id}
                          className="factory-facility-card-icon"
                        />
                        <div className="min-w-0">
                          <span className="factory-facility-card-label">
                            {attribute.label}
                          </span>
                          {attribute.value && (
                            <span className="factory-facility-card-value">
                              {attribute.value}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {windows.length > 0 && (
                <div className="lg:w-72 lg:shrink-0 lg:border-l lg:border-(--border) lg:pl-12">
                  <div className="flex items-baseline justify-between gap-4 border-b border-(--border) pb-3">
                    <h3 className="factory-group-label">{scheduleLabel}</h3>
                    <span className="factory-index" aria-hidden="true">
                      {String(windows.length).padStart(2, "0")}
                    </span>
                  </div>
                  <dl className="mt-5 flex flex-col gap-2.5">
                    {windows.map((entry) => (
                      <div
                        key={entry.label}
                        className="flex items-baseline justify-between gap-4"
                      >
                        <dt className="factory-schedule-day">{entry.label}</dt>
                        <dd className="factory-schedule-window">{entry.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </Reveal>
        )}
      </Container>
    </section>
  );
}
