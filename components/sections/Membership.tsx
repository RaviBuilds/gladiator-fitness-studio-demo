import Image from "next/image";
import { offerEngine } from "@/lib/festival-offers";
import { formatWindowEnd, resolvePlanOffers } from "@/lib/offer-engine";
import { pricing } from "@/lib/pricing";
import type {
  PricingPlan,
  ResolvedOffer,
  ResolvedPlanOffer,
  SpecialTraining,
} from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Section 06 — PRICING / MEMBERSHIP REGISTER.
 *
 * The site's decision / conversion section, and it owns its own visual
 * identity (scoped `.s06-*` CSS in app/globals.css): a technical pricing
 * register — compact, ruled, editorially numbered cards over ONE atmospheric,
 * already-dark gym photograph, kept visibly present behind only a minimal
 * readability overlay. Prices, plans and CTAs still read first because of
 * contrast and layout, not because the photograph is buried.
 *
 * PURE FRONTEND + SOURCE-FIRST. Everything rendered here comes from
 * lib/pricing.ts — plan names, durations, prices, currency, descriptions, CTA
 * labels and price status. There is no CMS/API/database. The component
 * hardcodes no price and no label; it only formats and lays out the data. When
 * `pricing.enabled` is false, or no plan is publicly visible, the whole
 * section does not render (no empty register).
 *
 * PRICE STATUS is data-driven per entry:
 *   exact   -> the INR-formatted amount.
 *   contact -> the configurable `contactLabel` instead of an amount.
 *   hidden  -> the entry is filtered out and never rendered.
 *
 * ---------------------------------------------------------------------------
 * PROMOTIONAL PRICING — the other half of the offer engine
 * ---------------------------------------------------------------------------
 * When a campaign is running, the plans it references show their regular price
 * beside the offer price. The campaign is not selected here: app/page.tsx picks
 * ONE ResolvedOffer and hands the same object to the hero card and to this
 * section, so the promotion a visitor clicks in the hero is provably the
 * promotion they land on.
 *
 * lib/pricing.ts stays the ONLY source of money. Campaign data carries a planId
 * and a percentage and nothing else — no amount is duplicated anywhere — so
 * re-pricing a plan here automatically re-prices its promotion. The arithmetic
 * lives in resolveOfferPrice() (lib/offer-engine.ts) and is never repeated in
 * this file's JSX.
 *
 * Scope is deliberately narrow: ONLY referenced, publicly priced plans change.
 * Every other card renders exactly as it did before the campaign existed, and
 * a plan that is hidden, contact-only, unknown to pricing or referenced with a
 * malformed percentage is simply not promoted. There is no struck-through fake
 * MRP and no ecommerce treatment — a "Regular" label over the gym's own list
 * price, an "Offer" label over the accent price, and the percentage as quiet
 * mono metadata.
 *
 * Server Component: the register is static and every CTA is a link, so no
 * client-side JavaScript is required. Motion is the existing Reveal primitive
 * only, which already respects prefers-reduced-motion.
 */

/*
 * One existing gym photograph, used only as the atmospheric background. It is
 * decorative here (the section's meaning is the pricing register, not the
 * photo), so it is rendered with an empty alt and aria-hidden — it must not be
 * announced to assistive technology as content.
 */
const BACKGROUND_IMAGE = "/assets/gladiator-fitness-studio-madhapur-pricing-background.jpg";

function formatPrice(amount: number): string {
  return new Intl.NumberFormat(pricing.locale, {
    style: "currency",
    currency: pricing.currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * The price line for a card or the special row. Returns either the formatted
 * amount (exact) or the configurable contact label (contact). `hidden` entries
 * are filtered out before this is ever called, and an `exact` entry with no
 * numeric price safely degrades to the contact label rather than rendering a
 * broken amount.
 */
function PriceLine({
  entry,
  large = false,
}: {
  entry: PricingPlan | SpecialTraining;
  large?: boolean;
}) {
  const showExact = entry.priceStatus === "exact" && typeof entry.price === "number";

  if (showExact) {
    return (
      <span className={`s06-price ${large ? "s06-price-lg" : ""}`}>
        {formatPrice(entry.price as number)}
      </span>
    );
  }

  return (
    <span className="s06-price-contact">{pricing.contactLabel}</span>
  );
}

/**
 * The promotional price block, rendered instead of PriceLine for a plan the
 * active campaign references.
 *
 * Both amounts are read from the already-calculated ResolvedPlanOffer — this
 * component performs no arithmetic and formats with the same INR formatter as
 * every other price in the register, so a promoted price and a normal price can
 * never be formatted differently. Labels are engine copy, so the wording is
 * configurable without touching this file.
 *
 * The regular price is labelled, not struck through: it is the gym's real list
 * price, not a manufactured "was" figure.
 */
function PromoPriceLines({ promo }: { promo: ResolvedPlanOffer }) {
  return (
    <>
      <span className="s06-price-row">
        <span className="s06-price-tag">{offerEngine.regularPriceLabel}</span>
        <span className="s06-price-regular">{formatPrice(promo.basePrice)}</span>
      </span>
      <span className="s06-price-row">
        <span className="s06-price-tag s06-price-tag-offer">
          {offerEngine.offerPriceLabel}
        </span>
        <span className="s06-price s06-price-offer">{formatPrice(promo.offerPrice)}</span>
      </span>
    </>
  );
}

export function Membership({
  whatsappHref,
  offer = null,
}: {
  whatsappHref: string;
  /**
   * The page's single active campaign, or null. Selected in app/page.tsx and
   * shared with the hero card so both surfaces show the same promotion.
   */
  offer?: ResolvedOffer | null;
}) {
  if (!pricing.enabled) return null;

  // "hidden" entries never render publicly.
  const visiblePlans = pricing.plans.filter((p) => p.priceStatus !== "hidden");
  const special =
    pricing.special && pricing.special.priceStatus !== "hidden"
      ? pricing.special
      : undefined;

  // Nothing to show at all -> do not render an empty register.
  if (visiblePlans.length === 0 && !special) return null;

  /*
   * Which plans the active campaign promotes, and at what prices. Empty for a
   * null campaign, for a campaign referencing no usable plan, and for every
   * plan the campaign does not mention — so "no promotion" needs no branch
   * anywhere below, it is just an empty map.
   */
  const planOffers = resolvePlanOffers(offer, pricing.plans, offerEngine);
  const isPromoting = planOffers.size > 0;
  // Seasonal bands recur and have no calendar end date; the line is omitted
  // rather than faked, exactly as on the hero card.
  const campaignEndsOn =
    offer && offer.type === "festival"
      ? formatWindowEnd(offer.end, offerEngine.locale)
      : null;

  return (
    <section
      id="membership"
      aria-labelledby="membership-heading"
      className="s06-surface relative overflow-hidden border-y border-(--border) py-20 scroll-mt-[calc(var(--header-h)+0.5rem)] sm:py-24 lg:py-28"
    >
      {/* Atmospheric background photograph — deliberately secondary. */}
      <div className="s06-photo" aria-hidden="true">
        <Image
          src={BACKGROUND_IMAGE}
          alt=""
          fill
          aria-hidden="true"
          loading="lazy"
          sizes="100vw"
          className="s06-photo-img"
        />
      </div>
      <div className="s06-scrim" aria-hidden="true" />
      <div className="s06-grain" aria-hidden="true" />

      <Container className="relative">
        <Reveal>
          <div className="s06-chapter-mark">
            <span className="s06-chapter-index" aria-hidden="true">
              {pricing.index}
            </span>
            <span className="s06-chapter-rule" aria-hidden="true" />
            <span className="s06-chapter-eyebrow">{pricing.eyebrow}</span>
          </div>
        </Reveal>

        <div className="s06-head">
          <Reveal>
            <h2 id="membership-heading" className="s06-display">
              {pricing.headlineLines.map((line, i) => {
                const isAccent =
                  pricing.accentLastLine === true &&
                  i === pricing.headlineLines.length - 1;
                return (
                  <span
                    key={line}
                    className="s06-display-line"
                    data-accent={isAccent ? "true" : undefined}
                  >
                    {line}
                  </span>
                );
              })}
            </h2>
          </Reveal>

          {pricing.deck && (
            <Reveal delayMs={90}>
              <p className="s06-deck">{pricing.deck}</p>
            </Reveal>
          )}
        </div>

        {/*
          Campaign marker: one restrained line naming the promotion whose prices
          are shown below. It exists so a visitor arriving from the hero's "view
          offer" link can see they landed on the same campaign, and it renders
          only when at least one plan is actually promoted — never as a header
          for a promotion with no prices behind it.
        */}
        {offer && isPromoting && (
          <Reveal delayMs={110}>
            <div className="s06-campaign" data-offer-state={offer.stateKey}>
              <span aria-hidden="true" className="s06-campaign-mark" />
              <span className="s06-campaign-eyebrow">{offer.eyebrow}</span>
              <span className="s06-campaign-title">{offer.title}</span>
              <span className="s06-campaign-state">{offer.stateLabel}</span>
              {campaignEndsOn && (
                <span className="s06-campaign-meta">
                  {offerEngine.endsLabel} {campaignEndsOn}
                </span>
              )}
            </div>
          </Reveal>
        )}

        {/* The register: six compact plan cards. */}
        {visiblePlans.length > 0 && (
          <Reveal delayMs={120}>
            <ul className="s06-register" role="list">
              {visiblePlans.map((plan, i) => {
                const promo = planOffers.get(plan.id);
                return (
                  <li
                    key={plan.id}
                    className="s06-card"
                    // Drives the accent top rule. Absent on every plan the
                    // campaign does not reference, which is what keeps those
                    // cards identical to their pre-campaign rendering.
                    data-promoted={promo ? "true" : undefined}
                  >
                    <span className="s06-card-index" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <div className="s06-card-body">
                      <h3 className="s06-card-name">{plan.name}</h3>
                      <p className="s06-card-price">
                        {promo ? (
                          <PromoPriceLines promo={promo} />
                        ) : (
                          <PriceLine entry={plan} />
                        )}
                      </p>
                      {promo ? (
                        <p className="s06-card-promo-note">
                          {promo.percentage}% {offerEngine.discountLabel}
                          <span aria-hidden="true" className="s06-promo-sep">
                            ·
                          </span>
                          {offer?.eyebrow}
                        </p>
                      ) : (
                        <p className="s06-card-term">{plan.term}</p>
                      )}
                    </div>

                    <Button
                      href={whatsappHref}
                      variant="ghost"
                      className="s06-card-cta"
                      aria-label={`${plan.ctaLabel} about the ${plan.name} plan`}
                    >
                      {plan.ctaLabel}
                      <span aria-hidden="true"> →</span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        )}

        {/* Special training — a distinct wide editorial row, not a giant card. */}
        {special && (
          <Reveal delayMs={160}>
            <div className="s06-special">
              <div className="s06-special-label-row">
                <span className="s06-special-label">{pricing.specialLabel}</span>
                <span className="s06-special-rule" aria-hidden="true" />
              </div>

              <div className="s06-special-body">
                <div className="s06-special-main">
                  <h3 className="s06-special-name">{special.name}</h3>
                  <p className="s06-special-desc">{special.description}</p>
                </div>

                <div className="s06-special-meta">
                  <p className="s06-special-price">
                    <PriceLine entry={special} large />
                    <span className="s06-special-term">
                      {special.duration} · {special.term}
                    </span>
                  </p>
                  {/*
                    The ONLY brand-accent CTA in the register. Personal Coaching
                    is the special training offering rather than one of the six
                    term-length plans, so it carries the filled accent treatment
                    (`primary`: accent background, accent-foreground text) while
                    every ordinary plan CTA stays `ghost`. Making them all filled
                    would flatten that distinction. Destination is unchanged —
                    the same site-wide WhatsApp enquiry action, no new route.
                  */}
                  <Button
                    href={whatsappHref}
                    variant="primary"
                    className="s06-special-cta"
                    aria-label={`${special.ctaLabel} about ${special.name}`}
                  >
                    {special.ctaLabel}
                    <span aria-hidden="true"> →</span>
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        )}
      </Container>
    </section>
  );
}
