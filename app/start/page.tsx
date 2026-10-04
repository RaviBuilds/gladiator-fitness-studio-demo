import type { Metadata } from "next";
import { business } from "@/lib/business";
import { services } from "@/lib/services";
import { whyChooseUs } from "@/lib/why-choose-us";
import { aboutConfiguration } from "@/lib/about";
import { seo } from "@/lib/seo";
import { contactDirectory } from "@/lib/contact";
import { buildWhatsAppHref } from "@/lib/whatsapp";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { StartCheck } from "@/components/motion/StartCheck";

const PAGE_TITLE = `Find Your Starting Point | ${business.name}`;
const PAGE_DESCRIPTION = `Not sure where to start? Find a simple fitness starting point based on your goal, experience and training schedule at ${business.name}.`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${seo.canonical.replace(/\/$/, "")}/start` },
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
 * /start — "Find Your Starting Point".
 *
 * A standalone internal TOOL page. The quiz is the primary content and the
 * primary interaction, so the page is composed as a single-screen asymmetric
 * split (left brand/media, right interactive quiz card) rather than as an
 * editorial article with the quiz appended beneath it: the first question is
 * visible and answerable in the opening viewport without scrolling.
 *
 * It reuses the site's data and design system exactly as-is — the shared
 * Header/Footer, the WhatsApp action built from lib/business.ts, the existing
 * typography/token vocabulary — and ships client JS only for the interactive
 * instrument (StartCheck). The brand image is a real, existing facility
 * photograph (lib/about.ts's verified interior shot), not new or stock imagery.
 *
 * Source-First: the "why this gym fits your start" items are built here from
 * real verified data (verified services, the business hours array, one
 * whyChooseUs principle) — no claim is invented.
 */
export default function StartPage() {
  const whatsappHref = buildWhatsAppHref(business.whatsapp);
  const callHref = contactDirectory(business).find((e) => e.id === "phone")?.href;
  const verifiedServices = services.filter((s) => s.verified);

  // Factual gym-fit items only, derived from existing verified data.
  const gymFitItems: { title: string; description: string }[] = [];

  for (const service of verifiedServices.slice(0, 2)) {
    gymFitItems.push({ title: service.name, description: service.description });
  }

  if (business.hours.length > 0) {
    const first = business.hours[0];
    gymFitItems.push({
      title: "Flexible Training Hours",
      description: `Open ${first.open}–${first.close} most days — check hours for your preferred time.`,
    });
  }

  // One relevant, non-redundant principle (personal-training support).
  const ptSupport = whyChooseUs.find((w) => /personal training/i.test(w.title));
  if (ptSupport && gymFitItems.length < 4) {
    gymFitItems.push({ title: ptSupport.title, description: ptSupport.description });
  }

  const fitItems = gymFitItems.slice(0, 4);

  return (
    <div id="top">
      <Header whatsappHref={whatsappHref} />

      <main>
        <StartCheck
          whatsapp={business.whatsapp}
          gymName={business.name}
          membershipHref="/#membership"
          callHref={callHref}
          gymFitItems={fitItems}
          brandImage={aboutConfiguration.image}
          supportingText={`Answer five quick questions about your goal, experience and schedule, and we'll help you find a practical starting point for training at ${business.name}.`}
        />
      </main>

      <Footer />
    </div>
  );
}
