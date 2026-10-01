"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { TrainingWeekModule, TrainingWeekPattern } from "@/lib/types";
import {
  describeDay,
  normalizePattern,
  pad,
  readWeekPattern,
  sessionNumerals,
} from "@/components/sections/intervalLog";

/**
 * Section 07 — THE TRAINING WEEK STRIP.
 *
 * The chapter's opening argument, made visually before it is made in words: a
 * week is seven marks, and only two, three or four of them are sessions. What
 * the section then teaches is about the unmarked days.
 *
 * WHAT IT IS NOT. Not a planner, not a recommendation engine, not a
 * personalised schedule and not scored. The patterns are named samples from the
 * data file, the readout DESCRIBES the selected pattern
 * (components/sections/intervalLog.ts), and there is no field anywhere in the
 * contract that could hold a "best" or "recommended" week. The scope line under
 * it says so in plain language.
 *
 * WORKS WITHOUT INTERACTION. The first pattern is selected on the server, so
 * the strip, its readout and the gap description are all fully rendered before
 * any JavaScript runs. Selecting another pattern changes the illustration; it
 * does not unlock the lesson.
 *
 * STATE IS NEVER COLOUR-ONLY. A training day is a filled block that also
 * carries a mono session index; a rest day is a rule. Days inside the longest
 * gap carry a bracket tick. Every cell additionally states its own meaning in
 * visually-hidden text ("Monday — training day"), so the strip reads correctly
 * with no colour perception at all.
 */
export function TrainingWeek({ week }: { week: TrainingWeekModule }) {
  const patterns = week.patterns.filter((pattern) =>
    normalizePattern(pattern).some(Boolean)
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  if (patterns.length === 0) return null;

  const pattern: TrainingWeekPattern = patterns[activeIndex] ?? patterns[0];
  const days = normalizePattern(pattern);
  const readout = readWeekPattern(days, week.gaps);

  const select = (next: number, moveFocus: boolean) => {
    const index = (next + patterns.length) % patterns.length;
    setActiveIndex(index);
    if (moveFocus) optionRefs.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        select(activeIndex + 1, true);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        select(activeIndex - 1, true);
        break;
      case "Home":
        event.preventDefault();
        select(0, true);
        break;
      case "End":
        event.preventDefault();
        select(patterns.length - 1, true);
        break;
      default:
        break;
    }
  };

  const gapDays = new Set(readout?.longestGapDays ?? []);
  const numerals = sessionNumerals(days);

  return (
    <div className="s07-week">
      <div className="s07-week-head">
        <div>
          <p className="s07-label">{week.label}</p>
          <p className="s07-week-intro">{week.intro}</p>
        </div>

        <div
          role="radiogroup"
          aria-label={week.selectorLabel}
          className="s07-week-options"
          onKeyDown={onKeyDown}
        >
          {patterns.map((item, i) => {
            const checked = i === activeIndex;
            return (
              <button
                key={item.id}
                ref={(node) => {
                  optionRefs.current[i] = node;
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={checked ? 0 : -1}
                data-active={checked || undefined}
                className="s07-week-option factory-focus"
                onClick={() => select(i, false)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* The strip itself. One row of seven cells at every breakpoint — a week
          is seven days wide on a phone too, which is exactly why the cells are
          marks rather than cards. */}
      <ul role="list" className="s07-week-strip">
        {days.map((isSession, i) => {
          const sessionIndex = numerals[i];
          return (
            <li
              key={week.dayNames[i] ?? i}
              className="s07-week-day"
              data-session={isSession || undefined}
              data-gap={!isSession && gapDays.has(i) ? "true" : undefined}
              style={{ "--s07-day": i } as CSSProperties}
            >
              <span className="s07-week-dayname" aria-hidden="true">
                {week.dayLabels[i]}
              </span>
              <span className="s07-week-mark" aria-hidden="true">
                {sessionIndex}
              </span>
              <span className="sr-only">{describeDay(i, isSession, week)}</span>
            </li>
          );
        })}
      </ul>

      {readout && (
        <div className="s07-week-readout">
          <div className="s07-week-figures">
            <p className="s07-week-figure">
              <span className="s07-week-figure-label">{week.sessionsLabel}</span>
              <span className="s07-week-figure-value">{pad(readout.sessions)}</span>
            </p>
            <p className="s07-week-figure">
              <span className="s07-week-figure-label">{week.restLabel}</span>
              <span className="s07-week-figure-value">{pad(readout.restDays)}</span>
            </p>
            <p className="s07-week-figure" data-accent="true">
              <span className="s07-week-figure-label">{week.gapLabel}</span>
              <span className="s07-week-figure-value">
                {pad(readout.longestGap)}
                <span className="s07-week-figure-unit">{readout.gapLabel}</span>
              </span>
            </p>
          </div>

          <p key={readout.gapKey} className="s07-week-gap-detail s07-swap">
            {readout.gapDetail}
          </p>
        </div>
      )}

      <p className="s07-week-scope">{week.scope}</p>
    </div>
  );
}
