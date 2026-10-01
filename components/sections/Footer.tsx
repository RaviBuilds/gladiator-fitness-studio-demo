import Link from "next/link";
import Image from "next/image";
import { business } from "@/lib/business";
import { instagramConfig } from "@/lib/instagram";
import { sections } from "@/lib/sections";
import { Container } from "@/components/ui/Container";

/**
 * Footer navigation. Reuses the existing on-page section anchors and is gated
 * by the same Factory flags that decide whether those sections render at all,
 * so switching a section off can never leave a dead footer anchor behind.
 */
const NAV_LINKS = [
  { href: "#programs", label: "Programs", enabled: sections.programs },
  { href: "#membership", label: "Membership", enabled: sections.membership },
  { href: "#gallery", label: "Gallery", enabled: sections.gallery },
  { href: "#faq", label: "FAQ", enabled: sections.faq },
  { href: "#contact", label: "Contact", enabled: sections.contact },
].filter((link) => link.enabled);

const AGENCY_URL = "https://www.blogspage.com/";

/**
 * Site footer. Three editorial areas — gym identity, navigation, social —
 * over a divider, then a bottom row carrying the copyright and the agency
 * attribution. Gym branding stays primary; the BLOGSPAGE AI credit is a quiet
 * accent-linked line beneath it.
 *
 * SOURCE-FIRST: gym name, tagline, Instagram handle/URL and the copyright year
 * all resolve from data (lib/business.ts, lib/instagram.ts). Navigation reuses
 * existing on-page section anchors — no invented pages. Only the fixed agency
 * attribution is a constant.
 */
export function Footer() {
  return (
    <footer className="factory-footer border-t border-(--border) bg-(--bg-secondary) py-16">
      <Container>
        <div className="factory-footer-grid">
          {/* Gym identity. The column is given a DEFINITE width so the logo's
              percentage width below actually resolves — .factory-footer-identity
              carries no CSS of its own, so as a content-sized flex item a
              percentage would have been indeterminate. */}
          <div className="factory-footer-identity w-full sm:w-80">
            {/* 150x150 square badge mark: sized by width with auto height
                (1:1 aspect, so width/height sizing is equivalent), landing
                at ~75% of the column, same footprint as the prior landscape
                mark. */}
            <Image
              src="/assets/brand/favicon/gladiator-fitness-studio-madhapur-logo.jpg"
              alt={`${business.name} logo`}
              width={150}
              height={150}
              className="h-auto w-[55%] max-w-full object-contain"
            />
            <p className="mt-5 text-lg font-semibold text-(--text-primary)">{business.name}</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-(--text-secondary)">
              {business.tagline}
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Footer" className="factory-footer-nav">
            <p className="factory-footer-heading">Explore</p>
            <ul className="factory-footer-nav-list">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="factory-focus text-sm text-(--text-secondary) transition-colors hover:text-(--text-primary)"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Social */}
          <div className="factory-footer-social">
            <p className="factory-footer-heading">Follow</p>
            <a
              href={instagramConfig.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="factory-focus mt-3 inline-flex items-center gap-2 text-sm text-(--text-secondary) transition-colors hover:text-(--text-primary)"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
              </svg>
              {instagramConfig.handle}
            </a>
          </div>
        </div>

        {/* Divider + bottom row */}
        <div className="factory-rule mt-12" />
        <div className="factory-footer-bottom">
          <p className="text-xs text-(--text-secondary)">
            © {new Date().getFullYear()} {business.name}. All rights reserved.
          </p>

          <p className="factory-footer-agency">
            <span className="factory-footer-agency-label">Designed &amp; developed by</span>{" "}
            <a
              href={AGENCY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="factory-focus factory-footer-agency-link"
            >
              Blogspage AI
              <span aria-hidden="true">↗</span>
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
}
