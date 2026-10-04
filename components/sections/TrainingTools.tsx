import { fitnessTools } from "@/lib/fitness-tools";
import { trainingIntelligenceConfiguration } from "@/lib/training-intelligence";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ToolVisual, ToolsRouteBanner } from "@/components/ui/TrainingToolVisuals";
import { availableTools } from "@/components/sections/fitnessToolsLogic";

/**
 * TRAINING TOOLS strip — sits between Section 01 (About) and Section 02
 * (Programs).
 *
 * Previously the closing block of Section 05. Moved here so a visitor who has
 * just learned who the gym is meets the guided tools before the programme
 * list: "not sure where to start?" is answered at the point the question
 * naturally arises.
 *
 * It keeps Section 05's warm paper surface (the `.s05-surface` token reset) and
 * the `.s05-tool*` vocabulary, and is built to make the tools worth clicking:
 *   - each card leads with an illustration of what that tool produces
 *     (components/ui/TrainingToolVisuals.tsx), so the empty space in the card
 *     shows the outcome instead of being blank;
 *   - a "You get" line states the concrete result in a few words, next to the
 *     format chip (question count) — what you give and what you get;
 *   - the first tool carries a "Start here" tag, the three are numbered and
 *     joined by connector chevrons, and a route drawing fills the header's
 *     right-hand side on desktop;
 *   - the whole card is one click target (stretched link on the CTA).
 *
 * Copy comes from lib/training-intelligence.ts (framing) and
 * lib/fitness-tools.ts (names, descriptions, outcomes, routes). Only AVAILABLE
 * tools render; with none available the strip renders nothing. Server
 * Component, not wrapped in Reveal: a conversion path must not depend on a
 * scroll observer firing.
 */
export function TrainingTools() {
  const { toolsEyebrow, toolsHeading, toolsDeck, toolsStartLabel, toolsOutcomeLabel } =
    trainingIntelligenceConfiguration;
  const tools = availableTools(fitnessTools);

  if (tools.length === 0) return null;

  return (
    <section
      id="training-tools"
      aria-labelledby="training-tools-heading"
      className="s05-surface s05-toolstrip relative overflow-hidden border-b border-(--border) py-14 scroll-mt-[calc(var(--header-h)+0.5rem)] sm:py-16"
    >
      <div className="s05-grain" aria-hidden="true" />

      <Container className="relative">
        <div className="s05-tools" data-count={tools.length}>
          <div className="s05-tools-top">
            <div className="s05-tools-head">
              <p className="s05-tools-eyebrow">{toolsEyebrow}</p>
              <h2 id="training-tools-heading" className="s05-tools-heading">
                {toolsHeading}
              </h2>
              <p className="s05-tools-deck">{toolsDeck}</p>
            </div>
            <ToolsRouteBanner indexes={tools.map((tool) => tool.index)} />
          </div>

          <ol className="s05-tools-list">
            {tools.map((tool, i) => (
              <li key={tool.id} className="s05-tool">
                <div className="s05-tool-visual">
                  <ToolVisual id={tool.id} />
                  {i === 0 && <span className="s05-tool-flag">{toolsStartLabel}</span>}
                </div>
                <div className="s05-tool-top">
                  <span className="s05-tool-index" aria-hidden="true">
                    {tool.index}
                  </span>
                  <span className="s05-tool-meta">{tool.meta}</span>
                </div>
                <h3 className="s05-tool-name">{tool.name}</h3>
                <p className="s05-tool-text">{tool.description}</p>
                {tool.outcome && (
                  <p className="s05-tool-outcome">
                    <span className="s05-tool-outcome-label">{toolsOutcomeLabel}</span>
                    {tool.outcome}
                  </p>
                )}
                <Button href={tool.href} variant="secondary" className="s05-tool-cta">
                  {tool.ctaLabel}
                  <span className="s05-tool-arrow" aria-hidden="true">
                    →
                  </span>
                </Button>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
