import { services } from "@/lib/services";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { ProgramIndex } from "@/components/sections/ProgramIndex";

/**
 * Section 02 — training-program index.
 *
 * Section 01 establishes the facility ("this is the floor"); Section 02
 * moves the narrative to how that floor is used, as a technical program
 * ledger rather than a photo+four-cards layout. A numbered, ruled index
 * (see ProgramIndex) carries the content; a single active preview panel on
 * desktop replaces one image per row.
 *
 * Background: a graphite surface (--surface) with a faint plate/rack
 * geometry watermark (.factory-programs-mark), breaking the run of flat
 * --bg-primary/--bg-secondary panels from Hero through Section 01 while
 * staying inside the existing dark athletic palette — no new color tokens.
 *
 * Source-First: only verified:true services render, in the data's own
 * order. Nothing here invents a program, count, or claim — the count
 * readout in ProgramIndex is `services.length`, always derived.
 */
export function Programs({ whatsappHref }: { whatsappHref: string }) {
  const verified = services.filter((s) => s.verified);
  if (verified.length === 0) return null;

  return (
    /*
     * overflow-CLIP, not overflow-hidden: `overflow: hidden` turns this
     * section into a scroll container, which silently disables the sticky
     * preview panel inside it (the panel scrolled away with the list).
     * `overflow: clip` clips the watermark exactly the same way WITHOUT
     * creating a scroll container, so position: sticky works again.
     */
    <section
      id="programs"
      aria-labelledby="programs-heading"
      className="factory-programs-surface relative overflow-clip border-b border-(--border) py-20 scroll-mt-[calc(var(--header-h)+0.5rem)] sm:py-24 lg:py-28"
    >
      <div className="factory-programs-mark" aria-hidden="true" />

      <Container className="relative">
        <Reveal>
          <div className="flex items-center gap-3">
            <span className="factory-index" aria-hidden="true">
              02
            </span>
            <span className="h-px w-8 bg-(--accent) sm:w-12" aria-hidden="true" />
            <span className="factory-eyebrow">Programs</span>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
          <Reveal className="lg:col-span-8">
            <h2
              id="programs-heading"
              className="factory-section-display text-(--text-primary)"
            >
              <span className="block">Training,</span>
              <span className="block text-(--accent)">not guesswork.</span>
            </h2>
          </Reveal>

          <Reveal delayMs={90} className="lg:col-span-4">
            <p className="max-w-sm text-[0.9375rem] leading-7 text-(--text-secondary) lg:text-right lg:ml-auto">
              Every training mode on the floor, indexed — pick the one that
              matches where you are right now.
            </p>
          </Reveal>
        </div>

        <Reveal delayMs={120}>
          <ProgramIndex programs={verified} whatsappHref={whatsappHref} />
        </Reveal>
      </Container>
    </section>
  );
}
