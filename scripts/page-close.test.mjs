// Zero-dependency tests for the page close: Section 11 (Location & Hours),
// Section 12 (Final CTA) and the Footer.
// Run: node --test scripts/page-close.test.mjs  (Node >= 22.18 type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { business } from "../lib/business.ts";
import { instagramConfig } from "../lib/instagram.ts";
import { sections } from "../lib/sections.ts";

const read = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8");

const LOCATION_SRC = read("../components/sections/Location.tsx");
const FINAL_CTA_SRC = read("../components/sections/FinalCta.tsx");
const FOOTER_SRC = read("../components/sections/Footer.tsx");
const PAGE_SRC = read("../app/page.tsx");
const CSS_SRC = read("../app/globals.css");
const PKG = JSON.parse(read("../package.json"));

// --------------------------------------------------- Section 11: data-driven

test("no address value is written into the Location component", () => {
  const values = [
    business.address.addressLine,
    business.address.locality,
    business.address.city,
    business.address.state,
    business.address.postalCode,
    business.address.landmark,
    business.mapUrl,
  ].filter((v) => v && v.trim());

  for (const value of values) {
    assert.equal(
      LOCATION_SRC.includes(value),
      false,
      `"${value}" is hardcoded in Location.tsx — it must come from lib/business.ts`
    );
  }
});

test("no day or opening-time string is written into the Location component", () => {
  for (const entry of business.hours) {
    for (const value of [entry.day, entry.open, entry.close].filter(Boolean)) {
      assert.equal(
        LOCATION_SRC.includes(value),
        false,
        `"${value}" is hardcoded in Location.tsx — hours must come from lib/business.ts`
      );
    }
  }
});

test("Location renders address, hours and the map URL from business data", () => {
  assert.match(LOCATION_SRC, /from "@\/lib\/business"/);
  assert.match(LOCATION_SRC, /const \{ address, hours, mapUrl \} = business/);
  assert.match(LOCATION_SRC, /hours\.map\(/, "the hours register iterates the data");
  assert.match(LOCATION_SRC, /address\.landmark &&/, "an absent landmark renders nothing");
  assert.match(LOCATION_SRC, /\{mapUrl &&/, "an absent map URL renders no CTA");
});

test("closed days and partial address data degrade cleanly", () => {
  // Empty open/close means the day is closed, not "—".
  assert.match(LOCATION_SRC, /!h\.open \|\| !h\.close/);
  assert.match(LOCATION_SRC, /Closed</);
  // Address lines are filtered, so missing parts never leave stray separators.
  assert.match(LOCATION_SRC, /\.filter\(\(line\) => line && line\.trim\(\)\)/);
});

test("the directions CTA is a plain outbound link, not a map integration", () => {
  assert.equal(LOCATION_SRC.includes("<iframe"), false, "no embedded map");
  assert.equal(/google.*api|apiKey|API_KEY/i.test(LOCATION_SRC), false, "no maps API");
  assert.match(LOCATION_SRC, /target="_blank"/);
  assert.match(LOCATION_SRC, /rel="noopener noreferrer"/);
});

// ------------------------------------------------------- Section 12: final CTA

test("the final CTA headline and phone action come from data", () => {
  assert.match(FINAL_CTA_SRC, /\{business\.tagline\}/);
  assert.equal(
    FINAL_CTA_SRC.includes(business.phone),
    false,
    "the placeholder phone number must not be written into FinalCta.tsx"
  );
  assert.match(FINAL_CTA_SRC, /const phone = business\.phone\?\.trim\(\)/);
  assert.match(FINAL_CTA_SRC, /\{phone &&/, "the call action only renders when a phone exists");
  assert.match(FINAL_CTA_SRC, /href=\{`tel:\$\{phone\}`\}/);
});

test("the final CTA uses the shared WhatsApp deep link and button primitives", () => {
  assert.match(FINAL_CTA_SRC, /export function FinalCta\(\{ whatsappHref \}/);
  assert.match(FINAL_CTA_SRC, /href=\{whatsappHref\} variant="primary"/);
  assert.match(FINAL_CTA_SRC, /variant="secondary"/);
  assert.equal(FINAL_CTA_SRC.includes("wa.me"), false, "the link is built once in app/page.tsx");
});

// ------------------------------------------------------------------- Footer

test("the agency attribution links exactly to https://www.blogspage.com/", () => {
  assert.match(FOOTER_SRC, /const AGENCY_URL = "https:\/\/www\.blogspage\.com\/";/);
  for (const wrong of [
    "blockspage.com",
    "blogspage.ai",
    "http://www.blogspage.com",
  ]) {
    assert.equal(FOOTER_SRC.includes(wrong), false, `${wrong} must not appear`);
  }
  assert.match(FOOTER_SRC, /Blogspage AI/);
  assert.match(FOOTER_SRC, /target="_blank"[\s\S]*?rel="noopener noreferrer"/);
});

test("footer identity, social and year all resolve from data", () => {
  assert.match(FOOTER_SRC, /\{business\.name\}/);
  assert.match(FOOTER_SRC, /\{business\.tagline\}/);
  assert.match(FOOTER_SRC, /instagramConfig\.profileUrl/);
  assert.match(FOOTER_SRC, /\{instagramConfig\.handle\}/);
  assert.match(FOOTER_SRC, /new Date\(\)\.getFullYear\(\)/);
  assert.equal(FOOTER_SRC.includes(business.name), false, "gym name is not hardcoded");
  assert.equal(FOOTER_SRC.includes(instagramConfig.handle), false, "handle is not hardcoded");
});

test("footer navigation only targets anchors that exist on the page", () => {
  const anchors = [...FOOTER_SRC.matchAll(/href: "#([a-z-]+)"/g)].map((m) => m[1]);
  assert.ok(anchors.length >= 3, "the footer carries a navigation register");

  const dir = new URL("../components/sections/", import.meta.url);
  const markup =
    PAGE_SRC +
    readdirSync(dir)
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => readFileSync(new URL(f, dir), "utf8"))
      .join("\n");

  for (const anchor of anchors) {
    assert.ok(markup.includes(`id="${anchor}"`), `#${anchor} has no target element`);
  }
});

test("footer navigation is gated by the same section flags as the page", () => {
  assert.match(FOOTER_SRC, /from "@\/lib\/sections"/);
  const gated = [...FOOTER_SRC.matchAll(/enabled: sections\.([A-Za-z]+)/g)].map((m) => m[1]);
  assert.ok(gated.length >= 3);
  for (const flag of gated) {
    assert.ok(flag in sections, `sections.${flag} is a real flag`);
  }
  assert.match(FOOTER_SRC, /\.filter\(\(link\) => link\.enabled\)/);
});

// ------------------------------------------------------ styles + constraints

test("the closing trio's scoped styles exist", () => {
  const required = [
    ".factory-location-calibration",
    ".factory-location-edge",
    ".factory-location-pin",
    ".factory-location-block",
    ".factory-location-address",
    ".factory-hours",
    ".factory-hours-row",
    ".factory-hours-day",
    ".factory-hours-time",
    ".factory-hours-closed",
    ".factory-finalcta-plate",
    ".factory-finalcta-detail",
    ".factory-footer-grid",
    ".factory-footer-heading",
    ".factory-footer-bottom",
    ".factory-footer-agency-link",
  ];
  for (const selector of required) {
    assert.ok(
      CSS_SRC.includes(`${selector} {`),
      `${selector} is used by a component but not defined in globals.css`
    );
  }
});

test("the closing trio keeps the squared editorial language", () => {
  const scoped = CSS_SRC.split("\n").filter((line) =>
    /factory-(location|hours|finalcta|footer)/.test(line)
  );
  assert.ok(scoped.length > 0);
  // Square corners everywhere: no rounded cards in these sections.
  const block = CSS_SRC.slice(
    CSS_SRC.indexOf(".factory-location-heading h2 {"),
    CSS_SRC.indexOf(".factory-footer-agency-link:hover {")
  );
  assert.ok(block.length > 500, "the scoped style block was located");
  assert.equal(/border-radius/.test(block), false, "no rounded corners");
  assert.equal(/box-shadow/.test(block), false, "no card shadows");
});

test("the page close adds no dependencies", () => {
  assert.deepEqual(Object.keys(PKG.dependencies).sort(), ["next", "react", "react-dom"]);
});

test("the page ends location -> final CTA -> footer", () => {
  const order = ["<Location />", "<FinalCta", "<Footer />"].map((token) =>
    PAGE_SRC.indexOf(token)
  );
  assert.ok(order.every((i) => i > -1), "all three are mounted");
  assert.deepEqual([...order].sort((a, b) => a - b), order, "closing order is wrong");
});
