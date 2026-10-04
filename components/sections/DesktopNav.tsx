"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV_LINKS, resolveNavHref } from "@/lib/nav";

/**
 * Desktop primary navigation (>=1024px). Client component so it can read the
 * current route via usePathname and resolve section anchors to absolute
 * homepage anchors on /start (see lib/nav.ts). The surrounding header shell
 * stays server-rendered; only this link row is interactive.
 */
export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="hidden items-center gap-6 lg:flex xl:gap-9">
      {PRIMARY_NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={resolveNavHref(link.href, pathname)}
          className="factory-nav-link factory-focus"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
