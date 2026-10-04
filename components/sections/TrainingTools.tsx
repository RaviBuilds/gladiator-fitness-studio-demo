import { fitnessTools } from "@/lib/fitness-tools";
import { trainingIntelligenceConfiguration } from "@/lib/training-intelligence";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { availableTools } from "@/components/sections/fitnessToolsLogic";

/**
 * TRAINING TOOLS strip — sits between Section 01 (About) and Section 02
 * (Programs).
 *
 * Previously the closing block of Section 05. Moved here so a visitor who has
 * just learned who the gym is meets the guided tools before the programme
 * list: "not sure where to start?" is answered at the point the question
 * naturally arises, rather than at the bottom of a long teaching chapter.
 *
 * It keeps Section 05's warm paper surface (the `.s05-surface` token reset) so
 * it reads as the same light interlude as before, and reuses the `.s05-tool*`
 * vocabulary. As a strip it is compact, and the three tools are presented as a
 * sequence — index, connector chevrons on desktop — because the registry is
 * ordered start -> journey -> first 30 days.
 *
 * Copy comes from lib/training-intelligence.ts (framing) and
 * lib/fitness-tools.ts (names, descriptions, routes). Only AVAILABLE tools
 * render; with none available the whole strip renders nothing, never an empty
 * heading. Server Component, not wrapped in Reveal: a conversion path must not
 * depend on a scroll observer firing.
 */
export function TrainingTools() {
  const { toolsEyebrow, toolsHeading, toolsDeck } = trainingIntelligenceConfiguration;
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
          <div className="s05-tools-head">
            <p className="s05-tools-eyebrow">{toolsEyebrow}</p>
            <h2 id="training-tools-heading" className="s05-tools-heading">
              {toolsHeading}
            </h2>
            <p className="s05-tools-deck">{toolsDeck}</p>
          </div>

          <ol className="s05-tools-list">
            {tools.map((tool) => (
              <li key={tool.id} className="s05-tool">
                <div className="s05-tool-top">
                  <span className="s05-tool-index" aria-hidden="true">
                    {tool.index}
                  </span>
                  <span className="s05-tool-meta">{tool.meta}</span>
                </div>
                <h3 className="s05-tool-name">{tool.name}</h3>
                <p className="s05-tool-text">{tool.description}</p>
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
