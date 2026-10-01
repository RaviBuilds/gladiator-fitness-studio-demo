# Master Gym SEO Contract

## Metadata

All page metadata is sourced from `lib/seo.ts` (`SEOConfiguration`) and
rendered centrally through the Next.js Metadata API in `app/layout.tsx`.
Never duplicate metadata values inside page/section components.

- **Title** template: `[Gym Name] | Gym in [Locality], [City]`
  Example: `Fitness Academy | Gym in Attapur, Hyderabad`
- **Meta description**: describes the gym, locality, services, and a real
  differentiator. No keyword stuffing.
- **Canonical**: `SEOConfiguration.canonical`, one canonical URL per site.
- **OG image**: `SEOConfiguration.ogImage`, static asset under
  `public/assets/brand/` or a dedicated OG image.
- **Twitter/X**: reuse the OG image/description; a separate Twitter-specific
  image is only added if a real requirement appears.
- **Robots / sitemap**: default to indexable (`robots: "index, follow"`)
  unless a gym explicitly needs otherwise. Next.js's file-convention
  `sitemap.ts`/`robots.ts` can be added in the homepage implementation phase;
  not required for this canonical phase.

## Semantic HTML / Heading Hierarchy

- Exactly one `<h1>` per page, containing the business entity + gym/fitness
  concept + locality (e.g. "Fitness Academy — Gym in Attapur"). Never forced
  superlatives ("BEST GYM IN ATTAPUR").
- Logical `<h2>`/`<h3>` nesting per section, no skipped levels.
- Landmark elements (`<header>`, `<main>`, `<nav>`, `<footer>`) used
  correctly.

## Local SEO

Primary relationship: **Business + Gym/Fitness Entity + Locality + City**.
Supporting concepts (gym, fitness, training, personal training, strength,
cardio, membership, location, timings) should arise naturally from real
business/location data in `lib/business.ts`, never as hardcoded keyword
lists or unverifiable claims like "best gym in [city]".

## Image Alt Text

See `MASTER-GYM-ASSET-CONTRACT.md`. Alt text is mandatory per image and must
describe the actual image, not a keyword phrase.

## Schema Strategy

A single, reusable structured-data builder consumes verified fields only:

```ts
interface LocalBusinessSchemaInput {
  schemaType: string; // e.g. "ExerciseGym" or another specific LocalBusiness subtype, configurable per gym
  name: string;
  address: BusinessAddress;
  telephone: string;
  url: string;
  image: string;
  openingHours: BusinessHours[];
  sameAs?: string[];      // verified social profile URLs
  geo?: { latitude: number; longitude: number }; // only when verified
  priceRange?: string;    // only when appropriate/verified
}
```

Do not build a generic "schema engine" with dozens of arbitrary options.
Support exactly the fields above.

## Google Reviews Display vs Structured-Data Eligibility

These are two separate concepts and must not be conflated:

- **`displayReviews`** — a UX/content feature. Manually curated reviews from
  `lib/reviews.ts` are always safe to visually display with star rating,
  count, tagline, and the 3 featured reviews.
- **`reviewStructuredDataEligibility`** — a separate, explicit decision about
  whether review content qualifies for search-engine review rich-result
  markup. Visible reviews do not automatically imply eligibility. This
  Factory does not assume first-party/self-curated reviews are eligible for
  review-rich-result schema by default; that determination is made
  separately, per deployment, if ever pursued.
