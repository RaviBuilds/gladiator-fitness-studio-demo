# Master Gym Data Contract

All shared types live in `lib/types.ts`. Each data file below exports exactly
one typed constant. No business content lives in components or JSX.

## Business — `lib/business.ts`

```ts
interface BusinessAddress {
  addressLine: string;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
  landmark?: string;
}

interface BusinessHours {
  day: string;   // e.g. "Monday"
  open: string;  // e.g. "05:00 AM"
  close: string; // e.g. "11:00 PM"
}

interface WhatsAppConfig {
  number: string;  // international format, e.g. "+91XXXXXXXXXX"
  message: string; // prefilled message text
}

interface Business {
  name: string;
  tagline: string;
  description: string;
  phone: string;
  whatsapp: WhatsAppConfig;
  email?: string;
  address: BusinessAddress;
  hours: BusinessHours[];
  mapUrl: string;       // verified Google Maps / Place URL
  accentColor: string;  // single hex/hsl token, contrast-checked
}
```

Public business information only. Never put API keys, tokens, or server
credentials in this file.

## Services — `lib/services.ts`

```ts
interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  image?: string;
  verified: boolean;   // only verified:true services render
  ctaLabel?: string;
  ctaHref?: string;
}
```

A service can exist in the data file and remain disabled with
`verified: false`. This is the direct mechanism that prevents an unverified
program from silently appearing on a live gym website.

## Why Choose Us — `lib/why-choose-us.ts`

```ts
interface WhyChooseUsItem {
  title: string;
  description: string;
  image?: string;                   // not rendered by Section 03 (see below)
}

interface WhyChooseUsAnchor {
  src: string;
  alt: string;                      // describes the photograph, not the claims
  objectPosition?: string;          // e.g. "50% 22%"
}

interface WhyChooseUsConfiguration {
  index: string;                    // "03"
  eyebrow: string;                  // "Why Choose Us"
  headlineLines: string[];          // manifesto, one short line per entry
  accentLastLine?: boolean;
  deck?: string;                    // one mono statement, never a claim
  principlesLabel: string;          // "Training principles"
  anchor: WhyChooseUsAnchor;
}
```

`whyChooseUs: WhyChooseUsItem[]` backs the mandatory Why Choose Us section
(see `docs/MASTER-GYM-WEBSITE-ARCHITECTURE.md`). This type/file pair is not
present in the original specification docx; it was added to this canonical
foundation following the exact same typed-data-file pattern as every other
`lib/*.ts` module, so the section stays fully data-driven rather than having
its copy hardcoded into the `WhyChooseUs` component. `WhyChooseUsItem` lives
in `lib/types.ts` alongside every other shared type.

Each item is a real, verifiable differentiator about the gym — real coaching
model, real equipment/capacity facts, real scheduling structure, real
policies. Never invent unverifiable superlatives (e.g. "best gym in
[city]") to fill this list. Since the section is mandatory, a clone should
always populate at least a few genuine items here rather than leaving
generic placeholder copy in production.

`whyChooseUsConfiguration: WhyChooseUsConfiguration` carries the composition
around those items — the Performance Blueprint sheet (see section 10 of
`docs/MASTER-PASS-1-DESIGN-DIRECTION.md`). Notes for a clone:

- **One anchor photograph.** Section 03 is a campaign portrait annotated by
  the principles, not a per-row image swap, so `anchor` is the only image the
  section renders. `WhyChooseUsItem.image` stays in the contract because a
  gym's data may already carry per-principle imagery for other uses, but it is
  intentionally ignored here.
- **`anchor.alt` describes the frame.** Never restate a differentiator as alt
  text: the principles are already readable text, and describing a photo as
  "illustrating" a claim attaches an unverifiable meaning to it.
- **Manifesto lines are short.** They cross the top of the photograph on
  desktop; keep each line to roughly 24 characters or fewer (enforced by
  `scripts/why-choose-us.test.mjs`).
- **Any count composes.** The field places the first four principles around
  the athlete and continues below him, so 4, 5 or 6+ principles all work
  without authoring coordinates. Nothing else on the sheet is text: the only
  other glyphs are derived numerals (`nn / NN`).

## Reviews — `lib/reviews.ts`

```ts
interface Review {
  name: string;
  text: string;
}

interface GoogleReviews {
  rating: number;
  reviewCount: number;
  tagline: string;                  // derived from review sentiment, not invented
  googleBusinessProfileUrl: string;
  reviews: Review[];                // exactly 3 in the standard product
}
```

No runtime scraping. No invented review content or reviewer avatars.

## Membership — `lib/membership.ts`

```ts
interface MembershipPlan {
  name: string;
  price: number;
  duration: string;
  description?: string;
  features: string[];
}

interface MembershipConfiguration {
  enabled: boolean;
  currency: string;
  plans: MembershipPlan[];
}
```

When `enabled: false`, the membership section does not render. No "TBD", no
empty pricing cards.

## Gallery — `lib/gallery.ts`

```ts
interface GalleryItem {
  src: string;
  alt: string;       // mandatory, describes the actual image
  width?: number;
  height?: number;
  caption?: string;
}
```

`galleryItems: GalleryItem[]` is authoritative for display order. Filename
order is not a data dependency.

## Social — `lib/social.ts`

```ts
interface SocialPost {
  url: string;
  image: string;
  label?: string;
}

interface SocialConfiguration {
  instagramHandle: string;
  instagramUrl: string;
  posts: SocialPost[];  // 4-6 curated posts; empty array is valid
}
```

No live/authenticated Instagram API dependency in v1. Empty `posts` renders a
"Follow us on Instagram" fallback, never a broken widget.

## SEO — `lib/seo.ts`

```ts
interface SEOConfiguration {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  robots?: string;
}
```

Consumed once, centrally, by `app/layout.tsx`'s Metadata API. Never
duplicated into page components.

## Sections — `lib/sections.ts`

```ts
interface SectionConfiguration {
  trust: boolean;
  about: boolean;
  programs: boolean;
  whyChooseUs: boolean;
  transformations: boolean;
  trainingIntelligence: boolean;
  reviews: boolean;
  betweenSessions: boolean;
  membership: boolean;
  gallery: boolean;
  instagram: boolean;
  faq: boolean;
  contact: boolean;
  location: boolean;
}
```

The Factory control panel. Toggling a flag hides a section without editing
any component.

## Hero — `lib/hero.ts`

```ts
interface HeroSlide {
  image: string;
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
}

interface HeroConfiguration {
  slides: HeroSlide[]; // up to 3, default narrative: place -> people -> training
}
```

## Section 01 / About — `lib/about.ts`

```ts
type TrainingIconName =
  | "strength" | "cardio" | "coaching" | "equipment" | "floor";

interface FacilityZone {
  id: string;
  label: string;      // short signage-style label, e.g. "Strength"
  detail?: string;    // one factual line, never a superlative
  icon: TrainingIconName;
  verified: boolean;  // only verified:true zones render
}

interface FacilityAttribute {
  id: string;
  label: string;
  value?: string;
  verified: boolean;  // only verified:true attributes render
}

interface AboutConfiguration {
  index: string;             // "01"
  eyebrow: string;
  headlineLines: string[];   // one authored line per entry
  accentLastLine?: boolean;
  image: { src: string; alt: string };  // ONE photo — Section 01 is not a gallery
  imageLabel?: string;       // technical caption chip on the frame
  frameLabel?: string;       // vertical label crossing the frame edge
  zonesLabel: string;
  attributesLabel: string;
  scheduleLabel: string;
  zones: FacilityZone[];         // 4 primary training-environment modules
  attributes: FacilityAttribute[]; // secondary support metadata
  showSchedule: boolean;
}
```

Backs Section 01 (`components/sections/About.tsx`), the facility /
training-floor story. Two rules matter here:

1. **The narrative is not duplicated.** Section 01 renders
   `business.description` and `business.address.locality`; `lib/about.ts`
   carries structure and labels only.
2. **The schedule is derived, never authored.** `scheduleWindows()` collapses
   `business.hours` into consecutive day ranges sharing the same open/close
   window (e.g. `Mon–Fri / 05:00 AM – 11:00 PM`). Beyond three distinct
   windows it renders nothing and the full timetable stays with the location
   section. A gym's hours therefore cannot drift between Section 01, the
   location section, and the LocalBusiness structured data.

`verified: false` on a zone or attribute is the same gate as
`Service.verified` — keep the row in the file as a record of what was checked
and found absent, rather than deleting it.

## Transformations — `lib/transformations.ts`

```ts
interface TransformationItem {
  image: string;                  // combined before/after diptych (required)
  imageAlt: string;
  beforeImage?: string;           // only when two INDEPENDENT photos exist
  afterImage?: string;            // (never crop `image` in half to fake this)
  beforeImageAlt?: string;
  afterImageAlt?: string;
  beforeLabel: string;
  afterLabel: string;
  mediaAspect?: "portrait" | "square" | "wide";
  personName?: string;
  journey?: string;               // "Fat loss" / "Recomposition" / ...
  story?: string;
  metrics?: TransformationMetrics;
  training?: TransformationNotationItem[];
  nutrition?: TransformationNotationItem[];
  coachNotes?: string[];          // 2-5 short phrases, e.g. "Meal discipline"
  consentVerified: boolean;       // only render when true
}

interface TransformationMetrics {  // NUMBERS ONLY — every field optional
  durationMonths?: number;
  beforeWeightKg?: number;  afterWeightKg?: number;
  beforeBmi?: number;       afterBmi?: number;
  beforeBodyFatPct?: number; afterBodyFatPct?: number;
  beforeWaistCm?: number;   afterWaistCm?: number;
  sessionsPerWeek?: number;
}

interface TransformationNotationItem {
  label: string;   // "Strength"
  value: string;   // "3x / week"
  note?: string;   // "Coach-led"
}
```

Never invent kilos lost, timeframe, or body composition figures.

Rules the component enforces, so the data layer only has to be truthful:

- `metrics` holds **numbers only**. Labels, units, the `before → after` arrow
  and the signed change are all derived in
  `components/sections/transformationDossier.ts`, so a figure cannot be
  mislabelled and a claim cannot be typed into a metric slot.
- A metric renders only when **every** figure it needs exists (a before/after
  pair needs both halves). Missing figures produce **no cell** — never a dash,
  never "n/a". Non-numbers, NaN and non-positive values are dropped.
- At most 6 metrics render, in a fixed order: duration, weight, body fat, BMI,
  waist, training load. Supplying more data cannot break the composition.
- Supply only 2-5 `training`, 2-4 `nutrition` and 2-5 `coachNotes` entries —
  the strongest verified factors for that member, not a full diet plan.
- `mediaAspect` picks the fixed media frame for the supplied photograph:
  `portrait` (4/5) for one phone photo, `square` (1/1, the default) for a
  side-by-side diptych, `wide` (3/2) for a landscape or three-up composite.
  The photograph is always contained inside the frame, never cropped, so this
  is a framing choice and never a loss of transformation anatomy.
- The master template ships two **demo** cases whose figures are synthetic and
  flagged as such in the file. Delete or replace them before any real build.

## Section 05 / Training Intelligence — `lib/training-intelligence.ts`

```ts
type TrainingEmphasisLevel = 1 | 2 | 3;   // maintain / supporting / primary

interface TrainingLever {
  id: string;                             // referenced by TrainingGoal.emphasis
  label: string;
  shortLabel?: string;                    // compact label for narrow layouts
}

interface TrainingGoal {
  id: string;
  label: string;
  premise: string;
  path: string;                           // short training-path readout
  emphasis: Record<string, TrainingEmphasisLevel>;
  priorities: { title: string; detail: string }[];
  mistakes: { mistake: string; instead: string }[];
  track: string[];
  coachNote: string;
  programId?: string;                     // a lib/services.ts id
  gymNote?: string;                       // optional "how we coach this here"
  enabled: boolean;                       // the per-gym on/off switch
}
```

Plus `TrainingIntelligenceConfiguration` (index, eyebrow, headline lines, deck,
every label, the CTA labels and message template, the disclaimer, the optional
`artifact` and the `levers` taxonomy). Full field documentation lives in
`lib/types.ts`.

This module is **different in kind** from every other file in this document.
The others hold business facts that must be verified per gym; this one holds
the factory's global educational library — general training principles written
and reviewed once and reused across every clone.

- **A clone edits:** `enabled` and goal order, `programId`, `gymNote`, the CTA
  labels and `ctaMessageTemplate`, and `artifact`. Nothing else.
- **A clone does not edit** the lever taxonomy, the priorities / mistakes /
  track framework, the coach notes or the disclaimer. Rewriting reviewed
  educational copy per gym is how a factory ships unreviewed fitness advice at
  scale.
- **No numeric field exists anywhere in this contract.** No percentages,
  calories, macros, protein or water targets, sleep targets, heart-rate zones,
  body-fat targets or guaranteed timeframes — so an operator has no slot in
  which to type a measurement. `emphasis` is an ordinal 1-3 teaching weight
  rendered as plate markers plus a word ("Maintain" / "Supporting" /
  "Primary focus"), never a score.
- **`programId` is verification-gated.** The handoff link renders only when the
  id resolves to a service that is actually `verified: true`, so a goal can
  never advertise a program the gym does not run. Resolved on the server.
- **A lever a goal does not weight is omitted**, never defaulted and never
  rendered as a dash.
- **`artifact` is optional and subordinate.** Delete it and the chapter still
  reads as a gym training interface — the instrument, not the photograph,
  carries the section. This is a standing factory rule, because future gyms may
  have no suitable photography.
- The section renders correctly with 3, 4, 5, 6 or more enabled goals with no
  layout change; the rail geometry is derived from the count.

## Section 07 / Between Sessions — `lib/between-sessions.ts`

```ts
interface IntervalStation {
  id: string;
  name: string;                           // "Fuel" / "Recover" / "Move" / "Ready?"
  marker: string;                         // RELATIVE, e.g. "T+ 0-2 H", "That night"
  intervalLabel: string;                  // plain-language restatement
  principle: string;                      // one clear statement
  why: string;                            // short explanatory paragraph
  practice: string[];                     // two or three practical ideas
  watchFor?: string[];                    // signals to raise with a coach
  gymNote?: string;                       // optional "how we coach this here"
  enabled: boolean;
}

interface PreSessionCheck {
  label: string; intro: string;
  items: { id; prompt; detail; escalates?: boolean }[];
  escalationLabel: string; escalation: string;
  scope: string;                          // "Nothing here is scored, saved or sent"
}

interface TrainingWeekModule {
  label; intro; dayLabels[7]; dayNames[7];
  patterns: { id; label; days: boolean[] }[];   // illustrative samples only
  gaps: { short; standard; long }: { label; detail };
  scope: string;
  // plus the readout labels
}

interface BodyMapGroup {
  id: string;
  label: string;                          // "Shoulders" ... "Legs"
  regions: { id: string; label: string }[];     // id must exist in the geometry
  note: string;                           // what training that region involves
  enabled: boolean;
}
```

Plus `BodyMapModule` (headline lines, deck, the view/group/note labels, the two
state captions, the figure description, the accessible summary label and the
outcome-variability disclaimer) and `BetweenSessionsConfiguration` (index,
eyebrow, headline lines, deck, every log label, the single CTA, the scope line
and the optional disabled `artifact`). Full field documentation lives in
`lib/types.ts`.

Like `lib/training-intelligence.ts` this module is the factory's **global
educational library**, not per-gym business facts — and the bar is higher here
because the subject matter is food, sleep and pain.

- **A clone edits:** `enabled` and order per station and per body-map group,
  `gymNote`, the CTA label/message/note, and the language of every label.
- **A clone does not edit** the station framework, the interval markers, the
  muscle-group taxonomy, the educational copy, the pre-session check wording,
  the state captions or the disclaimers.
- **No numeric field exists anywhere in this contract, and no educational
  sentence contains a numeral.** No calories, macros, protein or hydration
  figures, sleep durations, body-fat targets, supplements, heart-rate zones or
  guaranteed timeframes. Locked by `scripts/between-sessions.test.mjs`.
- **Interval markers are relative to the last rep**, never clock times — the
  factory cannot know when a member trains.
- **The pre-session check cannot become an instrument.** There is no field for a
  score, total, percentage or recommendation; the component never counts the
  boxes; and nothing is persisted or transmitted. Exactly one item sets
  `escalates`, and raising it shows a note that defers to a coach and a
  clinician rather than assessing anything.
- **The body map is one figure and one shared anatomy.** Region `id`s reference
  the fixed geometry table in `components/sections/bodyMap.ts`; an unknown id is
  dropped and a group left with no drawable region is dropped with it, so a
  typo costs one label rather than breaking the figure. The two rendered states
  are derived from the SAME authored points by a horizontal-only contour swell,
  so identical height, head, joint heights and limb placement are guaranteed by
  construction — the contract has no way to express a different body, and
  `disclaimer` must state that individual outcomes vary.
- **The state labels are a training state, not a promise.** `baseState.label` and
  `trainedState.label` must describe training behaviour ("Not training
  regularly" / "Training regularly"). The words before, after, transformation,
  results and guaranteed are forbidden anywhere in this block and are asserted
  against in `scripts/between-sessions.test.mjs`.
- **`artifact` is disabled by default and must stay that way** unless a gym has
  a genuinely strong supporting photograph. Section 07 is composed as a
  zero-raster-image chapter; the body map SVG is the primary visual asset.
- The section renders correctly with any subset of stations and groups enabled;
  station numbering and group numbering are assigned after filtering, so there
  are never gaps in the sequence. With no stations and no groups it renders
  nothing at all.

## FAQ — `lib/faq.ts`

```ts
interface FaqItem {
  question: string;
  answer: string;
}
```

Only generated from actual business information. If the information is not
available, the FAQ entry is not created.
