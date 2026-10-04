/**
 * Master Gym Data Contract — shared types.
 *
 * See docs/MASTER-GYM-DATA-CONTRACT.md for the authoritative explanation of
 * every field. Components consume these types; they never define their own
 * ad-hoc content shapes.
 */

export interface BusinessAddress {
  addressLine: string;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
  landmark?: string;
}

export interface BusinessHours {
  day: string;
  open: string;
  close: string;
}

export interface WhatsAppConfig {
  /** International format, e.g. "+91XXXXXXXXXX" */
  number: string;
  /** Prefilled message text for the wa.me deep link */
  message: string;
}

export interface Business {
  name: string;
  tagline: string;
  description: string;
  phone: string;
  whatsapp: WhatsAppConfig;
  email?: string;
  address: BusinessAddress;
  hours: BusinessHours[];
  /** Verified Google Maps / Place URL */
  mapUrl: string;
  /**
   * PRIMARY brand token (hex/hsl) — action / energy / major brand emphasis.
   * Injected as --accent (aliased --brand-primary) in app/layout.tsx.
   * Contrast-checked against fixed base tokens.
   */
  accentColor: string;
  /**
   * SECONDARY brand token (hex/hsl) — supporting hierarchy: eyebrows,
   * metadata, technical marks, secondary states, focus indicators.
   * Injected as --brand-secondary in app/layout.tsx; every derived
   * --brand-secondary-* variant is computed from it in app/globals.css.
   * This is the ONLY place a gym's secondary hex should be written.
   */
  secondaryColor: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  image?: string;
  /** Only verified:true services render on the live site */
  verified: boolean;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface Review {
  name: string;
  text: string;
  /**
   * Optional per-review star rating (1-5). Only render a review's stars when
   * this is present — never assume every review is a 5-star review just
   * because the aggregate `GoogleReviews.rating` is high.
   */
  rating?: number;
}

export interface GoogleReviews {
  rating: number;
  reviewCount: number;
  /** Derived from real review sentiment, never invented */
  tagline: string;
  googleBusinessProfileUrl: string;
  /**
   * Direct "write a review" link for the Google Business Profile (the share
   * link Google provides under "Ask for reviews"). Optional and NEVER guessed:
   * when unset, the footer trust card shows no review CTA.
   */
  reviewUrl?: string;
  /**
   * Public path of a review QR-code image (e.g. "/assets/reviews/gbp-review-qr.png")
   * that encodes `reviewUrl`. Optional: when unset, no QR renders.
   */
  reviewQrSrc?: string;
  /** Exactly 3 in the standard product */
  reviews: Review[];
}

/* ===========================================================================
 * Section 06 — PRICING / MEMBERSHIP REGISTER
 *
 * A reusable, data-driven pricing register. This is a PURE FRONTEND template:
 * there is no CMS, database, API or backend pricing source. Every price, name,
 * duration, description, CTA label and availability state is authored in
 * lib/pricing.ts, and the component consumes it verbatim. A future gym is
 * customized by editing the data file, never the component.
 *
 * FACTORY SPLIT
 *   Factory code — layout, card design, typography, spacing, the atmospheric
 *                  background treatment, responsive behaviour, motion,
 *                  accessibility, and INR formatting.
 *   Data file    — plan names, durations, prices, currency, descriptions, CTA
 *                  labels, price status, and the special-training entry.
 *
 * SOURCE-FIRST / HONESTY (enforced by the type system where possible)
 *   Prices are NUMERIC, never pre-formatted strings, so the component owns all
 *   currency formatting (Intl.NumberFormat) and a gym operator can only supply
 *   a figure, never a formatted claim. A plan carries an explicit price status
 *   rather than a magic number, so "price on request" and "not shown publicly"
 *   are first-class states instead of a fake ₹0.
 * ========================================================================= */

/**
 * How a plan's price is treated. DELIBERATELY a closed union, not a boolean or
 * a sentinel figure:
 *   - "exact"   render the numeric `price` with INR formatting.
 *   - "contact" do NOT show an amount; render the configurable
 *               `PricingConfiguration.contactLabel` (e.g. "CONSULT
 *               MANAGEMENT") instead. `price` may be omitted.
 *   - "hidden"  the plan does not render publicly at all — no card, no
 *               placeholder. Used for a plan a gym keeps in the data file but
 *               is not currently offering to the public.
 */
export type PricingPriceStatus = "exact" | "contact" | "hidden";

/**
 * One standard membership plan (Daily Pass, 1 Month, 1 Year, …).
 *
 * `price` is a plain number in the configuration's `currency` minor-unit-free
 * major units (e.g. 2500 => ₹2,500). It is optional because a `contact`-status
 * plan has no public amount, and it is never rendered directly — the component
 * formats it. Only plans whose `priceStatus` is not "hidden" render.
 */
export interface PricingPlan {
  /** Stable key, e.g. "daily". */
  id: string;
  /** Display name, e.g. "Daily Pass". */
  name: string;
  /** Human duration/term, e.g. "1 Day", "1 Month", "12 Months". */
  duration: string;
  /**
   * Compact supporting label rendered as quiet mono metadata, e.g. "ONE DAY",
   * "PER MONTH", "BILLED ONCE". Never a claim, discount or urgency line.
   */
  term: string;
  /** Numeric amount in `currency`. Omit for a `contact`-status plan. */
  price?: number;
  /** Availability / display state. See PricingPriceStatus. */
  priceStatus: PricingPriceStatus;
  /** CTA label, e.g. "ENQUIRE". The CTA links to the site-wide WhatsApp action. */
  ctaLabel: string;
}

/**
 * The Special Training entry. Structurally a plan (same fields), but rendered
 * as a distinct wide editorial row rather than one of the six compact cards —
 * it carries a short description the standard cards do not. Kept as its own
 * type so a gym cannot accidentally drop it into the six-card grid.
 */
export interface SpecialTraining {
  id: string;
  /** Service name, e.g. "Personal Coaching". */
  name: string;
  duration: string;
  term: string;
  price?: number;
  priceStatus: PricingPriceStatus;
  /** Short editorial description. One or two sentences, never a claim. */
  description: string;
  ctaLabel: string;
}

export interface PricingConfiguration {
  /**
   * Entirely conditional. When false, the whole section does not render — no
   * empty register, no "pricing TBD". A gym that does not publish pricing sets
   * this to false.
   */
  enabled: boolean;
  /** ISO 4217 currency code, e.g. "INR". Drives Intl.NumberFormat. */
  currency: string;
  /**
   * BCP 47 locale for number formatting, e.g. "en-IN" so 100000 => ₹1,00,000.
   * Kept in data so a clone in another market formats correctly.
   */
  locale: string;
  /** Small mono eyebrow, e.g. "Membership / Pricing". */
  eyebrow: string;
  /** Section index numeral, e.g. "06". */
  index: string;
  /** Display heading lines, one entry per line. */
  headlineLines: string[];
  /** Render the final headline line in the accent treatment. */
  accentLastLine?: boolean;
  /** Compact supporting deck beneath the heading. */
  deck?: string;
  /**
   * Label rendered in place of a price for `contact`-status entries, e.g.
   * "Consult management". Configurable so a clone can reword it.
   */
  contactLabel: string;
  /** Group label above the special-training row, e.g. "Special training". */
  specialLabel: string;
  /** The six (or more) standard plans, in display order. */
  plans: PricingPlan[];
  /** Optional distinct special-training entry. Omit to hide the row entirely. */
  special?: SpecialTraining;
}

export interface GalleryItem {
  src: string;
  /** Mandatory. Must describe the actual image, never keyword-stuffed. */
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
}

export interface SocialPost {
  url: string;
  image: string;
  label?: string;
}

export interface SocialConfiguration {
  instagramHandle: string;
  instagramUrl: string;
  /** 4-6 curated posts; empty array is valid and renders a fallback CTA */
  posts: SocialPost[];
}

export interface SEOConfiguration {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  robots?: string;
}

export interface SectionConfiguration {
  trust: boolean;
  about: boolean;
  programs: boolean;
  whyChooseUs: boolean;
  transformations: boolean;
  /** Section 05 — Training Intelligence (educational training loadout). */
  trainingIntelligence: boolean;
  reviews: boolean;
  /** Section 07 — Between Sessions (interval log + body map). Educational. */
  betweenSessions: boolean;
  membership: boolean;
  gallery: boolean;
  instagram: boolean;
  faq: boolean;
  contact: boolean;
  location: boolean;
}

/**
 * Verified NUMERIC figures for one transformation case.
 *
 * Every field is optional and every field is a number, never a
 * pre-formatted string: the component owns all labels, units, arrows and
 * derived deltas (see components/sections/transformationDossier.ts), so a
 * gym operator can only supply facts, never presentation — and can never
 * type a claim into a metric slot.
 *
 * A metric cell renders ONLY when every input it needs is present (a
 * before/after pair needs both halves). Missing figures are omitted
 * entirely: the dossier never renders "BMI —" or an empty placeholder.
 * Deltas are arithmetic on supplied numbers, so nothing is invented.
 *
 * Populate from real, member-approved measurements only. If a gym has no
 * figures, omit `metrics` and the case still renders as photograph + story.
 */
export interface TransformationMetrics {
  /** Programme length in whole months. */
  durationMonths?: number;
  beforeWeightKg?: number;
  afterWeightKg?: number;
  beforeBmi?: number;
  afterBmi?: number;
  beforeBodyFatPct?: number;
  afterBodyFatPct?: number;
  beforeWaistCm?: number;
  afterWaistCm?: number;
  /** Training sessions per week across the programme. */
  sessionsPerWeek?: number;
}

/**
 * One line of training / nutrition / habit notation for a case, e.g.
 * label "Strength", value "3x / week". Free text because these vary per gym
 * and per member — which is exactly why they must be supplied verbatim by
 * the gym and are rendered verbatim, never templated into a claim.
 */
export interface TransformationNotationItem {
  label: string;
  value: string;
  /** Optional micro-qualifier, e.g. "coach-led". */
  note?: string;
}

/**
 * How the supplied photograph should be framed by the fixed media plate.
 * Three tokens only — the frame's aspect ratio, never a pixel height:
 *   - "portrait": one standing phone photo (4/5)
 *   - "square":   a combined before/after diptych, two portraits side by
 *                 side (1/1) — the default for `image`
 *   - "wide":     a landscape or three-up composite (3/2)
 * The photograph is always contained, never cropped, inside the frame.
 */
export type TransformationMediaAspect = "portrait" | "square" | "wide";

export interface TransformationItem {
  /**
   * Combined before/after diptych (a single photograph with the before half
   * and after half already composed side-by-side). This is the required
   * fallback artifact — the master demo data and most real gym submissions
   * only have this. Always required so a case can never render with no
   * image at all.
   */
  image: string;
  /** Mandatory, descriptive alt text for `image`. */
  imageAlt: string;
  /**
   * Optional INDEPENDENT before/after photographs. Only supply these when
   * the gym genuinely has two separate photographs of the same member/angle
   * — never crop `image` in half to fake this. When both are present the
   * component renders an accessible keyboard-operable comparison scrubber
   * instead of the static diptych.
   */
  beforeImage?: string;
  afterImage?: string;
  beforeImageAlt?: string;
  afterImageAlt?: string;
  beforeLabel: string;
  afterLabel: string;
  personName?: string;
  /**
   * The member's goal category in the gym's own words, e.g. "Fat loss",
   * "Muscle building", "Recomposition", "Conditioning". Rendered verbatim as
   * the case's journey tag; never inferred from the figures.
   */
  journey?: string;
  story?: string;
  /** Verified numeric figures. Omit entirely when the gym has none. */
  metrics?: TransformationMetrics;
  /** How the member trained. 2-5 lines; omit when unverified. */
  training?: TransformationNotationItem[];
  /** Nutrition and daily habits. 2-4 lines; omit when unverified. */
  nutrition?: TransformationNotationItem[];
  /**
   * Coach's short annotation of what actually changed, e.g.
   * ["Training consistency", "Progressive overload"]. 2-5 short phrases,
   * rendered as a restrained inline annotation — not another card.
   */
  coachNotes?: string[];
  /** Frame for the supplied photograph. Defaults to the diptych frame. */
  mediaAspect?: TransformationMediaAspect;
  /** Only render when true. Never invent figures/timeframes. */
  consentVerified: boolean;
}

/**
 * Layered campaign typography for a hero slide (athletic campaign
 * treatment). `back` words render as oversized ghost type behind the
 * slide's transparent athlete cutout; `front` words render as the slide's
 * real headline in front of it, echoing the "text sits both behind and in
 * front of the subject" depth cue from reference 11. Optional so slides
 * authored with a plain `headline` string still render correctly.
 */
export interface HeroHeadlineLayers {
  back: string[];
  middle?: string[];
  front: string[];
  /**
   * Optional SECOND front-plane word group, positioned independently of
   * `front`. A slide that frames its subject with foreground typography both
   * above and below it (see Slide 03's full-figure campaign frame) needs two
   * separately placed foreground words. Slides omitting this render exactly
   * as before with a single front layer.
   */
  frontSecondary?: string[];
}

/**
 * One breakpoint's composition for a layered campaign hero slide.
 *
 * Every value is a CSS length/percentage string resolved against the
 * composition zone — the box the three depth layers share (see
 * `.factory-hero-zone`). The zone spans the full hero frame from 1024px up;
 * below that it stops above the supporting copy block, so the copy can never
 * be crossed by the oversized type. Percentages therefore stay proportional
 * instead of pixel-pinned, and the three layers keep their authored
 * relationship to each other at every size.
 *
 * These are the ONLY numbers that place the three depth layers — the
 * component itself carries no per-slide magic numbers. See lib/hero.ts for
 * the authored values and app/globals.css (`.factory-hero-stage`) for the
 * breakpoint mapping.
 */
export interface HeroCompositionFrame {
  /** Subject (athlete cutout) height as a % of the composition zone height. */
  subjectHeight: string;
  /**
   * Width of the subject box as a % of the hero frame width. The image is
   * `object-contain`, so whichever of height/width binds first preserves the
   * cutout's aspect ratio; values above 100% intentionally allow controlled
   * bleed inside the (overflow-hidden) hero frame.
   */
  subjectWidth: string;
  /** Horizontal center of the subject box as a % of the zone width. */
  subjectCenterX: string;
  /**
   * Distance from the composition zone's bottom edge to the subject box's
   * bottom, as a % of the zone height. Usually "0%" (the figure stands on the
   * zone floor); a positive value lifts the figure for compositions that want
   * the subject floating clear of the zone's baseline.
   */
  subjectBottom: string;
  /** Font size of BOTH headline layers (same typographic system). */
  typeSize: string;
  /** Top edge of the back headline layer, % of the zone height. */
  backTop: string;
  /** Left edge of the back headline layer, % of the zone width. */
  backLeft: string;
  /**
   * Whether the back layer's words sit on one line ("inline") or stack one
   * per line ("stack"). Stacking is how narrow viewports keep the headline
   * interacting with the subject instead of running off-frame.
   */
  backWordLayout: "inline" | "stack";
  /**
   * Optional extra left offset for every back word after the first, only
   * when `backWordLayout` is "stack" (e.g. "0.35em"). Staggers the stacked
   * words into a composed cascade instead of a flush-left list. Defaults to 0.
   */
  backStackIndent?: string;
  /** Optional top edge of the middle (bridge) typography layer, % of zone height. */
  middleTop?: string;
  /** Optional left edge of the middle (bridge) typography layer, % of zone width. */
  middleLeft?: string;
  /** Optional font size override for the middle bridge typography. */
  middleSize?: string;
  /** Top edge of the front headline layer, % of the zone height. */
  frontTop: string;
  /**
   * Left edge of the front headline layer, % of the zone width. Authored
   * so the first letter starts *inside* the subject's body, which is what
   * makes the front layer read as crossing in front of the athlete.
   */
  frontLeft: string;
  /** Optional font size override for the front climax typography. */
  frontSize?: string;
  /**
   * Optional second front layer geometry (see
   * `HeroHeadlineLayers.frontSecondary`). Same front plane as `front`, placed
   * independently so foreground typography can sit both above and below the
   * subject. Omitted on slides that do not author a second front group.
   */
  frontSecondaryTop?: string;
  /** Left edge of the second front layer, % of the zone width. */
  frontSecondaryLeft?: string;
  /** Font size override for the second front layer. */
  frontSecondarySize?: string;
}

/**
 * Responsive composition for a layered campaign hero slide. Breakpoints are
 * recomposed rather than scaled: mobile `<768px`, tablet `768–1023px`,
 * laptop `1024–1439px`, desktop `>=1440px`.
 */
export interface HeroSlideComposition {
  mobile: HeroCompositionFrame;
  /**
   * Optional short-height phone frame (`<768px` wide AND `<=700px` tall,
   * e.g. 375x667). Falls back to `mobile` when omitted. Short phones have
   * too little height between the fixed header and the copy for the regular
   * mobile frame, so they get their own calibration instead of a squeezed
   * version of it.
   */
  mobileShort?: HeroCompositionFrame;
  tablet: HeroCompositionFrame;
  laptop: HeroCompositionFrame;
  desktop: HeroCompositionFrame;
}

export interface HeroSlide {
  image: string;
  /**
   * Descriptive alt text for the slide image. Falls back to the plain-text
   * `headline` when omitted so older slide data keeps working unchanged.
   */
  imageAlt?: string;
  eyebrow?: string;
  headline: string;
  /**
   * Optional layered campaign typography split across a back (behind the
   * subject) and front (in front of the subject) layer. When present,
   * HeroSlider renders these instead of splitting the plain `headline`
   * string; `headline` still drives the image alt fallback and remains
   * required so every slide has a plain-text equivalent.
   */
  headlineLayers?: HeroHeadlineLayers;
  /**
   * Optional explicit text for the slide's single semantic H1 on layered
   * slides. The stage otherwise builds the accessible heading by joining the
   * depth layers in back -> middle -> front order, which reads correctly only
   * when the visual depth order matches the sentence order. Slide 03 places
   * its back word ("AGAIN") in the middle of the sentence, so it authors the
   * spoken heading explicitly. Slides omitting this keep the join behaviour
   * unchanged.
   */
  spokenHeadline?: string;
  /**
   * Optional per-breakpoint layered composition. When present (and the slide
   * also has `headlineLayers`), HeroSlider renders the three-layer campaign
   * composition — back headline behind the subject, subject, front headline
   * in front of it — using only these authored values. Slides without it
   * keep the previous bottom-anchored composition unchanged.
   */
  composition?: HeroSlideComposition;
  /** Horizontal placement of the slide's athlete cutout within the frame. */
  subjectAlign?: "left" | "center" | "right";
  subheadline?: string;
  /**
   * Data-driven CTA sources (preferred). When present, components/sections/
   * Hero.tsx resolves them through components/sections/fitnessToolsLogic.ts
   * into the concrete label/href fields below before the slide reaches
   * HeroSlider. Slides without `cta` keep using the legacy fields unchanged.
   */
  cta?: HeroSlideCtas;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  /** Render a decorative, aria-hidden "→" inside the primary CTA. */
  primaryCtaArrow?: boolean;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  /** Render a decorative, aria-hidden "→" inside the secondary CTA. */
  secondaryCtaArrow?: boolean;
}

/* ===========================================================================
 * INTERACTIVE FITNESS TOOLS — registry contract (lib/fitness-tools.ts)
 *
 * One entry per guided, personalised experience the site offers (/start,
 * /journey, /first-30-days). Hero CTAs and the Training
 * Intelligence tools block both read this registry, so a tool's name, route
 * and copy live in exactly one place.
 * ======================================================================== */

export type FitnessToolId = "starting-point" | "journey" | "first-30-days";

export interface FitnessTool {
  id: FitnessToolId;
  /** Display index, e.g. "01". Distinguishes tools without relying on colour. */
  index: string;
  /** Customer-facing tool name, e.g. "Find Your Starting Point". */
  name: string;
  /** One value-oriented sentence. Only facts the tool actually delivers. */
  description: string;
  /** Short mono tag describing the format, e.g. "5 questions". */
  meta: string;
  /**
   * What the visitor walks away with, in a few words. Only what the tool
   * actually produces — never an outcome promise. Rendered as "You get: …".
   */
  outcome?: string;
  /** Descriptive CTA label used in the Training Intelligence tools block. */
  ctaLabel: string;
  /** CTA label used on a hero slide. Defaults to `name`. */
  heroCtaLabel?: string;
  /**
   * Real route of the tool, e.g. "/start". `null` means the tool has no
   * destination yet — it then never renders anywhere, and hero slides that
   * reference it fall back to their configured fallback action.
   */
  href: string | null;
  /** Master switch. A tool renders only when `enabled` AND `href` is set. */
  enabled: boolean;
}

/** A concrete, non-tool hero action (used directly or as a tool fallback). */
export interface HeroLinkAction {
  label: string;
  /** Internal route ("/x") or in-page section anchor ("#section"). */
  href: string;
}

export type HeroCtaSource =
  | {
      type: "tool";
      toolId: FitnessToolId;
      /** Used while the tool is unavailable (disabled or no route yet). */
      fallback?: HeroLinkAction;
      /** Optional subheadline applied only when the tool resolves. */
      subheadline?: string;
    }
  | { type: "whatsapp"; label: string }
  | ({ type: "link" } & HeroLinkAction);

export interface HeroSlideCtas {
  primary: HeroCtaSource;
  secondary?: HeroCtaSource;
}

export interface HeroConfiguration {
  /** Up to 3 slides. Default narrative: place -> people -> training */
  slides: HeroSlide[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

/* ===========================================================================
 * /first-30-days — "Plan Your First 30 Days" (lib/first-30-days.ts)
 *
 * CAPABILITY CONTRACT. Any result content that would describe an onboarding
 * service (an orientation, a tour, a trial, ...) declares the capability it
 * requires. A capability renders as a claim ONLY when `verified: true` with a
 * documented `source`. Otherwise the tool turns it into a question the visitor
 * can ask the gym, or omits it — it never promises the service.
 * ======================================================================== */

export type OnboardingCapabilityId =
  | "orientation"
  | "tour"
  | "trainerIntro"
  | "assessment"
  | "trialSession"
  | "checkIns";

export interface OnboardingCapability {
  id: OnboardingCapabilityId;
  /** Only `true` when the gym owner has confirmed the service. */
  verified: boolean;
  /** Short display label, e.g. "Floor orientation". */
  label: string;
  /** One factual sentence shown when verified, e.g. "A coach walks new members through the floor." */
  detail: string;
  /** Where the confirmation came from (owner email, call note). Required for verified:true. */
  source?: string;
}

export interface First30DaysImage {
  src: string;
  /** Describes only what is in the frame — no facility claim for campaign images. */
  alt: string;
  objectPosition?: string;
  objectPositionMobile?: string;
}

export interface First30DaysFact {
  id: string;
  /** Short label, e.g. "Landmark". */
  label: string;
  /** Verified / publicly reported value, e.g. "Opposite Leaf Hospital". */
  value: string;
}

export interface First30DaysConfiguration {
  /** Every image is optional; a missing one renders the card text-only. */
  images: {
    hero?: First30DaysImage;
    firstVisit?: First30DaysImage;
    weeklyRhythm?: First30DaysImage;
    reflection?: First30DaysImage;
  };
  capabilities: OnboardingCapability[];
  /** Practical, sourced first-visit facts (landmark, parking, access). */
  firstVisitFacts: First30DaysFact[];
}

/**
 * Section 01 (About / facility editorial) — data contract.
 *
 * Section 01 is a facility/training-floor story, not a generic "about us"
 * paragraph. Everything it renders is authored here so the same composition
 * can carry a completely different gym: labels, attributes, image and
 * headline are data, while the layout, typography, module styling and motion
 * are part of the fixed Master Component System.
 */

/**
 * Icon key for a training-environment module. A closed union rather than a
 * free string so a clone cannot reference an icon that does not exist. The
 * icons themselves are simple geometric line marks drawn in
 * components/ui/TrainingIcon.tsx — no icon library.
 */
export type TrainingIconName =
  | "strength"
  | "cardio"
  | "coaching"
  | "equipment"
  | "floor";

/**
 * One primary training-environment module (Level 1): the physical training
 * the floor supports. Only `verified: true` zones render, exactly like
 * `Service.verified` — an unverified zone stays in the data file and off the
 * live site.
 */
export interface FacilityZone {
  id: string;
  /** Short signage-style label, e.g. "Strength". */
  label: string;
  /** Optional one-line factual descriptor. Never a superlative or a claim. */
  detail?: string;
  icon: TrainingIconName;
  verified: boolean;
}

/**
 * One secondary practical/support attribute (Level 2), rendered as quiet
 * technical metadata rather than a feature card. Only `verified: true`
 * attributes render, so an amenity the gym does not actually offer can never
 * appear by default.
 */
export interface FacilityAttribute {
  id: string;
  label: string;
  /** Optional short technical value, e.g. a unit or qualifier. */
  value?: string;
  verified: boolean;
}

export interface AboutImage {
  src: string;
  /** Mandatory. Must describe the actual photograph. */
  alt: string;
}

export interface AboutConfiguration {
  /** Section index numeral, e.g. "01". */
  index: string;
  /** Small mono editorial label, e.g. "About the gym". */
  eyebrow: string;
  /** Display heading, authored one line per array entry. */
  headlineLines: string[];
  /** Render the final headline line in the accent token. */
  accentLastLine?: boolean;
  /** The single primary facility photograph. Section 01 is not a gallery. */
  image: AboutImage;
  /** Optional technical caption chip riding the image frame. */
  imageLabel?: string;
  /** Optional vertical label crossing the frame edge (desktop only). */
  frameLabel?: string;
  /** Group label above the primary training-environment modules. */
  zonesLabel: string;
  /** Group label above the secondary support metadata. */
  attributesLabel: string;
  /** Group label above the derived opening-schedule readout. */
  scheduleLabel: string;
  zones: FacilityZone[];
  attributes: FacilityAttribute[];
  /**
   * Render the opening-schedule module. The schedule itself is never authored
   * here — it is derived from `business.hours` (see lib/about.ts), so it can
   * never drift from the hours used by the location section and the
   * LocalBusiness structured data.
   */
  showSchedule: boolean;
}

/**
 * Why Choose Us differentiators. Not defined in the original data contract
 * docx; added here following the same typed-data-file pattern as every
 * other section so the mandatory Why Choose Us section stays data-driven
 * rather than hardcoded in the component. See lib/why-choose-us.ts.
 */
export interface WhyChooseUsItem {
  title: string;
  description: string;
  /**
   * Optional per-item supporting image. Not rendered by the Performance
   * Blueprint composition (Section 03 is anchored by ONE campaign photograph,
   * see WhyChooseUsAnchor) — kept in the contract because a gym's data file
   * may already carry per-principle imagery used elsewhere. See
   * docs/MASTER-GYM-DATA-CONTRACT.md.
   */
  image?: string;
}

/**
 * Section 03's single anchor photograph — the athlete the principles annotate.
 * One image, never a per-principle gallery: the composition is a campaign
 * portrait crossed by a technical field, so swapping the photograph per row
 * would destroy the read.
 */
export interface WhyChooseUsAnchor {
  src: string;
  /** Mandatory. Must describe the actual photograph, never the principles. */
  alt: string;
  /**
   * Optional CSS object-position for the crop, e.g. "50% 26%". Lets a clone
   * re-centre a differently framed athlete without touching the layout.
   */
  objectPosition?: string;
}

/**
 * Section 03 (Why Choose Us / performance blueprint) — composition contract.
 *
 * Same typed-configuration pattern as `AboutConfiguration`: the manifesto
 * heading, eyebrow, anchor photograph and group label are data, while the
 * blueprint field, annotation system, motion and responsive recomposition are
 * part of the fixed Master Component System. The principles themselves stay in
 * `whyChooseUs` so the content basis is unchanged.
 */
export interface WhyChooseUsConfiguration {
  /** Section index numeral, e.g. "03". */
  index: string;
  /** Small mono editorial label, e.g. "Why Choose Us". */
  eyebrow: string;
  /**
   * Manifesto heading, authored one short line per entry. Lines cross the
   * anchor photograph's upper field on desktop, so keep each line short
   * (<= 24 characters) — long lines would run across the subject.
   */
  headlineLines: string[];
  /** Render the final headline line in the accent token. */
  accentLastLine?: boolean;
  /** One-line mono statement opening the blueprint sheet. Never a claim. */
  deck?: string;
  /** Group label above the annotated principles, e.g. "Training principles". */
  principlesLabel: string;
  anchor: WhyChooseUsAnchor;
}

/* ===========================================================================
 * Section 05 — TRAINING INTELLIGENCE
 *
 * An educational chapter, not a sales panel: the visitor selects a training
 * GOAL and the section teaches what changes, what stays the same, and what to
 * pay attention to.
 *
 * FACTORY SPLIT
 *   Global / fixed  — the lever taxonomy, the three-part teaching structure
 *                     (priorities / corrections / signals), the emphasis
 *                     vocabulary, the instrument, the motion, the responsive
 *                     recomposition.
 *   Per gym         — which goals are enabled and in what order, the mapped
 *                     Section 02 program, the optional "how we coach this
 *                     here" note, the CTA labels, the artifact, the accent.
 *
 * FACTUAL INTEGRITY (enforced by the type system, not by good intentions)
 *   There is NO numeric field anywhere in this contract. No percentages, no
 *   calories, no macros, no timeframes, no body-composition targets, no
 *   heart-rate zones. Emphasis is an ordinal 1-3 teaching weight rendered as
 *   plate markers plus a word ("Maintain" / "Supporting" / "Primary focus"),
 *   so a gym operator has no slot in which to type a measurement, and the
 *   section can never imply a scientific score.
 * ========================================================================= */

/**
 * Ordinal teaching emphasis for one training lever under one goal.
 *
 * 1 = maintain · 2 = supporting · 3 = primary focus.
 *
 * DELIBERATELY NOT A PERCENTAGE, a score, or a measurement. It is the
 * qualitative weight a coach would give that lever when programming for the
 * goal, and it renders as 1-3 plate markers with a word beside them. The
 * union is closed at three values precisely so no clone can widen it into a
 * 0-100 scale and start implying data it does not have.
 */
export type TrainingEmphasisLevel = 1 | 2 | 3;

/**
 * One universal training lever. The same levers are compared across every
 * goal — that constant row order is what makes "different goals require
 * different emphasis" legible at a glance.
 *
 * Fixed taxonomy in the master template. A gym may drop a lever it genuinely
 * does not program, but must not invent a sixth category of training.
 */
export interface TrainingLever {
  /** Stable key referenced by `TrainingGoal.emphasis`. */
  id: string;
  /** Full label, e.g. "Muscle-building volume". */
  label: string;
  /** Optional compact label for the narrow emphasis stack, e.g. "Volume". */
  shortLabel?: string;
}

/** One "what to prioritize" teaching point: a principle plus why it matters. */
export interface TrainingPriority {
  title: string;
  detail: string;
}

/**
 * One "common mistakes" pair. Both halves are mandatory: the template never
 * shows a visitor an error without the better approach next to it.
 */
export interface TrainingCorrection {
  mistake: string;
  instead: string;
}

/**
 * One training goal and everything the section teaches about it.
 *
 * Every text field explains a PRINCIPLE. None of them prescribes a dose, a
 * timeframe or an individual plan — that is what the coach conversation at
 * the end of the section is for.
 */
export interface TrainingGoal {
  /** Stable key, e.g. "fat-loss". Used for selection state and CTA context. */
  id: string;
  /** Display label, e.g. "Fat loss". */
  label: string;
  /** One sentence: what this goal actually asks of training. */
  premise: string;
  /**
   * Short training-path readout for the goal handoff, e.g.
   * "Strength base + conditioning + activity you can sustain".
   */
  path: string;
  /**
   * Ordinal emphasis keyed by `TrainingLever.id`. A lever with no entry is
   * omitted from the display rather than rendered as a dash or a zero, so a
   * partially configured goal degrades to fewer rows, never to placeholders.
   */
  emphasis: Record<string, TrainingEmphasisLevel>;
  priorities: TrainingPriority[];
  mistakes: TrainingCorrection[];
  /** Progress signals worth watching. Signals to read, never targets to hit. */
  track: string[];
  /** One short coaching insight. Part of the reviewed educational library. */
  coachNote: string;
  /**
   * Optional `Service.id` from lib/services.ts. The handoff link renders only
   * when this resolves to a service that is actually `verified: true`, so the
   * section can never point at a program the gym does not run.
   */
  programId?: string;
  /** Optional gym-specific "how we coach this here" note. Omitted if absent. */
  gymNote?: string;
  /** Only `enabled: true` goals render. The per-gym on/off switch. */
  enabled: boolean;
}

/** The small subordinate photographic artifact beside the coach's note. */
export interface TrainingArtifact {
  src: string;
  /** Mandatory. Must describe the actual photograph. */
  alt: string;
  /** Short mono caption. Never a claim about results. */
  caption: string;
}

/**
 * Section 05 composition + copy contract. Same typed-configuration pattern as
 * `AboutConfiguration` and `WhyChooseUsConfiguration`: labels and content are
 * data, the instrument and its behaviour are the fixed component system.
 */
export interface TrainingIntelligenceConfiguration {
  /** Section index numeral, e.g. "05". */
  index: string;
  /** Mono chapter label, e.g. "Training intelligence". */
  eyebrow: string;
  /** Display heading, one short line per entry. */
  headlineLines: string[];
  /** Give the final headline line the accent marker treatment. */
  accentLastLine?: boolean;
  /** Compact supporting deck. Keep to two or three short sentences. */
  deck: string;
  /** Accessible + visible name of the goal selector, e.g. "Training goal". */
  selectorLabel: string;
  /** Label above the instrument, e.g. "Training loadout". */
  loadoutLabel: string;
  /** Label above the lever stack, e.g. "Training emphasis". */
  emphasisLabel: string;
  /** Heading of the first teaching column, e.g. "What to prioritize". */
  prioritiesLabel: string;
  /** Heading of the second teaching column, e.g. "Common mistakes". */
  mistakesLabel: string;
  /** Heading of the third teaching column, e.g. "What to track". */
  trackLabel: string;
  /** Label of the coach's note strip, e.g. "Coach's note". */
  coachNoteLabel: string;
  /** Label of the gym-specific note, e.g. "How we coach this here". */
  gymNoteLabel: string;
  /** Label of the closing handoff, e.g. "Your goal → your training path". */
  handoffLabel: string;
  /** Primary CTA label. The selected goal is appended by the component. */
  primaryCtaLabel: string;
  /** Secondary CTA label, shown only when a verified program resolves. */
  secondaryCtaLabel: string;
  /**
   * WhatsApp message template for the primary CTA. `{goal}` is replaced with
   * the selected goal's label. The gym's number is never stored here — the
   * href comes from the existing site-wide WhatsApp action.
   */
  ctaMessageTemplate: string;
  /** Mono label above the tools strip, e.g. "Training tools". */
  toolsEyebrow: string;
  /** Tools strip heading (rendered as h2). */
  toolsHeading: string;
  /** One-sentence tools strip intro. */
  toolsDeck: string;
  /** Small tag on the first tool card, e.g. "Start here". */
  toolsStartLabel: string;
  /** Label before each tool's outcome line, e.g. "You get". */
  toolsOutcomeLabel: string;
  /** Standing safety line. Educational scope, explicitly not medical advice. */
  disclaimer: string;
  /** Optional reviewer attribution. Render only if the gym can stand behind it. */
  reviewedBy?: string;
  /** Optional subordinate photograph. The section must work without it. */
  artifact?: TrainingArtifact;
  /** The lever taxonomy compared across every goal. */
  levers: TrainingLever[];
}

/* ===========================================================================
 * Section 07 — BETWEEN SESSIONS + BODY MAP
 *
 * Section 05 teaches "your goal changes how you train". Section 07 teaches
 * what happens in the hours and days BETWEEN sessions, and closes with an
 * anatomy blueprint showing which regions respond to appropriate training.
 *
 * Same discipline as Section 05, and it matters more here because the subject
 * matter is nutrition, sleep and pain: every string in this contract is a
 * PRINCIPLE. Not one field may carry a calorie figure, a protein or macro
 * number, a hydration volume, a sleep duration, a body-fat target, a
 * supplement dose, a guaranteed timeframe, a physiological mechanism claim or
 * anything that could read as a diagnosis. The educational library is global
 * and reviewed once; a clone edits `enabled`, order, `gymNote`, the CTA and
 * the language — never the teaching copy.
 * ======================================================================== */

/**
 * One station of the interval log: a phase of the gap between two sessions.
 *
 * The four canonical stations are FUEL, RECOVER, MOVE and READY?. Each answers
 * WHAT (principle) / WHY (why) / WHAT DO I DO WITH THIS (practice), with an
 * optional WATCH FOR list for stations where the honest answer includes
 * "notice this and mention it to a coach".
 */
export interface IntervalStation {
  /** Stable key, e.g. "fuel". */
  id: string;
  /** Station name, e.g. "Fuel". */
  name: string;
  /**
   * RELATIVE interval marker printed on the log spine, e.g. "T+ 0-2 H" or
   * "That night". Never a clock time: the factory cannot know when anyone
   * trains, so the log is anchored to the last rep, not to 6 PM.
   */
  marker: string;
  /** Plain-language restatement of the marker, e.g. "The hours after you finish". */
  intervalLabel: string;
  /** One clear statement. The thing to remember if nothing else is read. */
  principle: string;
  /** Short explanatory paragraph. Two or three sentences, no numbers. */
  why: string;
  /** Two or three concise practical ideas. Ideas, never prescriptions. */
  practice: string[];
  /**
   * Optional "watch for" list. Signals worth noticing and raising with a
   * coach — explicitly NOT diagnostic criteria for any condition.
   */
  watchFor?: string[];
  /** Optional gym-specific "how we coach this here" note. Omitted if absent. */
  gymNote?: string;
  /** Only `enabled: true` stations render. */
  enabled: boolean;
}

/** One prompt in the pre-session check. */
export interface PreSessionCheckItem {
  id: string;
  /** Short coaching question, e.g. "Fueled?". */
  prompt: string;
  /** One line explaining what the question is actually asking. */
  detail: string;
  /**
   * Marks the pain/injury prompt. When it is raised the component shows the
   * escalation note instead of treating the answer as a result. Exactly one
   * item should set this.
   */
  escalates?: boolean;
}

/**
 * The pre-session check. A coaching reminder, deliberately NOT an instrument:
 * it has no score, no total, no traffic light, no persistence and no
 * recommendation. The contract has no field to put a score in.
 */
export interface PreSessionCheck {
  label: string;
  intro: string;
  items: PreSessionCheckItem[];
  /** Label of the escalation note, e.g. "If something feels sharp or new". */
  escalationLabel: string;
  /** The escalation note. Points at a coach or a clinician, never a diagnosis. */
  escalation: string;
  /** Standing scope line, e.g. "Nothing here is scored, saved or sent." */
  scope: string;
}

/** One illustrative weekly session pattern. */
export interface TrainingWeekPattern {
  id: string;
  /** Short label, e.g. "Three sessions". */
  label: string;
  /** Exactly seven entries, Monday first. `true` = a training day. */
  days: boolean[];
}

/** Copy for one gap classification. Descriptive, never a recommendation. */
export interface TrainingWeekGapCopy {
  /** e.g. "Short gap". */
  label: string;
  /** One line describing what that spacing means for training. */
  detail: string;
}

/**
 * The training-week strip: an educational illustration of spacing and
 * consistency, not a planner and not a recommendation engine. The component
 * derives the session count, the rest-day count and the longest gap from the
 * selected pattern — the data file never states a "best" pattern.
 */
export interface TrainingWeekModule {
  label: string;
  intro: string;
  /** Seven short day labels, Monday first, e.g. "Mon". */
  dayLabels: string[];
  /** Seven full day names for assistive technology, Monday first. */
  dayNames: string[];
  patterns: TrainingWeekPattern[];
  /** Accessible + visible name of the pattern selector. */
  selectorLabel: string;
  sessionsLabel: string;
  restLabel: string;
  gapLabel: string;
  /** Label for a training day cell, used in the accessible readout. */
  sessionDayLabel: string;
  /** Label for a non-training day cell, used in the accessible readout. */
  restDayLabel: string;
  gaps: {
    short: TrainingWeekGapCopy;
    standard: TrainingWeekGapCopy;
    long: TrainingWeekGapCopy;
  };
  /** Standing scope line: illustrative patterns, not a personal schedule. */
  scope: string;
}

/**
 * One labelled region of the body map.
 *
 * `id` must match a key in the fixed geometry table
 * (components/sections/bodyMap.ts). A region with no geometry is dropped, so a
 * mistyped id degrades to one fewer label instead of a broken figure. The
 * view (front or back) comes from the geometry, never from this file.
 */
export interface BodyMapRegion {
  id: string;
  /** Illustrative anatomical label, e.g. "Deltoids". */
  label: string;
}

/**
 * One selectable muscle group and the education attached to it.
 *
 * `note` explains what training that region involves in principle. It must not
 * prescribe a workout, name a set/rep scheme, give technique cues or promise a
 * body change.
 */
export interface BodyMapGroup {
  id: string;
  /** Group label, e.g. "Shoulders". */
  label: string;
  regions: BodyMapRegion[];
  note: string;
  enabled: boolean;
}

/** Copy for one of the two rendered states of the same figure. */
export interface BodyMapStateCopy {
  /** e.g. "Without regular training". */
  label: string;
  /** One line explaining what the drawing convention on this side means. */
  caption: string;
}

/**
 * The body map. One figure, one geometry, two rendering states split across
 * the figure's own centre axis — never two different bodies and never a
 * before/after physique claim.
 */
export interface BodyMapModule {
  label: string;
  /** Chapter-B heading, one short line per entry. */
  headlineLines: string[];
  deck: string;
  /** Accessible + visible name of the front/back view control. */
  viewLabel: string;
  frontLabel: string;
  backLabel: string;
  /** Accessible + visible name of the muscle-group selector. */
  groupLabel: string;
  /** Label above the educational annotation, e.g. "What training it involves". */
  noteLabel: string;
  /** Label of the axis readout between the two states. */
  axisLabel: string;
  baseState: BodyMapStateCopy;
  trainedState: BodyMapStateCopy;
  /**
   * Accessible description of the illustration for `role="img"`. Describes the
   * DRAWING, not a physique.
   */
  figureDescription: string;
  /** Label of the visually-hidden region summary. */
  summaryLabel: string;
  /** Outcome-variability line. Mandatory: the figure is illustrative anatomy. */
  disclaimer: string;
  groups: BodyMapGroup[];
}

/**
 * Optional decorative photograph slot for Section 07.
 *
 * Disabled by default and disabled in the master template. Section 07 is
 * composed so that it is complete with zero raster images — the body map SVG
 * is the primary visual asset. This slot exists only so a gym with a genuinely
 * strong supporting photograph is not forced to fork the component.
 */
export interface BetweenSessionsArtifact {
  enabled: boolean;
  src: string;
  /** Mandatory when enabled. Must describe the actual photograph. */
  alt: string;
  caption: string;
}

/**
 * Section 07 composition + copy contract. Same typed-configuration pattern as
 * `TrainingIntelligenceConfiguration`: labels and content are data, the log
 * spine, the figure geometry and every behaviour are the fixed component
 * system.
 */
export interface BetweenSessionsConfiguration {
  /** Section index numeral, e.g. "07". */
  index: string;
  eyebrow: string;
  headlineLines: string[];
  accentLastLine?: boolean;
  deck: string;
  /** Label of the interval log, e.g. "Interval log". */
  logLabel: string;
  /** Marker that opens the log, e.g. "Last rep". */
  openLabel: string;
  /** Marker that closes the log, e.g. "Next session". */
  closeLabel: string;
  principleLabel: string;
  whyLabel: string;
  practiceLabel: string;
  watchLabel: string;
  gymNoteLabel: string;
  week: TrainingWeekModule;
  check: PreSessionCheck;
  bodyMap: BodyMapModule;
  /** The single closing CTA. There is deliberately only one. */
  ctaLabel: string;
  /**
   * WhatsApp message for the CTA. The gym's number is never stored here — the
   * href comes from the existing site-wide WhatsApp action.
   */
  ctaMessage: string;
  /** Short line above the CTA tying it to the lesson. */
  ctaNote: string;
  /** Standing safety line. Educational scope, explicitly not medical advice. */
  disclaimer: string;
  /** Optional reviewer attribution. Render only if the gym can stand behind it. */
  reviewedBy?: string;
  /** Optional, disabled by default. The section must be complete without it. */
  artifact?: BetweenSessionsArtifact;
  stations: IntervalStation[];
}

/* ---------------------------------------------------------------------------
 * Section 10 — Contact / Inquiry
 *
 * The Contact section is data-driven end to end: every label, field label,
 * CTA label and status message below is editable per gym without touching a
 * component. Business facts (phone, email, address, WhatsApp) are NOT
 * duplicated here — they resolve from lib/business.ts, which stays the single
 * source of truth for the whole site.
 *
 * SECRETS NEVER LIVE HERE. The inquiry recipient, sender and Resend API key
 * are server-only environment variables (see .env.example). This file may
 * only name which variable supplies a value, never the value itself.
 * ------------------------------------------------------------------------- */

/** The four fields the inquiry form is allowed to collect. Deliberately small. */
export type ContactFieldName = "name" | "phone" | "email" | "message";

/** Validation outcomes. Shared by the client form and the server route. */
export type ContactFieldErrorCode = "required" | "tooShort" | "tooLong" | "invalid";

export interface ContactFieldCopy {
  /** Technical index rendered before the label, e.g. "01". */
  index: string;
  /** Visible label. Required — placeholders are never the only label. */
  label: string;
  /** Rendered next to the label when the field is optional, e.g. "Optional". */
  optionalLabel?: string;
  /** Hint text. Supplementary only; never a replacement for the label. */
  placeholder?: string;
  /** Browser autofill token, e.g. "name", "tel", "email". */
  autoComplete?: string;
  /** Per-outcome message shown under the field and used by the API response. */
  errors: Partial<Record<ContactFieldErrorCode, string>>;
}

export interface ContactFormCopy {
  /** Eyebrow above the form plate, e.g. "Inquiry form". */
  eyebrow: string;
  /** Mono tag on the right of the form plate header, e.g. "10 / FORM". */
  plateTag: string;
  /** Marker rendered next to required field labels. */
  requiredMarker: string;
  fields: Record<ContactFieldName, ContactFieldCopy>;
  submitLabel: string;
  submittingLabel: string;
  /** Structural note under the form. Must stay factual, never a promise. */
  note: string;
  /** Summary announced when client-side validation blocks a submission. */
  validationSummary: string;
  successTitle: string;
  successBody: string;
  /** Optional, off by default. Only set when a response window is real. */
  responseNote?: string;
  /** Returns the form to the idle state after a successful send. */
  resetLabel: string;
  /** Generic failure copy. Provider internals are never surfaced. */
  errorMessage: string;
  /** Shown when the server has no email provider configured yet. */
  notConfiguredMessage: string;
  /** Shown when the endpoint throttles a visitor. */
  throttledMessage: string;
}

export interface ContactDirectoryCopy {
  phoneLabel: string;
  emailLabel: string;
  addressLabel: string;
  /**
   * Rendered when `dataVerified` is false, so placeholder business facts are
   * never presented as verified. Set `dataVerified: true` once lib/business.ts
   * holds the gym's real, supplied details.
   */
  unverifiedNotice: string;
}

export interface ContactMetaItem {
  label: string;
  /** Structural fact about how the form works — not a marketing claim. */
  value: string;
}

export interface ContactDeliveryConfiguration {
  /**
   * Subject line template. `{name}` and `{business}` are the only tokens.
   * Keep it free of message content and personal detail beyond the name.
   */
  subjectTemplate: string;
  /** Provenance line printed in the email body. */
  sourceLabel: string;
  /** Names of the server-only variables that carry the addresses/key. */
  recipientEnvVar: "CONTACT_TO_EMAIL";
  senderEnvVar: "CONTACT_FROM_EMAIL";
  apiKeyEnvVar: "RESEND_API_KEY";
}

export interface ContactBackgroundArt {
  /** Existing project asset only. Never an external or generated image. */
  src: string;
  /** Oversized technical numeral drawn behind the composition. */
  numeral: string;
  /** Mono label drawn along the section edge. */
  edgeLabel: string;
}

export interface ContactConfiguration {
  /** Section index numeral, e.g. "10". */
  index: string;
  eyebrow: string;
  headline: string;
  supporting: string;
  /** WhatsApp-first primary CTA. The href comes from lib/business.ts. */
  primaryCtaLabel: string;
  /** Whether the optional email field is collected. */
  collectEmail: boolean;
  /**
   * False in the master template: lib/business.ts still holds demo
   * placeholders. Flip to true only once real supplied details are in place.
   */
  dataVerified: boolean;
  /** Human-readable phone rendering. The tel: href always uses business.phone. */
  phoneDisplay?: string;
  directory: ContactDirectoryCopy;
  meta: ContactMetaItem[];
  form: ContactFormCopy;
  delivery: ContactDeliveryConfiguration;
  background: ContactBackgroundArt;
}


/* ===========================================================================
 * FESTIVAL & SEASONAL OFFER ENGINE
 *
 * A date-driven promotional layer. The engine answers exactly one question:
 * "given the current instant, which single promotional message (if any)
 * should the site show right now?"
 *
 * Hard boundaries of this contract:
 *   - It describes PROMOTIONAL INFORMATION only. It never restates a base
 *     price. Discounts reference an existing PricingPlan by `planId`, so
 *     lib/pricing.ts stays the single source of truth for amounts.
 *   - There is no API, CMS, database or festival service. Every campaign
 *     date is curated in lib/festival-offers.ts.
 *   - No component contains festival-specific text. All wording is data.
 *
 * See lib/festival-offers.ts (data + date provenance) and lib/offer-engine.ts
 * (the pure selector).
 * ========================================================================= */

/**
 * One discount line, e.g. "10% OFF · 6 MONTHS".
 *
 * `planId` MUST match a PricingPlan.id in lib/pricing.ts. The plan's public
 * label and amount are read from pricing at render time — never copied here.
 * A discount whose plan does not exist, or whose plan is not publicly priced,
 * is dropped rather than rendered against an unknown plan.
 */
export interface OfferDiscount {
  /** Reference into PricingConfiguration.plans[].id (e.g. "half-year"). */
  planId: string;
  /** Whole-number percentage off, e.g. 10 => "10% OFF". */
  percentage: number;
}

/**
 * One bounded promotional window with its own copy. A festival campaign has
 * up to two: a PRE window (run-up) and a LIVE window (the festival itself).
 * Seasonal fallbacks use SeasonalOffer instead.
 *
 * `start`/`end` are inclusive calendar dates in strict "YYYY-MM-DD" form,
 * evaluated in the engine's configured timezone. Never a locale date string:
 * "10/11/2026" is ambiguous and is rejected by the engine.
 */
export interface OfferWindow {
  /** Per-window kill switch. false => this window never selects. */
  enabled: boolean;
  /** Inclusive first day, "YYYY-MM-DD". */
  start: string;
  /** Inclusive last day, "YYYY-MM-DD". */
  end: string;
  /** Mono micro-label above the title, e.g. "Festive offer". */
  eyebrow: string;
  /** The campaign headline, e.g. "Pre-Dussehra". Phase wording lives here. */
  title: string;
  /** Optional one-line supporting copy. Never a claim or urgency line. */
  description?: string;
  /** Discount lines, in display order. May be empty (message-only campaign). */
  discounts: OfferDiscount[];
  /** Optional CTA override, e.g. "View offer". Falls back to engine default. */
  ctaLabel?: string;
}

/**
 * One festival campaign for ONE year.
 *
 * `festivalDate` is the curated observance date. It is NOT derived from a
 * fixed annual recurrence: most Indian festivals move with lunar or solar
 * reckoning, so every year is stored explicitly and sourced. `dateNote`
 * carries the provenance/verification note for that date.
 */
export interface FestivalOffer {
  /** Stable key, unique across the calendar, e.g. "dussehra-2026". */
  id: string;
  /** Gregorian year the observance falls in. */
  year: number;
  /** Festival name as data, e.g. "Dussehra". Never hardcoded in a component. */
  name: string;
  /** Curated observance date, "YYYY-MM-DD". */
  festivalDate: string;
  /** Provenance for `festivalDate` (source + reckoning). */
  dateNote?: string;
  /**
   * Run-up window. Omit for a festival with no pre-campaign.
   *
   * IMPORTANT: its `start` is an authored OUTER bound, not the date the
   * campaign appears. Visibility is governed by
   * `OfferEngineConfiguration.preFestivalLeadDays`, and the engine reports the
   * clamped effective window. Author a LATER start to deliberately shorten one
   * campaign's run-up below the global look-ahead.
   */
  preOffer?: OfferWindow;
  /** The festival-day window. Omit for a pre-only campaign. */
  liveOffer?: OfferWindow;
  /** Campaign-level kill switch. false => neither window can select. */
  enabled?: boolean;
  /**
   * Tie-breaker weight within the same phase. Higher wins. Defaults to 0.
   * Use it to rank flagship moments (Diwali) above minor ones.
   */
  priority?: number;
  /**
   * Relevance metadata, e.g. ["India", "Telangana", "Hyderabad"]. Advisory:
   * the engine does not filter on it. It exists so a future regional variant
   * can enable/disable or re-prioritise campaigns from data alone.
   */
  region?: string[];
  /**
   * Free-form grouping, e.g. "hindu", "muslim", "sikh", "christian", "jain",
   * "buddhist", "regional", "national", "commercial". Deliberately a string,
   * not a union, so a new market can add categories without a type change.
   */
  category?: string;
}

/**
 * A recurring calendar-band campaign used when no festival window is open —
 * the "no gap" layer. Bands repeat every year, so they are stored as
 * month-day pairs ("MM-DD") rather than absolute dates, and a band may wrap
 * the year boundary (start "11-16" -> end "02-14").
 */
export interface SeasonalOffer {
  /** Stable key, e.g. "season-monsoon". */
  id: string;
  /** Kill switch. false => this band never selects. */
  enabled?: boolean;
  /** Inclusive first day of the band, "MM-DD". */
  startMonthDay: string;
  /** Inclusive last day of the band, "MM-DD". May be < start (wraps year). */
  endMonthDay: string;
  eyebrow: string;
  title: string;
  description?: string;
  /** Optional discount lines. A band may be message-only. */
  discounts?: OfferDiscount[];
  ctaLabel?: string;
  /** Tie-breaker weight between overlapping bands. Higher wins. */
  priority?: number;
  region?: string[];
  category?: string;
}

/**
 * The whole engine configuration: one object, one place to edit.
 */
export interface OfferEngineConfiguration {
  /** Master switch. false => no offer ever renders, anywhere. */
  enabled: boolean;
  /**
   * IANA timezone every campaign date is evaluated in. Centralised here so
   * the selected campaign never depends on the visitor's browser timezone.
   */
  timeZone: string;
  /**
   * LOOK-AHEAD, in whole days: how far ahead of a festival its run-up
   * campaign may appear. This — not the authored window length — is what
   * makes an upcoming festival visible.
   *
   * A festival is "upcoming" when `today < festivalDate` and
   * `festivalDate - today <= preFestivalLeadDays`. The bound is INCLUSIVE, so
   * at exactly N days out the campaign shows and at N+1 days it does not.
   *
   * Defaults to DEFAULT_PRE_FESTIVAL_LEAD_DAYS (30) when omitted or invalid.
   * Change it to 20, 25 or 45 here and every campaign in the calendar
   * re-times itself — no component, test or campaign entry is edited.
   */
  preFestivalLeadDays?: number;
  /**
   * Upper bound for a single discount percentage, exclusive of nonsense. A
   * discount at or above this value is treated as malformed data and dropped
   * rather than rendered. Defaults to DEFAULT_MAX_DISCOUNT_PERCENTAGE (60).
   */
  maxDiscountPercentage?: number;
  /** BCP 47 locale used to format the window end date, e.g. "en-IN". */
  locale: string;
  /** Existing in-page anchor the CTA points at, e.g. "#membership". */
  ctaHref: string;
  /** CTA label used when a window does not override it. */
  defaultCtaLabel: string;
  /** Prefix for the end-of-window line, e.g. "Ends" => "ENDS 19 OCT". */
  endsLabel: string;
  /**
   * Generic marker shown beside the eyebrow while a LIVE window is in force,
   * e.g. "Live". Phase wording, not festival wording — it is engine copy, so
   * it lives here rather than in the component.
   */
  /**
   * THE customer-facing state word on the offer card's chip, e.g. "Live".
   *
   * One word for every campaign. It is presentation copy, not phase wording:
   * a run-up campaign, a live festival and a seasonal band all show it, because
   * all three are offers a visitor can act on at the moment they are rendered.
   * There is deliberately no "upcoming" or "seasonal" equivalent — the campaign
   * TITLE carries timing ("Pre-Dussehra"), the chip carries availability.
   *
   * The engine still distinguishes `pre` / `live` / `season` internally via
   * OfferPhase; that is unaffected by this label.
   */
  liveLabel: string;
  /** Word joining a percentage to its plan, e.g. "off" => "10% OFF · 1 YEAR". */
  discountLabel: string;
  /**
   * Label for the undiscounted amount in the pricing register, e.g.
   * "Regular". Engine copy, so the Membership section hardcodes no wording.
   */
  regularPriceLabel: string;
  /** Label for the promotional amount in the pricing register, e.g. "Offer". */
  offerPriceLabel: string;
  /** Curated festival campaigns, any number of years, any order. */
  festivals: FestivalOffer[];
  /** Recurring seasonal bands used when no festival window is open. */
  seasonal: SeasonalOffer[];
}

/** Which ladder rung produced the selected campaign. */
export type OfferPhase = "live" | "pre" | "season";

/**
 * A discount line after it has been resolved against lib/pricing.ts. The
 * label is the plan's own public headline — read, not duplicated.
 */
export interface ResolvedOfferDiscount {
  planId: string;
  percentage: number;
  /** The referenced plan's public label, e.g. "6 Months", "1 Year". */
  planLabel: string;
}

/**
 * The result of applying one percentage to one base amount.
 *
 * Both amounts travel together on purpose: the pricing register must show the
 * regular price beside the offer price, and neither number may be recomputed
 * in JSX. `basePrice` is always the amount read from lib/pricing.ts.
 */
export interface OfferPriceResult {
  /** The percentage actually applied, echoed back for labelling. */
  percentage: number;
  /** The undiscounted amount, exactly as authored in lib/pricing.ts. */
  basePrice: number;
  /** basePrice less percentage, rounded to whole currency units. */
  offerPrice: number;
}

/**
 * One pricing plan that the active campaign promotes, ready to render: the
 * plan's identity plus both amounts. Produced only for plans the campaign
 * actually references and that are publicly priced.
 */
export interface ResolvedPlanOffer extends OfferPriceResult {
  planId: string;
  /** The referenced plan's public label, e.g. "6 Months", "1 Year". */
  planLabel: string;
}

/**
 * The single normalised result of a selection. The UI consumes only this and
 * knows nothing about how it was chosen.
 */
export interface ResolvedOffer {
  type: "festival" | "seasonal";
  phase: OfferPhase;
  /** The winning FestivalOffer.id or SeasonalOffer.id. */
  campaignId: string;
  /** campaignId + phase. Stable identity of the rendered state. */
  stateKey: string;
  eyebrow: string;
  /**
   * The customer-facing micro-state word for the chip, resolved from engine
   * copy (`liveLabel`). Resolved here so the card never maps a phase to wording
   * itself — and it is deliberately the SAME word for every phase, because
   * every selected campaign is an offer a visitor can act on now.
   *
   * Read `phase` — not this — to branch on pre / live / seasonal.
   */
  stateLabel: string;
  title: string;
  description?: string;
  discounts: OfferDiscount[];
  ctaLabel?: string;
  /**
   * Inclusive bounds of the window actually in force, "YYYY-MM-DD".
   *
   * For a run-up campaign this is the EFFECTIVE window — the authored window
   * clamped to the configured look-ahead — not the authored outer bound. For a
   * seasonal band these are recurring "MM-DD" edges instead, which is why the
   * card only prints an end date for `type: "festival"`.
   */
  start: string;
  end: string;
  /** Festival metadata, present only for `type: "festival"`. */
  festivalName?: string;
  festivalDate?: string;
  /**
   * Whole days from today to `festivalDate` for an upcoming campaign; 0 once
   * the festival is live. Undefined for seasonal bands. Exposed for QA and
   * analytics, not required by the card.
   */
  daysUntilFestival?: number;
  priority: number;
  region?: string[];
  category?: string;
}
