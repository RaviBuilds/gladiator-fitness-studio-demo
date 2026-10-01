import type {
  FestivalOffer,
  OfferEngineConfiguration,
  OfferPhase,
  OfferPriceResult,
  OfferWindow,
  PricingPlan,
  ResolvedOffer,
  ResolvedOfferDiscount,
  ResolvedPlanOffer,
  SeasonalOffer,
} from "./types";

/**
 * FESTIVAL & SEASONAL OFFER ENGINE — the selector.
 *
 * One pure function, `getActiveOffer(now, config)`, answers: which single
 * promotional message should the site show at this instant? Everything here is
 * side-effect free and dependency free (no date library, no network, no
 * `Date.now()` read inside the engine — the caller supplies `now`), which is
 * what makes the whole system unit testable against injected dates.
 *
 * ---------------------------------------------------------------------------
 * SELECTION LADDER — evaluated as ORDERED RUNGS, not as one weighted sort
 * ---------------------------------------------------------------------------
 *   1. LIVE      a festival is inside its live window today
 *   2. UPCOMING  the nearest festival whose date is within the configured
 *                look-ahead (`preFestivalLeadDays`, default 30 days)
 *   3. SEASONAL  the recurring band fallback
 *   4. null      nothing renders
 *
 * The rungs are separate buckets on purpose. A lower rung can NEVER outrank a
 * higher one no matter what `priority` numbers the data carries, so a seasonal
 * band cannot shadow an upcoming festival and an upcoming festival cannot
 * shadow a live one. That invariant is structural here, not a consequence of
 * tuning weights.
 *
 * ---------------------------------------------------------------------------
 * WHAT MAKES A FESTIVAL "UPCOMING" — the important rule
 * ---------------------------------------------------------------------------
 * Look-ahead, not authored window length:
 *
 *   today < festivalDate  AND  festivalDate - today <= preFestivalLeadDays
 *
 * The bound is INCLUSIVE — at exactly N days out the run-up shows, at N+1 days
 * it does not. The authored `preOffer.start` is an outer bound only: the
 * effective run-up is the authored window clamped into the look-ahead, and the
 * clamped window is what is reported to the UI. So a campaign authored with a
 * 19-day run-up still appears 30 days out under a 30-day look-ahead, while a
 * campaign deliberately authored to start 7 days out stays short.
 *
 * Separation of concerns, which this file depends on:
 *   festival DATE   -> data       (lib/festival-offers.ts)
 *   campaign WINDOW -> data       (lib/festival-offers.ts)
 *   look-ahead RULE -> config     (OfferEngineConfiguration)
 *   presentation    -> component  (components/ui/OfferSignal.tsx)
 *
 * "NEXT VALID CAMPAIGN" is deliberately NOT a rendering state. It is the
 * consequence of re-evaluating the entire configured calendar — including
 * future years — on every request: the moment Dussehra's live window closes,
 * Diwali is the nearest festival inside the look-ahead, so the site advances on
 * its own. Nobody has to "activate" the next campaign.
 *
 * TIE-BREAKING within a rung, in order:
 *   LIVE      priority (higher wins) -> nearest date -> earlier end -> id
 *   UPCOMING  nearest festival date  -> priority     -> earlier end -> id
 *   SEASONAL  priority               -> soonest close                -> id
 * The final rungs exist only so the result is fully deterministic; a selection
 * can never depend on array order.
 *
 * DATES
 *   Every date is a strict "YYYY-MM-DD" calendar date, compared as a string
 *   (ISO dates sort lexicographically), never via `new Date("10/11/2026")`.
 *   "Today" is derived from the caller's instant in the configured IANA
 *   timezone via Intl, so two visitors in different browser timezones see the
 *   same campaign, and a window changes over exactly at local midnight.
 *
 * GRACEFUL FAILURE
 *   Malformed data is skipped, never thrown: a bad date, an inverted window, a
 *   missing phase, a disabled flag, an unknown plan id, an out-of-range
 *   percentage or an unknown timezone all degrade to "this candidate does not
 *   participate". The worst possible outcome is `null`, which renders nothing.
 */

/** Factory default. Overridden per site via OfferEngineConfiguration.timeZone. */
export const DEFAULT_TIME_ZONE = "Asia/Kolkata";

/**
 * Factory look-ahead in whole days: how far ahead of a festival its run-up
 * campaign may appear. Overridden per site via
 * OfferEngineConfiguration.preFestivalLeadDays.
 */
export const DEFAULT_PRE_FESTIVAL_LEAD_DAYS = 30;

/**
 * Hard ceiling on a single discount percentage. A percentage at or above this
 * is treated as malformed data and dropped — a data typo can shrink an offer,
 * never publish an 900%-off claim. Overridden via
 * OfferEngineConfiguration.maxDiscountPercentage.
 */
export const DEFAULT_MAX_DISCOUNT_PERCENTAGE = 60;

/** Rung ranking, retained as metadata on the result. Live > pre > season. */
const PHASE_RANK: Record<OfferPhase, number> = { live: 3, pre: 2, season: 1 };

const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_DAY = /^\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

/**
 * True for a real "YYYY-MM-DD" calendar date. Round-trips through UTC so
 * impossible days are rejected — "2027-02-29" is false, "2028-02-29" is true.
 */
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !CALENDAR_DATE.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

/**
 * True for a real "MM-DD" month-day used by seasonal bands. 02-29 is allowed:
 * bands recur every year, so a band edge on the leap day is legitimate.
 */
export function isMonthDay(value: unknown): value is string {
  if (typeof value !== "string" || !MONTH_DAY.test(value)) return false;
  // 2024 is a leap year, so this accepts 02-29 and still rejects 02-30.
  return isCalendarDate(`2024-${value}`);
}

/**
 * The calendar date at `now` in `timeZone`, as "YYYY-MM-DD".
 *
 * This is the only place a wall-clock instant becomes a campaign date. An
 * invalid Date returns null; an unknown timezone falls back to the factory
 * default rather than throwing.
 */
export function toCalendarDate(
  now: Date,
  timeZone: string = DEFAULT_TIME_ZONE
): string | null {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) return null;

  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
  } catch {
    if (timeZone === DEFAULT_TIME_ZONE) return null;
    return toCalendarDate(now, DEFAULT_TIME_ZONE);
  }

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  const year = read("year");
  const month = read("month");
  const day = read("day");
  if (!year || !month || !day) return null;

  const date = `${year.padStart(4, "0")}-${month}-${day}`;
  return isCalendarDate(date) ? date : null;
}

/** Whole days since the Unix epoch. Used only for distance arithmetic. */
export function dayNumber(date: string): number {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

/**
 * Shifts a "YYYY-MM-DD" date by whole days. Pure UTC, so it crosses month,
 * year and leap-day boundaries correctly. Used to project the look-ahead edge
 * back from a festival date.
 */
export function shiftCalendarDate(date: string, days: number): string {
  const shifted = new Date((dayNumber(date) + days) * MS_PER_DAY);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(
    shifted.getUTCDate()
  )}`;
}

/** Inclusive containment for an absolute window. */
export function isWithinWindow(today: string, start: string, end: string): boolean {
  return today >= start && today <= end;
}

/**
 * Inclusive containment for a recurring band. A band whose end month-day is
 * before its start month-day wraps the year boundary ("11-16" -> "02-14"), so
 * December and January both fall inside the same winter band.
 */
export function isWithinSeasonBand(
  todayMonthDay: string,
  startMonthDay: string,
  endMonthDay: string
): boolean {
  if (startMonthDay <= endMonthDay) {
    return todayMonthDay >= startMonthDay && todayMonthDay <= endMonthDay;
  }
  return todayMonthDay >= startMonthDay || todayMonthDay <= endMonthDay;
}

/**
 * The configured look-ahead, in whole days, defensively normalised.
 *
 * A missing, non-numeric, negative or fractional value falls back to the
 * factory default rather than silently disabling every run-up campaign. 0 is
 * honoured: it means "never show a campaign before the festival itself".
 */
export function resolvePreFestivalLeadDays(
  config: OfferEngineConfiguration | null | undefined
): number {
  const configured = config?.preFestivalLeadDays;
  if (typeof configured !== "number" || !Number.isFinite(configured)) {
    return DEFAULT_PRE_FESTIVAL_LEAD_DAYS;
  }
  if (configured < 0) return DEFAULT_PRE_FESTIVAL_LEAD_DAYS;
  return Math.floor(configured);
}

/** The configured discount ceiling, defensively normalised. */
function resolveMaxDiscountPercentage(
  config: OfferEngineConfiguration | null | undefined
): number {
  const configured = config?.maxDiscountPercentage;
  if (typeof configured !== "number" || !Number.isFinite(configured)) {
    return DEFAULT_MAX_DISCOUNT_PERCENTAGE;
  }
  if (configured <= 0 || configured > 100) return DEFAULT_MAX_DISCOUNT_PERCENTAGE;
  return configured;
}

/**
 * Days left in the current pass of a seasonal band, used only as a tie-breaker
 * between overlapping bands (the soonest-to-close band wins).
 */
function seasonBandDaysRemaining(today: string, band: SeasonalOffer): number {
  const year = Number(today.slice(0, 4));
  for (const candidateYear of [year, year + 1]) {
    const end = `${candidateYear}-${band.endMonthDay}`;
    if (isCalendarDate(end) && end >= today) {
      return dayNumber(end) - dayNumber(today);
    }
  }
  return Number.MAX_SAFE_INTEGER;
}

/** A window is usable only if it is enabled, well-formed and not inverted. */
function isUsableWindow(window: OfferWindow | undefined): window is OfferWindow {
  if (!window || typeof window !== "object") return false;
  if (window.enabled === false) return false;
  if (!isCalendarDate(window.start) || !isCalendarDate(window.end)) return false;
  if (window.start > window.end) return false;
  if (typeof window.title !== "string" || window.title.trim() === "") return false;
  return true;
}

/**
 * The customer-facing state word for the chip.
 *
 * PRESENTATION-ONLY, and deliberately INDEPENDENT of `phase`. Every campaign
 * the selector returns is one a visitor can act on right now — that is the only
 * reason it is being rendered, and the pricing register is already showing its
 * real discounted amounts — so the card presents a single availability state
 * rather than three. There is no customer-facing "upcoming" state: a run-up
 * campaign is a live OFFER even though the festival itself is still ahead, and
 * the campaign title ("Pre-Dussehra") is what carries that timing, not the chip.
 *
 * The internal `phase` (`pre` / `live` / `season`) is untouched and remains the
 * engine's and the tests' source of truth for selection. Nothing about which
 * campaign wins is decided here — this function only picks a word.
 */
function resolveStateLabel(config: OfferEngineConfiguration): string {
  return typeof config.liveLabel === "string" && config.liveLabel.trim() !== ""
    ? config.liveLabel
    : "Live";
}

interface Candidate {
  offer: ResolvedOffer;
  priority: number;
  /** Whole days from today to the campaign's most relevant date. */
  distance: number;
}

/**
 * RUNG 1 — a live festival window containing today.
 *
 * The live window is taken exactly as authored: the look-ahead has no bearing
 * on it, because "the festival is happening" is a fact about the calendar, not
 * a marketing lead time.
 */
function liveCandidate(
  festival: FestivalOffer,
  today: string,
  todayNumber: number,
  config: OfferEngineConfiguration
): Candidate | null {
  const window = festival.liveOffer;
  if (!isUsableWindow(window)) return null;
  if (!isWithinWindow(today, window.start, window.end)) return null;

  const hasDate = isCalendarDate(festival.festivalDate);
  const anchor = hasDate ? festival.festivalDate : window.start;
  const priority = Number.isFinite(festival.priority) ? Number(festival.priority) : 0;

  return {
    priority,
    distance: Math.abs(dayNumber(anchor) - todayNumber),
    offer: {
      ...baseOffer(festival, window, "live", config),
      start: window.start,
      end: window.end,
      // The festival is today or already under way; nothing is "until".
      daysUntilFestival: hasDate
        ? Math.max(0, dayNumber(festival.festivalDate) - todayNumber)
        : undefined,
      priority,
    },
  };
}

/**
 * RUNG 2 — the run-up to a festival that is within the look-ahead.
 *
 * Eligibility is the look-ahead rule, not the authored window length:
 *
 *   today < festivalDate  AND  festivalDate - today <= leadDays
 *
 * The authored window still participates as an outer bound, so data can
 * shorten one campaign, and the window reported to the UI is the clamped
 * effective window (typically `[festivalDate - leadDays, festivalDate - 1]`).
 *
 * A festival with a malformed `festivalDate` cannot be measured against the
 * look-ahead, so it degrades to plain authored-window containment rather than
 * disappearing.
 */
function upcomingCandidate(
  festival: FestivalOffer,
  today: string,
  todayNumber: number,
  leadDays: number,
  config: OfferEngineConfiguration
): Candidate | null {
  const window = festival.preOffer;
  if (!isUsableWindow(window)) return null;

  const priority = Number.isFinite(festival.priority) ? Number(festival.priority) : 0;

  if (!isCalendarDate(festival.festivalDate)) {
    // Degraded path: no measurable anchor, so honour the authored window only.
    if (!isWithinWindow(today, window.start, window.end)) return null;
    return {
      priority,
      distance: Math.abs(dayNumber(window.start) - todayNumber),
      offer: {
        ...baseOffer(festival, window, "pre", config),
        start: window.start,
        end: window.end,
        priority,
      },
    };
  }

  const festivalDate = festival.festivalDate;
  const daysUntil = dayNumber(festivalDate) - todayNumber;

  // Strictly in the future, and no further away than the look-ahead allows.
  if (daysUntil <= 0) return null;
  if (daysUntil > leadDays) return null;

  // Effective window: the look-ahead edge, but never earlier than the authored
  // outer bound, and never running into the festival's own day.
  const leadEdge = shiftCalendarDate(festivalDate, -leadDays);
  const effectiveStart = window.start > leadEdge ? window.start : leadEdge;
  const dayBefore = shiftCalendarDate(festivalDate, -1);
  const effectiveEnd = window.end < dayBefore ? window.end : dayBefore;

  if (effectiveStart > effectiveEnd) return null;
  if (!isWithinWindow(today, effectiveStart, effectiveEnd)) return null;

  return {
    priority,
    distance: daysUntil,
    offer: {
      ...baseOffer(festival, window, "pre", config),
      start: effectiveStart,
      end: effectiveEnd,
      daysUntilFestival: daysUntil,
      priority,
    },
  };
}

/** Shared normalisation for both festival rungs. */
function baseOffer(
  festival: FestivalOffer,
  window: OfferWindow,
  phase: "pre" | "live",
  config: OfferEngineConfiguration
): ResolvedOffer {
  return {
    type: "festival",
    phase,
    campaignId: festival.id,
    stateKey: `${festival.id}:${phase}`,
    eyebrow: window.eyebrow,
    stateLabel: resolveStateLabel(config),
    title: window.title,
    description: window.description,
    discounts: Array.isArray(window.discounts) ? window.discounts : [],
    ctaLabel: window.ctaLabel,
    start: window.start,
    end: window.end,
    festivalName: festival.name,
    festivalDate: isCalendarDate(festival.festivalDate)
      ? festival.festivalDate
      : undefined,
    priority: 0,
    region: festival.region,
    category: festival.category,
  };
}

/** RUNG 3 — the recurring band fallback. */
function seasonalCandidate(
  band: SeasonalOffer,
  today: string,
  config: OfferEngineConfiguration
): Candidate | null {
  if (!band || typeof band !== "object") return null;
  if (band.enabled === false) return null;
  if (!isMonthDay(band.startMonthDay) || !isMonthDay(band.endMonthDay)) return null;
  if (typeof band.title !== "string" || band.title.trim() === "") return null;
  if (!isWithinSeasonBand(today.slice(5), band.startMonthDay, band.endMonthDay)) {
    return null;
  }

  const priority = Number.isFinite(band.priority) ? Number(band.priority) : 0;

  return {
    priority,
    distance: seasonBandDaysRemaining(today, band),
    offer: {
      type: "seasonal",
      phase: "season",
      campaignId: band.id,
      stateKey: `${band.id}:season`,
      eyebrow: band.eyebrow,
      stateLabel: resolveStateLabel(config),
      title: band.title,
      description: band.description,
      discounts: Array.isArray(band.discounts) ? band.discounts : [],
      ctaLabel: band.ctaLabel,
      // Bands recur, so the "window" reported to the UI is the band edge in
      // month-day form. The card shows an end date only for dated campaigns.
      start: band.startMonthDay,
      end: band.endMonthDay,
      priority,
      region: band.region,
      category: band.category,
    },
  };
}

/** Highest priority, then nearest date, then earliest end, then id. */
function byPriorityThenDistance(a: Candidate, b: Candidate): number {
  return (
    b.priority - a.priority ||
    a.distance - b.distance ||
    compare(a.offer.end, b.offer.end) ||
    compare(a.offer.campaignId, b.offer.campaignId)
  );
}

/**
 * Nearest festival first, then priority, then earliest end, then id.
 *
 * Distance leads here — the brief's "nearest upcoming festival" rule — so a
 * flagship campaign three weeks out cannot jump ahead of a smaller festival
 * that is three days away. Priority only settles genuine date ties.
 */
function byDistanceThenPriority(a: Candidate, b: Candidate): number {
  return (
    a.distance - b.distance ||
    b.priority - a.priority ||
    compare(a.offer.end, b.offer.end) ||
    compare(a.offer.campaignId, b.offer.campaignId)
  );
}

/**
 * THE selector. Returns exactly one campaign, or null.
 *
 * @param now    the instant to evaluate — injected, never read internally, so
 *               tests and QA can drive any date through the real calendar.
 * @param config the whole offer configuration (lib/festival-offers.ts).
 */
export function getActiveOffer(
  now: Date,
  config: OfferEngineConfiguration | null | undefined
): ResolvedOffer | null {
  if (!config || typeof config !== "object") return null;
  if (config.enabled === false) return null;

  const timeZone =
    typeof config.timeZone === "string" && config.timeZone.trim() !== ""
      ? config.timeZone
      : DEFAULT_TIME_ZONE;

  const today = toCalendarDate(now, timeZone);
  if (!today) return null;
  const todayNumber = dayNumber(today);
  const leadDays = resolvePreFestivalLeadDays(config);

  const live: Candidate[] = [];
  const upcoming: Candidate[] = [];
  const seasonal: Candidate[] = [];

  for (const festival of Array.isArray(config.festivals) ? config.festivals : []) {
    if (!festival || typeof festival !== "object") continue;
    if (festival.enabled === false) continue;
    if (typeof festival.id !== "string" || festival.id === "") continue;

    const liveHit = liveCandidate(festival, today, todayNumber, config);
    if (liveHit) live.push(liveHit);

    // Evaluated even when a live window matched: a different festival may be
    // live today, and rung selection happens after every bucket is filled.
    const upcomingHit = upcomingCandidate(
      festival,
      today,
      todayNumber,
      leadDays,
      config
    );
    if (upcomingHit) upcoming.push(upcomingHit);
  }

  for (const band of Array.isArray(config.seasonal) ? config.seasonal : []) {
    if (!band || typeof band !== "object") continue;
    if (typeof band.id !== "string" || band.id === "") continue;
    const candidate = seasonalCandidate(band, today, config);
    if (candidate) seasonal.push(candidate);
  }

  // ORDERED RUNGS. The first non-empty bucket wins outright — this is what
  // guarantees live > upcoming > seasonal independently of priority data.
  if (live.length > 0) return live.sort(byPriorityThenDistance)[0].offer;
  if (upcoming.length > 0) return upcoming.sort(byDistanceThenPriority)[0].offer;
  if (seasonal.length > 0) return seasonal.sort(byPriorityThenDistance)[0].offer;
  return null;
}

/** Rung rank of a resolved offer. Exposed for QA/analytics, not for layout. */
export function offerPhaseRank(offer: ResolvedOffer): number {
  return PHASE_RANK[offer.phase] ?? 0;
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/* ===========================================================================
 * PRICING BRIDGE
 *
 * lib/pricing.ts        -> base prices (the ONLY source of money)
 * lib/festival-offers.ts -> planId + percentage (never an amount)
 * this file              -> regular price + offer price
 * components             -> display
 *
 * Campaign data stores no rupee amount, so re-pricing the gym in
 * lib/pricing.ts automatically re-prices every promotion.
 * ========================================================================= */

/**
 * THE price calculation. One pure function, used by every surface.
 *
 * Returns both amounts together so nothing downstream ever recomputes a price
 * in JSX, and returns null — rather than a broken or negative figure — for any
 * input it cannot honour:
 *
 *   - non-finite or negative base price
 *   - non-finite percentage, <= 0, or >= `maxPercentage`
 *
 * Rounding is deterministic to whole currency units (Math.round), matching the
 * register's `maximumFractionDigits: 0` formatting: the displayed offer price
 * is exactly the number used in the calculation, never a rounded view of a
 * different value. The result is clamped at 0, so no arithmetic path can
 * produce a negative price.
 *
 *   resolveOfferPrice(10000, 10) -> { percentage: 10, basePrice: 10000, offerPrice: 9000 }
 *   resolveOfferPrice(18000, 20) -> { percentage: 20, basePrice: 18000, offerPrice: 14400 }
 */
export function resolveOfferPrice(
  basePrice: number,
  percentage: number,
  maxPercentage: number = DEFAULT_MAX_DISCOUNT_PERCENTAGE
): OfferPriceResult | null {
  if (typeof basePrice !== "number" || !Number.isFinite(basePrice)) return null;
  if (basePrice < 0) return null;
  if (typeof percentage !== "number" || !Number.isFinite(percentage)) return null;
  if (percentage <= 0) return null;
  if (percentage >= 100 || percentage >= maxPercentage) return null;

  const offerPrice = Math.max(0, Math.round(basePrice - (basePrice * percentage) / 100));

  return { percentage, basePrice, offerPrice };
}

/**
 * Resolves discount references against the live pricing configuration.
 *
 * This is the label-only bridge, used by the hero card: it reads one field per
 * plan — the plan's own public headline (`name`, with `duration` as a
 * fallback) — and copies no amount. A reference to a plan that no longer
 * exists, or to a plan the gym has hidden, is dropped, so a stale planId
 * degrades to one fewer line rather than a broken claim. Duplicate references
 * collapse to the first, deterministically.
 */
export function resolveOfferDiscounts(
  discounts: readonly { planId: string; percentage: number }[] | undefined,
  plans: readonly PricingPlan[] | undefined,
  maxPercentage: number = DEFAULT_MAX_DISCOUNT_PERCENTAGE
): ResolvedOfferDiscount[] {
  if (!Array.isArray(discounts) || !Array.isArray(plans)) return [];

  const resolved: ResolvedOfferDiscount[] = [];
  const seen = new Set<string>();

  for (const discount of discounts) {
    if (!discount || typeof discount.planId !== "string") continue;
    if (!Number.isFinite(discount.percentage)) continue;
    if (discount.percentage <= 0) continue;
    if (discount.percentage >= 100 || discount.percentage >= maxPercentage) continue;
    if (seen.has(discount.planId)) continue;

    const plan = plans.find((candidate) => candidate.id === discount.planId);
    if (!plan || plan.priceStatus === "hidden") continue;

    const planLabel = planPublicLabel(plan);
    if (!planLabel) continue;

    seen.add(discount.planId);
    resolved.push({
      planId: plan.id,
      percentage: discount.percentage,
      planLabel,
    });
  }

  return resolved;
}

/**
 * Resolves an active campaign into per-plan promotional pricing, keyed by plan
 * id — the bridge used by the pricing register.
 *
 * Only plans the campaign actually references appear in the map, so every
 * other plan renders exactly as it did before the campaign existed. A plan is
 * excluded when it is unknown, hidden, not publicly priced (`contact` status
 * or a missing amount) or referenced with a percentage the calculation
 * rejects. Duplicate references collapse to the first.
 *
 * `null`/seasonal/live/pre are all handled identically: the map simply follows
 * whatever the selected campaign references, which is what keeps the hero card
 * and the register showing the same promotion.
 */
export function resolvePlanOffers(
  offer: ResolvedOffer | null | undefined,
  plans: readonly PricingPlan[] | undefined,
  config?: OfferEngineConfiguration | null
): Map<string, ResolvedPlanOffer> {
  const result = new Map<string, ResolvedPlanOffer>();
  if (!offer || !Array.isArray(plans)) return result;
  if (!Array.isArray(offer.discounts)) return result;

  const maxPercentage = resolveMaxDiscountPercentage(config);

  for (const discount of offer.discounts) {
    if (!discount || typeof discount.planId !== "string") continue;
    if (result.has(discount.planId)) continue;

    const plan = plans.find((candidate) => candidate.id === discount.planId);
    if (!plan || plan.priceStatus !== "exact") continue;
    if (typeof plan.price !== "number") continue;

    const planLabel = planPublicLabel(plan);
    if (!planLabel) continue;

    const price = resolveOfferPrice(plan.price, discount.percentage, maxPercentage);
    if (!price) continue;

    result.set(plan.id, { planId: plan.id, planLabel, ...price });
  }

  return result;
}

/** The plan's own public headline. Never invented, never an amount. */
function planPublicLabel(plan: PricingPlan): string | null {
  if (typeof plan.name === "string" && plan.name.trim() !== "") return plan.name;
  if (typeof plan.duration === "string" && plan.duration.trim() !== "") {
    return plan.duration;
  }
  return null;
}

/**
 * Formats a window end as a compact "19 Oct" style label.
 *
 * The stored date is anchored at UTC midnight and formatted in UTC, so the
 * rendered day always equals the authored day regardless of the campaign
 * timezone. Returns null for a seasonal band edge ("MM-DD") or bad data, and
 * the card simply omits the line.
 */
export function formatWindowEnd(end: string, locale: string = "en-IN"): string | null {
  if (!isCalendarDate(end)) return null;
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(new Date(`${end}T00:00:00Z`));
  } catch {
    return null;
  }
}
