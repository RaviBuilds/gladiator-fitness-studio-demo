# Master Gym Customization SOP

This is exactly what a developer changes to turn the master into a specific
gym's website. Follow it in order.

## 1. Duplicate the Master Repository

No redesign. No component edits. Start from a clean clone.

## 2. Replace Brand Assets

- `public/assets/brand/logo.svg` (+ `logo-light.svg` / `logo-dark.svg` if used)
- `public/assets/brand/favicon/*`

## 3. Replace Hero Images

- `public/assets/hero/hero-01.webp` (place)
- `public/assets/hero/hero-02.webp` (people)
- `public/assets/hero/hero-03.webp` (training)

## 4. Replace Section Images

- `public/assets/about/*`
- `public/assets/programs/*`
- `public/assets/transformations/*` (only if this gym has verified
  transformations)

## 5. Replace Gallery

- `public/assets/gallery/*`
- Update `lib/gallery.ts` array to match, in the desired display order, with
  real alt text for every item.

## 6. Edit Data Files

Edit every file under `lib/`:

- `lib/business.ts` — name, tagline, description, phone, WhatsApp, email,
  address, hours, map URL, accent color.
- `lib/services.ts` — real services only; set `verified: true` only for
  currently offered programs.
- `lib/why-choose-us.ts` — real, verifiable differentiators for the
  mandatory Why Choose Us section. No invented superlatives.
- `lib/reviews.ts` — rating, review count, 3 genuine reviews, Google
  Business Profile URL, sentiment-derived tagline.
- `lib/membership.ts` — set `enabled: false` if pricing should not be public;
  otherwise fill in real current plans.
- `lib/social.ts` — Instagram handle/URL and 4-6 curated posts (or leave
  `posts` empty for the fallback state).
- `lib/seo.ts` — title, description, canonical URL, OG image.
- `lib/sections.ts` — toggle optional sections based on available data.
- `lib/hero.ts` — hero slide copy matching the replaced hero images.
- `lib/transformations.ts` — only items with `consentVerified: true`.
- `lib/training-intelligence.ts` — Section 05 is the **global educational
  library**: edit only `enabled` / goal order, `programId` (must match a
  `verified: true` service), the optional `gymNote`, the CTA labels and the
  `artifact`. Do not rewrite the training principles, coach notes or the
  disclaimer, and never add a number to any of them.
- `lib/faq.ts` — only questions with real, known answers.
- `lib/first-30-days.ts` — the Plan Your First 30 Days tool: replace the four
  images in `public/assets/first-30-days/` (keep the names) and their `alt`
  text; set `firstVisitFacts` from verified/publicly reported facts only
  (label publicly reported ones as such). Every onboarding capability
  (orientation, tour, trainer introduction, assessment, trial session,
  check-ins) stays `verified: false` until the owner confirms it in writing —
  then set `verified: true` AND record that confirmation in `source`. Without
  both, the tool phrases the service as a question to ask, never a promise.
- `lib/contact.ts` — Section 10 copy: headline, supporting line, CTA label,
  field labels, validation wording, success/error messages, the email subject
  pattern and the background art. Set `dataVerified: true` only once
  `lib/business.ts` holds the gym's real phone/email/address — until then the
  section labels those details as placeholders on purpose. Never put the Resend
  key or destination inbox in this file.

## 7. Set Environment Variables

In `.env.local` / the Vercel project (never commit real values):

- `RESEND_API_KEY` — inquiry-form delivery key (Resend).
- `CONTACT_TO_EMAIL` — inbox that receives inquiries.
- `CONTACT_FROM_EMAIL` — sender address on a **domain verified in the Resend
  account for this deployment**. An unverified sender domain is rejected by
  Resend, so confirm verification before launch.
- `BUSINESS_ID`

Never prefix secrets with `NEXT_PUBLIC_`. With any of the three contact
variables missing, `/api/contact` answers `503` with safe copy and the form
tells the visitor to use WhatsApp or phone — it never reports a false send.

## 8. Set Brand Colors

Two tokens, both in `lib/business.ts`. No component or CSS modifications.

- `accentColor` — PRIMARY brand colour (action / energy / major emphasis:
  primary CTA fills, selected + active states, hero brand moment). Injected
  as `--accent`, aliased `--brand-primary`.
- `secondaryColor` — SECONDARY brand colour (supporting hierarchy:
  eyebrows, mono metadata, technical ticks, supporting icons, secondary card
  segments, nav underline, secondary hover states, keyboard focus). Injected
  as `--brand-secondary`; `-hover`, `-active`, `-soft`, `-border`,
  `-foreground` and the light-surface `-ink` are derived automatically in
  `app/globals.css`. If a gym has no secondary colour, set it equal to
  `accentColor`.

Enter each authentic brand hex exactly once. Never write it into CSS or a
component. Contrast checks before finalizing:
- `secondaryColor` against `--bg-primary` (#09090b) ≥ 4.5:1 — it is used
  as small text and as the focus ring on dark surfaces.
- Dark text on a `secondaryColor` fill ≥ 4.5:1 (`--brand-secondary-foreground`
  is `--bg-primary`). If the secondary is dark, revisit that token.
- White on `accentColor` ≥ 4.5:1 (primary CTA text).

## 9. Validate

```
npm run lint
npm run build
```

Both must pass cleanly before QA.

## 10. Browser QA

Check on desktop, tablet, and mobile:

- Hero (all slides, CTAs)
- WhatsApp link (correct number, correct prefilled message)
- Phone `tel:` link
- Contact form submission and failure-state message
- Why Choose Us (real, verifiable differentiators, no generic placeholder
  copy left in production)
- Reviews section (rating, count, 3 reviews, Google profile link)
- Gallery (order, alt text, lazy loading)
- Instagram (curated posts or fallback CTA)
- Maps link
- FAQ (only real answered questions)

## 11. Deploy

Deploy to Vercel (or the project's chosen host). Confirm the deployed
`robots`/`sitemap`/canonical values match the live domain.

## What You Should Never Touch During a Standard Clone

`components/*`, `motion/*`, core page layout, SEO implementation code, the
schema builder, the responsive system, the button system, the typography
system, the animation system, accessibility utilities, image utilities.

If a gym genuinely requires a change to one of these, that is not a standard
clone — it is either a Master Template improvement (benefits every future
gym) or a separate paid custom project. Do not quietly make one-off
component edits for a single client.
