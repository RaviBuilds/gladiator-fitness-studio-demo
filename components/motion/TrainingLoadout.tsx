"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import {
  EMPHASIS_SLOTS,
  pad,
  railPosition,
  type LoadoutGoalView,
} from "@/components/sections/trainingLoadout";

/**
 * Section 05 — THE TRAINING LOADOUT.
 *
 * The signature visual device of the chapter, and the only client island in
 * it. A gym-machine weight selector translated into editorial print: a
 * calibrated rail, indexed positions, a lime selector pin that travels to the
 * chosen position, plate markers that load and unload per lever, and the
 * teaching sheet that reads out beneath it.
 *
 * WHY IT IS NOT ANY OF SECTIONS 01-04
 *   - Section 01 is a sticky photograph beside scrolling copy. Here there is
 *     no sticky panel and no scroll-linked behaviour at all.
 *   - Section 02 is a ruled vertical index whose rows swap a side preview
 *     image. Here selection changes no image; it moves a mechanical pin and
 *     re-weights a comparison stack.
 *   - Section 03 is a centred subject with perimeter annotations wired to it.
 *     Here there is no subject and no connector geometry.
 *   - Section 04 is a repeated per-case evidence sheet with a metric ledger.
 *     Here there is exactly ONE instrument and the content is impersonal
 *     teaching, not member records.
 *   - And none of them are horizontal. The loadout's primary axis is the rail,
 *     which is what makes the chapter feel like a different mode of the site.
 *
 * INTERACTION SEMANTICS. The selector is a real WAI-ARIA tab list with
 * automatic activation, because one control genuinely governs one region of
 * downstream content (emphasis stack, teaching columns, coach's note, CTA).
 * Left/Right move and select, Home/End jump to the ends, roving tabindex keeps
 * the group a single tab stop, and pointer and keyboard reach identical state.
 * "Tab list" is the semantic contract only — visually this is a weight-stack
 * selector, not a tabbed card.
 *
 * NO COLOUR-ONLY STATE, ANYWHERE. The selected position carries a filled
 * block, a raised stem, a weight step and `aria-selected`. Every emphasis row
 * states its level as a WORD ("Maintain" / "Supporting" / "Primary focus")
 * beside the plate markers, so the markers are reinforcement rather than the
 * only channel — and the plates themselves are `aria-hidden`.
 *
 * NO HOVER-GATED CONTENT. Every priority, correction, tracking signal, note
 * and CTA for the selected goal is in normal document flow at every
 * breakpoint. Hover changes nothing but emphasis of the hovered control.
 *
 * SCALES BY DATA, NOT BY REDESIGN. The rail is `total` equal positions and the
 * pin coordinate is derived (see railPosition), so 3, 5, 6 or 8 enabled goals
 * all compose correctly. Below the instrument breakpoint the rail keeps its
 * calibration but the positions recompose into a thumb-scrollable chip track
 * with snap points — a different control for a different hand, not a squeezed
 * desktop one.
 */
export function TrainingLoadout({
  goals,
  selectorLabel,
  loadoutLabel,
  emphasisLabel,
  prioritiesLabel,
  mistakesLabel,
  trackLabel,
  coachNoteLabel,
  gymNoteLabel,
  handoffLabel,
  primaryCtaLabel,
  secondaryCtaLabel,
  artifact,
}: {
  goals: LoadoutGoalView[];
  selectorLabel: string;
  loadoutLabel: string;
  emphasisLabel: string;
  prioritiesLabel: string;
  mistakesLabel: string;
  trackLabel: string;
  coachNoteLabel: string;
  gymNoteLabel: string;
  handoffLabel: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  /** Server-rendered subordinate photograph. Absent on gyms without one. */
  artifact?: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const total = goals.length;
  const goal = goals[active] ?? goals[0];
  if (!goal) return null;

  /** Move selection AND focus together, so the two never drift apart. */
  const select = (next: number) => {
    const index = (next + total) % total;
    setActive(index);
    tabRefs.current[index]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        select(active + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        select(active - 1);
        break;
      case "Home":
        event.preventDefault();
        select(0);
        break;
      case "End":
        event.preventDefault();
        select(total - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div
      className="s05-instrument"
      style={
        {
          // --s05-count drives the rail's calibration pitch and the position
          // grid; --s05-index moves the pin by whole position widths (a pure
          // transform, so the travel is compositor-friendly and exact for any
          // goal count); --s05-pin is the same coordinate as a percentage, used
          // by the rail's local light under the pin.
          "--s05-count": total,
          "--s05-index": active,
          "--s05-pin": railPosition(active, total),
        } as CSSProperties
      }
    >
      {/* ------------------------------------------------ instrument header */}
      <div className="s05-instrument-head">
        <p className="s05-label">{loadoutLabel}</p>
        <p className="s05-instrument-ref" aria-hidden="true">
          Position {pad(active + 1)} / {pad(total)}
        </p>
      </div>

      {/* --------------------------------------------- the calibrated rail */}
      <div className="s05-rail-zone">
        {/* Calibration band, rail and travelling pin: decorative geometry that
            visualises the state the buttons below already announce. */}
        <span className="s05-rail-ticks" aria-hidden="true" />
        <span className="s05-rail" aria-hidden="true" />
        <span className="s05-rail-pin" aria-hidden="true" />

        <div
          role="tablist"
          aria-label={selectorLabel}
          aria-orientation="horizontal"
          className="s05-selector"
          onKeyDown={onKeyDown}
        >
          {goals.map((item, i) => {
            const isActive = i === active;
            return (
              <button
                key={item.id}
                ref={(node) => {
                  tabRefs.current[i] = node;
                }}
                type="button"
                role="tab"
                id={`s05-goal-${item.id}`}
                aria-selected={isActive}
                aria-controls="s05-readout"
                tabIndex={isActive ? 0 : -1}
                data-active={isActive || undefined}
                className="s05-goal factory-focus"
                onClick={() => setActive(i)}
              >
                <span className="s05-goal-stem" aria-hidden="true" />
                <span className="s05-goal-index" aria-hidden="true">
                  {pad(i + 1)}
                </span>
                <span className="s05-goal-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------- the readout */}
      {/*
        Deliberately NOT keyed as a whole. The teaching areas below are keyed
        per goal so they cross-fade, while the emphasis stack persists across
        goal changes — that is the only way the plate markers can visibly LOAD
        and UNLOAD (a CSS transition needs both states to exist on the same
        element). Remounting the whole panel would replace the mechanism with a
        fade and lose the one motion that carries the section's meaning.
      */}
      <div
        id="s05-readout"
        role="tabpanel"
        aria-labelledby={`s05-goal-${goal.id}`}
        className="s05-readout"
      >
        {/* ---------------------------------- selected goal + emphasis stack */}
        <div className="s05-load">
          <div key={goal.id} className="s05-load-goal s05-swap">
            <p className="s05-label">Selected goal</p>
            <p className="s05-load-name">{goal.label}</p>
            <p className="s05-load-premise">{goal.premise}</p>
          </div>

          <div className="s05-emphasis">
            <div className="s05-emphasis-head">
              <p className="s05-label">{emphasisLabel}</p>
              <p className="s05-emphasis-key">
                Relative emphasis, not a measurement
              </p>
            </div>

            <ul role="list" className="s05-emphasis-list">
              {goal.emphasis.map((row, i) => (
                <li
                  key={row.id}
                  className="s05-emphasis-row factory-stagger-child"
                  data-level={row.level}
                  style={
                    {
                      "--s05-row": i,
                      transitionDelay: `${140 + i * 60}ms`,
                    } as CSSProperties
                  }
                >
                  <span className="s05-emphasis-index" aria-hidden="true">
                    {pad(i + 1)}
                  </span>
                  <span className="s05-emphasis-label">
                    <span className="s05-emphasis-long">{row.label}</span>
                    <span className="s05-emphasis-short">{row.shortLabel}</span>
                  </span>
                  {/* Plate markers are reinforcement of the word beside them,
                      never the sole carrier of the level. Their load/unload
                      cascade is timed in CSS from --s05-row. */}
                  <span className="s05-plates" aria-hidden="true">
                    {Array.from({ length: EMPHASIS_SLOTS }, (_, slot) => (
                      <span
                        key={`${row.id}-plate-${slot + 1}`}
                        className="s05-plate"
                        data-loaded={slot < row.level || undefined}
                      />
                    ))}
                  </span>
                  <span className="s05-emphasis-word">{row.word}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ------------------------------------- editorial teaching columns */}
        <div key={goal.id} className="s05-teach s05-swap">
          <section className="s05-teach-col">
            <h3 className="s05-teach-head">{prioritiesLabel}</h3>
            <ol role="list" className="s05-teach-list">
              {goal.priorities.map((item, i) => (
                <li key={item.title} className="s05-teach-item">
                  <span className="s05-teach-index" aria-hidden="true">
                    {pad(i + 1)}
                  </span>
                  <p className="s05-teach-title">{item.title}</p>
                  <p className="s05-teach-detail">{item.detail}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="s05-teach-col">
            <h3 className="s05-teach-head">{mistakesLabel}</h3>
            <ol role="list" className="s05-teach-list">
              {goal.mistakes.map((item, i) => (
                <li key={item.mistake} className="s05-teach-item">
                  <span className="s05-teach-index" aria-hidden="true">
                    {pad(i + 1)}
                  </span>
                  <p className="s05-teach-title" data-strike="true">
                    {item.mistake}
                  </p>
                  <p className="s05-teach-fix">
                    <span className="s05-teach-fix-arrow" aria-hidden="true">
                      &rarr;
                    </span>
                    {item.instead}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="s05-teach-col" data-compact="true">
            <h3 className="s05-teach-head">{trackLabel}</h3>
            <ol role="list" className="s05-teach-list">
              {goal.track.map((item, i) => (
                <li key={item} className="s05-teach-item">
                  <span className="s05-teach-index" aria-hidden="true">
                    {pad(i + 1)}
                  </span>
                  <p className="s05-teach-signal">{item}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* ------------------------------------------------- coach's note */}
        <div className="s05-note">
          <div key={goal.id} className="s05-note-body s05-swap">
            <p className="s05-label" data-accent="true">
              {coachNoteLabel}
            </p>
            <p className="s05-note-text">{goal.coachNote}</p>
            {goal.gymNote && (
              <p className="s05-note-gym">
                <span className="s05-note-gym-label">{gymNoteLabel}</span>
                {goal.gymNote}
              </p>
            )}
          </div>

          {artifact}
        </div>

        {/* --------------------------------------------- goal → path handoff */}
        <div className="s05-handoff">
          <p className="s05-label">{handoffLabel}</p>

          <div key={goal.id} className="s05-handoff-body s05-swap">
            <p className="s05-handoff-path">
              <span className="s05-handoff-goal">{goal.label}</span>
              <span className="s05-handoff-arrow" aria-hidden="true">
                &rarr;
              </span>
              <span className="s05-handoff-line">{goal.path}</span>
            </p>

            <div className="s05-handoff-actions">
              <Button href={goal.ctaHref} className="s05-cta">
                {primaryCtaLabel} &rarr;
              </Button>
              {/* Only rendered when the goal maps to a genuinely verified
                  program — resolved on the server, see trainingLoadout.ts. */}
              {goal.programName && (
                <Button href="#programs" variant="secondary" className="s05-cta-alt">
                  {secondaryCtaLabel}: {goal.programName} &rarr;
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
