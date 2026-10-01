import type {
  FestivalOffer,
  OfferDiscount,
  OfferEngineConfiguration,
  OfferWindow,
  SeasonalOffer,
} from "./types";

/**
 * FESTIVAL & SEASONAL OFFER ENGINE — the campaign calendar.
 *
 * This is the ONLY file a gym owner or operator edits to run promotions. The
 * selector (lib/offer-engine.ts) and the card (components/ui/OfferSignal.tsx)
 * contain no festival name, no date and no percentage.
 *
 * ---------------------------------------------------------------------------
 * NO EXTERNAL DEPENDENCIES
 * ---------------------------------------------------------------------------
 * No festival API, no holiday API, no calendar service, no CMS, no database,
 * no runtime fetch. Every date below is curated text in this file.
 *
 * ---------------------------------------------------------------------------
 * DATE PROVENANCE — read this before editing a date
 * ---------------------------------------------------------------------------
 * Indian festival dates are NOT fixed Gregorian recurrences. Most move with
 * lunar reckoning (Diwali, Dussehra, Holi, Janmashtami…), some with solar
 * transit (Makar Sankranti / Pongal), and the Islamic dates shift ~11 days a
 * year and are ultimately settled by local moon sighting. Nothing here is
 * derived from a "same date every year" rule.
 *
 * Every observance date in `campaigns` was taken from the Drik Panchang
 * "Indian Festivals and Holidays" calendars for 2026, 2027 and 2028
 * (https://www.drikpanchang.com/calendars/indian/indiancalendar.html?year=YYYY),
 * read on 2026-09-30, and each template records its reckoning in `dateNote`.
 * Cross-check: Dussehra resolves to 2026-10-20, 2027-10-09 and 2028-09-27,
 * which matches the reference dates supplied with this brief.
 *
 * Known-unverified moments are intentionally ABSENT rather than guessed.
 * Akshaya Tritiya, for example, is not included: its 2026-2028 dates could
 * not be confirmed from a primary calendar in this pass, and inferring them
 * from a neighbouring tithi would be inventing precision. Add it as data once
 * verified — no code change is required.
 *
 * Islamic observances (Eid al-Fitr, Bakrid) are stored as the expected
 * civil-calendar date. A gym should confirm the local announcement each year;
 * the campaign still behaves correctly if the date is corrected here.
 *
 * ---------------------------------------------------------------------------
 * PLACEHOLDER COMMERCIAL TERMS
 * ---------------------------------------------------------------------------
 * The percentages below are DEMONSTRATION VALUES for the master template.
 * They are not an approved offer for any real gym. Replace the three ladders
 * in this file (or per campaign) with terms the business has actually
 * approved. Discounts reference an existing plan id from lib/pricing.ts and
 * never restate an amount, so re-pricing the site cannot desync the offers.
 *
 * ---------------------------------------------------------------------------
 * ADDING 2029 AND BEYOND
 * ---------------------------------------------------------------------------
 * Add one `dates` row per template. Nothing else changes. When the calendar
 * runs out, the seasonal bands take over automatically — the site never keeps
 * showing a stale final campaign.
 */

/* ---------------------------------------------------------------------------
 * Local date helpers.
 *
 * Deliberately duplicated here instead of imported from lib/offer-engine.ts:
 * this file must stay import-free of runtime values so the Node test runner
 * can load it directly with type stripping. They are 10 lines of pure UTC
 * arithmetic, which is also why they are leap-year safe.
 * ------------------------------------------------------------------------- */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

/** Shifts an authored "YYYY-MM-DD" by whole days. Pure UTC, leap-year safe. */
function shiftDays(date: string, days: number): string {
  const base = Date.UTC(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10))
  );
  const shifted = new Date(base + days * MS_PER_DAY);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(
    shifted.getUTCDate()
  )}`;
}

/**
 * True only for a real calendar date. The round-trip through shiftDays()
 * rejects impossible days, so a typo like "2027-02-29" drops that one year
 * out of the calendar instead of silently becoming 1 March.
 */
function isAuthoredDate(value: unknown): value is string {
  return typeof value === "string" && ISO_DATE.test(value) && shiftDays(value, 0) === value;
}

/* ---------------------------------------------------------------------------
 * Commercial terms. Three shared ladders keep the whole calendar consistent
 * and give an operator exactly three numbers to renegotiate.
 * ------------------------------------------------------------------------- */

/**
 * Flagship moments (Diwali, New Year). The year's strongest terms.
 * DEMONSTRATION VALUES — replace with terms the business has approved.
 */
const FLAGSHIP_TERMS: OfferDiscount[] = [
  { planId: "half-year", percentage: 15 },
  { planId: "annual", percentage: 25 },
];

/**
 * Standard festive moments — the reference ladder for the master template:
 * 10% off the 6-month plan, 20% off the 1-year plan.
 * DEMONSTRATION VALUES — replace with terms the business has approved.
 */
const STANDARD_TERMS: OfferDiscount[] = [
  { planId: "half-year", percentage: 10 },
  { planId: "annual", percentage: 20 },
];

/**
 * Lighter, single-line moments and the seasonal fallback.
 * DEMONSTRATION VALUES — replace with terms the business has approved.
 */
const LIGHT_TERMS: OfferDiscount[] = [{ planId: "annual", percentage: 10 }];

/* ---------------------------------------------------------------------------
 * Campaign templates.
 *
 * One template describes a festival ONCE — its wording, audience, weight and
 * window shape — plus a curated observance date per year. The builder below
 * expands it into one strongly typed FestivalOffer per year with explicit
 * pre/live windows, so the selector still sees a plain, auditable array.
 *
 * Window shape:
 *   The RUN-UP window is not authored per campaign. Its length is governed by
 *   `offerEngine.preFestivalLeadDays` (the look-ahead, default 30 days), so
 *   retiming every run-up on the site is a one-number change. The builder
 *   emits a generous outer bound (PRE_WINDOW_OUTER_DAYS) and the engine clamps
 *   it to the look-ahead.
 *     preCampaign: false  -> this festival never shows a run-up campaign.
 *     preLeadDays: N      -> optional override that SHORTENS one campaign's
 *                            run-up to N days, below the global look-ahead.
 *                            Omit it in the normal case.
 *   liveTailDays N  -> live window runs [date, date + N]. 0 = the day itself.
 * For multi-day observances the anchor is the FIRST day and liveTailDays
 * covers the rest (Navratri, Ganesh Utsav).
 *
 * priority breaks ties inside the same phase. Higher wins. For the run-up rung
 * the NEAREST festival wins first and priority only settles date ties, so a
 * flagship campaign cannot jump ahead of a festival that is sooner.
 * ------------------------------------------------------------------------- */

/**
 * Outer bound the builder authors for a run-up window, in days before the
 * festival. Deliberately wider than any sane look-ahead: the engine clamps the
 * window to `offerEngine.preFestivalLeadDays`, so this value only has to be
 * large enough not to be the binding constraint. Raising the site's look-ahead
 * above this number is the one case where this would need to change.
 */
const PRE_WINDOW_OUTER_DAYS = 120;

interface CampaignTemplate {
  /** Slug; the per-year id becomes `${id}-${year}`. */
  id: string;
  /** Festival name as data. */
  name: string;
  /** Mono eyebrow above the title. */
  eyebrow: string;
  /** Title during the run-up. Defaults to `Pre-${name}`. */
  preTitle?: string;
  /** Title during the observance. Defaults to `name`. */
  liveTitle?: string;
  /** Optional one-line supporting copy, shared by both windows. */
  description?: string;
  /**
   * false => no run-up campaign for this festival, ever. Omit for enabled:
   * every festival runs a look-ahead-governed run-up by default.
   */
  preCampaign?: boolean;
  /**
   * Optional override that SHORTENS this campaign's run-up to N days before
   * the festival. Omit to use the global look-ahead. It can only shorten — the
   * look-ahead is always the upper bound.
   */
  preLeadDays?: number;
  liveTailDays: number;
  discounts: OfferDiscount[];
  priority: number;
  category: string;
  region: string[];
  /** Campaign-level kill switch. Omit for enabled. */
  enabled?: boolean;
  /** Reckoning + why the date moves. Required: this is the audit trail. */
  dateNote: string;
  /** Curated observance date per Gregorian year, "YYYY-MM-DD". */
  dates: Record<number, string>;
}

const FESTIVE_EYEBROW = "Festive offer";
const NATIONAL_EYEBROW = "National day offer";

const campaignTemplates: CampaignTemplate[] = [
  {
    id: "new-year",
    name: "New Year",
    eyebrow: "New year offer",
    preTitle: "Pre-New Year",
    liveTitle: "New Year Block",
    description: "Start the year on a programmed block, not a resolution.",
    liveTailDays: 6,
    discounts: FLAGSHIP_TERMS,
    priority: 55,
    category: "commercial",
    region: ["India"],
    dateNote: "Fixed Gregorian date, 1 January.",
    dates: { 2026: "2026-01-01", 2027: "2027-01-01", 2028: "2028-01-01" },
  },
  {
    id: "sankranti-pongal",
    name: "Sankranti & Pongal",
    eyebrow: FESTIVE_EYEBROW,
    preTitle: "Pre-Sankranti",
    liveTitle: "Sankranti & Pongal",
    liveTailDays: 2,
    discounts: STANDARD_TERMS,
    priority: 50,
    category: "regional",
    region: ["India", "Telangana", "Andhra Pradesh", "Tamil Nadu"],
    dateNote:
      "Solar: Sun's transit into Makara. Falls on 14 or 15 January, not a fixed date. Anchor is Sankranti/Thai Pongal day; the live window covers the three-day observance.",
    dates: { 2026: "2026-01-14", 2027: "2027-01-15", 2028: "2028-01-15" },
  },
  {
    id: "republic-day",
    name: "Republic Day",
    eyebrow: NATIONAL_EYEBROW,
    preTitle: "Pre-Republic Day",
    liveTitle: "Republic Day",
    liveTailDays: 0,
    discounts: LIGHT_TERMS,
    priority: 30,
    category: "national",
    region: ["India"],
    dateNote: "Fixed Gregorian date, 26 January.",
    dates: { 2026: "2026-01-26", 2027: "2027-01-26", 2028: "2028-01-26" },
  },
  {
    id: "maha-shivratri",
    name: "Maha Shivratri",
    eyebrow: FESTIVE_EYEBROW,
    liveTailDays: 0,
    discounts: STANDARD_TERMS,
    priority: 35,
    category: "hindu",
    region: ["India"],
    dateNote: "Lunar: Phalguna, Krishna Chaturdashi. Moves every year.",
    dates: { 2026: "2026-02-15", 2027: "2027-03-06", 2028: "2028-02-23" },
  },
  {
    id: "holi",
    name: "Holi",
    eyebrow: FESTIVE_EYEBROW,
    liveTailDays: 1,
    discounts: STANDARD_TERMS,
    priority: 45,
    category: "hindu",
    region: ["India"],
    dateNote:
      "Lunar: Chaitra, Krishna Pratipada (Rangwali Holi, the day after Holika Dahan). Moves every year.",
    dates: { 2026: "2026-03-04", 2027: "2027-03-22", 2028: "2028-03-11" },
  },
  {
    id: "ugadi-gudi-padwa",
    name: "Ugadi & Gudi Padwa",
    eyebrow: FESTIVE_EYEBROW,
    preTitle: "Pre-Ugadi",
    liveTitle: "Ugadi & Gudi Padwa",
    description: "New-year reset: pick a term and start a coached block.",
    liveTailDays: 1,
    discounts: STANDARD_TERMS,
    priority: 50,
    category: "regional",
    region: ["India", "Telangana", "Andhra Pradesh", "Karnataka", "Maharashtra"],
    dateNote: "Lunar: Chaitra, Shukla Pratipada. Telugu/Kannada/Marathi new year.",
    dates: { 2026: "2026-03-19", 2027: "2027-04-07", 2028: "2028-03-27" },
  },
  {
    id: "eid-al-fitr",
    name: "Eid al-Fitr",
    eyebrow: FESTIVE_EYEBROW,
    liveTailDays: 1,
    discounts: STANDARD_TERMS,
    priority: 45,
    category: "muslim",
    region: ["India", "Telangana", "Hyderabad"],
    dateNote:
      "Islamic lunar calendar; expected civil date. Final observance is settled by local moon sighting — confirm and correct here each year.",
    dates: { 2026: "2026-03-20", 2027: "2027-03-10", 2028: "2028-02-27" },
  },
  {
    id: "ram-navami",
    name: "Ram Navami",
    eyebrow: FESTIVE_EYEBROW,
    liveTailDays: 0,
    discounts: LIGHT_TERMS,
    priority: 30,
    category: "hindu",
    region: ["India"],
    dateNote: "Lunar: Chaitra, Shukla Navami (Smarta observance).",
    dates: { 2026: "2026-03-26", 2027: "2027-04-15", 2028: "2028-04-03" },
  },
  {
    id: "mahavir-jayanti",
    name: "Mahavir Jayanti",
    eyebrow: FESTIVE_EYEBROW,
    liveTailDays: 0,
    discounts: LIGHT_TERMS,
    priority: 25,
    category: "jain",
    region: ["India"],
    dateNote: "Lunar: Chaitra, Shukla Trayodashi.",
    dates: { 2026: "2026-03-31", 2027: "2027-04-19", 2028: "2028-04-07" },
  },
  {
    id: "easter",
    name: "Easter",
    eyebrow: FESTIVE_EYEBROW,
    liveTailDays: 0,
    discounts: LIGHT_TERMS,
    priority: 25,
    category: "christian",
    region: ["India"],
    dateNote:
      "Computus (first Sunday after the paschal full moon). Anchor is Easter Sunday; the run-up deliberately does not promote across Good Friday.",
    dates: { 2026: "2026-04-05", 2027: "2027-03-28", 2028: "2028-04-16" },
  },
  {
    id: "baisakhi",
    name: "Baisakhi",
    eyebrow: FESTIVE_EYEBROW,
    liveTailDays: 0,
    discounts: LIGHT_TERMS,
    priority: 30,
    category: "sikh",
    region: ["India", "Punjab"],
    dateNote: "Solar: observed on Mesha Sankranti, 13 or 14 April.",
    dates: { 2026: "2026-04-14", 2027: "2027-04-14", 2028: "2028-04-13" },
  },
  {
    id: "buddha-purnima",
    name: "Buddha Purnima",
    eyebrow: FESTIVE_EYEBROW,
    liveTailDays: 0,
    discounts: LIGHT_TERMS,
    priority: 25,
    category: "buddhist",
    region: ["India"],
    dateNote: "Lunar: Vaishakha, Shukla Purnima.",
    dates: { 2026: "2026-05-01", 2027: "2027-05-20", 2028: "2028-05-08" },
  },
  {
    id: "bakrid",
    name: "Bakrid",
    eyebrow: FESTIVE_EYEBROW,
    preTitle: "Pre-Bakrid",
    liveTitle: "Bakrid (Eid al-Adha)",
    liveTailDays: 1,
    discounts: STANDARD_TERMS,
    priority: 40,
    category: "muslim",
    region: ["India", "Telangana", "Hyderabad"],
    dateNote:
      "Islamic lunar calendar; expected civil date. Confirm the local announcement each year and correct here.",
    dates: { 2026: "2026-05-27", 2027: "2027-05-17", 2028: "2028-05-05" },
  },
  {
    id: "muharram",
    name: "Muharram",
    eyebrow: FESTIVE_EYEBROW,
    preCampaign: false,
    liveTailDays: 0,
    discounts: LIGHT_TERMS,
    priority: 20,
    category: "muslim",
    region: ["India", "Telangana", "Hyderabad"],
    // Deliberate editorial decision, not an oversight: Muharram / Ashura is a
    // period of mourning and is not an appropriate commercial moment. The
    // entry stays in the calendar so the date is documented and a gym can make
    // its own call, but it ships disabled and therefore never selects.
    enabled: false,
    dateNote:
      "Islamic lunar calendar (Day of Ashura). Present for completeness but DISABLED by default — a day of mourning, not a promotional moment.",
    dates: { 2026: "2026-06-26", 2027: "2027-06-15", 2028: "2028-06-03" },
  },
  {
    id: "independence-day",
    name: "Independence Day",
    eyebrow: NATIONAL_EYEBROW,
    preTitle: "Pre-Independence Day",
    liveTitle: "Independence Day",
    liveTailDays: 1,
    discounts: STANDARD_TERMS,
    priority: 45,
    category: "national",
    region: ["India"],
    dateNote: "Fixed Gregorian date, 15 August.",
    dates: { 2026: "2026-08-15", 2027: "2027-08-15", 2028: "2028-08-15" },
  },
  {
    id: "raksha-bandhan",
    name: "Raksha Bandhan",
    eyebrow: FESTIVE_EYEBROW,
    liveTailDays: 0,
    discounts: STANDARD_TERMS,
    priority: 35,
    category: "hindu",
    region: ["India"],
    dateNote: "Lunar: Shravana, Shukla Purnima.",
    dates: { 2026: "2026-08-28", 2027: "2027-08-17", 2028: "2028-08-05" },
  },
  {
    id: "janmashtami",
    name: "Krishna Janmashtami",
    eyebrow: FESTIVE_EYEBROW,
    preTitle: "Pre-Janmashtami",
    liveTitle: "Janmashtami",
    liveTailDays: 0,
    discounts: STANDARD_TERMS,
    priority: 35,
    category: "hindu",
    region: ["India"],
    dateNote: "Lunar: Bhadrapada, Krishna Ashtami.",
    dates: { 2026: "2026-09-04", 2027: "2027-08-25", 2028: "2028-08-13" },
  },
  {
    id: "ganesh-chaturthi",
    name: "Ganesh Chaturthi",
    eyebrow: FESTIVE_EYEBROW,
    preTitle: "Pre-Ganesh Chaturthi",
    liveTitle: "Ganesh Utsav",
    liveTailDays: 9,
    discounts: STANDARD_TERMS,
    priority: 55,
    category: "regional",
    region: ["India", "Telangana", "Hyderabad", "Maharashtra"],
    dateNote:
      "Lunar: Bhadrapada, Shukla Chaturthi. Anchor is Chaturthi; the live window covers the ten-day Utsav through Visarjan.",
    dates: { 2026: "2026-09-14", 2027: "2027-09-04", 2028: "2028-08-23" },
  },
  {
    id: "navratri",
    name: "Navratri",
    eyebrow: FESTIVE_EYEBROW,
    liveTailDays: 8,
    discounts: STANDARD_TERMS,
    priority: 50,
    category: "hindu",
    region: ["India", "Telangana", "Gujarat", "West Bengal"],
    // Shipped DISABLED, and this is a commercial modelling decision rather than
    // a date problem. Shardiya Navratri is the nine-night run-up that
    // culminates in Vijayadashami — Dussehra — so the two templates describe
    // one continuous observance, not two moments. Enabled, Navratri's own
    // window sits nearer to every September date than Dussehra does, which
    // under the nearest-festival rule means the Dussehra run-up could never
    // appear at all: the site would jump from "Navratri" straight to the
    // two-day "Dussehra" live window. The master therefore promotes the whole
    // stretch as the Dussehra campaign (its run-up covers the nine nights) and
    // a gym that genuinely wants a separate Navratri campaign — a Gujarati or
    // Bengali market, say — enables this entry in data alone and accepts that
    // it then owns 11-19 October. The verified dates stay here either way.
    enabled: false,
    dateNote:
      "Lunar: Ashwina, Shukla Pratipada through Maha Navami. Anchor is day one of Shardiya Navratri; the live window covers the nine nights. DISABLED by default — see the note above: this period is promoted as the Dussehra campaign.",
    dates: { 2026: "2026-10-11", 2027: "2027-09-30", 2028: "2028-09-19" },
  },
  {
    id: "dussehra",
    name: "Dussehra",
    eyebrow: FESTIVE_EYEBROW,
    liveTailDays: 1,
    discounts: STANDARD_TERMS,
    priority: 55,
    category: "hindu",
    region: ["India", "Telangana", "Hyderabad"],
    dateNote:
      "Lunar: Ashwina, Shukla Dashami (Vijayadashami). 2026-10-20, 2027-10-09, 2028-09-27 — the swing across years is why no date is derived.",
    dates: { 2026: "2026-10-20", 2027: "2027-10-09", 2028: "2028-09-27" },
  },
  {
    id: "karwa-chauth",
    name: "Karwa Chauth",
    eyebrow: FESTIVE_EYEBROW,
    liveTailDays: 0,
    discounts: LIGHT_TERMS,
    priority: 10,
    category: "regional",
    region: ["India", "Delhi", "Punjab", "Haryana", "Uttar Pradesh"],
    // Shipped disabled for the Hyderabad-optimised master: it is primarily a
    // north-Indian observance, and as a LIVE window it would otherwise outrank
    // the Diwali run-up locally. A northern variant enables it in data alone.
    enabled: false,
    dateNote:
      "Lunar: Kartika, Krishna Chaturthi. Present for reusability but DISABLED in the Hyderabad master — see region metadata.",
    dates: { 2026: "2026-10-29", 2027: "2027-10-18", 2028: "2028-10-07" },
  },
  {
    id: "diwali",
    name: "Diwali",
    eyebrow: FESTIVE_EYEBROW,
    description: "The year's main membership window. Terms apply to new joins.",
    liveTailDays: 3,
    discounts: FLAGSHIP_TERMS,
    priority: 70,
    category: "hindu",
    region: ["India", "Telangana", "Hyderabad"],
    dateNote:
      "Lunar: Kartika, Krishna Amavasya (Lakshmi Puja). Anchor is Diwali day; the live window runs through Bhai Dooj.",
    dates: { 2026: "2026-11-08", 2027: "2027-10-29", 2028: "2028-10-17" },
  },
  {
    id: "guru-nanak-jayanti",
    name: "Guru Nanak Jayanti",
    eyebrow: FESTIVE_EYEBROW,
    liveTailDays: 0,
    discounts: LIGHT_TERMS,
    priority: 30,
    category: "sikh",
    region: ["India", "Punjab"],
    dateNote: "Lunar: Kartika, Shukla Purnima (Kartik Purnima).",
    dates: { 2026: "2026-11-24", 2027: "2027-11-14", 2028: "2028-11-02" },
  },
  {
    id: "christmas",
    name: "Christmas",
    eyebrow: FESTIVE_EYEBROW,
    liveTailDays: 1,
    discounts: STANDARD_TERMS,
    // Intentionally the same weight as the New Year campaign. Their run-ups
    // overlap from 20-24 December, and the tie is broken by the engine's
    // nearest-relevant-date rule, which correctly prefers Christmas.
    priority: 55,
    category: "christian",
    region: ["India"],
    dateNote: "Fixed Gregorian date, 25 December.",
    dates: { 2026: "2026-12-25", 2027: "2027-12-25", 2028: "2028-12-25" },
  },
];

/* ---------------------------------------------------------------------------
 * Seasonal bands — the "no gap" layer.
 *
 * Recurring month-day bands, so they never expire and never need a yearly
 * edit. Together they tile all 366 days, which is what guarantees the utility
 * slot is never blank between festivals. The winter band wraps the year
 * boundary on purpose (16 Nov -> 14 Feb).
 *
 * A band is the LOWEST rung: any open festival window outranks all of them.
 * Set `enabled: false` on a band, or `enabled: false` on the engine, to turn
 * the fallback off entirely — the card then simply does not render.
 * ------------------------------------------------------------------------- */

/**
 * Customer-facing, deliberately not internal vocabulary: a visitor reads
 * "SEASONAL OFFER", never "seasonal block". The same rule applies to the band
 * titles below — they are offer names, not programming jargon.
 */
const SEASONAL_EYEBROW = "Seasonal offer";

const seasonalCampaigns: SeasonalOffer[] = [
  {
    id: "season-winter",
    startMonthDay: "11-16",
    endMonthDay: "02-14",
    eyebrow: SEASONAL_EYEBROW,
    title: "Winter Offer",
    description: "Cold-season programming runs in strength blocks. Start one with a coach.",
    discounts: LIGHT_TERMS,
    priority: 0,
    category: "seasonal",
    region: ["India"],
  },
  {
    id: "season-summer",
    startMonthDay: "02-15",
    endMonthDay: "06-15",
    eyebrow: SEASONAL_EYEBROW,
    title: "Summer Offer",
    description: "Conditioning-led programming for the hot months, air-conditioned floor.",
    discounts: LIGHT_TERMS,
    priority: 0,
    category: "seasonal",
    region: ["India"],
  },
  {
    id: "season-monsoon",
    startMonthDay: "06-16",
    endMonthDay: "09-30",
    eyebrow: SEASONAL_EYEBROW,
    title: "Monsoon Offer",
    description: "Train through the rains on a fully indoor floor, no session skipped.",
    discounts: LIGHT_TERMS,
    priority: 0,
    category: "seasonal",
    region: ["India"],
  },
  {
    id: "season-autumn",
    startMonthDay: "10-01",
    endMonthDay: "11-15",
    eyebrow: SEASONAL_EYEBROW,
    title: "Autumn Offer",
    description: "Post-monsoon rebuild: reset technique, then add load with a coach.",
    discounts: LIGHT_TERMS,
    priority: 0,
    category: "seasonal",
    region: ["India"],
  },
];

/* ---------------------------------------------------------------------------
 * Builder: templates x curated dates -> explicit FestivalOffer[].
 * ------------------------------------------------------------------------- */

function buildWindow(
  start: string,
  end: string,
  eyebrow: string,
  title: string,
  discounts: OfferDiscount[],
  description?: string
): OfferWindow {
  return { enabled: true, start, end, eyebrow, title, description, discounts };
}

/**
 * Expands the templates into one FestivalOffer per configured year.
 *
 * A year whose date fails validation is skipped rather than repaired: a typo
 * costs one campaign year and falls through to the seasonal band, instead of
 * silently promoting on the wrong day.
 */
export function buildFestivalCampaigns(
  templates: readonly CampaignTemplate[]
): FestivalOffer[] {
  const campaigns: FestivalOffer[] = [];

  for (const template of templates) {
    for (const yearKey of Object.keys(template.dates)) {
      const year = Number(yearKey);
      const festivalDate = template.dates[year];
      if (!Number.isInteger(year) || !isAuthoredDate(festivalDate)) continue;

      const preTitle = template.preTitle ?? `Pre-${template.name}`;
      const liveTitle = template.liveTitle ?? template.name;

      // Outer bound only. The engine clamps this to the configured look-ahead,
      // so the authored value is never what decides when the run-up appears —
      // except when a template deliberately shortens it via preLeadDays.
      const outerLeadDays =
        typeof template.preLeadDays === "number" && template.preLeadDays > 0
          ? template.preLeadDays
          : PRE_WINDOW_OUTER_DAYS;

      const preOffer =
        template.preCampaign === false
          ? undefined
          : buildWindow(
              shiftDays(festivalDate, -outerLeadDays),
              shiftDays(festivalDate, -1),
              template.eyebrow,
              preTitle,
              template.discounts,
              template.description
            );

      const liveOffer = buildWindow(
        festivalDate,
        shiftDays(festivalDate, Math.max(0, template.liveTailDays)),
        template.eyebrow,
        liveTitle,
        template.discounts,
        template.description
      );

      campaigns.push({
        id: `${template.id}-${year}`,
        year,
        name: template.name,
        festivalDate,
        dateNote: template.dateNote,
        preOffer,
        liveOffer,
        enabled: template.enabled,
        priority: template.priority,
        region: template.region,
        category: template.category,
      });
    }
  }

  return campaigns;
}

/** Every festival campaign, expanded. Exported for tests and tooling. */
export const festivalCampaigns: FestivalOffer[] =
  buildFestivalCampaigns(campaignTemplates);

/** The recurring seasonal bands. Exported for tests and tooling. */
export const seasonalOffers: SeasonalOffer[] = seasonalCampaigns;

/**
 * THE engine configuration consumed by the site.
 *
 * `enabled: false` here is the single switch that removes every promotional
 * card from the site without touching a component.
 */
export const offerEngine: OfferEngineConfiguration = {
  enabled: true,
  // Centralised: campaign state is evaluated in this zone for every visitor,
  // so the same campaign shows regardless of the browser's timezone.
  timeZone: "Asia/Kolkata",
  /*
   * THE LOOK-AHEAD. How many days before a festival its run-up campaign
   * appears — the single number that times the whole calendar.
   *
   * At 30, a festival on 20 October is promoted from 20 September. Change this
   * to 20, 25 or 45 and every campaign in the calendar retimes itself: no
   * campaign entry, component, style or test is edited. It is configuration,
   * never a literal in the UI.
   *
   * Individual campaigns can only ever be SHORTER than this (a template may
   * set `preLeadDays`, or opt out entirely with `preCampaign: false`).
   */
  preFestivalLeadDays: 30,
  /*
   * Ceiling for a single discount percentage. A campaign referencing a higher
   * value is treated as a data error and dropped rather than published, so a
   * mistyped "200" can never reach a visitor.
   */
  maxDiscountPercentage: 60,
  locale: "en-IN",
  // Existing in-page anchor. No new route is introduced.
  ctaHref: "#membership",
  defaultCtaLabel: "View offer",
  endsLabel: "Ends",
  /*
   * Campaign STATE vocabulary. ONE customer-facing word, shown on every
   * campaign's chip — run-up, live festival and seasonal band alike. Each is an
   * offer a visitor can act on the moment it renders, so the card presents a
   * single availability state and never an "upcoming" one; the campaign title
   * ("Pre-Dussehra") is what communicates timing.
   *
   * This is presentation copy only. The engine still distinguishes pre / live /
   * season internally to decide WHICH campaign runs.
   */
  liveLabel: "Live",
  discountLabel: "off",
  /*
   * Pricing-register vocabulary. "Regular" beside "Offer" is deliberately
   * plain: it is not a struck-through fake MRP, it is the gym's own list price
   * from lib/pricing.ts shown next to the promotional price.
   */
  regularPriceLabel: "Regular",
  offerPriceLabel: "Offer",
  festivals: festivalCampaigns,
  seasonal: seasonalOffers,
};
