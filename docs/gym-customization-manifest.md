# Gym Customization Manifest — Factory Customization Contract

Operator-facing contract for turning this master template into a **prospect
demo** site. Produced by a full read of `app/`, `components/`, `lib/`,
`public/assets/`, `emails/`, `.env.example` on 2026-09-30. Every path, field
name, fallback and component binding below was traced in the repository — none
are assumed.

Companion document: [`gym-research-schema.md`](./gym-research-schema.md) — the
exact package Gemini Deep Research must return.

Related, still authoritative: `MASTER-GYM-WEBSITE-ARCHITECTURE.md`,
`MASTER-GYM-DATA-CONTRACT.md`, `MASTER-GYM-CUSTOMIZATION-SOP.md`,
`MASTER-GYM-ASSET-CONTRACT.md`, `MASTER-GYM-SEO-CONTRACT.md`.

> This document is **discovery + documentation only**. Nothing in the UI, data,
> styles, layout, components, Hero, education modules, transformations, pricing
> behaviour or Instagram behaviour was modified to produce it.

---

## 0. Discovered inventory

### 0.1 Page composition — `app/page.tsx`

Render order, with the flag that gates each section (`lib/sections.ts`):

| # | Component | Flag | Notes |
|---|-----------|------|-------|
| — | `Header` | always | `whatsappHref` built in `page.tsx` from `business.whatsapp` |
| — | `Hero` | always | receives the single `activeOffer` |
| — | `KineticStrip` | always | content derived from `business` |
| — | `Trust` | `sections.trust` | |
| 01 | `About` | `sections.about` | |
| 02 | `Programs` → `ProgramIndex` | `sections.programs` | |
| 03 | `WhyChooseUs` | `sections.whyChooseUs` | |
| 04 | `Transformations` | `sections.transformations` | **frozen for demos** |
| 05 | `TrainingIntelligence` | `sections.trainingIntelligence` | educational |
| 06 | `Reviews` | `sections.reviews` | numeral hardcoded `06` |
| 07 | `BetweenSessions` | `sections.betweenSessions` | educational |
| 06 | `Membership` | `sections.membership` | numeral from `pricing.index` (`"06"`) |
| 07 | `Gallery` | `sections.gallery` | numeral hardcoded `07` |
| 08 | `Instagram` | `sections.instagram` | |
| 09 | `Faq` | `sections.faq` | |
| 10 | `Contact` | `sections.contact` | numeral from `contact.index` |
| 11 | `Location` | `sections.location` | |
| 12 | `FinalCta` | always | |
| — | `Footer`, `FloatingContact`, `ContactDialog` | always | |

`export const revalidate = 3600` in `app/page.tsx` exists so the offer engine
re-evaluates hourly. Do not remove it.

### 0.2 Data modules under `lib/`

| File | Export | Role |
|------|--------|------|
| `business.ts` | `business: Business` | identity, contact, address, hours, map, primary + secondary brand colours |
| `seo.ts` | `seo: SEOConfiguration` | title/description/canonical/ogImage/robots |
| `schema.ts` | `buildLocalBusinessSchema()` | **code, frozen** |
| `sections.ts` | `sections: SectionConfiguration` | 14 section flags |
| `services.ts` | `services: Service[]` | Section 02 programs |
| `why-choose-us.ts` | `whyChooseUs: WhyChooseUsItem[]`, `whyChooseUsConfiguration` | Section 03 |
| `about.ts` | `aboutConfiguration`, `scheduleWindows()` | Section 01 |
| `hero.ts` | `heroConfiguration: HeroConfiguration` | **frozen** |
| `kinetic-strip.ts` | `kineticStripConfiguration` | derived from `business` |
| `transformations.ts` | `transformations: TransformationItem[]` | **frozen for demos** |
| `training-intelligence.ts` | `trainingGoals`, `trainingIntelligenceConfiguration` | global educational library |
| `between-sessions.ts` | `betweenSessionsConfiguration` | global educational library |
| `reviews.ts` | `googleReviews: GoogleReviews` | Trust + Reviews + Hero motif |
| `pricing.ts` | `pricing: PricingConfiguration` | the only source of money |
| `gallery.ts` | `galleryItems: GalleryItem[]` | Gallery rail |
| `instagram.ts` | `instagramConfig: InstagramConfiguration` | Instagram + Footer |
| `social.ts` | `social: SocialConfiguration` | **ORPHANED — see §9.1** |
| `faq.ts` | `faq: FaqItem[]` | Section 09 |
| `contact.ts` | `contact: ContactConfiguration`, `contactDirectory()`, … | Section 10 |
| `festival-offers.ts` | `offerEngine: OfferEngineConfiguration` | campaign calendar |
| `offer-engine.ts` | selector/arithmetic | **code, frozen** |
| `contact-validation.ts` | validators | **code, frozen** |
| `types.ts` | all interfaces | **code, frozen** |

### 0.3 Classification legend

- **A — FROZEN_FACTORY_CONTENT**: do not change for a prospect demo. Changing it
  is a Master Template improvement, not a clone task.
- **B — GYM_SPECIFIC_CUSTOMIZABLE**: must change for every gym.
- **C — CONDITIONAL / OPTIONAL**: change only when a real, sourced value exists;
  otherwise leave the template value or switch the feature off.

Research columns: **G** = Gemini research, **M** = manual operator collection,
**O** = owner verification recommended.

---

## 1. BUSINESS IDENTITY — `lib/business.ts` → `business`

Type: `Business` (`lib/types.ts:31`).

| Field | Path | Type | Class | Req | Rendered by | Fallback if missing | G | M | O |
|---|---|---|---|---|---|---|---|---|---|
| Gym name | `business.name` | `string` | B | yes | `Header` (aria label), `Footer` (identity + copyright), `KineticStrip` band 01 & 02, `layout.tsx` schema `name`, contact email sender name | none — required, template name renders | YES | no | YES |
| Tagline | `business.tagline` | `string` | B | yes | `FinalCta` **H2 headline**, `Footer` sub-line, `KineticStrip` band 01 | none — template tagline renders | YES | no | YES |
| Description | `business.description` | `string` | B | yes | `About` deck (split on `\n` into paragraphs) | none — template description renders | YES | no | YES |
| Accent colour | `business.accentColor` | hex/hsl `string` | C | yes | `app/layout.tsx` → `--accent` inline style on `<html>` | demo lime `#D6FF3F` | NO | YES (pick from logo, contrast-check) | YES |
| Secondary colour | `business.secondaryColor` | hex/hsl `string` | C | yes | `app/layout.tsx` → `--brand-secondary` inline style on `<html>`; variants derived in `app/globals.css` | — (falls back to accent) | NO | YES (brand reference, contrast-check vs `--bg-primary`) | YES |

Notes:
- The gym name is **never rendered as visible text in the header** — only the
  logo image is. The accessible name comes from `business.name`.
- `business.description` is the single source for the About narrative. Do not
  duplicate it into `about.ts`.
- Business **category** and **branch count** have no field anywhere in the
  repository. Category is expressible only via `seo.title`/`seo.description`
  wording and the schema type literal `"ExerciseGym"` hardcoded in
  `app/layout.tsx`. Multi-branch is **not supported** — one address, one hours
  set, one map URL. Collect branch count for the sales conversation only.

### 1.1 CONTACT — `lib/business.ts`

| Field | Path | Type | Class | Req | Rendered by | Fallback if missing | G | M | O |
|---|---|---|---|---|---|---|---|---|---|
| Phone | `business.phone` | `string` (E.164) | B | yes | `Contact` directory (`tel:`), `FinalCta` Call button, schema `telephone` | `FinalCta` Call button **not rendered**; phone row omitted from directory | YES | no | YES |
| Phone display override | `contact.phoneDisplay` | `string?` | C | no | `Contact` directory value | falls back to `business.phone` verbatim | no | YES | YES |
| WhatsApp number | `business.whatsapp.number` | `string` | B | yes | `buildWhatsAppHref()` in `page.tsx` → Header CTA, Hero CTAs, WhatsApp float, every section CTA, `Reviews` "Talk to the gym" | none — every WhatsApp CTA points at the template number | YES | no | YES |
| WhatsApp prefill | `business.whatsapp.message` | `string` | C | yes | same deep link | template message | no | YES | YES |
| Email | `business.email` | `string?` | C | no | `Contact` directory (`mailto:`) | email row **omitted entirely** | YES | no | YES |
| Website | — | — | — | — | only as `seo.canonical` | — | YES | no | YES |
| Instagram | `instagramConfig.profileUrl` / `.handle` | `string` | B | yes | `Instagram` H2 + CTA, `Footer` Follow link | template `@blogspage_ai` renders | YES | no | YES |
| Other socials (FB/YouTube/Maps `sameAs`) | **none** | — | — | — | `buildLocalBusinessSchema` accepts `sameAs` but `app/layout.tsx` passes `sameAs: undefined` | not renderable without a code change | YES (collect) | no | YES |
| Booking link | **none** | — | — | — | no field exists | route all intent to WhatsApp | YES (collect) | no | — |

Inquiry-form delivery is **environment-only** (`.env.example`):
`RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `BUSINESS_ID`.
Never place these in `lib/`. With any missing, `/api/contact` answers `503` and
the form shows `contact.form.notConfiguredMessage`.

### 1.2 LOCATION — `lib/business.ts` → `business.address`, `business.mapUrl`

Type: `BusinessAddress` (`lib/types.ts:9`). Rendered by `Location`
(`components/sections/Location.tsx`) and `contactDirectory()`.

| Field | Path | Class | Req | Fallback if missing | G | M | O |
|---|---|---|---|---|---|---|---|
| Street line | `business.address.addressLine` | B | yes | line omitted from the composed address (no empty line, no stray comma) | YES | no | YES |
| Locality | `business.address.locality` | B | yes | falls through to `city` in `Trust`, `Hero` caption, `KineticStrip` band 02, `About` | YES | no | YES |
| City | `business.address.city` | B | yes | as above | YES | no | YES |
| State | `business.address.state` | B | yes | omitted from the state/postcode line; schema `addressRegion` empty | YES | no | YES |
| Postal code | `business.address.postalCode` | B | yes | omitted | YES | no | YES |
| Landmark | `business.address.landmark` | C | no | landmark paragraph **not rendered** | YES (only if publicly stated) | no | YES |
| Map URL | `business.mapUrl` | B | yes | "Get directions" button **not rendered** | YES | no | YES |
| Geo lat/lng | schema only | C | no | `app/layout.tsx` passes `geo: undefined` — needs a code change to populate | YES (collect) | no | — |

`addressCountry` is explicitly `undefined` in `lib/schema.ts`. Not a per-gym
field today.

### 1.3 HOURS — `lib/business.ts` → `business.hours`

Type: `BusinessHours[]` — `{ day, open, close }`, one row per day, strings as
displayed (`"05:00 AM"`).

| Aspect | Behaviour | Class | G | M | O |
|---|---|---|---|---|---|
| Per-day rows | `Location` renders every array entry as a `<dt>/<dd>` row | B | YES | no | YES |
| Closed day | leave `open`/`close` empty strings → renders `Closed` | C | YES | no | YES |
| Schema | `schema.ts` maps `Monday→Mo` … `Sunday→Su` into `openingHoursSpecification` | A (code) | — | — | — |
| About schedule readout | `scheduleWindows(business.hours)` collapses consecutive days with identical windows; returns `[]` (module hidden) when a day is missing a value **or** when there are more than 3 distinct windows | A (logic) | — | — | — |

There is **no special/holiday hours field**. Do not invent one. A festive
closure can only be communicated through the offer engine copy or FAQ.

---

## 2. ABOUT (Section 01) — `lib/about.ts` → `aboutConfiguration`

Type: `AboutConfiguration` (`lib/types.ts:587`). Component:
`components/sections/About.tsx`.

| Field | Class | Req | Fallback / gate | G | M | O |
|---|---|---|---|---|---|---|
| `index` `"01"`, `eyebrow`, `headlineLines`, `accentLastLine` | A | yes | — | no | no | no |
| `zonesLabel`, `attributesLabel`, `scheduleLabel`, `imageLabel`, `frameLabel` | A | yes/opt | optional labels simply don't render | no | no | no |
| `image.src` | B | yes | broken image if the file is absent — always replace the file | no | YES (image) | YES |
| `image.alt` | B | yes | mandatory by type | no | YES (write from the real photo) | no |
| `zones[]` `{id,label,detail?,icon,verified}` | C | — | **only `verified: true` renders**; `detail` optional | YES | no | YES |
| `attributes[]` `{id,label,value?,verified}` | C | — | **only `verified: true` renders** | YES | no | YES |
| `showSchedule` | C | yes | `false` hides the readout | no | YES | no |

`icon` is a closed union `TrainingIconName`: `strength | cardio | coaching |
equipment | floor`. No other value compiles.

The gym **story / positioning** has exactly one home: `business.description`.
There is no separate story field, no founder field, no trainer-bio field.

---

## 3. PROGRAMS (Section 02) — `lib/services.ts` → `services`

Type: `Service[]` (`lib/types.ts:46`). Components: `Programs.tsx` →
`ProgramIndex.tsx`.

| Field | Class | Req | Fallback / gate | G | M | O |
|---|---|---|---|---|---|---|
| `id` | B | yes | must be stable; **referenced by `trainingGoals[].programId`** | no | YES | no |
| `name` | B | yes | also builds the image alt: `` `${program.name} training at the gym` `` | YES | no | YES |
| `description` | B | yes | — | YES | no | YES |
| `icon` | C | yes | free `string` on `Service`; current demo uses `dumbbell/flame/target/users` | no | YES | no |
| `image` | C | no | **row renders without an inline image; the desktop preview panel is skipped for that row** | no | YES (image) | no |
| `verified` | B | yes | **`false` ⇒ the program does not render**. `Programs` returns `null` when no verified service exists | no | YES (gate) | YES |
| `ctaLabel` | C | no | falls back to the component default | no | YES | no |
| `ctaHref` | C | no | falls back to the site-wide WhatsApp action | no | no | no |

Frozen in `Programs.tsx`: numeral `02`, eyebrow `Programs`, H2
"Training, / not guesswork.", and the supporting paragraph. The program count
readout is derived (`services.length`) — never authored.

**Special training offerings** are priced through `pricing.special`, not
through `services`. A gym's PT offering can legitimately appear in both.

---

## 4. WHY CHOOSE US (Section 03) — `lib/why-choose-us.ts`

Components: `WhyChooseUs.tsx` → `WhyChooseBlueprint.tsx`.

| Field | Class | Req | Fallback / gate | G | M | O |
|---|---|---|---|---|---|---|
| `whyChooseUs[].title` | B | yes | — | YES | no | YES |
| `whyChooseUs[].description` | B | yes | — | YES | no | YES |
| `whyChooseUs[].image` | C | no | **not rendered by this section at all** (see §9.2) | no | no | no |
| `whyChooseUsConfiguration.index/eyebrow/headlineLines/accentLastLine/deck/principlesLabel` | A | — | — | no | no | no |
| `whyChooseUsConfiguration.anchor.src` | B | yes | the one campaign photograph the annotations attach to | no | YES (image) | YES |
| `whyChooseUsConfiguration.anchor.alt` | B | yes | must describe the photograph, **not** the principles | no | YES | no |
| `whyChooseUsConfiguration.anchor.objectPosition` | C | no | defaults to CSS default; use to re-centre a differently framed subject | no | YES | no |

`headlineLines` entries must stay ≤ ~24 characters — they cross the anchor
photograph on desktop. Keep it to 4–6 principles: facilities, equipment,
training environment, coaching approach, amenities, specialisation. Never a
superlative, never a count you cannot source.

---

## 5. TRANSFORMATIONS (Section 04) — FROZEN FOR INITIAL DEMO

**STATUS: FROZEN FOR INITIAL DEMO.**

- File: `lib/transformations.ts` → `transformations: TransformationItem[]`
  (`lib/types.ts:305`). Component: `Transformations.tsx` +
  `TransformationScrubber.tsx` / `TransformationNav.tsx` /
  `transformationDossier.ts`.
- Do **not** research, replace, or edit transformation data for a prospect demo.
  Leave `sections.transformations: true` and the two demo cases exactly as they
  are. Case 01 is deliberately data-complete and case 02 deliberately sparse —
  together they are the proof the component renders both without empty rails.
- **Excluded from the Gemini research contract.** No transformation field
  appears in `gym-research-schema.md`.
- Gate: only `consentVerified: true` items render; `Transformations` returns
  `null` when none qualify. `personName` falls back to `` `Case 01` ``.
  `mediaAspect` defaults to `square` (`portrait` when independent
  before/after assets exist).
- `app/page.tsx` also feeds the first `consentVerified` item's image into
  `ContactDialog`. Emptying this array silently removes that dialog image.

**LATER OWNER INPUT** (only if the owner asks for the section to be
personalised): 2 genuine cases, each needing before image, after image (or one
combined diptych), duration, metrics *only if genuinely recorded*, training
context, member story, member name, and explicit written consent
(`consentVerified`). Never crop one diptych in half to fake split assets.

---

## 6. EDUCATIONAL MODULES (Sections 05 + 07) — FROZEN COPY

`lib/training-intelligence.ts` and `lib/between-sessions.ts` are the factory's
**global educational library**: written once, reviewed once, reused everywhere.
The files themselves say so. Rewriting this copy per gym is how a factory ships
unreviewed fitness, nutrition and injury advice at scale.

**Frozen (A):** the lever taxonomy, every `premise`/`path`/`priorities`/
`mistakes`/`track`/`coachNote`, all emphasis values, the station framework and
interval markers, the pre-session check, the body-map taxonomy and state
captions, the training-week patterns, both `disclaimer` strings, and every
label.

**Editable per gym (C), all optional:**

| Field | File | Notes | G | M | O |
|---|---|---|---|---|---|
| `trainingGoals[].enabled` + array order | `training-intelligence.ts` | renders with 3, 4, 5+ goals unchanged | no | YES | no |
| `trainingGoals[].programId` | `training-intelligence.ts` | **must match a `verified: true` `services[].id`**; secondary CTA is hidden when it does not resolve | no | YES | no |
| `trainingGoals[].gymNote` | `training-intelligence.ts` | gym-specific operational claim — currently demo text on the `fat-loss` goal only. **Delete it or replace with a verified arrangement.** | no | no | YES |
| `trainingIntelligenceConfiguration.primaryCtaLabel` / `secondaryCtaLabel` / `ctaMessageTemplate` | same | `{goal}` placeholder | no | no | no |
| `trainingIntelligenceConfiguration.reviewedBy` | same | `undefined` ⇒ not rendered. It is a credibility claim | no | no | YES |
| `trainingIntelligenceConfiguration.artifact` | same | optional photo; delete the key to drop it | no | YES (image) | no |
| `betweenSessionsConfiguration.stations[].enabled` / order | `between-sessions.ts` | | no | YES | no |
| `betweenSessionsConfiguration.stations[].gymNote` | same | demo text on the `fuel` station only — **delete or replace** | no | no | YES |
| `betweenSessionsConfiguration.ctaLabel` / `ctaMessage` / `ctaNote` | same | | no | no | no |
| `betweenSessionsConfiguration.artifact.enabled` | same | ships `false` by design — Section 07 is a zero-photograph chapter. Leave it off | no | no | no |
| `bodyMap.groups[].enabled` / order | same | | no | YES | no |

Neither module needs per-gym verification to render, which is why both flags
ship `true`.

---

## 7. REVIEWS (Section 06 + Trust rail + Hero motif) — `lib/reviews.ts`

Type: `GoogleReviews` (`lib/types.ts:69`). Consumers: `Reviews.tsx`,
`Trust.tsx`, `Hero.tsx`.

| Field | Class | Req | Fallback / gate | G | M | O |
|---|---|---|---|---|---|---|
| `rating` | B | yes | `Trust` Google block hidden when `rating <= 0`; `Reviews` needs a rating to render the dial | YES | no | YES |
| `reviewCount` | B | yes | `reviewCount === 0` ⇒ **`Reviews` returns `null`**, `Trust` Google block hidden, Hero review motif suppressed | YES | no | YES |
| `tagline` | C | yes (type) | empty string ⇒ the tagline paragraph is not rendered. **Derive from real review sentiment — never invent** | YES (as a sentiment summary) | YES (write it) | YES |
| `googleBusinessProfileUrl` | B | yes | empty ⇒ `Trust` renders a non-linked `role="img"` block; `Reviews` CTA falls back to the raw value | YES | no | YES |
| `reviews[].name` | B | — | `reviews.length === 0` ⇒ **`Reviews` returns `null`** | YES | no | YES |
| `reviews[].text` | B | — | verbatim only | YES | no | YES |
| `reviews[].rating` | C | no | stars are rendered **only** when the per-review rating exists — the aggregate is never assumed per review | YES | no | YES |

Component behaviour: the section adapts to 1, 3, 5 or more reviews with no code
change (`buildSignalSet`). Reviewer avatars are initials, never fabricated
portraits. Frozen: numeral `06`, eyebrow `Reviews`, H2 "Do real people / trust
this gym?", both CTA labels.

**Hero interaction:** when no campaign is active and `reviewCount > 0 &&
rating > 0`, the hero's top-right utility slot shows
`{ value: reviewCount, label: "Verified member reviews" }`. An active campaign
takes that slot instead.

---

## 8. PRICING / MEMBERSHIP (Section 06) — `lib/pricing.ts`

Type: `PricingConfiguration` (`lib/types.ts:163`). Component:
`Membership.tsx`. **This is the only source of money in the repository.**

| Field | Class | Req | Fallback / gate | G | M | O |
|---|---|---|---|---|---|---|
| `enabled` | C | yes | `false` ⇒ **whole section does not render**. Also degrades the hero offer CTA to WhatsApp | no | YES | YES |
| `currency` / `locale` | C | yes | `"INR"` / `"en-IN"`; drives `Intl.NumberFormat` | no | YES | no |
| `eyebrow`, `index`, `headlineLines`, `accentLastLine`, `deck` | A | — | leave as shipped | no | no | no |
| `contactLabel` | A | yes | `"Consult management"` — rendered wherever an amount is withheld | no | no | no |
| `specialLabel` | A | yes | | no | no | no |
| `plans[].id` | B | yes | **stable keys — `festival-offers.ts` discounts reference them**. Current ids: `daily`, `weekly`, `monthly`, `quarterly`, `half-year`, `annual` | no | YES | no |
| `plans[].name` / `duration` / `term` | C | yes | template values (`Daily Pass`, `1 Day`, `One day` …) | YES | no | YES |
| `plans[].price` | C | no | **`priceStatus: "exact"` with no numeric price safely degrades to `contactLabel`** | YES — only from credible public sources | no | YES |
| `plans[].priceStatus` | B | yes | `exact` \| `contact` \| `hidden`. `hidden` ⇒ the card is filtered out entirely | no | YES | YES |
| `plans[].ctaLabel` | C | yes | `"Enquire"` | no | no | no |
| `special` | C | no | omit the key ⇒ the special row disappears | YES | no | YES |

**Price research rule:** if a price is not publicly available from a credible
source → `NOT FOUND / KEEP TEMPLATE VALUE`. Never invent a figure. If the gym
publishes no pricing at all, either set every `priceStatus: "contact"` or set
`enabled: false`. Do not add discounts, savings, "best value"/"most popular"
tags, urgency, scarcity or guarantees — none of those exist in this contract by
design, and the component has no slot for them.

### 8.1 Festival & Seasonal Offer Engine — `lib/festival-offers.ts`

`offerEngine: OfferEngineConfiguration` (`lib/types.ts:1402`). Selected once in
`app/page.tsx` and handed to both `Hero` and `Membership`, so the hero card and
the discounted prices are provably the same campaign.

| Field | Class | Notes | G | M | O |
|---|---|---|---|---|---|
| `enabled` | C | `false` ⇒ no offer renders anywhere; hero returns to the review motif | no | YES | YES |
| `timeZone`, `locale` | C | evaluation timezone, not the visitor's | no | YES | no |
| `preFestivalLeadDays` (30), `maxDiscountPercentage` (60) | A | a discount ≥ the ceiling is dropped as malformed data | no | no | no |
| `ctaHref` (`#membership`), `defaultCtaLabel`, `endsLabel`, `liveLabel`, `discountLabel`, `regularPriceLabel`, `offerPriceLabel` | A | engine copy | no | no | no |
| `festivals[]` dates + `dateNote` | A | curated from Drik Panchang 2026–2028, each with recorded provenance. **Do not edit dates during a clone** | no | no | no |
| Discount ladders `FLAGSHIP_TERMS` (15/25), `STANDARD_TERMS` (10/20), `LIGHT_TERMS` (10) | C | **demonstration percentages** — replace only with terms the business has approved | no | no | **YES** |
| `seasonal[]` bands | A | the "no gap" fallback layer | no | no | no |

A discount carries `{ planId, percentage }` only — never an amount — so
re-pricing `lib/pricing.ts` can never desync a promotion. A discount whose plan
is missing, hidden or contact-only is dropped, not rendered.

**For a prospect demo, leave the ladders as demonstration values and say so in
the sales conversation.** They are the only place in the site that states a
commercial term the owner has not approved.

---

## 9. GALLERY, INSTAGRAM, FAQ, CONTACT

### 9.1 Gallery — `lib/gallery.ts` → `galleryItems`

| Field | Class | Req | Fallback / gate | G | M | O |
|---|---|---|---|---|---|---|
| `src` | B | yes | `galleryItems.length === 0` ⇒ **section returns `null`** | no | YES (image) | no |
| `alt` | B | yes | mandatory by type — describe the actual frame | no | YES | no |
| `width` / `height` / `caption` | C | no | not required for local assets | no | no | no |

Array order **is** display order; filename order is not a dependency. Demo
ships 7 items.

### 9.2 Instagram — `lib/instagram.ts` → `instagramConfig`

Official public-embed mode. **No Instagram API, no OAuth, no Meta token.**

| Field | Class | Req | Fallback / gate | G | M | O |
|---|---|---|---|---|---|---|
| `profileUrl` | B | yes | `Instagram` CTA + `Footer` Follow link | YES | no | YES |
| `handle` | B | yes | rendered as the section **H2** | YES | no | YES |
| `items[].id` | B | yes | React key only | no | YES | no |
| `items[].url` | B | yes | `items.length === 0` ⇒ **section returns `null`** | YES (3–4 public Reel URLs) | YES (verify each embeds) | no |
| `items[].type` | B | yes | `"reel"` only | no | no | no |

There is **no date field** on a reel. Collect dates for operator judgement only.
Frozen: numeral `08`, eyebrow, the mono line "Training. People. The gym in
motion.", CTA label.

> **`lib/social.ts` is orphaned.** `social: SocialConfiguration`
> (`instagramHandle`, `instagramUrl`, `posts[]`) is imported by **no component**
> — `Instagram.tsx` and `Footer.tsx` both read `lib/instagram.ts`. The four
> `public/assets/social/*.jpg` files it references are therefore unrendered.
> `MASTER-GYM-CUSTOMIZATION-SOP.md` step 6 and
> `MASTER-GYM-DATA-CONTRACT.md` §Social still point operators at this dead file.
> **Do not spend prospect time on it.** Flagged, not changed — see §12.

### 9.3 FAQ — `lib/faq.ts` → `faq: FaqItem[]`

| Field | Class | Req | Fallback / gate | G | M | O |
|---|---|---|---|---|---|---|
| `id` | B | yes | display numeral | no | YES | no |
| `question` | B | yes | `faq.length === 0` ⇒ **section returns `null`** | YES | no | YES |
| `answer` | B | yes | — | YES | no | YES |

Rule from the file itself: **if the answer is not actually known, do not create
the entry.** Candidate topics — booking/trial policy, joining fee, parking,
timings, membership terms, payment methods, facilities, guest passes. Only when
supported by a public source.

Frozen: numeral `09`, eyebrow, H2 "COMMON QUESTIONS.", the supporting line, the
"STILL HAVE A QUESTION?" block and its CTA. Background image path is hardcoded
in the component — see §10.

### 9.4 Contact — `lib/contact.ts` → `contact`

Type: `ContactConfiguration` (`lib/types.ts:1233`). Components: `Contact.tsx`,
`ContactForm.tsx`, `app/api/contact/route.ts`,
`emails/contact-inquiry-email.ts`.

| Field | Class | Notes / fallback | G | M | O |
|---|---|---|---|---|---|
| `index`, `eyebrow`, `headline`, `supporting`, `primaryCtaLabel` | A | editorial copy | no | no | no |
| `dataVerified` | **B** | ships `false`. While `false` the directory renders `directory.unverifiedNotice` labelling the details as placeholders. **Set `true` only after `lib/business.ts` holds real, verified details** | no | YES | YES |
| `phoneDisplay` | C | `undefined` ⇒ uses `business.phone` | no | YES | no |
| `collectEmail` | C | `false` hides the optional email field | no | YES | no |
| `directory.*Label`, `unverifiedNotice` | A | | no | no | no |
| `meta[]` | A | structural facts about the form, not claims | no | no | no |
| `form.*` (all labels, placeholders, every error string, submit/success/error/throttle copy, `validationSummary`) | A | reworded only for a non-English clone | no | no | no |
| `form.responseNote` | C | `undefined` ⇒ not rendered. **Set only if the gym can stand behind a response window** | no | no | YES |
| `delivery.subjectTemplate` (`{name}`), `sourceLabel` | C | | no | YES | no |
| `delivery.recipientEnvVar` / `senderEnvVar` / `apiKeyEnvVar` | A | names only — **never values** | no | no | no |
| `background.src` / `numeral` / `edgeLabel` | C | currently reuses the education asset at 12% opacity | no | YES | no |

`contactDirectory(business)` composes the visible rows: phone (if present),
email (if present), address (if any part is present). No business fact is
duplicated into `contact.ts`.

---

## 10. FROZEN CONTENT REGISTER

Do not change any of the following for a prospect demo.

### 10.1 Hero — fully frozen

`lib/hero.ts` → `heroConfiguration.slides` (3 slides) and
`components/motion/HeroSlider.tsx`.

Frozen: every `image`, `imageAlt`, `eyebrow` (The Power / The Coaching / The
Training), `headline`, `headlineLayers` (back/middle/front/frontSecondary word
groups), `spokenHeadline`, the entire per-breakpoint `composition` block
(`mobile`/`mobileShort`/`tablet`/`laptop`/`desktop`: `subjectHeight`,
`subjectWidth`, `subjectCenterX`, `subjectBottom`, `typeSize`, `backTop`,
`backLeft`, `backWordLayout`, `middle*`, `front*`, `frontSecondary*`),
`subjectAlign`, `subheadline`, `primaryCtaLabel`, `secondaryCtaLabel/Href`.

Every composition value is calibrated against the measured alpha geometry of
its specific PNG cutout. Swapping a hero image without re-deriving the whole
composition block visibly breaks the layered typography. **No hero research
field exists in the research schema.**

Gym-specific utility data *around* the hero (all harmless, all already covered
elsewhere):

| Hero surface | Actual source | Behaviour |
|---|---|---|
| Offer card (top-right ≥1024px, docked strip below) | `festival-offers.ts` + `pricing.ts` via `page.tsx` | renders only when a campaign is active |
| Review motif | `reviews.rating` + `reviews.reviewCount` | only when no campaign **and** both > 0 |
| Locality caption | `business.address.locality \|\| business.address.city` | omitted when both empty |
| Business name | not visible in the hero | — |
| Offer CTA href | `offerEngine.ctaHref` when `sections.membership && pricing.enabled`, else the WhatsApp link | never links to an absent section |

### 10.2 Other frozen items

- `lib/hero.ts`, `lib/transformations.ts` (demo phase), `lib/training-intelligence.ts`
  educational copy, `lib/between-sessions.ts` educational copy, festival dates
  and `dateNote` provenance in `lib/festival-offers.ts`.
- `lib/types.ts`, `lib/schema.ts`, `lib/offer-engine.ts`,
  `lib/contact-validation.ts`, `emails/contact-inquiry-email.ts`.
- All of `components/**`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`.
- Hardcoded editorial copy inside components: `Header` `NAV_LINKS`; `Programs`
  `02` / "Training, / not guesswork."; `Transformations` "Results" /
  "Real members, / real consent."; `Reviews` `06` / "Do real people / trust this
  gym?"; `Gallery` `07` / "Inside the gym."; `Instagram` `08` / "Training.
  People. The gym in motion."; `Faq` `09` / "COMMON QUESTIONS."; `Location`
  `11` / "Find us." / "Get directions"; `FinalCta` "12 — Ready when you are" /
  "Programs · Pricing · First session"; `Footer` "Explore" / "Follow" / the
  Blogspage AI attribution and `AGENCY_URL`; `FloatingContact` aria-label.
- Three **hardcoded asset paths** (change the *file*, never the component):
  - `components/sections/Header.tsx:57` → `/assets/brand/ironline-training-demo-logo.jpg`
  - `components/sections/Faq.tsx:19` → `/assets/gallery/ironline-demo-gallery-02.jpg`
  - `components/sections/Membership.tsx:71` → `/assets/pricing-bg.jpg`

---

## 11. IMAGE ASSET CONTRACT

Authority is the actual repository tree, not `MASTER-GYM-ASSET-CONTRACT.md`
(whose example filenames no longer match what ships — see §12).

Ratios below are read from `app/globals.css` and component classes. Naming
convention stays `[brand]-[location]-[subject]-[context].ext`, lowercase,
hyphenated, descriptive, no keyword stuffing, no `image1.jpg`.

| # | Slot | Current file | Consumed by | Path is | Frame / ratio | Orientation | Req | Suggested filename |
|---|---|---|---|---|---|---|---|---|
| 1 | Brand logo | `brand/ironline-training-demo-logo.jpg` | `Header.tsx:57` | **hardcoded** | rendered 44×44, `object-contain` | square / compact mark | **YES** | keep the exact filename, replace the file |
| 2 | Favicon set | `brand/favicon/` (empty, `.gitkeep`) | — | — | — | — | no | app currently serves `app/favicon.ico` |
| 3–5 | Hero slides | `hero/banner-image-01.png`, `-02.png`, `-03.png` | `heroConfiguration.slides[].image` | data | full-bleed cutout | **transparent-background PNG athlete cutouts** | **FROZEN** | do not replace |
| — | Unused hero | `hero/banner-image-04.png` | nothing | — | — | — | no | leave or ignore |
| 6 | About facility | `about/ironline-demo-about-gym-interior.webp` | `aboutConfiguration.image.src` | data | `4/5` → `3/2` (sm) → `16/11` (lg) | wide interior; must survive a portrait crop on mobile | **YES** | `[brand]-[locality]-gym-interior.webp` |
| 7 | Why-choose anchor | `why-choose-us/why-choose-01.jpg` | `whyChooseUsConfiguration.anchor.src` | data | `4/5` | portrait, single athlete, dark hall, headroom for crossing type | **YES** | `[brand]-[locality]-training-portrait.jpg` |
| 8–10 | Why-choose extras | `why-choose-us/why-choose-02..04.jpg` | `whyChooseUs[].image` — **not rendered** | data | — | — | no | skip |
| 11–14 | Program images | `programs/ironline-demo-program-{strength,conditioning,personal-training,group-training}.jpg` | `services[].image` | data | `16/10` inline row, `4/5` desktop panel | must read at both — keep the subject centred | optional per program | `[brand]-[locality]-program-strength.jpg` |
| 15–21 | Gallery | `gallery/ironline-demo-gallery-01..07.jpg` | `galleryItems[].src` | data | `1/1` rail cells + lightbox | square-safe; interior/equipment/people | **YES** (≥5 recommended) | `[brand]-[locality]-gallery-strength-floor.jpg` |
| 22 | FAQ background | `gallery/ironline-demo-gallery-02.jpg` | `Faq.tsx:19` | **hardcoded** | `fill` + `object-cover`, 20% opacity under a black/60 wash | wide, tolerant of heavy darkening | **YES** | replace the gallery file at that exact path, or point `galleryItems` elsewhere and accept the demo background |
| 23 | Pricing background | `pricing-bg.jpg` (assets root) | `Membership.tsx:71` | **hardcoded** | `fill` + `object-cover`, decorative | wide, already dark | **YES** | keep the exact filename, replace the file |
| 24 | Education artifact | `education/training-intelligence-weight-plate-loading-editorial.webp` | `trainingIntelligenceConfiguration.artifact.src` | data | `4/5` (`.s05-artifact-frame`) | portrait detail shot (hands/plate/bar) | optional — delete the key instead | `[brand]-[locality]-plate-detail.webp` |
| 25 | Contact background | same education file | `contact.background.src` | data | `fill` + `object-cover`, 12% opacity | wide, tolerant of darkening | optional | reuse |
| 26–27 | Transformations | `transformations/ironline-demo-transformation-01.webp`, `-02.webp` | `transformations[].image` | data | `--evidence-ratio`: `1/1` square, `4/5` portrait, `3/2` wide | diptych | **FROZEN** | do not replace for a demo |
| 28–31 | Social | `social/ironline-demo-social-01..04.jpg` | `lib/social.ts` — **orphaned** | data | — | — | no | skip |
| 32 | OG image | none | `seo.ogImage` (`undefined`) | data | 1200×630 recommended | wide | optional | `[brand]-[locality]-og.jpg` |

### 11.1 Image source rule

Image collection is **separate from Gemini text research**. Gemini may identify
image URLs, profile/Cover image references and image *opportunities* — it must
not be treated as the delivery channel. The operator manually collects and
approves every file and places it in the exact folder above. Every image needs
real, descriptive alt text written from the actual frame; alt text lives in
`lib/*.ts`, never in a component.

Priority load applies to the hero and the logo only; everything else lazy-loads.
`.webp` preferred for photography; the three hero cutouts must stay PNG for
alpha.

---

## 12. Repository inconsistencies found during discovery (reported, not changed)

1. **`lib/social.ts` is dead code.** No component imports it. The four
   `public/assets/social/*.jpg` files are unrendered. `MASTER-GYM-CUSTOMIZATION-SOP.md`
   step 6 and `MASTER-GYM-DATA-CONTRACT.md` §Social still direct operators to
   it. `INSTAGRAM-IMPLEMENTATION-SUMMARY.md` already notes it "can now be
   deprecated".
2. **SOP names a file that does not exist**: step 6 says `lib/membership.ts`;
   the real file is `lib/pricing.ts`.
3. **Asset contract filenames are stale**: it documents `brand/logo.svg` and
   `hero/hero-01..03.webp`; the repo ships
   `brand/ironline-training-demo-logo.jpg` and `hero/banner-image-01..03.png`.
   Following the doc literally would produce a broken logo, because the logo
   path is hardcoded in `Header.tsx`.
4. **Three asset paths are hardcoded in components** (logo, FAQ background,
   pricing background), so those three are file-replacement slots rather than
   data slots.
5. **Duplicate section numerals rendered**: `06` appears on both `Reviews`
   (hardcoded) and `Membership` (`pricing.index`); `07` on both
   `BetweenSessions` (`betweenSessionsConfiguration.index`) and `Gallery`
   (hardcoded).
6. **`whyChooseUs[].image` is authored but never rendered** — three of the four
   `why-choose-us/*.jpg` files are unused.
7. **`hero/banner-image-04.png` is unreferenced.**
8. **Schema optionals are unreachable from data**: `app/layout.tsx` passes
   `sameAs`, `geo` and `priceRange` as `undefined`, and `addressCountry` is
   `undefined` in `lib/schema.ts`. Collecting geo coordinates or social profiles
   cannot improve the structured data without a code change.
9. **No fields exist** for: business category, branch count, booking link,
   website URL (other than `seo.canonical`), special/holiday hours, founder or
   trainer bios, amenities beyond `aboutConfiguration.attributes`.

None of these were modified. Fixing 1–3 is a documentation task; 4–8 would each
be a Master Template improvement decision.

---

## 13. Research / manual / owner matrix

| Field | Primary source | Gemini | Manual | Owner verification | Fallback if not found |
|---|---|---|---|---|---|
| Gym name | Official site / GBP | YES | no | YES | template name |
| Tagline | Site / Instagram bio | YES | YES (may need composing from sourced wording) | YES | template tagline |
| Description | Site / GBP "about" | YES | YES (trim to length) | YES | template description |
| Accent colour | Logo | no | YES | YES | demo `#D6FF3F` |
| Phone | GBP | YES | no | YES | template phone |
| WhatsApp number | GBP / site / Instagram | YES | no | YES | template number |
| WhatsApp prefill | — | no | YES | YES | template message |
| Email | Site / GBP | YES | no | YES | row omitted |
| Address parts | GBP / Maps | YES | no | YES | line omitted |
| Landmark | GBP / site (only if stated) | YES | no | YES | not rendered |
| Map URL | Google Maps | YES | YES (canonical share URL) | YES | "Get directions" hidden |
| Hours (7 days) | GBP | YES | no | YES | template hours |
| Zones / attributes (`verified`) | Site / GBP attributes | YES | YES (set each flag) | YES | `verified: false` ⇒ hidden |
| Programs (name/description) | Site / Instagram / GBP services | YES | no | YES | template programs |
| Program `verified` | — | no | YES | YES | `false` ⇒ hidden |
| Why-choose principles | Site / reviews / Instagram | YES | YES (rewrite without superlatives) | YES | template principles |
| Google rating | GBP | YES | no | YES | template `4.8` |
| Review count | GBP | YES | no | YES | template `126` |
| GBP URL | Google Maps | YES | no | YES | template URL |
| Selected reviews (name + text + rating) | GBP | YES (verbatim) | YES (select 3–5) | YES | template demo reviews |
| Review tagline | derived from real reviews | YES (sentiment) | YES (write) | YES | template tagline |
| Prices (all terms) | Site / GBP / credible listings | YES | no | YES | `NOT FOUND` ⇒ keep template value, or `priceStatus: "contact"` |
| Offer ladders (%) | Owner only | no | no | **YES — required** | demonstration values 15/25, 10/20, 10 |
| Instagram profile + handle | Instagram | YES | no | YES | template `@blogspage_ai` |
| Reel URLs (3–4) | Instagram | YES | YES (verify each embeds) | no | template reels |
| FAQ Q&A | Site / GBP Q&A / policies | YES | YES (drop anything unanswerable) | YES | template demo Q&A |
| SEO title / description | composed from name + locality + city | YES (inputs) | YES (compose) | YES | template SEO |
| Canonical URL | deployment | no | YES | no | `https://example.com` |
| OG image | — | no | YES | no | `undefined` ⇒ no OG block, schema `image: ""` |
| Logo / favicon | Owner or public profile | YES (identify) | YES (collect) | YES | demo logo |
| Gallery images | Public sources / Instagram | YES (identify) | YES (collect) | YES | demo gallery |
| Program / about / anchor images | Public sources / Instagram | YES (identify) | YES (collect) | YES | demo images |
| **Transformations** | Owner | **NO** | **NO** | YES (later phase) | keep demo transformations |
| **Hero copy + artwork** | — | **NO** | **NO** | no | frozen |
| **Educational copy (05 / 07)** | — | **NO** | **NO** | no | frozen |
| `gymNote` lines (05 / 07) | Owner | no | no | **YES** | delete the demo lines |
| `reviewedBy` (05 / 07) | Owner | no | no | YES | `undefined` ⇒ not rendered |
| `contact.form.responseNote` | Owner | no | no | YES | `undefined` ⇒ not rendered |
| Env vars (Resend, inbox) | Operator / owner | no | YES | YES | `503` + WhatsApp fallback copy |

---

## 14. PROSPECT_DEMO vs FINAL_CLIENT

### PROSPECT_DEMO

1. Use public research only. Publicly reported claims are acceptable **if
   labelled** in the research package.
2. Never invent a missing fact. `NOT FOUND` ⇒ keep the template value or switch
   the feature off.
3. Keep frozen: Hero (copy, artwork, composition), both educational modules,
   Transformations, all component copy and layout.
4. Keep demo transformations and the demo offer ladders.
5. Leave `contact.dataVerified: false` unless the details are genuinely
   verified — the placeholder notice is the honest state for a demo.
6. Delete the two demo `gymNote` lines (`trainingGoals[0].gymNote`,
   `stations[0].gymNote`) unless the gym's real arrangement is known — they are
   operational claims.
7. Leave `reviewedBy` and `form.responseNote` undefined.
8. Run `npm run lint` and `npm run build`; then the browser QA list in
   `MASTER-GYM-CUSTOMIZATION-SOP.md` §10.
9. Deploy to Vercel, record the screen capture, send demo URL + recording +
   sales PDF.

Everything researched in this phase is **PROVISIONAL UNTIL OWNER-VERIFIED**.

### FINAL_CLIENT

1. Owner verifies or corrects every factual field: name, tagline, description,
   phone, WhatsApp, email, address, landmark, hours, programs, principles,
   prices, rating/reviews, FAQ answers.
2. Replace provisional values; set `contact.dataVerified: true`.
3. Replace the offer ladders with approved commercial terms.
4. Replace transformation cases with consented real cases (§5) or switch
   `sections.transformations: false`.
5. Add the real `gymNote` lines if the gym has a genuine arrangement.
6. Set `seo.canonical` to the live domain, supply `seo.ogImage`, configure the
   Resend environment variables, confirm sender-domain verification.
7. Apply any requested customisation — and if it needs a component change,
   treat it as a Master Template improvement or a separate paid project, per
   `AGENTS.md`.

---

## 15. Section flag decision table — `lib/sections.ts`

| Flag | Set `false` when | Effect |
|---|---|---|
| `trust` | no rating/count **and** no locality | rail hidden (component also self-nulls) |
| `about` | never for a demo | — |
| `programs` | never — mandatory | `Programs` self-nulls with no verified service |
| `whyChooseUs` | never — mandatory | — |
| `transformations` | only at FINAL_CLIENT if the owner has no consented case | section hidden; `ContactDialog` loses its image |
| `trainingIntelligence` | never — educational, needs no verification | — |
| `reviews` | gym has no Google reviews | self-nulls at `reviewCount === 0` |
| `betweenSessions` | never — educational | — |
| `membership` | gym publishes no pricing (or set `pricing.enabled: false`) | hero offer CTA degrades to WhatsApp |
| `gallery` | fewer than ~5 usable images | self-nulls when empty |
| `instagram` | no public Instagram | self-nulls when `items` is empty |
| `faq` | no answerable questions | self-nulls when empty |
| `contact` | never — mandatory | — |
| `location` | never — mandatory | — |

A section renders only when its flag is `true` **and** its data passes the
component's own gate. Missing data must never produce "TBD", an empty card or a
broken widget.

---

## 16. Operator checklist (prospect demo)

- [ ] Clone the master repo. No component edits.
- [ ] Receive the Gemini package (`gym-research-schema.md` format). Reject it if
      any factual field lacks `source` and `status`.
- [ ] Collect and approve images manually; place them in the §11 folders with
      the documented names.
- [ ] Replace the three hardcoded-path files: brand logo, the gallery file used
      as the FAQ background, `pricing-bg.jpg`.
- [ ] Edit `lib/business.ts` — all identity, contact, address, hours, map,
      accent.
- [ ] Edit `lib/seo.ts` — title, description, canonical.
- [ ] Edit `lib/services.ts` — real programs, `verified` flags, images.
- [ ] Edit `lib/about.ts` — image + alt, zones, attributes, `verified` flags.
- [ ] Edit `lib/why-choose-us.ts` — principles + anchor image/alt.
- [ ] Edit `lib/reviews.ts` — rating, count, GBP URL, 3–5 verbatim reviews,
      derived tagline.
- [ ] Edit `lib/pricing.ts` — real prices or `priceStatus: "contact"`, or
      `enabled: false`.
- [ ] Edit `lib/gallery.ts` — real src + alt, in display order.
- [ ] Edit `lib/instagram.ts` — profile URL, handle, 3–4 verified Reel URLs.
- [ ] Edit `lib/faq.ts` — only answerable questions.
- [ ] Edit `lib/sections.ts` — flags per §15.
- [ ] Delete the two demo `gymNote` lines.
- [ ] Confirm untouched: `lib/hero.ts`, `lib/transformations.ts`, the
      educational copy in `lib/training-intelligence.ts` and
      `lib/between-sessions.ts`, festival dates, all of `components/**`.
- [ ] `npm run lint` && `npm run build` — both clean.
- [ ] Browser QA per `MASTER-GYM-CUSTOMIZATION-SOP.md` §10.
- [ ] Deploy; verify canonical/robots match the live domain.
