import Image from "next/image";
import { googleReviews } from "@/lib/reviews";
import { GoogleLogo } from "@/components/ui/GoogleLogo";
import { RatingStars } from "@/components/ui/RatingStars";

/**
 * Footer trust card: the gym's Google rating and review count, with an
 * optional "scan to review" QR.
 *
 * SOURCE-FIRST. Rating and count come from lib/reviews.ts (verified) and the
 * card renders nothing when either is missing. The review link and QR are
 * optional fields (`reviewUrl`, `reviewQrSrc`) that are never guessed: until
 * the owner supplies the real Google review link, only the rating block shows.
 * Server Component.
 */
export function GoogleTrustCard() {
  const { rating, reviewCount, googleBusinessProfileUrl, reviewUrl, reviewQrSrc } = googleReviews;

  if (!(rating > 0 && reviewCount > 0)) return null;

  const profileUrl = googleBusinessProfileUrl.trim();
  const ratingLabel = rating.toFixed(1);
  const name = `Rated ${ratingLabel} out of 5 from ${reviewCount} Google reviews`;

  const summary = (
    <>
      <GoogleLogo className="h-5 w-auto" />
      <span className="mt-3 flex items-center gap-3">
        <span className="text-4xl font-bold leading-none tracking-tight text-(--text-primary)">
          {ratingLabel}
        </span>
        <span className="flex flex-col gap-1.5">
          <RatingStars rating={rating} />
          <span className="text-xs text-(--text-secondary)">{reviewCount} Google reviews</span>
        </span>
      </span>
    </>
  );

  return (
    <div className="mt-6 w-full max-w-xs border border-(--border) bg-(--surface) p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {profileUrl ? (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${name}. Read reviews on Google.`}
              className="factory-focus block transition-opacity hover:opacity-80"
            >
              {summary}
            </a>
          ) : (
            <div role="img" aria-label={name}>
              {summary}
            </div>
          )}
        </div>

        {reviewQrSrc && (
          <figure className="flex shrink-0 flex-col items-center gap-1.5">
            {/* QR codes need a light quiet zone to scan, so the image always
                sits on white regardless of the footer's dark surface. */}
            <Image
              src={reviewQrSrc}
              alt="QR code: scan to write a Google review"
              width={80}
              height={80}
              loading="lazy"
              className="h-20 w-20 bg-white p-1.5"
            />
            <figcaption className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-(--text-secondary)">
              Scan to review
            </figcaption>
          </figure>
        )}
      </div>

      {reviewUrl && (
        <a
          href={reviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="factory-focus mt-4 inline-flex items-center gap-2 text-sm font-semibold text-(--text-primary) underline-offset-4 hover:underline"
        >
          Write a review
          <span aria-hidden="true">→</span>
        </a>
      )}
    </div>
  );
}
