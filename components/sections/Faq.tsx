import Image from "next/image";
import { faq } from "@/lib/faq";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { FaqAccordion } from "@/components/motion/FaqAccordion";

/**
 * Section 09 — FAQ.
 *
 * Editorial two-column composition: left column has section heading, supporting
 * copy, and contact CTA; right column has the structured question register.
 * Background: one existing gym photograph with black overlay and subtle
 * technical graphics.
 *
 * PURE FRONTEND + SOURCE-FIRST. All FAQ content comes from lib/faq.ts. The
 * component renders whatever question count exists in the data file.
 */

const BACKGROUND_IMAGE = "/assets/gladiator-fitness-studio-madhapur-faq-background.jpg";

export function Faq() {
  if (faq.length === 0) return null;

  return (
    <section id="faq" className="relative bg-(--bg-secondary) py-24 sm:py-32 overflow-hidden">
      {/* Background photograph with overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={BACKGROUND_IMAGE}
          alt=""
          fill
          className="object-cover opacity-20"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Technical background graphics */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
        {/* Oversized Q/A text */}
        <div className="absolute top-12 right-[5%] font-mono text-[clamp(8rem,15vw,16rem)] font-bold text-(--border) opacity-30 select-none">
          Q/A
        </div>
        
        {/* Corner brackets */}
        <svg className="absolute top-8 left-8 w-12 h-12 stroke-current text-(--border) opacity-40" fill="none" strokeWidth="1">
          <path d="M0,12 L0,0 L12,0" />
        </svg>
        <svg className="absolute bottom-8 right-8 w-12 h-12 stroke-current text-(--border) opacity-40" fill="none" strokeWidth="1">
          <path d="M12,0 L12,12 L0,12" />
        </svg>

        {/* Registration crosses */}
        <svg className="absolute top-1/3 left-[15%] w-4 h-4 stroke-current text-(--brand-secondary) opacity-30" fill="none" strokeWidth="1">
          <path d="M2,0 L2,4 M0,2 L4,2" />
        </svg>
        <svg className="absolute bottom-1/4 right-[20%] w-4 h-4 stroke-current text-(--brand-secondary) opacity-30" fill="none" strokeWidth="1">
          <path d="M2,0 L2,4 M0,2 L4,2" />
        </svg>
      </div>

      <Container className="relative z-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left editorial column */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <span className="factory-eyebrow" aria-hidden="true">
                09
              </span>
              <span className="factory-eyebrow">FAQ</span>
            </div>
            
            <h2 className="mt-3 text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.05] tracking-tight text-(--text-primary)">
              COMMON QUESTIONS.
            </h2>
            
            <p className="mt-4 text-base leading-7 text-(--text-secondary)">
              Everything you need to know before you walk through the door.
            </p>

            {/* Contact CTA block */}
            <div className="mt-10 pt-8 border-t border-(--border)">
              <p className="factory-eyebrow text-(--text-secondary) mb-2">
                STILL HAVE A QUESTION?
              </p>
              <p className="text-sm text-(--text-secondary) mb-4">
                Talk to the gym directly.
              </p>
              <Button href="#contact" variant="secondary">
                Contact the gym →
              </Button>
            </div>
          </div>

          {/* Right question register */}
          <div className="lg:col-span-8">
            <FaqAccordion items={faq} />
          </div>
        </div>
      </Container>
    </section>
  );
}
