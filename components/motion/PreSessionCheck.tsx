"use client";

import { useState } from "react";
import type { PreSessionCheck as PreSessionCheckData } from "@/lib/types";

/**
 * Section 07 — THE PRE-SESSION CHECK.
 *
 * The final station of the interval log, and the one place in the chapter where
 * the visitor answers something. It is a COACHING REMINDER, and the
 * implementation is constrained so it cannot quietly become anything else:
 *
 *   - there is no score, no total, no percentage, no dial and no traffic light.
 *     The component never counts the boxes, and the data contract
 *     (PreSessionCheck in lib/types.ts) has no field to put a result in;
 *   - nothing is stored. No localStorage, no cookie, no network call, no form
 *     submission — the state is three booleans in React that die with the page,
 *     and the scope line says exactly that;
 *   - the pain prompt does not produce an assessment. Raising it reveals one
 *     note whose entire content is "tell a coach, and see a clinician if it
 *     persists". The interface never names a cause, a condition or a severity.
 *
 * ACCESSIBILITY. Real `<input type="checkbox">` elements inside real `<label>`
 * elements, so the native role, state, keyboard behaviour and screen-reader
 * announcement are the browser's, not a reimplementation. The visual mark is a
 * drawn square that follows `:checked`; the input is visually hidden but never
 * `display: none`, so it stays focusable and the focus ring is drawn on the
 * label. The escalation note is a polite live region: a keyboard or
 * screen-reader user who ticks the third box hears it appear.
 */
export function PreSessionCheck({ check }: { check: PreSessionCheckData }) {
  const [raised, setRaised] = useState<Record<string, boolean>>({});

  const escalated = check.items.some(
    (item) => item.escalates && raised[item.id]
  );

  return (
    <div className="s07-check">
      <div className="s07-check-head">
        <h4 className="s07-label s07-check-heading" data-accent="true">
          {check.label}
        </h4>
        <p className="s07-check-intro">{check.intro}</p>
      </div>

      <ul role="list" className="s07-check-list">
        {check.items.map((item, i) => {
          const inputId = `s07-check-${item.id}`;
          const isRaised = Boolean(raised[item.id]);
          return (
            <li key={item.id} className="s07-check-item">
              <input
                id={inputId}
                type="checkbox"
                className="s07-check-input"
                checked={isRaised}
                onChange={(event) =>
                  setRaised((current) => ({
                    ...current,
                    [item.id]: event.target.checked,
                  }))
                }
              />
              <label htmlFor={inputId} className="s07-check-label">
                <span className="s07-check-index" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="s07-check-box" aria-hidden="true" />
                <span className="s07-check-copy">
                  <span className="s07-check-prompt">{item.prompt}</span>
                  <span className="s07-check-detail">{item.detail}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {/* Always in the DOM as a live region so the note is announced when it
          appears, rather than being mounted at the same moment it should be
          read. */}
      <div className="s07-check-escalation" aria-live="polite">
        {escalated && (
          <div className="s07-check-escalation-body">
            <p className="s07-check-escalation-label">{check.escalationLabel}</p>
            <p className="s07-check-escalation-text">{check.escalation}</p>
          </div>
        )}
      </div>

      <p className="s07-check-scope">{check.scope}</p>
    </div>
  );
}
