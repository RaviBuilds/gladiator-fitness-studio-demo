import type { Metadata } from "next";
import { business } from "@/lib/business";
import { services } from "@/lib/services";
import { seo } from "@/lib/seo";
import { contactDirectory } from "@/lib/contact";
import { journeyConfiguration } from "@/lib/journey";
import { buildWhatsAppHref } from "@/lib/whatsapp";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { FitnessJourney } from "@/components/motion/FitnessJourney";

const PAGE_TITLE = `Fitness Journey | ${business.name}`;
const PAGE_DESCRIPTION = `Explore a practical fitness roadmap based on your goal, starting point and realistic weekly commitment at ${business.name}.`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${seo.canonical.replace(/\/$/, "")}/journey` },
  robots: seo.robots,
  openGraph: seo.ogImage
    ? {
        title: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        images: [seo.ogImage],
      }
    : undefined,
};

/**
 * /journey — "Fitness Journey".
 *
 * The site's second interactive tool. Where /start answers "where should I
 * start?", this one answers "what could my path look like from here?": three
 * questions, then an explorable roadmap drawn as a measuring rule (phases,
 * checkpoints, a 3/6/12-month horizon switch), the current focus, the next
 * behavioural milestone, an example week and one contextual WhatsApp action.
 *
 * Composition mirrors /start's proven first-viewport lesson (real image + H1
 * on the left, the interactive instrument on the right) but with its own
 * visual vocabulary, so the two read as related tools rather than clones.
 *
 * Source-First / reuse: every gym fact is passed in from lib/*.ts — the name
 * and WhatsApp config from lib/business.ts, VERIFIED services only from
 * lib/services.ts, the call link from lib/contact.ts and the page campaign
 * image (src, alt, crop) from lib/journey.ts. The client component and its logic module
 * (components/sections/fitnessJourneyLogic.ts) contain no gym-specific value.
 */
export default function JourneyPage() {
  const whatsappHref = buildWhatsAppHref(business.whatsapp);
  const callHref = contactDirectory(business).find((e) => e.id === "phone")?.href;
  const verifiedServices = services
    .filter((s) => s.verified)
    .map(({ id, name, description, verified }) => ({ id, name, description, verified }));

  return (
    <div id="top">
      <Header whatsappHref={whatsappHref} />

      <main>
        <FitnessJourney
          whatsapp={business.whatsapp}
          gymName={business.name}
          membershipHref="/#membership"
          callHref={callHref}
          services={verifiedServices}
          image={journeyConfiguration.image}
          startHref="/start"
          supportingText={`Explore a practical training roadmap based on your goal, starting point and realistic weekly commitment at ${business.name}.`}
        />
      </main>

      <Footer />
    </div>
  );
}
