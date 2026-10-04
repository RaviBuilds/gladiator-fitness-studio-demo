"use client";

import { useEffect, useState } from "react";

/**
 * Floating contact actions (WhatsApp + Call), bottom-right.
 *
 * Visibility rule: hidden while the hero/banner is in the viewport, revealed
 * with an entrance animation once the user has scrolled past it, and animated
 * out again if they return to it. The hero is located through the
 * `data-floating-contact-hero` attribute set in components/sections/Hero.tsx;
 * if no such element exists on the page the actions are simply always shown.
 *
 * All motion lives in app/globals.css (`.factory-fab*`) and collapses to an
 * instant state change under `prefers-reduced-motion`.
 */
type FabState = "hidden" | "in" | "out";

const HERO_SELECTOR = "[data-floating-contact-hero]";

export function FloatingContact({
  whatsappHref,
  phoneHref,
}: {
  whatsappHref: string;
  /** `tel:` link. Omit (unverified / missing phone) and the call action does not render. */
  phoneHref?: string;
}) {
  const [state, setState] = useState<FabState>("hidden");

  useEffect(() => {
    const show = (visible: boolean) =>
      setState((prev) => (visible ? "in" : prev === "hidden" ? "hidden" : "out"));

    const hero = document.querySelector(HERO_SELECTOR);
    if (!hero) {
      show(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => show(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const shown = state === "in";

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-40 flex flex-col items-center gap-3">
      {phoneHref && (
        <div className="factory-fab factory-fab--call" data-state={state} style={{ "--fab-delay": "90ms" } as React.CSSProperties}>
          <div className="factory-fab__float">
            <a
              href={phoneHref}
              aria-label="Call us"
              tabIndex={shown ? 0 : -1}
              className="factory-focus factory-fab__btn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="factory-fab__icon" aria-hidden="true">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
            </a>
          </div>
          <span className="factory-fab__ground" aria-hidden="true" />
        </div>
      )}

      <div className="factory-fab factory-fab--whatsapp" data-state={state} style={{ "--fab-delay": "0ms" } as React.CSSProperties}>
        <div className="factory-fab__float">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            tabIndex={shown ? 0 : -1}
            className="factory-focus factory-fab__btn"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="factory-fab__icon" aria-hidden="true">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.94.55 3.75 1.5 5.29L2 22l4.94-1.6a9.85 9.85 0 0 0 5.1 1.4h.01c5.46 0 9.9-4.45 9.9-9.9C21.96 6.45 17.5 2 12.04 2zm5.8 14.02c-.24.68-1.42 1.3-1.96 1.38-.5.08-1.14.11-1.84-.12-.42-.14-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.93-4.36-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.27-.29.58-.36.78-.36.19 0 .39 0 .55.01.18.01.42-.07.65.5.24.58.81 2 .88 2.15.07.14.12.31.02.5-.09.19-.15.31-.29.47-.14.16-.29.36-.42.48-.14.14-.29.29-.12.58.16.29.75 1.24 1.62 2.02 1.12.99 2.06 1.3 2.37 1.44.31.14.49.12.67-.07.19-.19.79-.9.99-1.21.2-.31.4-.26.67-.16.27.1 1.68.79 1.97.93.29.14.48.21.55.33.07.12.07.68-.17 1.36z" />
            </svg>
          </a>
        </div>
        <span className="factory-fab__ground" aria-hidden="true" />
      </div>
    </div>
  );
}
