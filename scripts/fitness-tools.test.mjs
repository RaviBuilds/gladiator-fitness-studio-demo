// Zero-dependency tests for the interactive fitness tools registry, the hero
// CTA resolver and the Training Intelligence tools block.
// Run: node --test scripts/fitness-tools.test.mjs  (Node >= 22.18 type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fitnessTools } from "../lib/fitness-tools.ts";
import { heroConfiguration } from "../lib/hero.ts";
import { trainingIntelligenceConfiguration as tiConfig } from "../lib/training-intelligence.ts";
import {
  DEFAULT_WHATSAPP_LABEL,
  availableTools,
  isToolAvailable,
  resolveHeroCtas,
  resolveHeroSlides,
} from "../components/sections/fitnessToolsLogic.ts";

const read = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8");
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

const WA = "https://wa.me/910000000000?text=hi";
const ALL_ANCHORS = { whatsappHref: WA, availableAnchors: ["programs", "membership"] };

const TOOLS_SRC = read("../components/sections/TrainingTools.tsx");
const TOOLS_CODE = stripComments(TOOLS_SRC);
const HERO_SRC = read("../components/sections/Hero.tsx");
const SLIDER_SRC = read("../components/motion/HeroSlider.tsx");
const CSS_SRC = read("../app/globals.css");
const TOOLS_CSS = CSS_SRC.slice(
  CSS_SRC.indexOf("/* ------------------------------------------------------------ tools block */"),
  CSS_SRC.indexOf("/* ------------------------------------------------------------ scope line */")
);

const slide = (cta, extra = {}) => ({
  image: "/x.png",
  headline: "Test.",
  subheadline: "Original line.",
  cta,
  ...extra,
});

// ------------------------------------------------------------------ registry

test("registry: ids and indexes are unique, and the order is 01, 02, 03", () => {
  const ids = fitnessTools.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(
    fitnessTools.map((t) => t.index),
    ["01", "02", "03"]
  );
});

test("registry: every available tool points at a real app route with complete copy", () => {
  const tools = availableTools(fitnessTools);
  assert.ok(tools.length >= 2);
  for (const tool of tools) {
    assert.match(tool.href, /^\/[a-z0-9-]+$/, `${tool.id} href is an internal route`);
    const page = new URL(`../app${tool.href}/page.tsx`, import.meta.url);
    assert.ok(existsSync(page), `${tool.href} has app${tool.href}/page.tsx`);
    for (const key of ["name", "description", "meta", "ctaLabel"]) {
      assert.ok(tool[key].trim().length > 0, `${tool.id}.${key} is filled`);
    }
  }
});

test("registry: the three tools map to /start, /journey and /first-30-days", () => {
  const byId = Object.fromEntries(fitnessTools.map((t) => [t.id, t]));
  assert.equal(byId["starting-point"].href, "/start");
  assert.equal(byId["journey"].href, "/journey");
  assert.equal(byId["first-30-days"].href, "/first-30-days");
  assert.equal(byId["starting-point"].name, "Find Your Starting Point");
  assert.equal(byId["journey"].name, "Map Your Fitness Journey");
  assert.equal(byId["first-30-days"].name, "Plan Your First 30 Days");
});

test("registry: the third tool is live and its copy is onboarding-only", () => {
  const third = fitnessTools.find((t) => t.id === "first-30-days");
  assert.ok(third);
  assert.equal(third.index, "03");
  assert.equal(third.enabled, true);
  assert.equal(isToolAvailable(third), true);
  assert.equal(availableTools(fitnessTools).length, 3);
  assert.equal(/workout|calori|guarantee|trial|programme/i.test(`${third.description} ${third.meta}`), false);
  assert.equal(fitnessTools.some((t) => t.id === "tool-03"), false, "reserved id is retired");
});

test("availableTools: requires BOTH enabled and a route", () => {
  const tools = [
    { id: "starting-point", index: "01", name: "a", description: "a", meta: "a", ctaLabel: "a", href: "/start", enabled: false },
    { id: "journey", index: "02", name: "b", description: "b", meta: "b", ctaLabel: "b", href: null, enabled: true },
    { id: "first-30-days", index: "03", name: "c", description: "c", meta: "c", ctaLabel: "c", href: "/c", enabled: true },
  ];
  assert.deepEqual(availableTools(tools).map((t) => t.id), ["first-30-days"]);
});

// ------------------------------------------------------------------ resolver

test("resolver: an available tool becomes the CTA with an arrow and its subheadline", () => {
  const out = resolveHeroCtas(
    slide({ primary: { type: "tool", toolId: "journey", subheadline: "Journey line." } }),
    fitnessTools,
    ALL_ANCHORS
  );
  assert.equal(out.primaryCtaHref, "/journey");
  assert.equal(out.primaryCtaLabel, "Map Your Fitness Journey");
  assert.equal(out.primaryCtaArrow, true);
  assert.equal(out.subheadline, "Journey line.");
  assert.equal("cta" in out, false, "data-only sources never reach the client");
});

test("resolver: an unavailable tool uses its fallback, never another tool's route", () => {
  const disabled = fitnessTools.map((t) => (t.id === "first-30-days" ? { ...t, enabled: false } : t));
  const out = resolveHeroCtas(
    slide({
      primary: { type: "tool", toolId: "first-30-days", fallback: { label: "Explore Programs", href: "#programs" } },
    }),
    disabled,
    ALL_ANCHORS
  );
  assert.equal(out.primaryCtaHref, "#programs");
  assert.equal(out.primaryCtaLabel, "Explore Programs");
  assert.equal(out.primaryCtaArrow, false);
  assert.equal(out.subheadline, "Original line.");
  assert.notEqual(out.primaryCtaHref, "/start");
  assert.notEqual(out.primaryCtaHref, "/journey");
});

test("resolver: a fallback to a switched-off section degrades to WhatsApp", () => {
  const disabled = fitnessTools.map((t) => (t.id === "first-30-days" ? { ...t, enabled: false } : t));
  const out = resolveHeroCtas(
    slide({
      primary: { type: "tool", toolId: "first-30-days", fallback: { label: "Explore Programs", href: "#programs" } },
    }),
    disabled,
    { whatsappHref: WA, availableAnchors: [] }
  );
  assert.equal(out.primaryCtaHref, WA);
  assert.equal(out.primaryCtaLabel, DEFAULT_WHATSAPP_LABEL);
});

test("resolver: a secondary link to a missing section is dropped, not rendered dead", () => {
  const out = resolveHeroCtas(
    slide({
      primary: { type: "tool", toolId: "journey" },
      secondary: { type: "link", label: "See Membership", href: "#membership" },
    }),
    fitnessTools,
    { whatsappHref: WA, availableAnchors: ["programs"] }
  );
  assert.equal(out.secondaryCtaHref, undefined);
  assert.equal(out.secondaryCtaLabel, undefined);
});

test("resolver: a secondary duplicating the primary destination is dropped", () => {
  const disabled = fitnessTools.map((t) => (t.id === "first-30-days" ? { ...t, enabled: false } : t));
  const out = resolveHeroCtas(
    slide({
      primary: { type: "tool", toolId: "first-30-days" },
      secondary: { type: "whatsapp", label: "Chat on WhatsApp" },
    }),
    disabled,
    ALL_ANCHORS
  );
  assert.equal(out.primaryCtaHref, WA);
  assert.equal(out.secondaryCtaHref, undefined);
});

test("resolver: a legacy slide without `cta` passes through untouched", () => {
  const legacy = {
    image: "/x.png",
    headline: "Legacy.",
    primaryCtaLabel: "Chat on WhatsApp",
    primaryCtaHref: undefined,
    secondaryCtaLabel: "See Membership",
    secondaryCtaHref: "#membership",
  };
  assert.equal(resolveHeroCtas(legacy, fitnessTools, ALL_ANCHORS), legacy);
});

test("resolver: the enabled third tool takes over Slide 03 with no hero edit", () => {
  const [, , s3] = resolveHeroSlides(heroConfiguration.slides, fitnessTools, ALL_ANCHORS);
  assert.equal(s3.primaryCtaHref, "/first-30-days");
  assert.equal(s3.primaryCtaLabel, "Plan Your First 30 Days");
  assert.equal(s3.primaryCtaArrow, true);
});

// --------------------------------------------------------- Gladiator hero

test("hero: Slide 01 Start, Slide 02 Journey, Slide 03 First 30 Days", () => {
  const [s1, s2, s3] = resolveHeroSlides(heroConfiguration.slides, fitnessTools, ALL_ANCHORS);

  assert.equal(s1.primaryCtaHref, "/start");
  assert.equal(s1.primaryCtaLabel, "Find Your Starting Point");
  assert.equal(s1.secondaryCtaHref, WA);
  assert.equal(s1.secondaryCtaLabel, "Chat on WhatsApp");

  assert.equal(s2.primaryCtaHref, "/journey");
  assert.equal(s2.primaryCtaLabel, "Map Your Fitness Journey");
  assert.equal(s2.secondaryCtaHref, "#membership");
  assert.match(s2.subheadline, /goal, your week and your starting point/);

  assert.equal(s3.primaryCtaHref, "/first-30-days");
  assert.equal(s3.primaryCtaLabel, "Plan Your First 30 Days");
  assert.equal(s3.secondaryCtaHref, undefined);
});

test("hero: exactly one WhatsApp CTA, on Slide 01's secondary", () => {
  const slides = resolveHeroSlides(heroConfiguration.slides, fitnessTools, ALL_ANCHORS);
  const hrefs = slides.flatMap((s, i) => [
    [i, "primary", s.primaryCtaHref],
    [i, "secondary", s.secondaryCtaHref],
  ]);
  const wa = hrefs.filter(([, , h]) => h === WA);
  assert.deepEqual(wa, [[0, "secondary", WA]]);
});

test("hero: every slide is data-driven and every CTA has a label + valid href", () => {
  for (const s of heroConfiguration.slides) {
    assert.ok(s.cta, "slide uses `cta` sources");
    assert.equal(s.primaryCtaHref, undefined);
    assert.equal(s.secondaryCtaHref, undefined);
  }
  for (const s of resolveHeroSlides(heroConfiguration.slides, fitnessTools, ALL_ANCHORS)) {
    assert.ok(s.primaryCtaLabel && s.primaryCtaHref);
    for (const href of [s.primaryCtaHref, s.secondaryCtaHref].filter(Boolean)) {
      if (href.startsWith("#")) assert.ok(ALL_ANCHORS.availableAnchors.includes(href.slice(1)));
      else if (href.startsWith("/")) assert.ok(existsSync(new URL(`../app${href}/page.tsx`, import.meta.url)));
      else assert.equal(href, WA);
    }
  }
});

test("hero: Hero.tsx resolves on the server; HeroSlider only gained the arrow", () => {
  assert.match(HERO_SRC, /resolveHeroSlides\(heroConfiguration\.slides, fitnessTools/);
  assert.match(HERO_SRC, /slides=\{slides\}/);
  assert.equal(/s05-|TrainingIntelligence|TrainingLoadout/.test(HERO_SRC), false);
  assert.match(SLIDER_SRC, /slide\.primaryCtaArrow && <span aria-hidden="true">→<\/span>/);
  assert.match(SLIDER_SRC, /slide\.secondaryCtaArrow && <span aria-hidden="true">→<\/span>/);
  assert.equal(SLIDER_SRC.includes("fitness-tools"), false, "the slider never reads the registry");
});

// ----------------------------------------------- Training Intelligence block

test("tools block: copy comes from configuration + registry, not JSX literals", () => {
  for (const key of ["toolsEyebrow", "toolsHeading", "toolsDeck"]) {
    assert.ok(tiConfig[key].trim().length > 0, `${key} is set`);
    assert.ok(TOOLS_SRC.includes(`{${key}}`), `{${key}} rendered from config`);
    assert.equal(TOOLS_SRC.includes(tiConfig[key]), false, `${key} text not hardcoded`);
  }
  for (const token of ["{tool.index}", "{tool.name}", "{tool.description}", "{tool.meta}", "{tool.ctaLabel}", "href={tool.href}"]) {
    assert.ok(TOOLS_SRC.includes(token), `${token} rendered from registry`);
  }
  for (const tool of availableTools(fitnessTools)) {
    assert.equal(TOOLS_CODE.includes(tool.name), false, `"${tool.name}" not hardcoded`);
  }
});

test("tools block: no hardcoded tool routes; only available tools render", () => {
  assert.equal(/["'`]\/(start|journey)["'`]/.test(TOOLS_SRC), false);
  assert.match(TOOLS_SRC, /const tools = availableTools\(fitnessTools\)/);
  assert.match(TOOLS_SRC, /if \(tools\.length === 0\) return null;/);
  assert.match(TOOLS_SRC, /tools\.map\(\(tool\) =>/);
});

test("tools strip: heading order h2 -> h3, placed between About and Programs, no Reveal", () => {
  const h2 = TOOLS_CODE.indexOf("<h2");
  const h3 = TOOLS_CODE.indexOf("<h3");
  assert.ok(h2 > -1 && h2 < h3);
  assert.equal(TOOLS_CODE.includes("<h4"), false);
  // Not scroll-gated.
  assert.equal(TOOLS_CODE.includes("Reveal"), false);
  // Moved out of Section 05 entirely.
  const ti = read("../components/sections/TrainingIntelligence.tsx");
  assert.equal(/s05-tools|availableTools|fitnessTools/.test(ti), false);
  // Rendered between About (01) and Programs (02) on the page.
  const page = read("../app/page.tsx");
  const about = page.indexOf("<About />");
  const strip = page.indexOf("<TrainingTools />");
  const programs = page.indexOf("<Programs");
  assert.ok(about > -1 && about < strip && strip < programs);
});

test("tools block: CTAs are real links with text and decorative arrows", () => {
  assert.match(TOOLS_SRC, /<Button href=\{tool\.href\} variant="secondary" className="s05-tool-cta">/);
  assert.match(TOOLS_SRC, /className="s05-tool-arrow" aria-hidden="true"/);
  assert.match(TOOLS_SRC, /className="s05-tool-index" aria-hidden="true"/);
});

test("tools CSS: tokens only, thumb targets, responsive grid, reduced motion", () => {
  assert.ok(TOOLS_CSS.length > 0);
  assert.equal(/#[0-9a-fA-F]{3,8}\b/.test(TOOLS_CSS), false, "no hex colours");
  assert.equal(/gradient|box-shadow|backdrop-filter|border-radius/.test(TOOLS_CSS), false);
  assert.match(TOOLS_CSS, /\.s05-tool-cta \{[^}]*min-height: 2\.75rem;/);
  assert.match(TOOLS_CSS, /@media \(min-width: 768px\) \{\s*\.s05-tools-list \{\s*grid-template-columns: repeat\(2/);
  assert.match(TOOLS_CSS, /\.s05-tools\[data-count="3"\] \.s05-tools-list/);
  // Reduced motion is folded into Section 05's single reduced-motion block.
  const rm = CSS_SRC.slice(CSS_SRC.lastIndexOf("@media (prefers-reduced-motion: reduce)", CSS_SRC.indexOf("Pass 10 additions")));
  assert.match(rm.slice(0, rm.indexOf("Pass 10 additions")), /\.s05-tool-cta:hover \.s05-tool-arrow/);
});

test("new modules carry no hex colour literals", () => {
  for (const rel of [
    "../lib/fitness-tools.ts",
    "../components/sections/fitnessToolsLogic.ts",
    "../components/sections/TrainingIntelligence.tsx",
    "../components/sections/TrainingTools.tsx",
    "../components/sections/Hero.tsx",
  ]) {
    assert.equal(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])/.test(stripComments(read(rel))), false, rel);
  }
});
