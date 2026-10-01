import { business } from "@/lib/business";
import { googleReviews } from "@/lib/reviews";
import { RatingStars } from "@/components/ui/RatingStars";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Premium editorial trust rail — a quiet credibility beat directly between
 * the kinetic identity strip and Section 01. Deliberately compact: this is
 * NOT the full Reviews section (see components/sections/Reviews.tsx), it
 * never duplicates review content, and it only ever renders verified fields
 * from lib/reviews.ts / lib/business.ts. No fabricated ratings, counts,
 * hours, or locality — a field that isn't populated simply doesn't render.
 */
export function Trust() {
  const hasReviews = googleReviews.reviewCount > 0 && googleReviews.rating > 0;
  const locality = business.address.locality || business.address.city;
  const profileUrl = googleReviews.googleBusinessProfileUrl.trim();

  if (!hasReviews && !locality) return null;

  const ratingLabel = googleReviews.rating.toFixed(1);
  const googleAccessibleName = `Rated ${ratingLabel} out of 5 from ${googleReviews.reviewCount} Google reviews. Read reviews on Google.`;

  const googleSignal = hasReviews && (
    <div className="flex items-center gap-3 sm:gap-4">
      <span className="factory-trust-label" aria-hidden="true">
        Google
      </span>
      <span className="hidden h-4 w-px bg-(--border) sm:inline-block" aria-hidden="true" />
      <RatingStars rating={googleReviews.rating} />
      <span className="factory-trust-rating" aria-hidden="true">
        {ratingLabel}
      </span>
      <span className="factory-trust-count" aria-hidden="true">
        {googleReviews.reviewCount} Google reviews
      </span>
    </div>
  );

  return (
    <section className="border-b border-(--border) bg-(--bg-primary)">
      <Container>
        <Reveal>
          <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:py-6">
            {hasReviews &&
              (profileUrl ? (
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={googleAccessibleName}
                  className="factory-focus inline-flex w-fit items-center transition-opacity hover:opacity-80"
                >
                  {googleSignal}
                </a>
              ) : (
                <div role="img" aria-label={googleAccessibleName}>
                  {googleSignal}
                </div>
              ))}

            {locality && (
              <span className="factory-trust-locality">{locality}</span>
            )}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
