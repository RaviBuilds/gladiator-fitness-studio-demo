import { heroConfiguration } from "@/lib/hero";
import { googleReviews } from "@/lib/reviews";
import { business } from "@/lib/business";
import { offerEngine } from "@/lib/festival-offers";
import { pricing } from "@/lib/pricing";
import { sections } from "@/lib/sections";
import { services } from "@/lib/services";
import { fitnessTools } from "@/lib/fitness-tools";
import type { ResolvedOffer } from "@/lib/types";
import { HeroSlider } from "@/components/motion/HeroSlider";
import { OfferSignal } from "@/components/ui/OfferSignal";
import { resolveHeroSlides } from "@/components/sections/fitnessToolsLogic";

/**
 * Server wrapper around the client HeroSlider. Keeps data access in a
 * Server Component; only the interactive slider itself ships JS.
 *
 * The floating trust motif is derived from existing verified review data
 * rather than a hardcoded number, and is omitted entirely (not zeroed out)
 * when no verified rating/review count exists. The locality caption reads
 * from the existing business address data. Neither introduces a new data
 * requirement — both are optional, generic, data-driven reads.
 *
 * ---------------------------------------------------------------------------
 * FESTIVAL & SEASONAL OFFER ENGINE — hero utility slot
 * ---------------------------------------------------------------------------
 * The hero's top-right utility card is now the campaign signal. The verified-
 * review motif that previously occupied that slot steps aside while a campaign
 * is running and returns automatically if the engine is switched off or the
 * calendar runs dry, so the slot always carries exactly one signal and the
 * hero never has a hole in it.
 *
 * WHY THE CARD LIVES HERE AND NOT INSIDE HeroSlider
 * HeroSlider.tsx is frozen and is not modified by this feature at all. The
 * wrapper below is the entire integration:
 *
 *   >= 1024px  the utility row is absolutely positioned over the hero's
 *              top-right, resolving to the same content spine
 *              (--container-pad) and the same y offset
 *              (--header-h + 1.375rem) as the hero's own metadata row.
 *   <  1024px  the hero has no utility row — its metadata row is
 *              `hidden lg:block` by design — so the row docks immediately
 *              beneath the hero instead of being injected into the hero's
 *              copy column.
 *
 * That distinction matters: the hero derives its composition zone (athlete
 * scale, oversized type placement) by MEASURING the copy block's offset. Flow
 * content added below the copy on a 375px screen pushed that measurement past
 * its clamp and visibly shrank the athlete. Docking the row outside the
 * <section> means the hero's measured geometry is untouched at every viewport.
 *
 * OTHER CONSEQUENCES WORTH KNOWING
 *   - The 2026-2028 calendar never reaches the client bundle: the card is a
 *     Server Component and only the one selected card's markup is sent.
 *   - The campaign is NOT selected here. app/page.tsx evaluates it once and
 *     passes the same ResolvedOffer to this hero and to the pricing register,
 *     which is what guarantees "the card in the hero and the promoted prices
 *     in Membership are the same campaign" — two independent `new Date()`
 *     reads could otherwise straddle midnight and disagree.
 *   - The CTA reuses the existing membership anchor and degrades to the
 *     site-wide WhatsApp action if that section is switched off, so the card
 *     can never link to a section that is not on the page.
 */
export function Hero({
  whatsappHref,
  offer = null,
}: {
  whatsappHref: string;
  /** The page's single active campaign, or null when nothing is running. */
  offer?: ResolvedOffer | null;
}) {
  const activeOffer = offer;

  const offerCtaHref =
    sections.membership && pricing.enabled ? offerEngine.ctaHref : whatsappHref;

  const hasVerifiedReviews = googleReviews.reviewCount > 0 && googleReviews.rating > 0;
  const motif =
    !activeOffer && hasVerifiedReviews
      ? { value: String(googleReviews.reviewCount), label: "Verified member reviews" }
      : undefined;
  const locality = business.address.locality || business.address.city || undefined;

  // Data-driven hero CTAs. Each slide's `cta` sources (lib/hero.ts) are
  // resolved here, on the server, against the interactive-tool registry, so
  // HeroSlider only ever receives concrete label/href pairs. Section anchors
  // count as available only when that section actually renders, so a
  // fallback can never target an anchor that is not on the page.
  const availableAnchors = [
    sections.programs && services.some((s) => s.verified) ? "programs" : null,
    sections.membership && pricing.enabled ? "membership" : null,
  ].filter((id): id is string => id !== null);
  const slides = resolveHeroSlides(heroConfiguration.slides, fitnessTools, {
    whatsappHref,
    availableAnchors,
  });

  return (
    // data-floating-contact-hero: FloatingContact hides the WhatsApp/Call
    // actions while this element is in the viewport.
    <div className="relative" data-floating-contact-hero>
      <HeroSlider
        slides={slides}
        whatsappHref={whatsappHref}
        motif={motif}
        locality={locality}
      />

      {activeOffer && (
        // The utility row. Absolute (and pointer-transparent) over the hero
        // from 1024px up; a docked strip below the hero under that. Only the
        // card itself takes pointer events, so the row can never swallow a
        // click on the header, the hero CTAs or the slide controls.
        <div className="factory-container pb-6 pt-5 sm:pb-7 sm:pt-6 lg:pointer-events-none lg:absolute lg:inset-x-0 lg:top-[calc(var(--header-h)+1.375rem)] lg:z-40 lg:py-0">
          <OfferSignal
            offer={activeOffer}
            config={offerEngine}
            plans={pricing.plans}
            ctaHref={offerCtaHref}
          />
        </div>
      )}
    </div>
  );
}
