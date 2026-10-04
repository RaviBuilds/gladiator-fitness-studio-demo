import { whyChooseUs, whyChooseUsConfiguration } from "@/lib/why-choose-us";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { WhyChooseBlueprint } from "@/components/motion/WhyChooseBlueprint";

/**
 * Section 03 — PERFORMANCE BLUEPRINT.
 *
 * A technical sheet rather than another indexed list: the manifesto statement
 * opens the chapter, the athlete stands at the centre of the composition on a
 * graduated floor line, and the training principles are indexed annotations in
 * the space around him, each wired to the subject by a connector hairline.
 *
 * Why it cannot be mistaken for Section 02 (program index + preview panel):
 *   - the photograph is the CENTRE column, not a side panel, and there is only
 *     one of them — no per-row image swap;
 *   - annotation text sits on both sides of the subject and the statement
 *     crosses the top of the frame, instead of a list living in its own column;
 *   - annotations are ragged-edge callouts at varying vertical offsets with no
 *     border, no fill, no icon and no arrow column — not full-width ruled rows;
 *   - the chapter surface steps from Section 02's flat graphite to a black
 *     blueprint plate: a two-axis training grid, a centre axis, edge
 *     measurement ticks and a single plate-ring target behind the subject, so
 *     the section still reads as a gym sheet with the photograph removed.
 *
 * Source-First: every title and description is `whyChooseUs` verbatim; the
 * statement, deck, group label and anchor photograph come from
 * `whyChooseUsConfiguration`. The only other text on the sheet is derived
 * numerals (index / total). Nothing here invents a category, count or claim.
 *
 * Server Component. The active-principle state is the single client island
 * (WhyChooseBlueprint); entrance motion is the existing Reveal primitive plus
 * CSS (see the "Pass 6" block in app/globals.css) — no animation library.
 */
export function WhyChooseUs() {
  if (whyChooseUs.length === 0) return null;

  const { index, eyebrow, headlineLines, accentLastLine, deck, principlesLabel, anchor } =
    whyChooseUsConfiguration;

  return (
    <section
      id="why-choose-us"
      aria-labelledby="why-choose-us-heading"
      className="factory-blueprint-surface relative overflow-hidden border-b border-(--border) py-20 scroll-mt-[calc(var(--header-h)+0.5rem)] sm:py-24 lg:py-28"
    >
      {/* Blueprint field: training grid + centre axis, edge measurement ticks
          and one plate-ring target behind the subject. Decorative only. */}
      <div className="factory-blueprint-grid" aria-hidden="true" />
      <div className="factory-blueprint-marks" aria-hidden="true" />

      <Container className="relative">
        {/* The statement sits above the sheet in the stacking order, so its
            final line can cross the top of the photograph. */}
        <Reveal className="relative z-20">
          <div className="flex items-center gap-3">
            <span className="factory-index" aria-hidden="true">
              {index}
            </span>
            <span className="h-px w-8 bg-(--brand-secondary) sm:w-12" aria-hidden="true" />
            <span className="factory-eyebrow">{eyebrow}</span>
          </div>

          <h2
            id="why-choose-us-heading"
            className="factory-blueprint-statement mt-5 sm:mt-6"
          >
            {headlineLines.map((line, i) => (
              <span
                key={line}
                className={`factory-blueprint-line factory-stagger-child${
                  accentLastLine && i === headlineLines.length - 1
                    ? " factory-blueprint-line-accent"
                    : ""
                }`}
                style={{ transitionDelay: `${90 + i * 80}ms` }}
              >
                {line}
              </span>
            ))}
          </h2>
        </Reveal>

        <Reveal delayMs={140} className="relative z-10">
          <WhyChooseBlueprint
            items={whyChooseUs}
            anchor={anchor}
            principlesLabel={principlesLabel}
            deck={deck}
          />
        </Reveal>
      </Container>
    </section>
  );
}
