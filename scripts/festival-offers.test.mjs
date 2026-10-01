// Zero-dependency tests for the Festival & Seasonal Offer Engine.
// Run: node --test scripts/festival-offers.test.mjs  (Node >= 22.18 / 23.6 type stripping)
//
// The selector is a pure function of (instant, configuration), so every state
// below is driven by an INJECTED date. Nothing here depends on the real clock.
// Tests 01-22 map 1:1 onto the required cases in the brief; the tests after
// them cover the remaining edge cases and the architectural invariants that
// keep this system data-only (no amount duplicated, no literal in any TSX).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DEFAULT_MAX_DISCOUNT_PERCENTAGE,
  DEFAULT_PRE_FESTIVAL_LEAD_DAYS,
  DEFAULT_TIME_ZONE,
  dayNumber,
  formatWindowEnd,
  getActiveOffer,
  isCalendarDate,
  isMonthDay,
  isWithinSeasonBand,
  offerPhaseRank,
  resolveOfferDiscounts,
  resolveOfferPrice,
  resolvePlanOffers,
  resolvePreFestivalLeadDays,
  shiftCalendarDate,
  toCalendarDate,
} from "../lib/offer-engine.ts";
import {
  buildFestivalCampaigns,
  festivalCampaigns,
  offerEngine,
  seasonalOffers,
} from "../lib/festival-offers.ts";
import { pricing } from "../lib/pricing.ts";

/* ------------------------------------------------------------------ helpers */

/** An instant expressed in IST, so intent is explicit at every call site. */
const ist = (isoDay, clock = "12:00:00") => new Date(`${isoDay}T${clock}+05:30`);

const TERMS = [{ planId: "annual", percentage: 15 }];

/** Mirrors the shipped builder: a wide authored outer bound for the run-up. */
const PRE_OUTER = 120;

/**
 * A festival campaign shaped exactly like the ones lib/festival-offers.ts
 * builds, so fixtures exercise the real data contract rather than a
 * convenient one.
 */
const festival = (id, festivalDate, opts = {}) => {
  const name = opts.name ?? id;
  const eyebrow = opts.eyebrow ?? "Festive offer";
  const discounts = opts.discounts ?? TERMS;
  return {
    id,
    year: Number(festivalDate.slice(0, 4)),
    name,
    festivalDate,
    preOffer:
      opts.preCampaign === false
        ? undefined
        : {
            enabled: opts.preEnabled ?? true,
            start: shiftCalendarDate(festivalDate, -(opts.preOuterDays ?? PRE_OUTER)),
            end: shiftCalendarDate(festivalDate, -1),
            eyebrow,
            title: opts.preTitle ?? `Pre-${name}`,
            discounts,
          },
    liveOffer:
      opts.liveCampaign === false
        ? undefined
        : {
            enabled: true,
            start: festivalDate,
            end: shiftCalendarDate(festivalDate, opts.liveTailDays ?? 0),
            eyebrow,
            title: opts.liveTitle ?? name,
            discounts,
          },
    priority: opts.priority ?? 0,
    enabled: opts.enabled,
    region: ["India"],
    category: "test",
  };
};

const band = (id, startMonthDay, endMonthDay, extra = {}) => ({
  id,
  startMonthDay,
  endMonthDay,
  eyebrow: "Seasonal offer",
  title: `Band ${id}`,
  ...extra,
});

/** Minimal configuration so fixtures assert one rule at a time. */
const fixture = (festivals, seasonal = [], extra = {}) => ({
  enabled: true,
  timeZone: "Asia/Kolkata",
  preFestivalLeadDays: 30,
  locale: "en-IN",
  ctaHref: "#membership",
  defaultCtaLabel: "View offer",
  endsLabel: "Ends",
  liveLabel: "Live",
  discountLabel: "off",
  regularPriceLabel: "Regular",
  offerPriceLabel: "Offer",
  festivals,
  seasonal,
  ...extra,
});

/** "A festival N days from `today`", the brief's own way of describing a case. */
const festivalInDays = (today, days, id = "target", opts = {}) =>
  festival(id, shiftCalendarDate(today, days), opts);

const readSource = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

/* =========================================================================
 * 01 — the headline regression: 2026-09-30 must show the Dussehra run-up
 * ========================================================================= */

test("01 — 2026-09-30 selects PRE-DUSSEHRA from the shipped calendar", () => {
  // Dussehra 2026 is 20 October: 20 days away, inside the 30-day look-ahead.
  // Before this pass the site showed a seasonal band here, because the authored
  // run-up window did not open until 1 October.
  const offer = getActiveOffer(ist("2026-09-30"), offerEngine);

  assert.ok(offer, "a campaign must be selected");
  assert.equal(offer.type, "festival");
  assert.equal(offer.phase, "pre");
  assert.equal(offer.campaignId, "dussehra-2026");
  assert.equal(offer.title, "Pre-Dussehra");
  assert.equal(offer.festivalDate, "2026-10-20");
  assert.equal(offer.daysUntilFestival, 20);
  // Internally a run-up; to the visitor, an available offer. See the
  // "customer-facing state chip" tests below.
  assert.equal(offer.phase, "pre");
  assert.equal(offer.stateLabel, offerEngine.liveLabel);
  // The reported window is the EFFECTIVE one: the look-ahead edge through the
  // day before the festival, not the authored 120-day outer bound.
  assert.equal(offer.start, "2026-09-20");
  assert.equal(offer.end, "2026-10-19");
  assert.equal(formatWindowEnd(offer.end, offerEngine.locale), "19 Oct");
});

test("01b — the run-up holds for every day of the look-ahead, then goes live", () => {
  // 2026-09-20 is deliberately absent: Ganesh Utsav is still live until the
  // 23rd, and LIVE outranks UPCOMING. That is the ladder working, and it is
  // asserted explicitly here rather than worked around.
  const ganesh = getActiveOffer(ist("2026-09-20"), offerEngine);
  assert.equal(ganesh.phase, "live");
  assert.equal(ganesh.campaignId, "ganesh-chaturthi-2026");

  const states = ["2026-09-24", "2026-09-30", "2026-10-05", "2026-10-15", "2026-10-19"].map(
    (day) => getActiveOffer(ist(day), offerEngine)
  );

  for (const offer of states) {
    assert.equal(offer.campaignId, "dussehra-2026");
    assert.equal(offer.phase, "pre");
  }

  // The day the festival arrives, the same campaign flips to live.
  const live = getActiveOffer(ist("2026-10-20"), offerEngine);
  assert.equal(live.campaignId, "dussehra-2026");
  assert.equal(live.phase, "live");
  assert.equal(live.title, "Dussehra");
  assert.equal(live.stateLabel, offerEngine.liveLabel);
});

/* =========================================================================
 * 02-04 — the look-ahead boundary. Inclusive at N, closed at N+1.
 * ========================================================================= */

test("02 — a festival exactly 30 days away selects its run-up", () => {
  const today = "2027-04-01";
  const config = fixture([festivalInDays(today, 30)]);
  const offer = getActiveOffer(ist(today), config);

  assert.ok(offer, "30 days out is inside an inclusive 30-day look-ahead");
  assert.equal(offer.phase, "pre");
  assert.equal(offer.daysUntilFestival, 30);
  // The effective window opens exactly today.
  assert.equal(offer.start, today);
});

test("03 — a festival 31 days away is NOT selected as upcoming", () => {
  const today = "2027-04-01";
  const config = fixture([festivalInDays(today, 31)]);

  assert.equal(getActiveOffer(ist(today), config), null);

  // ...and with a band configured it falls to seasonal, not to the festival.
  const withBand = fixture([festivalInDays(today, 31)], [band("season", "01-01", "12-31")]);
  const offer = getActiveOffer(ist(today), withBand);
  assert.equal(offer.type, "seasonal");
});

test("04 — a festival 29 days away selects its run-up", () => {
  const today = "2027-04-01";
  const offer = getActiveOffer(ist(today), fixture([festivalInDays(today, 29)]));

  assert.ok(offer);
  assert.equal(offer.phase, "pre");
  assert.equal(offer.daysUntilFestival, 29);
});

test("04b — a festival 1 day away is still the run-up, not yet live", () => {
  const today = "2027-04-01";
  const offer = getActiveOffer(ist(today), fixture([festivalInDays(today, 1)]));

  assert.equal(offer.phase, "pre");
  assert.equal(offer.daysUntilFestival, 1);
  assert.equal(offer.end, today, "the run-up ends the day before the festival");
});

test("04c — festivals 60 days out are silent until the look-ahead reaches them", () => {
  const today = "2027-04-01";
  const config = fixture([festivalInDays(today, 60)]);

  assert.equal(getActiveOffer(ist(today), config), null);
  // 30 days later the same unedited calendar starts promoting it.
  assert.ok(getActiveOffer(ist(shiftCalendarDate(today, 30)), config));
});

/* =========================================================================
 * 05-06 — LIVE always beats UPCOMING.
 * ========================================================================= */

test("05 — a festival that is live today wins", () => {
  const today = "2027-04-01";
  const offer = getActiveOffer(ist(today), fixture([festival("today", today)]));

  assert.equal(offer.phase, "live");
  assert.equal(offer.daysUntilFestival, 0);
  assert.equal(offerPhaseRank(offer), 3);
});

test("06 — a live festival beats another festival due inside the look-ahead", () => {
  const today = "2027-04-01";
  const config = fixture([
    // The upcoming one is deliberately given the far higher priority and the
    // nearer-looking id, so only the rung ordering can produce the right answer.
    festivalInDays(today, 10, "aaa-upcoming", { priority: 999 }),
    festival("live-now", today, { priority: 1 }),
  ]);

  const offer = getActiveOffer(ist(today), config);
  assert.equal(offer.campaignId, "live-now");
  assert.equal(offer.phase, "live");
});

test("06b — once the live window closes the next festival takes over unattended", () => {
  const config = fixture([
    festival("first", "2027-04-01", { liveTailDays: 1 }),
    festival("second", "2027-04-20"),
  ]);

  assert.equal(getActiveOffer(ist("2027-04-02"), config).campaignId, "first");
  const after = getActiveOffer(ist("2027-04-03"), config);
  assert.equal(after.campaignId, "second");
  assert.equal(after.phase, "pre");
});

/* =========================================================================
 * 07-08 — choosing between competing upcoming festivals.
 * ========================================================================= */

test("07 — of two festivals inside the look-ahead, the nearest wins", () => {
  const today = "2027-04-01";
  const config = fixture([
    // The further festival carries the higher priority on purpose: "nearest"
    // must lead, or a flagship would shadow everything in front of it.
    festivalInDays(today, 25, "further", { priority: 90 }),
    festivalInDays(today, 5, "nearer", { priority: 10 }),
  ]);

  const offer = getActiveOffer(ist(today), config);
  assert.equal(offer.campaignId, "nearer");
  assert.equal(offer.daysUntilFestival, 5);
});

test("08 — two festivals on the SAME date resolve by priority, then by id", () => {
  const today = "2027-04-01";
  const date = shiftCalendarDate(today, 12);

  const byPriority = fixture([
    festival("low", date, { priority: 10 }),
    festival("high", date, { priority: 80 }),
  ]);
  assert.equal(getActiveOffer(ist(today), byPriority).campaignId, "high");

  // Reversing the array must not change the outcome: no rule may depend on
  // authoring order.
  const reversed = fixture([
    festival("high", date, { priority: 80 }),
    festival("low", date, { priority: 10 }),
  ]);
  assert.equal(getActiveOffer(ist(today), reversed).campaignId, "high");

  // Identical date AND identical priority: the id breaks the tie alphabetically.
  const byId = fixture([
    festival("zulu", date, { priority: 50 }),
    festival("alpha", date, { priority: 50 }),
  ]);
  assert.equal(getActiveOffer(ist(today), byId).campaignId, "alpha");
});

/* =========================================================================
 * 09 — the seasonal fallback, and the rule that it never outranks a festival.
 * ========================================================================= */

test("09 — with no festival live or upcoming, the seasonal band fills the gap", () => {
  const today = "2027-04-01";
  const config = fixture(
    [festivalInDays(today, 90, "far")],
    [band("season-all", "01-01", "12-31")]
  );

  const offer = getActiveOffer(ist(today), config);
  assert.equal(offer.type, "seasonal");
  assert.equal(offer.phase, "season");
  assert.equal(offer.campaignId, "season-all");
  assert.equal(offer.stateLabel, config.liveLabel);
  assert.equal(offerPhaseRank(offer), 1);
});

test("09b — a seasonal band can NEVER outrank an upcoming festival", () => {
  const today = "2027-04-01";
  // The band is given an absurd priority; the rung ordering must still win.
  const config = fixture(
    [festivalInDays(today, 28, "upcoming", { priority: 0 })],
    [band("greedy", "01-01", "12-31", { priority: 10_000 })]
  );

  const offer = getActiveOffer(ist(today), config);
  assert.equal(offer.type, "festival");
  assert.equal(offer.campaignId, "upcoming");
});

test("09c — the shipped calendar returns a real seasonal state", () => {
  // Mid-June 2027: the nearest shipped festival is well beyond 30 days.
  const offer = getActiveOffer(ist("2027-06-20"), offerEngine);

  assert.equal(offer.type, "seasonal");
  assert.equal(offer.campaignId, "season-monsoon");
  assert.equal(offer.title, "Monsoon Offer");
  assert.equal(offer.eyebrow, "Seasonal offer");
  assert.equal(offer.stateLabel, "Live");
  // Customer-facing wording only — no internal vocabulary reaches the card.
  assert.doesNotMatch(offer.title, /block/i);
  assert.doesNotMatch(offer.eyebrow, /block/i);
});

/* =========================================================================
 * 10-12 — expiry, the year boundary, and running past the calendar.
 * ========================================================================= */

test("10 — an expired campaign is ignored and never reappears", () => {
  const config = fixture([festival("past", "2027-01-10", { liveTailDays: 1 })]);

  assert.ok(getActiveOffer(ist("2027-01-11"), config), "still live on the tail day");
  assert.equal(getActiveOffer(ist("2027-01-12"), config), null);
  assert.equal(getActiveOffer(ist("2030-01-12"), config), null);
});

test("11 — the look-ahead crosses the year boundary", () => {
  const config = fixture([festival("new-year", "2028-01-01")]);

  // 2 December is 30 days out; the run-up must open across the year change.
  assert.equal(getActiveOffer(ist("2027-12-02"), config).phase, "pre");
  assert.equal(getActiveOffer(ist("2027-12-31"), config).daysUntilFestival, 1);
  assert.equal(getActiveOffer(ist("2028-01-01"), config).phase, "live");

  // And on the real calendar, unattended.
  const real = getActiveOffer(ist("2026-12-31"), offerEngine);
  assert.equal(real.campaignId, "new-year-2027");
  assert.equal(real.phase, "pre");
});

test("12 — past the last configured year the site falls back, never stales", () => {
  const years = festivalCampaigns.map((c) => c.year);
  const beyond = `${Math.max(...years) + 2}-07-01`;

  const offer = getActiveOffer(ist(beyond), offerEngine);
  assert.ok(offer, "the seasonal layer must still answer");
  assert.equal(offer.type, "seasonal");

  // With the bands switched off too, the answer is silence — never a stale
  // final festival.
  const noBands = { ...offerEngine, seasonal: [] };
  assert.equal(getActiveOffer(ist(beyond), noBands), null);
});

/* =========================================================================
 * 13-18 — PRICING INTEGRATION. lib/pricing.ts is the only source of money.
 * ========================================================================= */

test("13 — the 6-month discount resolves against the real pricing plan", () => {
  const offer = getActiveOffer(ist("2026-09-30"), offerEngine);
  const promos = resolvePlanOffers(offer, pricing.plans, offerEngine);
  const halfYear = promos.get("half-year");
  const plan = pricing.plans.find((p) => p.id === "half-year");

  assert.ok(halfYear, "the 6-month plan must be promoted by this campaign");
  assert.equal(halfYear.planLabel, plan.name);
  assert.equal(halfYear.basePrice, plan.price, "base price is READ from pricing");
  assert.equal(halfYear.percentage, 10);
  assert.equal(halfYear.offerPrice, Math.round(plan.price * 0.9));
});

test("14 — the 1-year discount resolves against the real pricing plan", () => {
  const offer = getActiveOffer(ist("2026-09-30"), offerEngine);
  const promos = resolvePlanOffers(offer, pricing.plans, offerEngine);
  const annual = promos.get("annual");
  const plan = pricing.plans.find((p) => p.id === "annual");

  assert.ok(annual, "the 1-year plan must be promoted by this campaign");
  assert.equal(annual.planLabel, plan.name);
  assert.equal(annual.basePrice, plan.price);
  assert.equal(annual.percentage, 20);
  assert.equal(annual.offerPrice, Math.round(plan.price * 0.8));

  // Both tiers of the ladder are present — the brief requires both to appear.
  assert.equal(promos.size, 2);
});

test("15 — festival data contains planIds and percentages, never an amount", () => {
  const amounts = new Set(
    [...pricing.plans, pricing.special]
      .map((entry) => entry?.price)
      .filter((price) => typeof price === "number")
  );
  assert.ok(amounts.size > 0, "the fixture needs real prices to be meaningful");

  const everyDiscount = [
    ...festivalCampaigns.flatMap((c) => [
      ...(c.preOffer?.discounts ?? []),
      ...(c.liveOffer?.discounts ?? []),
    ]),
    ...seasonalOffers.flatMap((s) => s.discounts ?? []),
  ];
  assert.ok(everyDiscount.length > 0);

  for (const discount of everyDiscount) {
    // The shape itself forbids duplication: two keys, no amount, no currency.
    assert.deepEqual(Object.keys(discount).sort(), ["percentage", "planId"]);
    assert.equal(typeof discount.planId, "string");
    assert.ok(!amounts.has(discount.percentage) || discount.percentage < 100);
  }

  // Belt and braces: no base amount appears anywhere in the campaign data.
  const serialised = JSON.stringify({ festivalCampaigns, seasonalOffers });
  for (const amount of amounts) {
    assert.ok(
      !serialised.includes(String(amount)),
      `campaign data must not restate the amount ${amount}`
    );
  }
});

test("16 — re-pricing a plan in pricing data re-prices its promotion", () => {
  const offer = getActiveOffer(ist("2026-09-30"), offerEngine);

  const before = resolvePlanOffers(offer, pricing.plans, offerEngine).get("annual");
  // Exactly what a gym does: change ONE amount in lib/pricing.ts.
  const repriced = pricing.plans.map((plan) =>
    plan.id === "annual" ? { ...plan, price: 24_000 } : plan
  );
  const after = resolvePlanOffers(offer, repriced, offerEngine).get("annual");

  assert.notEqual(before.basePrice, after.basePrice);
  assert.equal(after.basePrice, 24_000);
  assert.equal(after.offerPrice, 19_200, "20% off 24,000");
  assert.equal(after.percentage, before.percentage, "the campaign is unchanged");
});

test("17 — 10% off 10,000 is 9,000", () => {
  assert.deepEqual(resolveOfferPrice(10_000, 10), {
    percentage: 10,
    basePrice: 10_000,
    offerPrice: 9_000,
  });
});

test("18 — 20% off 18,000 is 14,400", () => {
  assert.deepEqual(resolveOfferPrice(18_000, 20), {
    percentage: 20,
    basePrice: 18_000,
    offerPrice: 14_400,
  });
});

test("18b — the price calculation is total, deterministic and never negative", () => {
  // Rounds to whole rupees, matching the register's own formatting.
  assert.equal(resolveOfferPrice(2_500, 33).offerPrice, 1_675);
  assert.equal(resolveOfferPrice(999, 7).offerPrice, 929);
  // Decimal rupee amounts are accepted safely.
  assert.equal(resolveOfferPrice(1_000.5, 10).offerPrice, 900);
  // A free plan stays free rather than going negative.
  assert.equal(resolveOfferPrice(0, 50).offerPrice, 0);

  // Every rejected input yields null, not a broken figure.
  for (const bad of [
    [10_000, 0],
    [10_000, -5],
    [10_000, 100],
    [10_000, 250],
    [10_000, Number.NaN],
    [10_000, Number.POSITIVE_INFINITY],
    [-10_000, 10],
    [Number.NaN, 10],
    ["10000", 10],
    [10_000, "10"],
  ]) {
    assert.equal(resolveOfferPrice(bad[0], bad[1]), null, `rejected: ${bad}`);
  }

  // The configured ceiling is honoured.
  assert.equal(resolveOfferPrice(10_000, 70, DEFAULT_MAX_DISCOUNT_PERCENTAGE), null);
  assert.ok(resolveOfferPrice(10_000, 70, 80));
});

/* =========================================================================
 * 19-21 — malformed discount data must never reach the UI.
 * ========================================================================= */

test("19 — an unknown plan id is ignored", () => {
  const discounts = [{ planId: "no-such-plan", percentage: 10 }];
  assert.deepEqual(resolveOfferDiscounts(discounts, pricing.plans), []);

  const offer = { discounts, type: "festival", phase: "pre" };
  assert.equal(resolvePlanOffers(offer, pricing.plans, offerEngine).size, 0);
});

test("20 — a hidden plan is ignored", () => {
  const plans = pricing.plans.map((plan) =>
    plan.id === "annual" ? { ...plan, priceStatus: "hidden" } : plan
  );
  const discounts = [{ planId: "annual", percentage: 20 }];

  assert.deepEqual(resolveOfferDiscounts(discounts, plans), []);
  assert.equal(
    resolvePlanOffers({ discounts }, plans, offerEngine).size,
    0,
    "a hidden plan must never be promoted"
  );

  // A contact-only plan has no amount to discount, so it is not promoted
  // either — but it is still a legitimate label on the hero card.
  const contact = pricing.plans.map((plan) =>
    plan.id === "annual" ? { ...plan, priceStatus: "contact", price: undefined } : plan
  );
  assert.equal(resolvePlanOffers({ discounts }, contact, offerEngine).size, 0);
  assert.equal(resolveOfferDiscounts(discounts, contact).length, 1);
});

test("21 — invalid discounts are ignored, and duplicates collapse deterministically", () => {
  const plans = pricing.plans;

  for (const percentage of [0, -10, 100, 250, Number.NaN, null, undefined, "20"]) {
    const discounts = [{ planId: "annual", percentage }];
    assert.deepEqual(
      resolveOfferDiscounts(discounts, plans),
      [],
      `percentage ${percentage} must be dropped`
    );
    assert.equal(resolvePlanOffers({ discounts }, plans, offerEngine).size, 0);
  }

  // Above the configured ceiling -> dropped.
  assert.deepEqual(
    resolveOfferDiscounts([{ planId: "annual", percentage: 75 }], plans),
    []
  );

  // Duplicate references collapse to the FIRST, both for labels and for prices.
  const duplicated = [
    { planId: "annual", percentage: 20 },
    { planId: "annual", percentage: 50 },
  ];
  assert.deepEqual(resolveOfferDiscounts(duplicated, plans).map((d) => d.percentage), [20]);
  assert.equal(
    resolvePlanOffers({ discounts: duplicated }, plans, offerEngine).get("annual")
      .percentage,
    20
  );

  // Structurally malformed entries are skipped without throwing.
  assert.deepEqual(resolveOfferDiscounts([null, undefined, {}, 7], plans), []);
  assert.equal(resolvePlanOffers({ discounts: [null, {}, 7] }, plans, offerEngine).size, 0);
});

/* =========================================================================
 * 22 — the Personal Coaching CTA carries the brand-accent treatment.
 * ========================================================================= */

test("22 — only the Personal Coaching CTA uses the brand-accent button", () => {
  const membership = readSource("../components/sections/Membership.tsx");
  const button = readSource("../components/ui/Button.tsx");

  // The accent treatment is the shared primitive's `primary` variant: accent
  // background with accent-foreground text. Asserted, not assumed.
  assert.match(button, /primary:\s*\n?\s*"bg-\(--accent\) text-\(--accent-foreground\)/);

  // The <Button> element that carries the special CTA class, read as a whole:
  // `variant` precedes `className` in the JSX, so the window opens before it.
  const specialAt = membership.indexOf("s06-special-cta");
  assert.ok(specialAt > 0, "the special training CTA must exist");
  const special = membership.slice(specialAt - 300, specialAt + 200);
  assert.match(
    special,
    /variant="primary"/,
    "the special training CTA must use the accent variant"
  );

  // The six ordinary plan CTAs stay ghost — the distinction is the whole point.
  const registerAt = membership.indexOf("s06-card-cta");
  const register = membership.slice(registerAt - 300, registerAt + 200);
  assert.match(register, /variant="ghost"/);
  assert.doesNotMatch(register, /variant="primary"/);

  // Exactly one accent CTA in the whole section.
  assert.equal(membership.match(/variant="primary"/g).length, 1);
  assert.equal(membership.match(/variant="ghost"/g).length, 1);
  assert.ok(!membership.includes('variant="secondary"'));

  // Destination unchanged: the existing site-wide enquiry action, no new route.
  assert.doesNotMatch(membership, /href="\/[a-z]/, "no new route may be introduced");
  assert.equal(membership.match(/href=\{whatsappHref\}/g).length, 2);
});

/* =========================================================================
 * CUSTOMER-FACING STATE CHIP
 *
 * One availability word for every campaign. There is no visitor-visible
 * "upcoming" state: a run-up campaign is a live OFFER, and its timing is
 * carried by the campaign TITLE ("Pre-Dussehra"), not by the chip.
 *
 * These tests guard the PRESENTATION only. The internal phase distinction is
 * re-asserted alongside each case, because the selector still depends on it.
 * ========================================================================= */

test("chip — a PRE campaign shows the live availability label", () => {
  const today = "2027-04-01";
  const offer = getActiveOffer(ist(today), fixture([festivalInDays(today, 12)]));

  assert.equal(offer.phase, "pre", "internally still a run-up");
  assert.equal(offer.stateLabel, "Live", "but presented as available");
});

test("chip — a LIVE campaign shows the live availability label", () => {
  const today = "2027-04-01";
  const offer = getActiveOffer(ist(today), fixture([festival("now", today)]));

  assert.equal(offer.phase, "live");
  assert.equal(offer.stateLabel, "Live");
});

test("chip — a SEASONAL campaign shows the live availability label", () => {
  const today = "2027-04-01";
  const offer = getActiveOffer(
    ist(today),
    fixture([], [band("season-all", "01-01", "12-31")])
  );

  assert.equal(offer.phase, "season");
  assert.equal(offer.stateLabel, "Live");
});

test("chip — no campaign on the whole calendar ever presents as UPCOMING", () => {
  const seen = new Set();
  const phases = new Set();
  let day = "2026-01-01";

  while (day <= "2028-12-31") {
    const offer = getActiveOffer(ist(day), offerEngine);
    assert.ok(offer, day);
    assert.doesNotMatch(
      offer.stateLabel,
      /upcoming|soon|pre-/i,
      `${day} presented a non-available state: "${offer.stateLabel}"`
    );
    seen.add(offer.stateLabel);
    phases.add(offer.phase);
    day = shiftCalendarDate(day, 1);
  }

  // Exactly one visible state word across three years...
  assert.deepEqual([...seen], [offerEngine.liveLabel]);
  // ...while all three internal phases genuinely still occur.
  assert.deepEqual([...phases].sort(), ["live", "pre", "season"]);
});

test("chip — the word is engine copy, configurable without touching a component", () => {
  const today = "2027-04-01";
  const config = fixture([festivalInDays(today, 12)], [], { liveLabel: "Available" });
  assert.equal(getActiveOffer(ist(today), config).stateLabel, "Available");

  // A missing or blank label degrades to a sane default rather than rendering
  // an empty chip.
  for (const bad of [undefined, "", "   ", null, 7]) {
    const broken = fixture([festivalInDays(today, 12)], [], { liveLabel: bad });
    assert.equal(getActiveOffer(ist(today), broken).stateLabel, "Live", `label ${bad}`);
  }
});

test("chip — the retired per-phase label config is gone, not left dangling", () => {
  // The two old fields had no consumer once the chip unified; leaving them in
  // the configuration would have described behaviour that no longer exists.
  assert.ok(!("upcomingLabel" in offerEngine));
  assert.ok(!("seasonalLabel" in offerEngine));

  const engineSrc = readSource("../lib/offer-engine.ts");
  const typesSrc = readSource("../lib/types.ts");
  assert.ok(!engineSrc.includes("upcomingLabel"));
  assert.ok(!engineSrc.includes("seasonalLabel"));
  assert.ok(!typesSrc.includes("upcomingLabel"));
  assert.ok(!typesSrc.includes("seasonalLabel"));

  // Nothing visual may key off the phase any more.
  const css = readSource("../app/globals.css");
  assert.ok(
    !/\[data-offer-phase="(pre|live|season)"\]/.test(css),
    "no stylesheet rule may re-introduce a per-phase visual state"
  );
  // The attribute itself stays, for QA and analytics.
  assert.ok(readSource("../components/ui/OfferSignal.tsx").includes("data-offer-phase"));
});

/* =========================================================================
 * Configuration, not code: the look-ahead is a single tunable number.
 * ========================================================================= */

test("the look-ahead is configuration and retimes the whole calendar", () => {
  const today = "2027-04-01";
  const target = festivalInDays(today, 25, "target");

  assert.ok(getActiveOffer(ist(today), fixture([target], [], { preFestivalLeadDays: 30 })));
  assert.ok(getActiveOffer(ist(today), fixture([target], [], { preFestivalLeadDays: 45 })));
  // Narrowed to 20 days, the same unedited campaign stops showing.
  assert.equal(
    getActiveOffer(ist(today), fixture([target], [], { preFestivalLeadDays: 20 })),
    null
  );
  // Zero means "never promote before the day itself" and is honoured, not
  // treated as missing.
  assert.equal(
    getActiveOffer(ist(today), fixture([target], [], { preFestivalLeadDays: 0 })),
    null
  );
});

test("an absent or malformed look-ahead falls back to the factory default", () => {
  assert.equal(resolvePreFestivalLeadDays(undefined), DEFAULT_PRE_FESTIVAL_LEAD_DAYS);
  assert.equal(resolvePreFestivalLeadDays({}), DEFAULT_PRE_FESTIVAL_LEAD_DAYS);
  for (const bad of [null, "30", Number.NaN, Number.POSITIVE_INFINITY, -1]) {
    assert.equal(
      resolvePreFestivalLeadDays({ preFestivalLeadDays: bad }),
      DEFAULT_PRE_FESTIVAL_LEAD_DAYS,
      `malformed look-ahead ${bad}`
    );
  }
  assert.equal(resolvePreFestivalLeadDays({ preFestivalLeadDays: 45 }), 45);
  assert.equal(DEFAULT_PRE_FESTIVAL_LEAD_DAYS, 30);
  assert.equal(offerEngine.preFestivalLeadDays, 30, "the shipped default is 30 days");
});

test("data can shorten one campaign's run-up below the look-ahead", () => {
  const today = "2027-04-01";
  // An authored start 7 days out is respected as an outer bound...
  const short = festivalInDays(today, 20, "short", { preOuterDays: 7 });
  assert.equal(getActiveOffer(ist(today), fixture([short])), null);
  // ...and the campaign appears once that authored window opens.
  const inside = shiftCalendarDate(today, 14);
  assert.equal(getActiveOffer(ist(inside), fixture([short])).phase, "pre");

  // `preCampaign: false` opts out of the run-up entirely.
  const silent = festivalInDays(today, 10, "silent", { preCampaign: false });
  assert.equal(getActiveOffer(ist(today), fixture([silent])), null);
  assert.equal(
    getActiveOffer(ist(shiftCalendarDate(today, 10)), fixture([silent])).phase,
    "live"
  );
});

/* =========================================================================
 * Timezone behaviour.
 * ========================================================================= */

test("campaign state is evaluated in the configured zone, not the visitor's", () => {
  // One instant, expressed two ways. 2026-10-19 18:40 UTC is already
  // 2026-10-20 in IST, so an Indian visitor sees Dussehra go live while it is
  // still the 19th in London.
  const instant = new Date("2026-10-19T18:40:00Z");

  const ind = getActiveOffer(instant, offerEngine);
  assert.equal(ind.phase, "live");
  assert.equal(ind.campaignId, "dussehra-2026");

  // Same instant, engine configured for a different zone: the run-up still.
  const london = getActiveOffer(instant, { ...offerEngine, timeZone: "Europe/London" });
  assert.equal(london.phase, "pre");

  // The configured zone — not the host machine — decides. Both calls above
  // ran in this process's local zone and disagreed only because of config.
  assert.equal(offerEngine.timeZone, "Asia/Kolkata");
  assert.equal(DEFAULT_TIME_ZONE, "Asia/Kolkata");
});

test("a campaign changes over exactly at local midnight", () => {
  const before = getActiveOffer(ist("2026-10-19", "23:59:59"), offerEngine);
  const after = getActiveOffer(ist("2026-10-20", "00:00:00"), offerEngine);

  assert.equal(before.phase, "pre");
  assert.equal(after.phase, "live");
  assert.equal(after.campaignId, before.campaignId);
});

test("an unknown timezone degrades to the default instead of throwing", () => {
  const offer = getActiveOffer(ist("2026-09-30"), {
    ...offerEngine,
    timeZone: "Not/AZone",
  });
  assert.equal(offer.campaignId, "dussehra-2026");
});

/* =========================================================================
 * Remaining edge cases from the brief.
 * ========================================================================= */

test("no campaign configured, or the engine switched off, resolves to null", () => {
  assert.equal(getActiveOffer(ist("2027-04-01"), fixture([], [])), null);
  assert.equal(getActiveOffer(ist("2027-04-01"), { ...offerEngine, enabled: false }), null);
  assert.equal(getActiveOffer(ist("2027-04-01"), null), null);
  assert.equal(getActiveOffer(ist("2027-04-01"), undefined), null);
  assert.equal(getActiveOffer(new Date("nonsense"), offerEngine), null);
  assert.equal(getActiveOffer("2027-04-01", offerEngine), null);
});

test("disabled campaigns and disabled windows never select", () => {
  const today = "2027-04-01";
  assert.equal(
    getActiveOffer(ist(today), fixture([festivalInDays(today, 10, "off", { enabled: false })])),
    null
  );
  assert.equal(
    getActiveOffer(
      ist(today),
      fixture([festivalInDays(today, 10, "no-pre", { preEnabled: false })])
    ),
    null
  );
  assert.equal(
    getActiveOffer(
      ist(today),
      fixture([festivalInDays(today, 10, "x")], [band("off", "01-01", "12-31", { enabled: false })])
    ).campaignId,
    "x"
  );
});

test("invalid campaign dates are skipped, never repaired or thrown", () => {
  const built = buildFestivalCampaigns([
    {
      id: "typo",
      name: "Typo",
      eyebrow: "Festive offer",
      liveTailDays: 0,
      discounts: TERMS,
      priority: 10,
      category: "test",
      region: ["India"],
      dateNote: "Fixture.",
      // 2027 is not a leap year, so the middle entry must be dropped whole.
      dates: { 2026: "2026-05-05", 2027: "2027-02-29", 2028: "2028-02-29" },
    },
  ]);

  assert.deepEqual(built.map((c) => c.year), [2026, 2028]);
  for (const campaign of built) {
    assert.ok(isCalendarDate(campaign.festivalDate));
  }
});

test("a malformed festival date degrades to authored-window containment", () => {
  const broken = festival("broken", "2027-04-20");
  broken.festivalDate = "not-a-date";

  // It cannot be measured against the look-ahead, so the authored window rules.
  const offer = getActiveOffer(ist("2027-04-01"), fixture([broken]));
  assert.ok(offer, "the campaign must not vanish");
  assert.equal(offer.phase, "pre");
  assert.equal(offer.festivalDate, undefined);
  assert.equal(offer.daysUntilFestival, undefined);
});

test("the seasonal band wrapping the year boundary is continuous", () => {
  const winter = fixture([], [band("winter", "11-16", "02-14")]);
  for (const day of ["2026-11-16", "2026-12-31", "2027-01-01", "2027-02-14"]) {
    assert.equal(getActiveOffer(ist(day), winter).campaignId, "winter", day);
  }
  assert.equal(getActiveOffer(ist("2027-02-15"), winter), null);

  assert.ok(isWithinSeasonBand("12-20", "11-16", "02-14"));
  assert.ok(isWithinSeasonBand("01-20", "11-16", "02-14"));
  assert.ok(!isWithinSeasonBand("03-20", "11-16", "02-14"));
});

test("a disabled seasonal layer leaves a genuine gap rather than faking one", () => {
  const quiet = { ...offerEngine, seasonal: [] };
  assert.equal(getActiveOffer(ist("2027-06-20"), quiet), null);
});

test("every day of the shipped calendar yields at most one well-formed offer", () => {
  const phases = new Set();
  let day = "2026-01-01";
  const last = "2028-12-31";

  while (day <= last) {
    const offer = getActiveOffer(ist(day), offerEngine);
    assert.ok(offer, `no campaign on ${day} — the seasonal layer must never gap`);
    assert.ok(typeof offer.title === "string" && offer.title.trim() !== "", day);
    assert.ok(typeof offer.eyebrow === "string" && offer.eyebrow.trim() !== "", day);
    assert.ok(typeof offer.stateLabel === "string" && offer.stateLabel !== "", day);
    assert.equal(offer.stateKey, `${offer.campaignId}:${offer.phase}`, day);

    if (offer.type === "festival") {
      // A festival campaign must always be coherent about its own window.
      assert.ok(isCalendarDate(offer.start), day);
      assert.ok(isCalendarDate(offer.end), day);
      assert.ok(offer.start <= day && day <= offer.end, `${day} outside ${offer.start}..${offer.end}`);
      if (offer.phase === "pre") {
        assert.ok(offer.daysUntilFestival >= 1, day);
        assert.ok(
          offer.daysUntilFestival <= offerEngine.preFestivalLeadDays,
          `${day}: ${offer.daysUntilFestival} days out exceeds the look-ahead`
        );
      }
    } else {
      assert.ok(isMonthDay(offer.start) && isMonthDay(offer.end), day);
    }

    phases.add(offer.phase);
    day = shiftCalendarDate(day, 1);
  }

  // All three rungs must actually occur across three years, or the ladder is
  // not really being exercised.
  assert.deepEqual([...phases].sort(), ["live", "pre", "season"]);
});

/* =========================================================================
 * Architecture: data-only customisation, and one shell for three states.
 * ========================================================================= */

test("the offer card contains no festival, date or percentage literal", () => {
  const card = readSource("../components/ui/OfferSignal.tsx");
  const code = card
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("*") && !line.trimStart().startsWith("//"))
    .join("\n");

  for (const name of ["Dussehra", "Diwali", "Navratri", "Monsoon", "Ganesh"]) {
    assert.ok(!code.includes(name), `the card must not mention ${name}`);
  }
  // No phase wording either: live/upcoming/seasonal all arrive as stateLabel.
  assert.ok(!/"(Live|Upcoming|Seasonal|Ends|off)"/.test(code));
  // No hardcoded percentage or date format.
  assert.ok(!/\b\d{1,2}%/.test(code));
  assert.ok(!/\b20\d{2}-\d{2}-\d{2}\b/.test(code));

  // ONE shell: the card branches on data presence, never on which phase or
  // which festival it was handed.
  assert.ok(!/offer\.phase\s*===/.test(code), "no per-phase branch in the card");
  assert.ok(!/campaignId\s*===/.test(code), "no per-campaign branch in the card");
  assert.ok(code.includes("offer.stateLabel"));
});

test("the pricing register never computes a price and never hardcodes one", () => {
  const membership = readSource("../components/sections/Membership.tsx");
  const code = membership
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("*") && !line.trimStart().startsWith("//"))
    .join("\n");

  // The arithmetic lives in the engine; JSX only formats what it is handed.
  assert.ok(code.includes("resolvePlanOffers"));
  assert.ok(!/\*\s*\(?1\s*-/.test(code), "no discount arithmetic in the section");
  assert.ok(!/percentage\s*\/\s*100/.test(code), "no discount arithmetic in the section");
  assert.ok(!/\b(9000|14400|10000|18000)\b/.test(code), "no amount literal");
  // Labels come from engine config, not from the component.
  assert.ok(code.includes("offerEngine.regularPriceLabel"));
  assert.ok(code.includes("offerEngine.offerPriceLabel"));
  // Promotion is opt-in per plan, driven by the resolved map.
  assert.ok(code.includes('data-promoted'));
});

test("the hero and the pricing register are handed the SAME campaign object", () => {
  const page = readSource("../app/page.tsx");
  const hero = readSource("../components/sections/Hero.tsx");

  // Selected once, at page level, and passed to both surfaces.
  assert.match(page, /const activeOffer = getActiveOffer\(new Date\(\), offerEngine\)/);
  assert.match(page, /<Hero[^>]*offer=\{activeOffer\}/s);
  assert.match(page, /<Membership[^>]*offer=\{activeOffer\}/s);
  // The hero must no longer run its own selection.
  assert.ok(!hero.includes("getActiveOffer("), "the hero must not re-select");

  // Runtime freshness is preserved, and the app is not force-dynamic.
  assert.match(page, /export const revalidate = 3600/);
  assert.ok(!page.includes("force-dynamic") || page.includes("Replace this with"));
});

test("changing campaign data changes the rendered content, with no TSX edit", () => {
  const today = "2027-04-01";
  const base = festivalInDays(today, 10, "custom", {
    name: "Invented Festival",
    eyebrow: "Custom eyebrow",
    discounts: [{ planId: "quarterly", percentage: 35 }],
  });
  base.preOffer.ctaLabel = "Custom CTA";

  const offer = getActiveOffer(ist(today), fixture([base]));
  assert.equal(offer.title, "Pre-Invented Festival");
  assert.equal(offer.eyebrow, "Custom eyebrow");
  assert.equal(offer.ctaLabel, "Custom CTA");

  const promos = resolvePlanOffers(offer, pricing.plans, offerEngine);
  const quarterly = pricing.plans.find((p) => p.id === "quarterly");
  assert.equal(promos.get("quarterly").percentage, 35);
  assert.equal(promos.get("quarterly").basePrice, quarterly.price);
  assert.equal(promos.size, 1, "only the referenced plan is promoted");
});

test("the shipped calendar is internally coherent", () => {
  const ids = new Set();
  for (const campaign of festivalCampaigns) {
    assert.ok(!ids.has(campaign.id), `duplicate campaign id ${campaign.id}`);
    ids.add(campaign.id);
    assert.ok(isCalendarDate(campaign.festivalDate), campaign.id);
    assert.equal(campaign.festivalDate.slice(0, 4), String(campaign.year));
    assert.ok(campaign.dateNote, `${campaign.id} must record its provenance`);

    if (campaign.preOffer) {
      assert.ok(campaign.preOffer.end < campaign.festivalDate);
      assert.ok(campaign.preOffer.start < campaign.preOffer.end);
      // Wide enough that the look-ahead, not the data, is the binding rule.
      const span = dayNumber(campaign.festivalDate) - dayNumber(campaign.preOffer.start);
      assert.ok(
        span >= offerEngine.preFestivalLeadDays,
        `${campaign.id}: authored run-up (${span}d) is narrower than the look-ahead`
      );
    }
    if (campaign.liveOffer) {
      assert.equal(campaign.liveOffer.start, campaign.festivalDate);
      assert.ok(campaign.liveOffer.end >= campaign.liveOffer.start);
    }
  }

  // Every discount points at a plan that exists.
  const planIds = new Set(pricing.plans.map((p) => p.id));
  const all = [
    ...festivalCampaigns.flatMap((c) => [
      ...(c.preOffer?.discounts ?? []),
      ...(c.liveOffer?.discounts ?? []),
    ]),
    ...seasonalOffers.flatMap((s) => s.discounts ?? []),
  ];
  for (const discount of all) {
    assert.ok(planIds.has(discount.planId), `unknown planId ${discount.planId}`);
    assert.ok(discount.percentage > 0 && discount.percentage < offerEngine.maxDiscountPercentage);
  }

  // The bands tile the whole year, which is what makes the gap-free guarantee
  // true rather than aspirational.
  let day = "2026-01-01";
  while (day <= "2026-12-31") {
    const monthDay = day.slice(5);
    const covering = seasonalOffers.filter(
      (b) => b.enabled !== false && isWithinSeasonBand(monthDay, b.startMonthDay, b.endMonthDay)
    );
    assert.equal(covering.length, 1, `${monthDay} is covered by ${covering.length} bands`);
    day = shiftCalendarDate(day, 1);
  }
});

test("date and window helpers are leap-year and boundary safe", () => {
  assert.ok(isCalendarDate("2028-02-29"));
  assert.ok(!isCalendarDate("2027-02-29"));
  assert.ok(!isCalendarDate("2027-13-01"));
  assert.ok(!isCalendarDate("10/11/2026"));
  assert.ok(isMonthDay("02-29"));
  assert.ok(!isMonthDay("02-30"));

  assert.equal(shiftCalendarDate("2028-02-28", 1), "2028-02-29");
  assert.equal(shiftCalendarDate("2027-02-28", 1), "2027-03-01");
  assert.equal(shiftCalendarDate("2026-12-31", 1), "2027-01-01");
  assert.equal(shiftCalendarDate("2027-01-01", -1), "2026-12-31");
  assert.equal(dayNumber("2027-01-02") - dayNumber("2027-01-01"), 1);

  assert.equal(toCalendarDate(ist("2026-09-30"), "Asia/Kolkata"), "2026-09-30");
  assert.equal(toCalendarDate(new Date("nonsense")), null);

  // The end label formats from the stored date, never via a locale parse.
  assert.equal(formatWindowEnd("2026-10-19", "en-IN"), "19 Oct");
  assert.equal(formatWindowEnd("11-15"), null);
  assert.equal(formatWindowEnd("garbage"), null);
});
