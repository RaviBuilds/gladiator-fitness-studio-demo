"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
 * Mobile navigation drawer. Client component isolated to interaction only;
 * the header shell around it stays server-rendered.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="lg:hidden">
      {/* Minimal square editorial control, matching the hero's slider buttons
          (36-40px, 1px border, sharp corners) rather than a circular icon
          button. Bar spacing and the collapse offset are the same 6.5px, so
          the three rules meet exactly on the centre line when open. */}
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="factory-focus flex h-10 w-10 flex-col items-center justify-center gap-[5px] border border-(--border) text-(--text-primary) transition-colors hover:border-(--accent)"
      >
        <span
          aria-hidden="true"
          className="block h-[1.5px] w-5 bg-current transition-transform"
          style={{ transform: open ? "translateY(6.5px) rotate(45deg)" : "none" }}
        />
        <span
          aria-hidden="true"
          className="block h-[1.5px] w-5 bg-current transition-opacity"
          style={{ opacity: open ? 0 : 1 }}
        />
        <span
          aria-hidden="true"
          className="block h-[1.5px] w-5 bg-current transition-transform"
          style={{ transform: open ? "translateY(-6.5px) rotate(-45deg)" : "none" }}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          /* Opens exactly at the header bar's bottom edge (--header-h is the
             single source for that geometry) and shares the site's container
             spine, so the links line up with the logo above them. */
          className="factory-container fixed inset-0 top-(--header-h) z-40 flex flex-col gap-2 bg-(--bg-primary) py-10"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="factory-focus border-b border-(--border) py-4 text-2xl font-semibold text-(--text-primary)"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
