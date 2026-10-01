"use client";

import { useState } from "react";
import type { FaqItem } from "@/lib/types";

/**
 * Accessible, one-open-at-a-time FAQ register. Renders semantic
 * button-triggered rows (aria-expanded/aria-controls) rather than
 * native <details>, so opening a new question always closes the
 * previous one — no per-panel toggle listeners required.
 *
 * Expansion uses a grid-template-rows clip transition (measured,
 * mechanical, no bounce/spring). The project's global
 * `prefers-reduced-motion: reduce` rule (app/globals.css) forces all
 * transition durations to ~0ms, so reduced motion is handled for free.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex flex-col">
      {items.map((item) => {
        const isOpen = openId === item.id;
        const panelId = `faq-panel-${item.id}`;
        const triggerId = `faq-trigger-${item.id}`;

        return (
          <div
            key={item.id}
            className="border-b border-(--border) first:border-t"
          >
            <h3 className="m-0">
              <button
                type="button"
                id={triggerId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="factory-focus flex w-full cursor-pointer items-start justify-between gap-6 py-6 text-left"
              >
                <span className="flex items-start gap-4 flex-1">
                  <span
                    className="factory-eyebrow shrink-0 mt-1 text-(--text-secondary)"
                    aria-hidden="true"
                  >
                    {item.id}
                  </span>
                  <span className="text-lg font-semibold leading-tight text-(--text-primary) tracking-tight">
                    {item.question}
                  </span>
                </span>
                <span
                  className="shrink-0 w-8 h-8 flex items-center justify-center border border-(--border) text-(--accent) text-xl font-light"
                  aria-hidden="true"
                >
                  {isOpen ? "−" : "+"}
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{
                gridTemplateRows: isOpen ? "1fr" : "0fr",
              }}
              hidden={false}
            >
              <div className="overflow-hidden">
                <p className="pb-6 ml-[calc(3ch+1rem)] pr-12 text-sm leading-6 text-(--text-secondary)">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
