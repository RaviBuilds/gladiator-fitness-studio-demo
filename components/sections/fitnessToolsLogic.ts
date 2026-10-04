import type {
  FitnessTool,
  FitnessToolId,
  HeroCtaSource,
  HeroSlide,
} from "@/lib/types";

/**
 * INTERACTIVE FITNESS TOOLS — derivation layer.
 *
 * Pure module (no React, no DOM, type-only imports) so it can be unit-tested
 * directly by scripts/fitness-tools.test.mjs. It turns the registry in
 * lib/fitness-tools.ts and each slide's data-driven `cta` sources into the
 * concrete label/href fields HeroSlider already renders, so the slider itself
 * carries no CTA logic and never needs to know a tool exists.
 *
 * Guarantees:
 *   - an unavailable tool (disabled, or `href: null`) never produces a link;
 *   - a fallback or link pointing at a homepage section that is switched off
 *     is treated as unavailable, so no CTA can target a missing anchor;
 *   - a primary action that cannot resolve degrades to the site-wide WhatsApp
 *     action, so a slide is never left without a primary CTA;
 *   - a secondary that would duplicate the primary's destination is dropped.
 */

export const DEFAULT_WHATSAPP_LABEL = "Chat on WhatsApp";

/** A tool is available only when it is enabled AND has a real route. */
export function isToolAvailable(tool: FitnessTool | undefined): tool is FitnessTool & { href: string } {
  return Boolean(tool && tool.enabled && typeof tool.href === "string" && tool.href.length > 0);
}

/** Available tools, in registry order. */
export function availableTools(tools: FitnessTool[]): (FitnessTool & { href: string })[] {
  return tools.filter(isToolAvailable);
}

export function findTool(tools: FitnessTool[], id: FitnessToolId): FitnessTool | undefined {
  return tools.find((t) => t.id === id);
}

export interface HeroCtaContext {
  /** The site-wide WhatsApp href (lib/whatsapp.ts). */
  whatsappHref: string;
  /**
   * Homepage section ids that are actually rendered (e.g. "programs",
   * "membership"). Any "#id" href outside this list is treated as unavailable.
   */
  availableAnchors: string[];
}

interface ResolvedCta {
  label: string;
  href: string;
  arrow: boolean;
  subheadline?: string;
}

function isHrefAvailable(href: string, ctx: HeroCtaContext): boolean {
  if (!href) return false;
  if (href.startsWith("#")) return ctx.availableAnchors.includes(href.slice(1));
  return true;
}

function resolveSource(
  source: HeroCtaSource,
  tools: FitnessTool[],
  ctx: HeroCtaContext
): ResolvedCta | null {
  switch (source.type) {
    case "tool": {
      const tool = findTool(tools, source.toolId);
      if (isToolAvailable(tool)) {
        return {
          label: tool.heroCtaLabel ?? tool.name,
          href: tool.href,
          arrow: true,
          subheadline: source.subheadline,
        };
      }
      if (source.fallback && isHrefAvailable(source.fallback.href, ctx)) {
        return { label: source.fallback.label, href: source.fallback.href, arrow: false };
      }
      return null;
    }
    case "whatsapp":
      return { label: source.label, href: ctx.whatsappHref, arrow: false };
    case "link":
      return isHrefAvailable(source.href, ctx)
        ? { label: source.label, href: source.href, arrow: false }
        : null;
  }
}

/**
 * Resolve one slide's `cta` sources into HeroSlider's concrete fields.
 * Slides without `cta` are returned untouched (legacy behaviour).
 */
export function resolveHeroCtas(
  slide: HeroSlide,
  tools: FitnessTool[],
  ctx: HeroCtaContext
): HeroSlide {
  if (!slide.cta) return slide;

  const { cta, ...rest } = slide;
  const primary = resolveSource(cta.primary, tools, ctx) ?? {
    label: DEFAULT_WHATSAPP_LABEL,
    href: ctx.whatsappHref,
    arrow: false,
  };
  const resolvedSecondary = cta.secondary ? resolveSource(cta.secondary, tools, ctx) : null;
  const secondary =
    resolvedSecondary && resolvedSecondary.href !== primary.href ? resolvedSecondary : null;

  return {
    ...rest,
    subheadline: primary.subheadline ?? rest.subheadline,
    primaryCtaLabel: primary.label,
    primaryCtaHref: primary.href,
    primaryCtaArrow: primary.arrow,
    secondaryCtaLabel: secondary?.label,
    secondaryCtaHref: secondary?.href,
    secondaryCtaArrow: secondary?.arrow ?? false,
  };
}

export function resolveHeroSlides(
  slides: HeroSlide[],
  tools: FitnessTool[],
  ctx: HeroCtaContext
): HeroSlide[] {
  return slides.map((slide) => resolveHeroCtas(slide, tools, ctx));
}
