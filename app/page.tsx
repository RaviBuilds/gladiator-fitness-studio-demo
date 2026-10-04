import { business } from "@/lib/business";
import { offerEngine } from "@/lib/festival-offers";
import { getActiveOffer } from "@/lib/offer-engine";
import { sections } from "@/lib/sections";
import { buildWhatsAppHref } from "@/lib/whatsapp";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { KineticStrip } from "@/components/sections/KineticStrip";
import { Trust } from "@/components/sections/Trust";
import { About } from "@/components/sections/About";
import { TrainingTools } from "@/components/sections/TrainingTools";
import { Programs } from "@/components/sections/Programs";
import { WhyChooseUs } from "@/components/sections/WhyChooseUs";
import { Transformations } from "@/components/sections/Transformations";
import { TrainingIntelligence } from "@/components/sections/TrainingIntelligence";
import { Reviews } from "@/components/sections/Reviews";
import { BetweenSessions } from "@/components/sections/BetweenSessions";
import { Membership } from "@/components/sections/Membership";
import { Gallery } from "@/components/sections/Gallery";
import { Instagram } from "@/components/sections/Instagram";
import { Faq } from "@/components/sections/Faq";
import { Contact } from "@/components/sections/Contact";
import { Location } from "@/components/sections/Location";
import { FinalCta } from "@/components/sections/FinalCta";
import { Footer } from "@/components/sections/Footer";
import { FloatingContact } from "@/components/sections/FloatingContact";
import { ContactDialog } from "@/components/motion/ContactDialog";
import { transformations } from "@/lib/transformations";

/**
 * Runtime revalidation window, in seconds.
 *
 * The Festival & Seasonal Offer Engine decides which campaign is current from
 * the `new Date()` read below. Without this export the homepage would be
 * rendered once at build time and the campaign state would be frozen into the
 * build output — a site deployed in October would still be advertising the
 * October campaign in December.
 *
 * With it, the page is regenerated on demand at most once an hour, which is
 * well inside the day-level granularity every campaign window uses: a window
 * that opens at 00:00 IST is live within the hour, with no deploy and no
 * developer action. The rest of the page stays statically rendered, so this
 * costs nothing in client JavaScript or hydration work, and the whole app is
 * deliberately NOT switched to force-dynamic for a day-granularity feature.
 *
 * Need exact-instant accuracy instead of hourly? Replace this with
 * `export const dynamic = "force-dynamic";` — the engine itself is unchanged,
 * because it reads the instant it is handed.
 */
export const revalidate = 3600;

export default function Home() {
  const whatsappHref = buildWhatsAppHref(business.whatsapp);
  const consentVerifiedTransformation = transformations.find((t) => t.consentVerified);

  /*
   * ONE campaign evaluation for the whole page.
   *
   * The hero card and the pricing register must show the same promotion — that
   * is the feature's central acceptance criterion — so the selector runs once
   * here and the result is handed to both. Evaluating it inside each section
   * would work almost always and then, once a year, render a hero advertising
   * one campaign above prices discounted by another, because two `new Date()`
   * reads can land either side of midnight in the configured timezone.
   *
   * `null` is a normal result: it means nothing is running, and both surfaces
   * fall back to their non-promotional state.
   */
  const activeOffer = getActiveOffer(new Date(), offerEngine);

  return (
    <div id="top">
      <Header whatsappHref={whatsappHref} />

      <main>
        <Hero whatsappHref={whatsappHref} offer={activeOffer} />
        <KineticStrip />
        {sections.trust && <Trust />}
        {sections.about && <About />}
        <TrainingTools />
        {sections.programs && <Programs whatsappHref={whatsappHref} />}
        {sections.whyChooseUs && <WhyChooseUs />}
        {sections.transformations && <Transformations />}
        {sections.trainingIntelligence && (
          <TrainingIntelligence whatsappHref={whatsappHref} />
        )}
        {sections.reviews && <Reviews />}
        {sections.betweenSessions && (
          <BetweenSessions whatsappHref={whatsappHref} />
        )}
        {sections.membership && (
          <Membership whatsappHref={whatsappHref} offer={activeOffer} />
        )}
        {sections.gallery && <Gallery />}
        {sections.instagram && <Instagram />}
        {sections.faq && <Faq />}
        {sections.contact && <Contact whatsappHref={whatsappHref} />}
        {sections.location && <Location />}
        <FinalCta whatsappHref={whatsappHref} />
      </main>

      <Footer />

      <FloatingContact
        whatsappHref={whatsappHref}
        phoneHref={business.phone ? `tel:${business.phone}` : undefined}
      />
      <ContactDialog
        whatsappHref={whatsappHref}
        image={consentVerifiedTransformation?.image}
        imageAlt={
          consentVerifiedTransformation
            ? `${consentVerifiedTransformation.personName ?? "Member"} transformation photo`
            : undefined
        }
      />
    </div>
  );
}

