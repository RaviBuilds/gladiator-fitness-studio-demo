import type { GoogleReviews } from "./types";

/**
 * Master Google Reviews data. Manually curated, never scraped at runtime.
 * Do not invent review content, reviewer names, ratings, or counts.
 *
 * GLADIATOR FITNESS STUDIO — rating/reviewCount are VERIFIED_OFFICIAL
 * (Google Business Profile Screenshot, Madhapur branch: 4.4 / 454 reviews,
 * checked September 2026, per docs/gladiator-gym-research.md REVIEWS.google).
 *
 * REVIEWS.featured_reviews is `[]` in docs/gladiator-gym-research.md — the
 * research states that attributable full-text Gladiator testimonials could
 * not be authenticated from third-party directory aggregators. The four
 * reviews below were supplied directly by the operator (verbatim reviewer
 * name + review text), not sourced from the research package, and are
 * reproduced exactly as given. None of the four arrived with a star rating,
 * so per the `Review.rating` contract (only render stars when a rating was
 * actually supplied) none carries one.
 *
 * REVIEWS.google.profile_url is NOT_FOUND in the research package — no
 * direct Google Business Profile URL exists. Per Phase 5/6 rules, never
 * invent a profile URL and never substitute a Justdial URL for the Google
 * review CTA. googleBusinessProfileUrl instead uses a Google Maps
 * search-by-name query (same safe-fallback pattern as lib/business.ts's
 * mapUrl) so the CTA still reaches the real Google listing without a
 * fabricated Place ID or profile slug.
 */
export const googleReviews: GoogleReviews = {
  rating: 4.4,
  reviewCount: 454,
  tagline:
    "Members repeatedly highlight trainer Najma Parveen's supportive, friendly coaching, flexible timings, a clean and well-monitored facility, and ladies-specific arrangements.",
  googleBusinessProfileUrl:
    "https://www.google.com/maps/search/?api=1&query=Gladiator+Fitness+Studio+Madhapur+Hyderabad",
  // Fill these two once the owner supplies the Google "write a review" link
  // (Google Business Profile -> Get more reviews -> share link). The footer
  // trust card then adds a "Write a review" link and, if reviewQrSrc points at
  // a QR image of that link, the scan-to-review QR. Left unset = not rendered.
  reviewUrl: undefined,
  reviewQrSrc: undefined,
  reviews: [
    {
      name: "Srilatha Kapa",
      text: "This gym has a female trainer. I've been training under her from more than 2 months and I love it. Mrs. Parveen is very friendly and motivating.",
    },
    {
      name: "Samina Khatun",
      text: "I’ve been going to Gladiator Gym for a while now, and training with Najma Parveen has been a really good experience. She’s very friendly, supportive, and knows exactly how to guide you based on your fitness level. She focuses on proper form and keeps a close eye during workouts, which I found really helpful.",
    },
    {
      name: "Pratiksha Puri",
      text: "I want to appreciate my trainer, Najama Parveen. She is an excellent female trainer who makes workouts comfortable and enjoyable. Because of her guidance and support, I never feel hesitant during any exercise. She explains everything clearly, motivates us, and creates a very friendly environment. It’s also the only gym in in entire area that has a female trainer, which makes it even better. I truly enjoy working out here because of her. Highly recommend!",
    },
    {
      name: "Mohammed Saleemuddin",
      text: "Excellent fitness center in Madhapur Hyderabad. Expert trainers and well disciplined staff. Neat and hygienic environment. Flexible timings. Special arrangements for ladies. Close monitoring through surveillance (CCTV) cameras.",
    },
  ],
};
