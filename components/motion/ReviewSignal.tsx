"use client";

import { useState } from "react";
import type { Review } from "@/lib/types";
import { buildSignalSet, padRef, padCount, stepIndex, getInitials } from "@/components/sections/reviewSignal";
import { RatingStars } from "@/components/ui/RatingStars";

/**
 * Section 06 — MEMBER SIGNAL. The one client island the section needs: which
 * review is currently promoted to the featured quotation. Everything else
 * (the rating instrument, the CTA row, the decorative field) is static
 * server-rendered markup owned by Reviews.tsx.
 *
 * GOOGLE-NATIVE CARD SYSTEM. Every review — featured or supporting — renders
 * inside a light, Google-review-style card (white surface, neutral dark
 * text, Google-yellow stars, a subtle "Google" attribution) so the review
 * content is unmistakably sourced from Google, deliberately distinct from
 * the surrounding dark athletic-editorial chapter. Google identity lives
 * INSIDE the card; gym identity (numerals, eyebrow, accent, dark field)
 * stays OUTSIDE it in Reviews.tsx — the two visual languages are never
 * merged into one card.
 *
 * Deliberately NOT a carousel: no autoplay, no dot rail, no swipe library.
 * The supporting cards are themselves buttons that promote a review, and two
 * arrow controls step the featured review, wrapping at the ends. Native
 * touch scroll/tap already covers mobile; no touch handlers are added beyond
 * the buttons themselves. Long supporting review text is visually truncated
 * with CSS line-clamp behind a "Read more" affordance (no nested interactive
 * disclosure, since the card itself is already a button) — the full text
 * stays in the DOM either way, so assistive tech and text search always see
 * the complete review, and clicking the card promotes it to the featured
 * position where it reads in full.
 */
export function ReviewSignal({
  reviews,
}: {
  reviews: Review[];
}) {
  const [active, setActive] = useState(0);
  const set = buildSignalSet(reviews, active);
  if (!set) return null;

  const { featured, supporting, total } = set;
  const hasMultiple = total > 1;

  return (
    <div className="factory-signal-stage">
      {/* Featured review — an ENLARGED Google-native card, editorial scale,
          still recognizably the same card language as the supporting field
          below it (hierarchy: featured > supporting, never a different
          component). */}
      <div
        className="factory-google-card factory-google-card-featured"
        role="group"
        aria-roledescription="featured review"
        aria-label={`Featured review ${padRef(featured.index)} of ${padCount(total)}`}
      >
        <header className="factory-google-card-head">
          <span className="factory-google-avatar" aria-hidden="true">
            {getInitials(featured.name)}
          </span>
          <span className="factory-google-identity">
            <span className="factory-google-name">{featured.name}</span>
            <span className="factory-google-source">
              <GoogleMark />
              Google review
            </span>
          </span>
        </header>

        {typeof featured.rating === "number" && (
          <div className="factory-google-rating">
            <RatingStars rating={featured.rating} variant="google" />
          </div>
        )}

        <blockquote className="factory-google-quote" key={featured.index}>
          &ldquo;{featured.text}&rdquo;
        </blockquote>

        {hasMultiple && (
          <div className="factory-signal-arrows" role="group" aria-label="Browse reviews">
            <button
              type="button"
              className="factory-signal-arrow factory-focus"
              onClick={() => setActive((i) => stepIndex(i, -1, total))}
              aria-label="Previous review"
            >
              <Chevron direction="prev" />
            </button>
            <span className="factory-signal-arrow-count" aria-hidden="true">
              {padRef(featured.index)} / {padCount(total)}
            </span>
            <button
              type="button"
              className="factory-signal-arrow factory-focus"
              onClick={() => setActive((i) => stepIndex(i, 1, total))}
              aria-label="Next review"
            >
              <Chevron direction="next" />
            </button>
          </div>
        )}
      </div>

      {supporting.length > 0 && (
        <ol role="list" className="factory-signal-ledger">
          {supporting.map((review, i) => (
            <li key={review.index} className="factory-signal-ledger-item factory-stagger-child" style={{ transitionDelay: `${i * 70}ms` }}>
              <button
                type="button"
                className="factory-google-card factory-google-card-supporting factory-focus"
                onClick={() => setActive(review.index)}
                aria-label={`Make ${review.name}'s review the featured review`}
              >
                <header className="factory-google-card-head">
                  <span className="factory-google-avatar factory-google-avatar-sm" aria-hidden="true">
                    {getInitials(review.name)}
                  </span>
                  <span className="factory-google-identity">
                    <span className="factory-google-name">{review.name}</span>
                    {typeof review.rating === "number" && (
                      <span className="factory-google-rating">
                        <RatingStars rating={review.rating} variant="google" />
                      </span>
                    )}
                  </span>
                </header>

                <p className="factory-google-body">{review.text}</p>
                <span className="factory-google-readmore" aria-hidden="true">
                  Read more
                </span>

                <span className="factory-google-source factory-google-source-tag">
                  <GoogleMark />
                  Google
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Multicolor "G" mark — a restrained four-arc glyph, not a full Google
 *  logo asset. Used only as a small source-identity tag inside review
 *  cards, never as a clickable brand control. */
function GoogleMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 18 18" aria-hidden="true" className="factory-google-g">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.81 2.73v2.26h2.92c1.71-1.57 2.69-3.89 2.69-6.63z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.55-1.85.87-3.04.87-2.34 0-4.32-1.58-5.03-3.71H.96v2.33C2.44 15.98 5.48 18 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A8.99 8.99 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

function Chevron({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      {direction === "prev" ? (
        <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
