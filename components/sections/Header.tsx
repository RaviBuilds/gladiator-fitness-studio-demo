import Link from "next/link";
import Image from "next/image";
import { business } from "@/lib/business";
import { Button } from "@/components/ui/Button";
import { MobileNav } from "@/components/motion/MobileNav";

const NAV_LINKS = [
  { href: "#programs", label: "Programs" },
  { href: "#why-choose-us", label: "Why Us" },
  { href: "#reviews", label: "Reviews" },
  { href: "#membership", label: "Membership" },
  { href: "#gallery", label: "Gallery" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
];

/**
 * Floating inset header bar. No scroll-driven JS — the bar carries its own
 * bordered, dense surface so it stays legible over any hero image without a
 * client-side scroll listener. See docs/MASTER-PASS-1-DESIGN-DIRECTION.md
 * section 4.
 *
 * Layer contract for the whole page, top to bottom:
 *   50  ContactDialog (true modal)
 *   45  this header — site chrome, and the stacking context the mobile nav
 *       drawer (z-40 inside it) lives in, so an open drawer covers the hero UI
 *       and the floating WhatsApp control
 *   40  hero UI (copy, controls, top-utility metadata) + floating WhatsApp
 *   10-35 hero artwork layers (back type -> athlete -> scrim -> front type)
 * The header must stay above 40: as site chrome it has to remain reachable
 * over in-page UI, and its drawer is modal.
 *
 * Geometry is shared, not duplicated: the inset/row/border below is mirrored
 * by --header-inset and --header-h in app/globals.css, which drive both the
 * mobile drawer offset and the hero's header-safe composition zone
 * (--hero-header-clear). Changing the row height or inset here without
 * updating those tokens would move the hero artwork's head clearance.
 */
export function Header({ whatsappHref }: { whatsappHref: string }) {
  return (
    <header className="fixed inset-x-3 top-3 z-45 sm:inset-x-4 sm:top-4">
      {/* Squared editorial bar: a 1px rule over a dense surface. Deliberately
          not rounded and not glassy — the same industrial language as the
          hero's chips, cards and slider controls. */}
      <div className="border border-(--border) bg-(--bg-primary)/90">
        <div className="factory-header-spine flex h-16 items-center justify-between gap-4 sm:h-18">
          {/* Brand: LOGO IMAGE ONLY. The business name is intentionally not
              rendered as visible text. The accessible brand label lives on the
              link and the mark itself is decorative (alt=""), so assistive
              tech announces the brand exactly once. */}
          <Link
            href="#top"
            aria-label={`${business.name} — home`}
            className="factory-focus flex shrink-0 items-center"
          >
            {/* The mark is a 150x150 square badge, so object-contain inside
                an auto-width/fixed-height box sizes it correctly without
                letterboxing or distortion (unlike a landscape mark, a square
                mark doesn't waste footprint in a height-constrained box). */}
            <Image
              src="/assets/brand/favicon/gladiator-fitness-studio-madhapur-logo.jpg"
              alt=""
              aria-hidden="true"
              width={150}
              height={150}
              priority
              className="h-12 w-auto object-contain sm:h-14"
            />
          </Link>

          {/* Desktop nav from 1024px: with the brand text gone the row has
              room for the full link set well before 1280px, so tablets in
              landscape get real navigation instead of the drawer. */}
          <nav aria-label="Primary" className="hidden items-center gap-6 lg:flex xl:gap-9">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="factory-nav-link factory-focus"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <Button href={whatsappHref} variant="primary">
              WhatsApp
            </Button>
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
