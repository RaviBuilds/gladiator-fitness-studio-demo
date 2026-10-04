import { formatWindowEnd, resolveOfferDiscounts } from "@/lib/offer-engine";
import type {
  OfferEngineConfiguration,
  PricingPlan,
  ResolvedOffer,
} from "@/lib/types";

/**
 * FESTIVAL & SEASONAL OFFER SIGNAL — the campaign module.
 *
 * A Server Component: zero client JavaScript, no hooks, no effects. It is
 * handed one already-selected ResolvedOffer and renders it. It does not know
 * how the selection was made, and — by design — contains no festival name, no
 * date, no percentage and no phase wording. Every visible string arrives as
 * data from lib/festival-offers.ts (see app/page.tsx for the wiring and
 * app/globals.css for the visual system).
 *
 * ---------------------------------------------------------------------------
 * ONE SHELL, THREE STATES
 * ---------------------------------------------------------------------------
 * The markup is byte-for-byte the same for an upcoming festival, a live
 * festival and a seasonal band. Only the DATA changes. There is no
 * per-festival styling and no per-festival branch — that is what makes this the
 * reusable campaign presentation rather than a series of one-off cards.
 *
 * The state chip shows ONE customer-facing availability word for all three
 * (resolved as `offer.stateLabel` in the engine), because every campaign the
 * selector returns is one a visitor can act on right now. The internal phase
 * still differs and is exposed as `data-offer-phase` for QA and analytics, but
 * nothing visible keys off it.
 *
 * VISUAL INTENT
 * It must read as a promotional module, not as the utility metadata card it
 * replaced: a full-width accent rule across the top, an accent spine down the
 * leading edge, an accent eyebrow, the campaign name as the dominant type, and
 * the discount ladder as the second-loudest thing on the card. Deliberately
 * absent: sale stickers, red graphics, oversized percent symbols, gradients,
 * countdowns and badges. The one looping cue is the "Live" chip: a slowly
 * beeping green dot and a softly glowing border, shared with the pricing
 * register's campaign marker (see "LIVE CHIP" in app/globals.css). The entrance
 * animation is the hero's existing stagger, and all motion respects
 * prefers-reduced-motion like everything else.
 *
 * PRICING BOUNDARY
 * The card renders a percentage against a plan's own label — never an amount,
 * never a "was/now" pair. Amounts belong to the pricing register, which shows
 * the regular price beside the offer price for exactly the same plans this card
 * lists (see components/sections/Membership.tsx). It reads one field per plan
 * via resolveOfferDiscounts(), so lib/pricing.ts stays the only source of
 * money and re-pricing the gym can never desync the two surfaces.
 *
 * ACCESSIBILITY
 * The whole card is ONE link, so there is one tab stop, one large pointer
 * target, and no nested interactive elements. Its accessible name is composed
 * from the same data the card shows, in reading order, so assistive tech gets a
 * spoken sentence rather than a run of punctuation and symbols. Focus uses the
 * shared .factory-focus ring. The separators and the arrow are aria-hidden.
 *
 * This file intentionally contains no campaign name, date or percentage
 * literal; scripts/festival-offers.test.mjs asserts that it stays that way.
 */
export function OfferSignal({
  offer,
  config,
  plans,
  ctaHref,
  className = "",
}: {
  offer: ResolvedOffer;
  config: OfferEngineConfiguration;
  /** The live pricing plans. Discount plan ids are resolved against these. */
  plans: readonly PricingPlan[];
  /** Resolved destination — an existing in-page anchor, never a new route. */
  ctaHref: string;
  className?: string;
}) {
  const discounts = resolveOfferDiscounts(
    offer.discounts,
    plans,
    config.maxDiscountPercentage
  );
  // Seasonal bands recur, so they have no meaningful calendar end date; the
  // line is simply omitted rather than faked.
  const endsOn =
    offer.type === "festival" ? formatWindowEnd(offer.end, config.locale) : null;
  const ctaLabel = offer.ctaLabel ?? config.defaultCtaLabel;

  const accessibleName = [
    offer.eyebrow,
    offer.stateLabel,
    offer.title,
    discounts.length > 0
      ? discounts
          .map((d) => `${d.percentage}% ${config.discountLabel} ${d.planLabel}`)
          .join(", ")
      : null,
    offer.description,
    endsOn ? `${config.endsLabel} ${endsOn}` : null,
    ctaLabel,
  ]
    .filter((part): part is string => typeof part === "string" && part.trim() !== "")
    // Authored copy may or may not end in a full stop; normalise so the spoken
    // name never contains ".." between clauses.
    .map((part) => part.trim().replace(/[.\s]+$/, ""))
    .join(". ");

  return (
    <a
      href={ctaHref}
      aria-label={accessibleName}
      // Exposes the selected state to browser QA and to any future analytics
      // without needing a second render path.
      data-offer-state={offer.stateKey}
      data-offer-phase={offer.phase}
      // Below md the docked card (capped at 26rem) is centred in the strip
      // rather than hugging the left edge on wider phones. md and up keep the
      // original placement: left at tablet, right-aligned from lg.
      className={`factory-offer-signal factory-focus pointer-events-auto mx-auto w-full max-w-[26rem] md:mx-0 lg:ml-auto lg:w-[17.25rem] lg:max-w-none ${className}`}
    >
      <span className="factory-offer-signal__head">
        <span className="factory-offer-signal__eyebrow">
          <span aria-hidden="true" className="factory-offer-signal__mark" />
          {offer.eyebrow}
        </span>
        {/* ONE micro-state chip, for every phase. The word is engine copy
            (live / upcoming / seasonal), resolved by the selector. */}
        <span className="factory-offer-signal__state">
          <span aria-hidden="true" className="factory-offer-signal__dot" />
          {offer.stateLabel}
        </span>
      </span>

      <span className="factory-offer-signal__title">{offer.title}</span>

      {discounts.length > 0 && (
        <>
          <span aria-hidden="true" className="factory-offer-signal__rule" />
          <span className="factory-offer-signal__terms">
            {discounts.map((discount) => (
              <span key={discount.planId} className="factory-offer-signal__term">
                <span className="factory-offer-signal__pct">{discount.percentage}%</span>
                <span className="factory-offer-signal__off">{config.discountLabel}</span>
                <span aria-hidden="true" className="factory-offer-signal__sep">
                  ·
                </span>
                <span className="factory-offer-signal__plan">{discount.planLabel}</span>
              </span>
            ))}
          </span>
        </>
      )}

      {/*
        The supporting sentence is deliberately NOT rendered. The specified card
        hierarchy is eyebrow / campaign name / discount ladder / ends / CTA, and
        holding to it is what keeps the module compact enough to sit over the
        hero without crowding the artwork at any viewport. The sentence is not
        lost: it is part of the link's accessible name above, so assistive tech
        still receives the full campaign description.
      */}

      <span className="factory-offer-signal__foot">
        {endsOn && (
          <span className="factory-offer-signal__meta">
            {config.endsLabel} {endsOn}
          </span>
        )}
        <span className="factory-offer-signal__cta">
          {ctaLabel}
          <svg
            aria-hidden="true"
            viewBox="0 0 10 8"
            fill="none"
            className="factory-offer-signal__arrow"
          >
            <path
              d="M0 4h8M5.5 1l3 3-3 3"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="square"
            />
          </svg>
        </span>
      </span>
    </a>
  );
}
