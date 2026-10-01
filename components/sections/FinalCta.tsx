import { business } from "@/lib/business";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Section 12 — Ready When You Are / Final CTA.
 *
 * The emotional + conversion conclusion of the page: a compact, strongly
 * centred editorial close rather than another content block. A very faint
 * oversized weight-plate contour and technical registration marks give it more
 * atmosphere than plain black while staying subordinate to the headline.
 *
 * SOURCE-FIRST: the headline is business.tagline, the WhatsApp deep link is
 * passed in, and the phone comes from business.phone. The CALL action only
 * renders when a phone number exists — no fabricated number is written here.
 * Reuses existing business/WhatsApp data only; no new lib file.
 */
export function FinalCta({ whatsappHref }: { whatsappHref: string }) {
  const phone = business.phone?.trim();

  return (
    <section className="factory-finalcta relative overflow-hidden border-y border-(--border) bg-(--bg-primary) py-24 sm:py-28">
      {/* Subtle atmosphere: oversized plate contour + registration marks. */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <span className="factory-finalcta-calibration" />

        <svg
          className="factory-finalcta-plate"
          viewBox="0 0 200 200"
          fill="none"
          strokeWidth="1"
        >
          <circle cx="100" cy="100" r="99" />
          <circle cx="100" cy="100" r="70" />
          <circle cx="100" cy="100" r="26" />
        </svg>

        <svg
          className="absolute left-8 top-8 h-12 w-12 stroke-current text-(--border) opacity-30"
          fill="none"
          strokeWidth="1"
        >
          <path d="M0,12 L0,0 L12,0" />
        </svg>
        <svg
          className="absolute bottom-8 right-8 h-12 w-12 stroke-current text-(--border) opacity-30"
          fill="none"
          strokeWidth="1"
        >
          <path d="M12,0 L12,12 L0,12" />
        </svg>
      </div>

      <Container className="relative z-10">
        <Reveal>
          <div className="flex flex-col items-center text-center">
            <span className="factory-eyebrow">12 — Ready when you are</span>

            <h2 className="factory-finalcta-headline mt-5 max-w-3xl text-[clamp(2.25rem,6vw,4.5rem)] font-semibold leading-[1.02] tracking-tight text-(--text-primary)">
              {business.tagline}
            </h2>

            <p className="mt-6 max-w-xl text-base leading-7 text-(--text-secondary)">
              Message us on WhatsApp and we&apos;ll walk you through programs, pricing, and what
              a first session looks like.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button href={whatsappHref} variant="primary" className="w-full sm:w-auto">
                Chat on WhatsApp
                <span aria-hidden="true">→</span>
              </Button>
              {phone && (
                <Button href={`tel:${phone}`} variant="secondary" className="w-full sm:w-auto">
                  Call
                  <span aria-hidden="true">→</span>
                </Button>
              )}
            </div>

            {/* Understated technical closing detail. */}
            <p className="factory-finalcta-detail">Programs · Pricing · First session</p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
