import { googleReviews } from "@/lib/reviews";
import { business } from "@/lib/business";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { RatingStars } from "@/components/ui/RatingStars";
import { Reveal } from "@/components/motion/Reveal";
import { ReviewSignal } from "@/components/motion/ReviewSignal";
import { buildRatingAccessibleName } from "./reviewSignal";

/**
 * Section 06 — MEMBER SIGNAL.
 *
 * A Google-review wall, not a rating chip plus three equal cards. The
 * composition is a single asymmetric instrument: an oversized rating dial
 * anchors the left column, one review is promoted to an enlarged Google-
 * native review card, and every other configured review renders as its own
 * Google-native card in a staggered field the visitor can tap to promote in
 * turn. The chapter surface stays the dark athletic-editorial field (warm
 * near-black + one faint oversized rating-dial ring) — Google identity
 * (light card surface, neutral text, Google-yellow stars, "Google"
 * attribution) lives INSIDE each card; gym identity (numerals, eyebrow,
 * accent, dark field) stays OUTSIDE it, so the dark-gym / light-Google-card
 * contrast itself becomes the section's visual signature, deliberately
 * distinct from Sections 01-05.
 *
 * Deliberately NOT Section 01-05's grammar:
 *   - no sticky image + scrolling copy column (Section 01);
 *   - no ruled option list with a swapping side preview (Section 02);
 *   - no centred subject with perimeter annotations on a blueprint grid
 *     (Section 03);
 *   - no case-file evidence sheet with a media plate (Section 04);
 *   - no goal-selector instrument with an emphasis stack (Section 05).
 *
 * Source-First: rating, review count, tagline, every review's name/text/
 * rating and the Google Business Profile URL are `lib/reviews.ts` verbatim.
 * Reviewer avatars are never fabricated portraits — see getInitials in
 * ./reviewSignal.ts. The section renders null when there is no rating or no
 * reviews — never a placeholder "no reviews yet" state. See buildSignalSet
 * for how it adapts to 1, 3, 5 or more configured reviews with no code
 * changes.
 *
 * Server Component. The single client island is ReviewSignal (which review
 * is currently featured); the rating instrument, chapter chrome and CTA row
 * are static. Entrance motion is the existing Reveal primitive plus CSS
 * (see the "Pass 10" block in app/globals.css) — no animation library.
 */
export function Reviews() {
  if (googleReviews.reviewCount === 0 || googleReviews.reviews.length === 0) return null;

  const { rating, reviewCount, tagline, googleBusinessProfileUrl, reviews } = googleReviews;
  const profileUrl = googleBusinessProfileUrl.trim();
  const ratingLabel = rating.toFixed(1);
  const ratingAccessibleName = buildRatingAccessibleName(rating, reviewCount);
  const whatsappHref = `https://wa.me/${business.whatsapp.number.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
    business.whatsapp.message
  )}`;

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="factory-signal-surface relative overflow-hidden border-b border-(--border) py-20 scroll-mt-[calc(var(--header-h)+0.5rem)] sm:py-24 lg:py-28"
    >
      {/* Chapter surface: warm near-black spotlight field + one oversized,
          faint rating-dial ring. Decorative, aria-hidden, static. */}
      <div className="factory-signal-field" aria-hidden="true" />

      <Container className="relative">
        <Reveal>
          <div className="flex items-center gap-3">
            <span className="factory-index" aria-hidden="true">
              06
            </span>
            <span className="h-px w-8 bg-(--accent) sm:w-12" aria-hidden="true" />
            <span className="factory-eyebrow">Reviews</span>
          </div>

          <h2 id="reviews-heading" className="factory-signal-heading mt-5 sm:mt-6">
            <span className="block">Do real people</span>
            <span className="block text-(--accent)">trust this gym?</span>
          </h2>
        </Reveal>

        <div className="factory-signal-grid">
          {/* Rating instrument — editorial, not a SaaS stat card. */}
          <Reveal delayMs={80} className="factory-signal-dial-cell">
            <div
              className="factory-signal-dial"
              role="img"
              aria-label={ratingAccessibleName}
            >
              <span className="factory-signal-dial-number" aria-hidden="true">
                {ratingLabel}
              </span>
              <span aria-hidden="true">
                <RatingStars rating={rating} />
              </span>
              <span className="factory-signal-dial-count" aria-hidden="true">
                {reviewCount.toLocaleString()} member reviews
              </span>
              <span className="factory-signal-dial-source" aria-hidden="true">
                Google
              </span>
            </div>

            {tagline && <p className="factory-signal-tagline">{tagline}</p>}

            <div className="factory-signal-cta">
              <Button href={profileUrl || googleBusinessProfileUrl} variant="secondary">
                Read all reviews on Google
              </Button>
              <Button href={whatsappHref} variant="ghost">
                Talk to the gym
              </Button>
            </div>
          </Reveal>

          {/* Featured review card + supporting Google-native card field —
              the single client island, everything else on the page is
              static. */}
          <Reveal delayMs={140} className="factory-signal-signal-cell">
            <ReviewSignal reviews={reviews} />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
