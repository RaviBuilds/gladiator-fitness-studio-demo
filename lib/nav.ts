/**
 * Primary navigation — single source of truth.
 *
 * The homepage is a one-page site: every primary destination except the
 * standalone /start tool is an in-page section anchor (`#section-id`). Both the
 * desktop nav (components/sections/DesktopNav.tsx) and the mobile drawer
 * (components/motion/MobileNav.tsx) render THIS list, so the link set can never
 * drift between the two.
 *
 * ROUTE-AWARENESS — a bare `#section` href resolves against the CURRENT route,
 * so on /start it would (incorrectly) point at `/start#section`. `resolveNavHref`
 * rewrites section anchors to absolute homepage anchors (`/#section`) whenever
 * the visitor is not already on the homepage, so a section link always returns
 * to the homepage and lands on the right section. On the homepage itself the
 * bare `#section` form is preserved so normal in-page smooth-scroll behaviour is
 * unchanged. Non-anchor routes (e.g. `/start`) are returned untouched.
 */

export interface NavLink {
  href: string;
  label: string;
}

/** Desktop header link set (no "Start Here" entry — the header has a dedicated
 *  WhatsApp CTA and the hero links to /start). */
export const PRIMARY_NAV_LINKS: NavLink[] = [
  { href: "#programs", label: "Programs" },
  { href: "#why-choose-us", label: "Why Us" },
  { href: "#reviews", label: "Reviews" },
  { href: "#membership", label: "Membership" },
  { href: "#gallery", label: "Gallery" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
];

/** Mobile drawer link set — same as desktop plus the explicit tool entries
 *  (/start, /journey and /first-30-days). The desktop header stays uncrowded; the tools are
 *  reached there through contextual in-page links instead. */
export const MOBILE_NAV_LINKS: NavLink[] = [
  { href: "#programs", label: "Programs" },
  { href: "#why-choose-us", label: "Why Us" },
  { href: "#reviews", label: "Reviews" },
  { href: "#membership", label: "Membership" },
  { href: "#gallery", label: "Gallery" },
  { href: "#faq", label: "FAQ" },
  { href: "/start", label: "Start Here" },
  { href: "/journey", label: "Fitness Journey" },
  { href: "/first-30-days", label: "First 30 Days" },
  { href: "#contact", label: "Contact" },
];

/**
 * Resolve a nav href for the current route. Section anchors become absolute
 * homepage anchors when not already on "/"; on "/" they stay as bare anchors.
 * Everything that is not a bare `#` anchor is returned unchanged.
 */
export function resolveNavHref(href: string, pathname: string | null): string {
  if (!href.startsWith("#")) return href;
  if (pathname === "/") return href;
  return `/${href}`;
}
