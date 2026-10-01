import Image from "next/image";
import { business } from "@/lib/business";
import { contact, contactDirectory } from "@/lib/contact";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { ContactForm } from "@/components/motion/ContactForm";

/**
 * Section 10 — Contact / Inquiry.
 *
 * Asymmetric editorial composition on the site grid: a 5-column contact
 * register on the left (heading, direct channels, WhatsApp-first CTA, form
 * metadata) against a 7-column inquiry plate on the right. Background is one
 * existing gym photograph held at low opacity under a black wash plus the
 * factory's technical marks, so the section is never visually empty and never
 * competes with the form.
 *
 * SOURCE-FIRST: all copy comes from lib/contact.ts; every business fact
 * resolves from lib/business.ts through contactDirectory(). No phone number,
 * address or WhatsApp link is written into this file.
 */
export function Contact({ whatsappHref }: { whatsappHref: string }) {
  const directory = contactDirectory(business);

  return (
    <section
      id="contact"
      className="factory-contact relative overflow-hidden bg-(--bg-primary) py-20 sm:py-28 lg:py-32"
    >
      {/* Background photograph: existing asset, low opacity, black wash. */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <Image
          src={contact.background.src}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center opacity-[0.12]"
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="factory-contact-veil" />
      </div>

      {/* Technical marks: oversized numeral, brackets, crosses, calibration. */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <span className="factory-contact-numeral">{contact.background.numeral}</span>
        <span className="factory-contact-edge">{contact.background.edgeLabel}</span>

        <svg
          className="absolute top-8 left-8 h-12 w-12 stroke-current text-(--border) opacity-40"
          fill="none"
          strokeWidth="1"
        >
          <path d="M0,12 L0,0 L12,0" />
        </svg>
        <svg
          className="absolute bottom-8 right-8 h-12 w-12 stroke-current text-(--border) opacity-40"
          fill="none"
          strokeWidth="1"
        >
          <path d="M12,0 L12,12 L0,12" />
        </svg>
        <svg
          className="absolute top-1/4 right-[8%] h-4 w-4 stroke-current text-(--accent) opacity-30"
          fill="none"
          strokeWidth="1"
        >
          <path d="M2,0 L2,4 M0,2 L4,2" />
        </svg>
        <svg
          className="absolute bottom-1/3 left-[6%] h-4 w-4 stroke-current text-(--accent) opacity-25"
          fill="none"
          strokeWidth="1"
        >
          <path d="M2,0 L2,4 M0,2 L4,2" />
        </svg>

        <span className="factory-contact-calibration" />
      </div>

      <Container className="relative z-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-16 lg:gap-y-0">
          {/* Contact register */}
          <Reveal className="lg:col-span-5">
            <div className="factory-contact-heading">
              <SectionHeading
                eyebrow={contact.eyebrow}
                index={contact.index}
                title={contact.headline}
              />
            </div>

            <p className="mt-5 max-w-md text-base leading-7 text-(--text-secondary)">
              {contact.supporting}
            </p>

            <dl className="factory-contact-directory">
              {directory.map((entry) => (
                <div key={entry.id} className="factory-contact-directory-row">
                  <dt className="factory-contact-directory-label">{entry.label}</dt>
                  <dd className="factory-contact-directory-value">
                    {entry.href ? (
                      <a href={entry.href} className="factory-contact-link factory-focus">
                        {entry.value}
                      </a>
                    ) : (
                      <span>{entry.value}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            {/*
              Placeholder business data is labelled, never presented as a
              verified fact. Disappears once lib/business.ts holds real details
              and lib/contact.ts sets dataVerified: true.
            */}
            {!contact.dataVerified && (
              <p className="factory-contact-unverified">{contact.directory.unverifiedNotice}</p>
            )}

            <Button href={whatsappHref} variant="primary" className="mt-8 w-full sm:w-auto">
              {contact.primaryCtaLabel}
              <span aria-hidden="true">→</span>
            </Button>

            <dl className="factory-contact-meta">
              {contact.meta.map((item) => (
                <div key={item.label} className="factory-contact-meta-item">
                  <dt className="factory-contact-meta-label">{item.label}</dt>
                  <dd className="factory-contact-meta-value">{item.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          {/* Inquiry plate */}
          <Reveal className="lg:col-span-7" delayMs={120}>
            <ContactForm />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
