import { betweenSessionsConfiguration } from "@/lib/between-sessions";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { TrainingWeek } from "@/components/motion/TrainingWeek";
import { PreSessionCheck } from "@/components/motion/PreSessionCheck";
import { BodyMap } from "@/components/motion/BodyMap";
import { buildStationViews, withCtaMessage } from "@/components/sections/intervalLog";
import { buildFigureSummary, resolveGroups } from "@/components/sections/bodyMap";

/**
 * Section 07 — BETWEEN SESSIONS.
 *
 * Section 05 answers "how does my goal change how I train?". This chapter
 * answers the question that follows it: what happens in the hours and days
 * around a session, and why that is the part of training that decides whether
 * anyone keeps going. It closes on an original anatomy blueprint — the
 * chapter's visual payoff and the template's most distinctive graphic asset.
 *
 * ---------------------------------------------------------------------------
 * ITS OWN VISUAL GRAMMAR, ON PURPOSE.
 *
 * The signature object is a VERTICAL GRADUATED TIME SPINE. The log descends
 * from LAST REP to NEXT SESSION with each station clamped onto the spine at its
 * own relative interval marker, and each station is a different SHAPE because
 * its content genuinely differs (RECOVER carries a "watch for" note the others
 * do not). Nothing in the descent is a card, a box or a repeated tile.
 *
 * Why it is none of Sections 01-06:
 *   - Section 01 is a sticky facility plate beside scrolling copy.
 *   - Section 02 is a uniform, interactive, ruled program index that swaps a
 *     side preview image. This log is non-uniform, non-interactive, and hung
 *     off a measured time axis with interval markers — a log sheet, not a menu.
 *   - Section 03 is a photographed athlete with radial perimeter annotations.
 *   - Section 04 is a per-case evidence dossier with a metric ledger.
 *   - Section 05 is a HORIZONTAL calibrated selector rail on warm paper. This
 *     chapter's axis is vertical and its surface is cool steel — the two
 *     educational chapters are deliberately opposite in both.
 *   - Section 06 is a dark field carrying light Google review cards.
 *
 * SURFACE. Cool graphite steel with a low floor glow, one very large sweep arc
 * (a rest interval, drawn as gym geometry rather than as a clock), sparse edge
 * calibration and a fine grain. No repeating grid, no dense horizontal rules,
 * no HUD, no neon, no gradient stack. Achieved by re-pointing the surface
 * tokens LOCALLY on `.s07-surface` (see the "Pass 11" block in
 * app/globals.css), never by touching the global palette.
 *
 * ZERO RASTER IMAGES. There is no photograph in this chapter and none is
 * required: the body map SVG is the primary visual asset, and the gym reads
 * through drawn equipment geometry — a barbell line across the figure's
 * shoulders, a floor baseline with graduations, plate-ring field geometry and
 * measurement brackets. `artifact` exists in the contract, is disabled in the
 * master template, and the section is composed so enabling it could only ever
 * add a supporting detail.
 *
 * SOURCE-FIRST AND SAFE. Every sentence is the reviewed global educational
 * library in lib/between-sessions.ts verbatim. No calorie, macro, hydration,
 * sleep, body-fat or supplement figure exists in the contract to type one into;
 * the interval markers are relative to the last rep rather than clock times;
 * the pre-session check has no score; and the body map's two states are the
 * same geometry drawn two ways rather than a promised physique.
 *
 * Server Component. Three small client islands carry the only interactive
 * state: the week strip's sample pattern, the pre-session check's three
 * booleans, and the body map's view + region selection. Region resolution,
 * station numbering, the accessible figure summary and the CTA href are all
 * computed here, on the server, so those rules never ship to the browser.
 * Entrance motion is the existing Reveal primitive plus CSS — no animation
 * library, no new dependency.
 */
export function BetweenSessions({ whatsappHref }: { whatsappHref: string }) {
  const {
    index,
    eyebrow,
    headlineLines,
    accentLastLine,
    deck,
    logLabel,
    openLabel,
    closeLabel,
    principleLabel,
    whyLabel,
    practiceLabel,
    watchLabel,
    gymNoteLabel,
    week,
    check,
    bodyMap,
    ctaLabel,
    ctaMessage,
    ctaNote,
    disclaimer,
    reviewedBy,
    stations,
  } = betweenSessionsConfiguration;

  const stationViews = buildStationViews(stations);
  const groups = resolveGroups(bodyMap.groups);

  // No stations and no body-map regions means there is no chapter to teach —
  // never a "Between sessions" heading over an empty spine.
  if (stationViews.length === 0 && groups.length === 0) return null;

  const figureSummary = buildFigureSummary(groups, {
    front: bodyMap.frontLabel,
    back: bodyMap.backLabel,
  });
  const ctaHref = withCtaMessage(whatsappHref, ctaMessage);

  return (
    <section
      id="between-sessions"
      aria-labelledby="between-sessions-heading"
      className="s07-surface relative overflow-hidden border-b border-(--border) py-20 scroll-mt-[calc(var(--header-h)+0.5rem)] sm:py-24 lg:py-28"
    >
      {/* Chapter surface. Decorative, aria-hidden and completely static —
          nothing on this field animates, idles or loops. */}
      <div className="s07-field" aria-hidden="true" />
      <div className="s07-grain" aria-hidden="true" />

      <Container className="relative">
        {/* ------------------------------------------------- chapter opening */}
        <Reveal>
          <div className="s07-chapter">
            <div className="s07-chapter-head">
              <div className="s07-chapter-mark">
                <span className="s07-chapter-index" aria-hidden="true">
                  {index}
                </span>
                <span className="s07-chapter-rule" aria-hidden="true" />
                <span className="s07-chapter-eyebrow">{eyebrow}</span>
              </div>

              <h2 id="between-sessions-heading" className="s07-display">
                {headlineLines.map((line, i) => (
                  <span
                    key={line}
                    className="s07-display-line factory-stagger-child"
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

            <div className="s07-deck">
              <span className="s07-deck-rule" aria-hidden="true" />
              <p className="s07-deck-text">{deck}</p>
            </div>
          </div>
        </Reveal>

        {/* ------------------------------------------------ the week context */}
        <Reveal delayMs={80}>
          <TrainingWeek week={week} />
        </Reveal>

        {/* ---------------------------------------- chapter A: interval log */}
        {stationViews.length > 0 && (
          <div className="s07-log">
            <Reveal>
              <div className="s07-log-head">
                <h3 className="s07-label s07-log-heading">{logLabel}</h3>
                <p className="s07-log-open">
                  <span className="s07-log-node" data-node="open" aria-hidden="true" />
                  {openLabel}
                </p>
              </div>
            </Reveal>

            {/*
              The spine lives on this list, so it is ONE continuous stroke from
              the first station to the last rather than a border repeated per
              row. Each station reveals on its own as it arrives — the log is
              taller than a viewport, so a single observer on the whole list
              would fire the entire sequence off-screen.
            */}
            <ol role="list" className="s07-log-list">
              {stationViews.map((station) => (
                <li key={station.id} className="s07-station-cell">
                  <Reveal>
                    <div className="s07-station" data-last={station.last || undefined}>
                      <div className="s07-station-marker">
                        <span className="s07-station-node" aria-hidden="true" />
                        <span className="s07-station-marker-text">{station.marker}</span>
                        <span className="s07-station-interval">
                          {station.intervalLabel}
                        </span>
                      </div>

                      <div className="s07-station-body">
                        <div className="s07-station-title">
                          <span className="s07-station-index" aria-hidden="true">
                            {station.index}
                          </span>
                          <h4 className="s07-station-name">{station.name}</h4>
                        </div>

                        <p className="s07-station-principle">
                          <span className="s07-station-principle-tag" aria-hidden="true">
                            {principleLabel}
                          </span>
                          {station.principle}
                        </p>

                        <div className="s07-station-grid">
                          <div className="s07-station-col">
                            <p className="s07-label">{whyLabel}</p>
                            <p className="s07-station-why">{station.why}</p>
                          </div>

                          <div className="s07-station-col">
                            <p className="s07-label">{practiceLabel}</p>
                            <ol role="list" className="s07-practice">
                              {station.practice.map((item, i) => (
                                <li key={item} className="s07-practice-item">
                                  <span
                                    className="s07-practice-index"
                                    aria-hidden="true"
                                  >
                                    {String(i + 1).padStart(2, "0")}
                                  </span>
                                  {item}
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>

                        {/* Only some stations carry this, which is what stops
                            the descent from becoming four identical blocks. */}
                        {station.watchFor && station.watchFor.length > 0 && (
                          <div className="s07-watch">
                            <p className="s07-label" data-accent="true">
                              {watchLabel}
                            </p>
                            <ul role="list" className="s07-watch-list">
                              {station.watchFor.map((item) => (
                                <li key={item} className="s07-watch-item">
                                  <span className="s07-watch-tick" aria-hidden="true" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {station.gymNote && (
                          <p className="s07-station-gym">
                            <span className="s07-station-gym-label">
                              {gymNoteLabel}
                            </span>
                            {station.gymNote}
                          </p>
                        )}
                      </div>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>

            {/* The log's closing instrument. Attached to the log itself rather
                than to a station id, so disabling or reordering stations can
                never orphan it or move it into the middle of the descent. */}
            <Reveal>
              <div className="s07-log-foot">
                <PreSessionCheck check={check} />

                <p className="s07-log-close">
                  <span className="s07-log-node" data-node="close" aria-hidden="true" />
                  {closeLabel}
                </p>
              </div>
            </Reveal>
          </div>
        )}

        {/* ------------------------------------------- chapter B: body map */}
        {groups.length > 0 && (
          <Reveal>
            <BodyMap bodyMap={bodyMap} groups={groups} summary={figureSummary} />
          </Reveal>
        )}

        {/* --------------------------------------------------- one closing CTA */}
        <Reveal>
          <div className="s07-cta-block">
            <p className="s07-cta-note">{ctaNote}</p>
            <Button href={ctaHref} className="s07-cta">
              {ctaLabel} &rarr;
            </Button>
          </div>
        </Reveal>

        {/*
          Standing scope line. Educational, explicitly not medical advice.

          Deliberately NOT wrapped in Reveal: .reveal's resting state is
          opacity: 0 and only JavaScript adds .reveal-visible, so a scroll-gated
          disclaimer is a disclaimer that never appears if the observer does not
          fire. This copy renders unconditionally.
        */}
        <p className="s07-scope">
          <span className="s07-scope-tag" aria-hidden="true">
            Scope
          </span>
          {disclaimer}
          {reviewedBy && <span className="s07-scope-review">{reviewedBy}</span>}
        </p>
      </Container>
    </section>
  );
}
