"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { Button, ActionButton } from "@/components/ui/Button";
import {
  DAYS,
  EXPERIENCE_OPTIONS,
  EXPERIENCE_SHORT,
  FEELING_OPTIONS,
  OBSTACLE_OPTIONS,
  QUESTION_PROMPTS,
  STEP_IDS,
  STEP_LABELS,
  SUPPORT_OPTIONS,
  TIME_OPTIONS,
  VARIABLE_COUNT_OPTIONS,
  buildFirst30Message,
  buildFirst30Plan,
  isDraftComplete,
  isStepComplete,
  mapHandoffDays,
  mapHandoffExperience,
  mapHandoffTime,
  resolveCapabilities,
  sanitizeDraft,
  sortDays,
  type First30Day,
  type First30Draft,
  type First30Experience,
  type First30Option,
  type First30Plan,
  type First30StepId,
  type First30Time,
  type First30Week,
  type ResolvedCapabilities,
} from "@/components/sections/first30DaysLogic";
import {
  clearFirst30State,
  readFirst30State,
  readToolHandoff,
  writeFirst30State,
  type HandoffSource,
} from "@/lib/tool-session";
import { emitToolEvent } from "@/lib/tool-events";
import { appendWhatsAppMessage, buildWhatsAppHref, isUsableWhatsAppNumber } from "@/lib/whatsapp";
import type {
  BusinessHours,
  First30DaysConfiguration,
  First30DaysImage,
  WhatsAppConfig,
} from "@/lib/types";

/**
 * /first-30-days — the interactive "Plan Your First 30 Days" planner.
 *
 * THREE PHASES, ONE SECTION, ONE PERSISTENT <h1>.
 *
 *   ENTRY  — compact split: headline, two lines of copy, Build My Plan and
 *            small format markers on the left; the hero image on the right.
 *   FLOW   — the H1 shrinks to an eyebrow line; left, the question card
 *            (labelled node rail, Back / Next, no auto-advance); right, a
 *            live "Your plan so far" preview with a step-matched image.
 *   RESULT — a FIRST MONTH DASHBOARD. A board header (H2, input chips and
 *            the primary action) sits above a card grid: Weekly Rhythm,
 *            First Visit, Before Day 1, the 30-Day Roadmap (horizontal week
 *            tabs), When It Gets Hard and Support. ≥768px renders the grid;
 *            <768px renders a pinned rhythm summary, a tablist showing one
 *            panel at a time and a sticky action bar.
 *
 * The primary action "Plan My First Visit" opens a dialog (a bottom sheet on
 * mobile) holding the editable WhatsApp message. Nothing is ever sent
 * automatically — the visitor opens WhatsApp and presses Send there.
 *
 * Every derived string comes from components/sections/first30DaysLogic.ts;
 * this file holds interaction state only and imports no gym data. The
 * optional handoff from /start and /journey is read from sessionStorage
 * (lib/tool-session.ts) and is never required.
 *
 * Motion is CSS-only (factory-stagger-in, short transitions); the site-wide
 * prefers-reduced-motion block neutralises it.
 */

type Phase = "entry" | "flow" | "result";

interface Carried {
  source: HandoffSource;
  experience?: First30Experience;
  time?: First30Time;
}

const MOBILE_QUERY = "(max-width: 767.98px)";

const MOBILE_TABS = [
  { id: "visit", label: "Visit" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "hard", label: "If it's hard" },
  { id: "ask", label: "Ask" },
] as const;
type MobileTabId = (typeof MOBILE_TABS)[number]["id"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function labelOf<V extends string>(options: First30Option<V>[], value: V | undefined): string | undefined {
  return options.find((o) => o.value === value)?.label;
}

function subscribeMedia(callback: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribeMedia,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false
  );
}

/** Arrow / Home / End roving focus for a tablist (same contract as /journey's phase tabs). */
function onTabKey<T extends string>(
  event: KeyboardEvent<HTMLDivElement>,
  ids: readonly T[],
  current: T,
  select: (id: T) => void,
  refs: RefObject<Array<HTMLButtonElement | null>>
) {
  {
    const index = ids.indexOf(current);
    let next: number | null = null;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = (index + 1) % ids.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = (index - 1 + ids.length) % ids.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = ids.length - 1;
        break;
    }
    if (next === null) return;
    event.preventDefault();
    select(ids[next]);
    refs.current?.[next]?.focus();
  }
}

/** Prefill a fresh draft from the optional handoff. */
function draftFromCarried(carried: Carried | null, daysHint?: string): First30Draft {
  const draft: First30Draft = {};
  if (carried?.experience) draft.experience = carried.experience;
  if (carried?.time) draft.time = carried.time;
  const count = mapHandoffDays(daysHint);
  if (count) draft.variableCount = count;
  return draft;
}

function readCarried(): { carried: Carried | null; daysHint?: string } {
  const handoff = readToolHandoff();
  if (!handoff) return { carried: null };
  const experience = mapHandoffExperience(handoff.experience);
  const time = mapHandoffTime(handoff.timePreference);
  if (!experience && !time) return { carried: null, daysHint: handoff.daysPerWeek };
  return { carried: { source: handoff.source, experience, time }, daysHint: handoff.daysPerWeek };
}

// ======================================================================

export function First30Days({
  whatsapp,
  gymName,
  hours,
  callHref,
  membershipHref,
  startHref,
  config,
  verifiedServiceIds,
  sourceNames,
}: {
  whatsapp: WhatsAppConfig;
  gymName: string;
  hours: BusinessHours[];
  callHref?: string;
  membershipHref: string;
  startHref: string;
  config: First30DaysConfiguration;
  verifiedServiceIds: string[];
  sourceNames: Record<HandoffSource, string>;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<Phase>("entry");
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<First30Draft>({});
  const [carried, setCarried] = useState<Carried | null>(null);
  const [showExperience, setShowExperience] = useState(true);
  const [includeObstacle, setIncludeObstacle] = useState(false);
  const [messageDraft, setMessageDraft] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const questionRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const entryRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<"question" | "result" | "entry" | null>(null);

  const caps = useMemo(
    () => resolveCapabilities(config.capabilities, verifiedServiceIds),
    [config.capabilities, verifiedServiceIds]
  );

  const steps = useMemo<First30StepId[]>(
    () => (showExperience ? STEP_IDS : STEP_IDS.filter((s) => s !== "experience")),
    [showExperience]
  );
  const total = steps.length;
  const stepId = steps[Math.min(step, total - 1)];

  // ---- restore (client only, after hydration; the server always renders ENTRY) ----
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const { carried: c, daysHint } = readCarried();
      const stored = readFirst30State();
      setCarried(c);
      if (stored) {
        const restored = sanitizeDraft(stored.answers);
        const skip = Boolean(c?.experience && restored.experience === c.experience);
        const restoredSteps = skip ? STEP_IDS.filter((s) => s !== "experience") : STEP_IDS;
        setDraft(restored);
        setShowExperience(!skip);
        setIncludeObstacle(stored.includeObstacle);
        if (stored.phase === "result" && isDraftComplete(restored)) {
          setPhase("result");
          emitToolEvent("first30_plan_viewed", { restored: true });
        } else if (stored.phase !== "entry") {
          setPhase("flow");
          setStep(Math.min(stored.step, restoredSteps.length - 1));
        }
      } else {
        setDraft(draftFromCarried(c, daysHint));
        setShowExperience(!c?.experience);
      }
      setHydrated(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // ---- persist ----
  useEffect(() => {
    if (!hydrated) return;
    writeFirst30State({ phase, step, answers: { ...draft }, includeObstacle });
  }, [hydrated, phase, step, draft, includeObstacle]);

  // ---- focus after the state change has rendered ----
  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    if (target === "result") resultRef.current?.focus();
    else if (target === "question") questionRef.current?.focus();
    else entryRef.current?.querySelector("button")?.focus();
  }, [phase, step, showExperience]);

  const patch = useCallback((p: Partial<First30Draft>) => setDraft((d) => ({ ...d, ...p })), []);

  const startPlan = () => {
    emitToolEvent("first30_started", { carried: Boolean(carried?.experience) });
    setPhase("flow");
    setStep(0);
    setAnnouncement(`Question 1 of ${total}: ${QUESTION_PROMPTS[steps[0]].prompt}`);
    pendingFocus.current = "question";
  };

  const next = () => {
    if (!isStepComplete(stepId, draft)) return;
    emitToolEvent("first30_question_completed", { step: stepId });
    if (step >= total - 1) {
      if (!isDraftComplete(draft)) return;
      emitToolEvent("first30_completed");
      emitToolEvent("first30_plan_viewed", { restored: false });
      setPhase("result");
      setAnnouncement("Your first-month plan is ready.");
      pendingFocus.current = "result";
      return;
    }
    const nextId = steps[step + 1];
    setAnnouncement(`Question ${step + 2} of ${total}: ${QUESTION_PROMPTS[nextId].prompt}`);
    pendingFocus.current = "question";
    setStep(step + 1);
  };

  const back = () => {
    if (step === 0) {
      setPhase("entry");
      setAnnouncement("Back to the start.");
      pendingFocus.current = "entry";
      return;
    }
    const prevId = steps[step - 1];
    setAnnouncement(`Question ${step} of ${total}: ${QUESTION_PROMPTS[prevId].prompt}`);
    pendingFocus.current = "question";
    setStep(step - 1);
  };

  /** Edit the carried experience: show Question 1 again. */
  const editCarried = () => {
    setShowExperience(true);
    setPhase("flow");
    setStep(0);
    setAnnouncement(`Question 1 of ${STEP_IDS.length}: ${QUESTION_PROMPTS.experience.prompt}`);
    pendingFocus.current = "question";
  };

  const editAnswers = () => {
    if (messageDraft !== null) {
      setMessageDraft(null);
      setNotice("Message updated to match your answers.");
    }
    setPhase("flow");
    setStep(0);
    setAnnouncement(`Editing answers. Question 1 of ${total}: ${QUESTION_PROMPTS[steps[0]].prompt}`);
    pendingFocus.current = "question";
  };

  /** Start over resets this tool only — the shared handoff is preserved. */
  const restart = () => {
    emitToolEvent("first30_restarted");
    clearFirst30State();
    const { carried: c, daysHint } = readCarried();
    setCarried(c);
    setDraft(draftFromCarried(c, daysHint));
    setShowExperience(!c?.experience);
    setIncludeObstacle(false);
    setMessageDraft(null);
    setNotice(null);
    setStep(0);
    setPhase("entry");
    setAnnouncement("Starting again.");
    pendingFocus.current = "entry";
  };

  const plan = useMemo(
    () =>
      phase === "result" && isDraftComplete(draft)
        ? buildFirst30Plan(draft, {
            gymName,
            capabilities: caps,
            facts: config.firstVisitFacts,
            hours,
          })
        : null,
    [phase, draft, gymName, caps, config.firstVisitFacts, hours]
  );

  const carriedExperienceChip =
    carried?.experience && !showExperience ? (
      <CarriedChip
        source={sourceNames[carried.source]}
        value={EXPERIENCE_SHORT[draft.experience ?? carried.experience]}
        onEdit={editCarried}
      />
    ) : null;

  return (
    <section
      aria-labelledby="f30-heading"
      className="f30"
      data-phase={phase}
      data-hydrated={hydrated ? "true" : undefined}
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      <div className="f30-shell">
        {/* ---------- INTRO: the single persistent H1 ---------- */}
        <div className="f30-intro">
          <p className="f30-eyebrow">
            <span className="f30-tick" aria-hidden="true" />
            Your first month
          </p>
          <h1 id="f30-heading" className="f30-display">
            Plan your <span className="text-(--accent)">first 30 days</span>
          </h1>

          {phase === "entry" && (
            <div className="f30-entry-body">
              <p className="f30-support">
                A few quick questions, then a realistic first month: what to sort before Day 1, what a
                first visit could look like, and how to build a rhythm that fits your actual week.
              </p>
              <p className="f30-clarify">This isn&apos;t a workout programme. It&apos;s a plan for showing up.</p>

              <ul className="f30-markers" role="list">
                <li>
                  <span className="f30-marker-num">{pad(showExperience ? 5 : 4)}</span>
                  {showExperience ? "Quick questions" : "Quick questions left"}
                </li>
                <li>
                  <span className="f30-marker-num">~1</span>Minute
                </li>
                <li>
                  <span className="f30-marker-num">30</span>Day plan
                </li>
              </ul>

              {carriedExperienceChip && <div className="f30-entry-carried">{carriedExperienceChip}</div>}

              <div ref={entryRef} className="f30-entry-actions">
                <ActionButton variant="primary" onClick={startPlan} className="f30-entry-cta">
                  Build My Plan <span aria-hidden="true">→</span>
                </ActionButton>
                <span className="f30-reassure">No account. No sign-up.</span>
              </div>

              <p className="f30-alt">
                Not sure what you&apos;re training for?{" "}
                <Link
                  href={startHref}
                  className="factory-focus text-(--text-primary) underline underline-offset-4 hover:text-(--brand-secondary)"
                >
                  Find your starting point →
                </Link>
              </p>
            </div>
          )}
        </div>

        {phase === "entry" && config.images.hero && (
          <div className="f30-entry-media">
            <F30Image image={config.images.hero} preload sizes="(min-width: 1024px) 46vw, 100vw" />
          </div>
        )}

        {/* ---------- FLOW ---------- */}
        {phase === "flow" && (
          <div className="f30-flow">
            <div className="f30-card f30-question-card">
              <div className="f30-qhead">
                <span className="f30-qid">First 30 Days</span>
                <span className="f30-qstep" aria-hidden="true">
                  {pad(step + 1)} / {pad(total)}
                </span>
              </div>

              <div
                className="f30-rail"
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={total}
                aria-valuenow={step + 1}
                aria-label={`Question ${step + 1} of ${total}: ${STEP_LABELS[stepId]}`}
                style={{ "--f30-steps": total } as CSSProperties}
              >
                {steps.map((id, i) => (
                  <span
                    key={id}
                    className="f30-rail-node"
                    data-state={i < step ? "done" : i === step ? "current" : "upcoming"}
                  >
                    <span className="f30-rail-dot" aria-hidden="true" />
                    <span className="f30-rail-label" aria-hidden="true">
                      {STEP_LABELS[id]}
                    </span>
                  </span>
                ))}
              </div>

              <PreviewLine draft={draft} />

              {stepId !== "experience" && carriedExperienceChip && (
                <div className="f30-qcarried">{carriedExperienceChip}</div>
              )}

              <div key={stepId} className="f30-qbody">
                <h2
                  ref={questionRef}
                  tabIndex={-1}
                  className="f30-question factory-stagger-in"
                  style={{ animationDelay: "30ms" }}
                >
                  {QUESTION_PROMPTS[stepId].prompt}
                </h2>
                {QUESTION_PROMPTS[stepId].hint && (
                  <p className="f30-qhint">{QUESTION_PROMPTS[stepId].hint}</p>
                )}

                {stepId === "experience" && (
                  <OptionTiles
                    name="experience"
                    options={EXPERIENCE_OPTIONS}
                    value={draft.experience}
                    onSelect={(v) => patch({ experience: v })}
                    columns={1}
                  />
                )}
                {stepId === "schedule" && (
                  <ScheduleControl
                    draft={draft}
                    patch={patch}
                    carriedTime={carried?.time && draft.time === carried.time ? sourceNames[carried.source] : undefined}
                  />
                )}
                {stepId === "feeling" && (
                  <OptionTiles
                    name="feeling"
                    options={FEELING_OPTIONS}
                    value={draft.feeling}
                    onSelect={(v) => patch({ feeling: v })}
                    columns={3}
                  />
                )}
                {stepId === "obstacle" && (
                  <OptionTiles
                    name="obstacle"
                    options={OBSTACLE_OPTIONS}
                    value={draft.obstacle}
                    onSelect={(v) => patch({ obstacle: v })}
                    columns={2}
                  />
                )}
                {stepId === "support" && (
                  <OptionTiles
                    name="support"
                    options={SUPPORT_OPTIONS}
                    value={draft.support}
                    onSelect={(v) => patch({ support: v })}
                    columns={2}
                  />
                )}
              </div>

              <div className="f30-qnav">
                <ActionButton variant="ghost" onClick={back} className="f30-qback">
                  <span aria-hidden="true">←</span> Back
                </ActionButton>
                <ActionButton
                  variant="primary"
                  onClick={next}
                  disabled={!isStepComplete(stepId, draft)}
                  className="f30-qnext"
                >
                  {step >= total - 1 ? "See My Plan" : "Next"}
                  <span aria-hidden="true">→</span>
                </ActionButton>
              </div>
            </div>

            <PreviewPanel draft={draft} stepId={stepId} images={config.images} />
          </div>
        )}

        {/* ---------- RESULT ---------- */}
        {phase === "result" && plan && (
          <Result
            plan={plan}
            caps={caps}
            gymName={gymName}
            whatsapp={whatsapp}
            callHref={callHref}
            membershipHref={membershipHref}
            images={config.images}
            resultRef={resultRef}
            includeObstacle={includeObstacle}
            onIncludeObstacle={(v) => {
              setIncludeObstacle(v);
              setMessageDraft(null);
            }}
            messageDraft={messageDraft}
            onMessageDraft={setMessageDraft}
            notice={notice}
            onNoticeSeen={() => setNotice(null)}
            onEdit={editAnswers}
            onRestart={restart}
          />
        )}
      </div>
    </section>
  );
}

// ======================================================================
// Shared bits

function F30Image({
  image,
  sizes,
  preload = false,
  className = "",
}: {
  image: First30DaysImage;
  sizes: string;
  preload?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <span className={`f30-img ${className}`}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        preload={preload}
        sizes={sizes}
        onError={() => setFailed(true)}
        className="f30-img-el"
        style={
          {
            "--f30-pos": image.objectPosition ?? "50% 50%",
            "--f30-pos-mobile": image.objectPositionMobile ?? image.objectPosition ?? "50% 50%",
          } as CSSProperties
        }
      />
    </span>
  );
}

function CarriedChip({ source, value, onEdit }: { source: string; value: string; onEdit: () => void }) {
  return (
    <p className="f30-carried">
      <span className="f30-carried-label">Experience</span>
      <span className="f30-carried-value">{value}</span>
      <span className="f30-carried-src">{source ? `From ${source}` : "Carried over"}</span>
      <button type="button" onClick={onEdit} className="factory-focus f30-carried-edit">
        Edit<span className="sr-only"> experience</span>
      </button>
    </p>
  );
}

function OptionTiles<V extends string>({
  name,
  options,
  value,
  onSelect,
  columns,
}: {
  name: string;
  options: First30Option<V>[];
  value?: V;
  onSelect: (value: V) => void;
  columns: 1 | 2 | 3;
}) {
  return (
    <ul className="f30-tiles" data-cols={columns} role="list" aria-label={`${name} options`}>
      {options.map((option, i) => {
        const selected = value === option.value;
        return (
          <li key={option.value} className="factory-stagger-in" style={{ animationDelay: `${70 + i * 35}ms` }}>
            <button
              type="button"
              aria-pressed={selected}
              data-selected={selected}
              onClick={() => onSelect(option.value)}
              className="factory-focus f30-tile"
            >
              <span className="f30-tile-index" aria-hidden="true">
                {pad(i + 1)}
              </span>
              <span className="f30-tile-label">{option.label}</span>
              <span className="f30-tile-mark" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ScheduleControl({
  draft,
  patch,
  carriedTime,
}: {
  draft: First30Draft;
  patch: (p: Partial<First30Draft>) => void;
  carriedTime?: string;
}) {
  const variable = draft.scheduleMode === "variable";
  const selected = sortDays(draft.days);

  const toggleDay = (id: First30Day) => {
    const has = selected.includes(id);
    patch({ scheduleMode: "fixed", days: has ? selected.filter((d) => d !== id) : sortDays([...selected, id]) });
  };

  const weekSwitch = (
    <button
      type="button"
      aria-pressed={variable}
      onClick={() => patch({ scheduleMode: variable ? "fixed" : "variable" })}
      className="factory-focus f30-weekswitch"
    >
      <span className="f30-weekswitch-box" aria-hidden="true" data-on={variable} />
      My week changes
    </button>
  );

  return (
    <div className="f30-schedule">
      {!variable ? (
        <div className="f30-sched-block">
          <div className="f30-sched-row">
            <p id="f30-days-label" className="f30-sched-label">
              Days <span className="f30-sched-count">{selected.length > 0 ? `${selected.length} selected` : "Pick at least one"}</span>
            </p>
            {weekSwitch}
          </div>
          <div className="f30-daychips" role="group" aria-labelledby="f30-days-label">
            {DAYS.map((d) => {
              const on = selected.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  aria-pressed={on}
                  data-selected={on}
                  onClick={() => toggleDay(d.id)}
                  className="factory-focus f30-daychip"
                >
                  <span aria-hidden="true">{d.short}</span>
                  <span className="sr-only">{d.full}</span>
                  <span className="f30-daychip-mark" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="f30-sched-block">
          <div className="f30-sched-row">
            <p id="f30-count-label" className="f30-sched-label">
              Days per week
            </p>
            {weekSwitch}
          </div>
          <div className="f30-segments" role="radiogroup" aria-labelledby="f30-count-label">
            {VARIABLE_COUNT_OPTIONS.map((o) => (
              <label key={o.value} className="f30-segment" data-checked={draft.variableCount === o.value}>
                <input
                  type="radio"
                  name="f30-count"
                  value={o.value}
                  checked={draft.variableCount === o.value}
                  onChange={() => patch({ variableCount: o.value })}
                  className="sr-only"
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>
      )}

      <fieldset className="f30-sched-block f30-fieldset">
        <legend className="f30-sched-label">Usually</legend>
        <div className="f30-segments" data-count={TIME_OPTIONS.length}>
          {TIME_OPTIONS.map((o) => (
            <label key={o.value} className="f30-segment" data-checked={draft.time === o.value}>
              <input
                type="radio"
                name="f30-time"
                value={o.value}
                checked={draft.time === o.value}
                onChange={() => patch({ time: o.value })}
                className="sr-only"
              />
              {o.label}
            </label>
          ))}
        </div>
        {carriedTime && <p className="f30-qhint">Pre-selected from {carriedTime}. Change it if needed.</p>}
      </fieldset>
    </div>
  );
}

function draftWeekText(draft: First30Draft): string | undefined {
  if (draft.scheduleMode === "variable") {
    const label = labelOf(VARIABLE_COUNT_OPTIONS, draft.variableCount);
    return label ? `${label} · week changes` : undefined;
  }
  const days = sortDays(draft.days);
  return days.length ? days.map((d) => DAYS.find((x) => x.id === d)!.short).join(" · ") : undefined;
}

/** <1024px: one compact line instead of the preview panel. */
function PreviewLine({ draft }: { draft: First30Draft }) {
  const parts = [draftWeekText(draft), labelOf(TIME_OPTIONS, draft.time)].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <p className="f30-preview-line">
      <span className="f30-preview-line-label">Your plan so far</span>
      {parts.join(" · ")}
    </p>
  );
}

function PreviewPanel({
  draft,
  stepId,
  images,
}: {
  draft: First30Draft;
  stepId: First30StepId;
  images: First30DaysConfiguration["images"];
}) {
  const image =
    stepId === "experience" ? images.hero : stepId === "schedule" ? images.weeklyRhythm : images.firstVisit;
  const selected = sortDays(draft.days);
  const variable = draft.scheduleMode === "variable";
  const rows: { id: First30StepId; label: string; value?: string }[] = [
    { id: "experience", label: "Experience", value: draft.experience ? EXPERIENCE_SHORT[draft.experience] : undefined },
    { id: "schedule", label: "Time", value: labelOf(TIME_OPTIONS, draft.time) },
    { id: "feeling", label: "First visit", value: labelOf(FEELING_OPTIONS, draft.feeling) },
    { id: "obstacle", label: "If it gets hard", value: labelOf(OBSTACLE_OPTIONS, draft.obstacle) },
    { id: "support", label: "Support", value: labelOf(SUPPORT_OPTIONS, draft.support) },
  ];

  return (
    <aside className="f30-preview" aria-label="Your plan so far">
      {image && (
        <div key={image.src} className="f30-preview-media factory-stagger-in">
          <F30Image image={image} sizes="(min-width: 1024px) 36vw, 0px" />
        </div>
      )}
      <div className="f30-preview-body">
        <p className="f30-label">Your plan so far</p>
        <div className="f30-week-strip f30-week-strip-sm" aria-hidden="true">
          {DAYS.map((d) => (
            <span key={d.id} className="f30-strip-day" data-on={!variable && selected.includes(d.id)}>
              {d.short.charAt(0)}
            </span>
          ))}
        </div>
        <p className="f30-preview-week">{draftWeekText(draft) ?? "Pick your days"}</p>
        <dl className="f30-preview-rows">
          {rows.map((r) => (
            <div key={r.id} data-current={r.id === stepId} data-filled={Boolean(r.value)}>
              <dt>{r.label}</dt>
              <dd>{r.value ?? "—"}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  );
}

// ======================================================================
// Result

function Result({
  plan,
  caps,
  gymName,
  whatsapp,
  callHref,
  membershipHref,
  images,
  resultRef,
  includeObstacle,
  onIncludeObstacle,
  messageDraft,
  onMessageDraft,
  notice,
  onNoticeSeen,
  onEdit,
  onRestart,
}: {
  plan: First30Plan;
  caps: ResolvedCapabilities;
  gymName: string;
  whatsapp: WhatsAppConfig;
  callHref?: string;
  membershipHref: string;
  images: First30DaysConfiguration["images"];
  resultRef: RefObject<HTMLHeadingElement | null>;
  includeObstacle: boolean;
  onIncludeObstacle: (v: boolean) => void;
  messageDraft: string | null;
  onMessageDraft: (v: string | null) => void;
  notice: string | null;
  onNoticeSeen: () => void;
  onEdit: () => void;
  onRestart: () => void;
}) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<MobileTabId>("visit");
  const [week, setWeek] = useState<First30Week["id"]>("w1");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const sheetTrigger = useRef<HTMLElement | null>(null);

  const generated = buildFirst30Message(gymName, plan, caps, { includeObstacle });
  const message = messageDraft ?? generated;
  const waUsable = isUsableWhatsAppNumber(whatsapp?.number);
  const waHref = waUsable ? appendWhatsAppMessage(buildWhatsAppHref(whatsapp), message) : undefined;

  const openSheet = () => {
    sheetTrigger.current = document.activeElement as HTMLElement | null;
    setSheetOpen(true);
    onNoticeSeen();
  };

  const closeSheet = () => {
    setSheetOpen(false);
    // Return focus to the control that opened the sheet. Some browsers (Safari)
    // don't focus a button on click, so fall back to the visible primary CTA.
    const trigger = sheetTrigger.current;
    const target =
      trigger && trigger !== document.body && trigger.isConnected
        ? trigger
        : [...document.querySelectorAll<HTMLElement>(".f30-cta")].find((el) => el.offsetParent !== null);
    requestAnimationFrame(() => target?.focus());
  };

  const copy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(message);
      ok = true;
    } catch {
      const area = document.getElementById("f30-message") as HTMLTextAreaElement | null;
      if (area) {
        area.select();
        try {
          ok = document.execCommand("copy");
        } catch {
          ok = false;
        }
      }
    }
    setCopyStatus(ok ? "Message copied." : "Couldn't copy automatically. Select the text and copy it.");
    if (ok) emitToolEvent("first30_message_copied");
  };

  const firstVisit = <FirstVisitCard plan={plan} image={images.firstVisit} />;
  const rhythm = <RhythmCard plan={plan} image={images.weeklyRhythm} />;
  const before = <BeforeCard items={plan.beforeDay1} facts={plan.firstVisit.facts} />;
  const roadmap = <RoadmapCard plan={plan} week={week} onWeek={setWeek} image={images.reflection} />;
  const hard = <HardCard hard={plan.hard} />;
  const support = <SupportCard support={plan.support} />;

  const actions = (
    <>
      <ActionButton variant="primary" onClick={openSheet} className="f30-cta">
        Plan My First Visit <span aria-hidden="true">→</span>
      </ActionButton>
      <ActionButton variant="secondary" onClick={copy} className="f30-copy">
        Copy message
      </ActionButton>
    </>
  );

  return (
    <div className="f30-result factory-stagger-in" data-mobile={isMobile ? "true" : undefined}>
      <p className="sr-only" aria-live="polite">
        {copyStatus}
      </p>

      <header className="f30-board-head">
        <div className="f30-board-id">
          <h2 ref={resultRef} tabIndex={-1} className="f30-board-title">
            Your first month at {gymName}
          </h2>
          <ul className="f30-chips" role="list" aria-label="What shaped this plan">
            {plan.summary.map((c) => (
              <li key={c.id} className="f30-chip" data-key={c.id}>
                <span className="f30-chip-label">{c.label}</span>
                <span className="f30-chip-value">{c.value}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="f30-board-actions">
          {!isMobile && <div className="f30-board-primary">{actions}</div>}
          <div className="f30-board-minor">
            <ActionButton variant="ghost" onClick={onEdit} className="f30-minor-btn">
              <span aria-hidden="true">←</span> Edit answers
            </ActionButton>
            <ActionButton variant="ghost" onClick={onRestart} className="f30-minor-btn">
              <span aria-hidden="true">↺</span> Start over
            </ActionButton>
          </div>
        </div>
        {notice && <p className="f30-notice">{notice}</p>}
      </header>

      {isMobile ? (
        <>
          <div className="f30-mobile-pin" aria-label="Your weekly rhythm">
            <p className="f30-pin-headline">{plan.rhythm.headline}</p>
            <WeekStrip plan={plan} />
          </div>

          <div
            className="f30-tabs"
            role="tablist"
            aria-label="Your first month"
            onKeyDown={(e) =>
              onTabKey(
                e,
                MOBILE_TABS.map((t) => t.id),
                tab,
                setTab,
                tabRefs
              )
            }
          >
            {MOBILE_TABS.map((t, i) => (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`f30-tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls="f30-tabpanel"
                tabIndex={tab === t.id ? 0 : -1}
                data-active={tab === t.id}
                onClick={() => setTab(t.id)}
                className="factory-focus f30-tab"
              >
                {t.label}
              </button>
            ))}
          </div>

          <div
            key={tab}
            id="f30-tabpanel"
            role="tabpanel"
            aria-labelledby={`f30-tab-${tab}`}
            className="f30-tabpanel factory-stagger-in"
          >
            {tab === "visit" && firstVisit}
            {tab === "week" && (
              <>
                {rhythm}
                {before}
              </>
            )}
            {tab === "month" && roadmap}
            {tab === "hard" && hard}
            {tab === "ask" && support}
          </div>

          <div className="f30-actionbar">{actions}</div>
        </>
      ) : (
        <div className="f30-grid">
          <div className="f30-slot" data-slot="rhythm">
            {rhythm}
          </div>
          <div className="f30-slot" data-slot="visit">
            {firstVisit}
          </div>
          <div className="f30-slot" data-slot="before">
            {before}
          </div>
          <div className="f30-slot" data-slot="roadmap">
            {roadmap}
          </div>
          <div className="f30-slot" data-slot="hard">
            {hard}
          </div>
          <div className="f30-slot" data-slot="support">
            {support}
          </div>
        </div>
      )}

      <p className="f30-disclaimer">
        Planning guidance for your first month, not a workout programme or medical advice.{" "}
        <Link href={membershipHref} className="factory-focus f30-disclaimer-link">
          View membership options
        </Link>
      </p>

      <MessageSheet
        open={sheetOpen}
        onClose={closeSheet}
        message={message}
        edited={messageDraft !== null}
        onMessage={onMessageDraft}
        obstacleLabel={plan.hard.title}
        includeObstacle={includeObstacle}
        onIncludeObstacle={onIncludeObstacle}
        waHref={waHref}
        callHref={callHref}
        onCopy={copy}
        copyStatus={copyStatus}
      />
    </div>
  );
}

function Card({
  id,
  title,
  meta,
  children,
  className = "",
  tone,
}: {
  id: string;
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: "primary";
}) {
  return (
    <section aria-labelledby={`${id}-h`} className={`f30-card f30-mod ${className}`} data-tone={tone}>
      <div className="f30-card-head">
        <h3 id={`${id}-h`} className="f30-label">
          {title}
        </h3>
        {meta && <span className="f30-card-meta">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

/** Compact time mark for a selected day cell (full label is in the card + sr text). */
const TIME_MARK: Record<First30Time, string> = { morning: "AM", afternoon: "MID", evening: "PM", varies: "✓" };

function WeekStrip({ plan }: { plan: First30Plan }) {
  const variable = plan.rhythm.mode === "variable";
  return (
    <>
      <ol className="f30-week-strip" role="list" aria-hidden="true">
        {plan.rhythm.strip.map((d) => (
          <li key={d.id} className="f30-strip-day" data-on={d.selected}>
            <span className="f30-strip-name">{d.short}</span>
            <span className="f30-strip-cell">{d.selected ? TIME_MARK[plan.answers.time] : variable ? "?" : ""}</span>
          </li>
        ))}
      </ol>
      <p className="sr-only">
        {variable
          ? `${plan.rhythm.headline}. Your days change week to week.`
          : `${plan.rhythm.headline}: ${plan.rhythm.strip
              .filter((d) => d.selected)
              .map((d) => d.full)
              .join(", ")}.`}
      </p>
    </>
  );
}

function RhythmCard({ plan, image }: { plan: First30Plan; image?: First30DaysImage }) {
  return (
    <Card id="f30-rhythm" title="Your weekly rhythm" meta={plan.rhythm.timeLabel} tone="primary" className="f30-rhythm">
      <div className="f30-rhythm-body">
        <div className="f30-rhythm-main">
          <p className="f30-rhythm-headline">{plan.rhythm.headline}</p>
          <p className="f30-rhythm-days">{plan.rhythm.daysLine}</p>
          <WeekStrip plan={plan} />
          <p className="f30-rhythm-note">{plan.rhythm.note}</p>
          {plan.rhythm.hours.length > 0 && (
            <dl className="f30-hours">
              <dt className="f30-hours-label">Open</dt>
              {plan.rhythm.hours.map((h) => (
                <dd key={h.days}>
                  <span>{h.days}</span> {h.range}
                </dd>
              ))}
            </dl>
          )}
        </div>
        {image && (
          <div className="f30-rhythm-media">
            <F30Image image={image} sizes="(min-width: 1280px) 12vw, (min-width: 768px) 16vw, 30vw" />
          </div>
        )}
      </div>
    </Card>
  );
}

function FirstVisitCard({ plan, image }: { plan: First30Plan; image?: First30DaysImage }) {
  const [view, setView] = useState<"steps" | "ask">("steps");
  const fv = plan.firstVisit;
  return (
    <Card
      id="f30-visit"
      title="Your first visit"
      className="f30-visit"
      tone="primary"
      meta={
        image ? (
          <span className="f30-visit-media">
            <F30Image image={image} sizes="96px" />
          </span>
        ) : undefined
      }
    >
      <div className="f30-toggle" role="group" aria-label="First visit view">
        <button
          type="button"
          aria-pressed={view === "steps"}
          data-on={view === "steps"}
          onClick={() => setView("steps")}
          className="factory-focus f30-toggle-btn"
        >
          What happens
        </button>
        <button
          type="button"
          aria-pressed={view === "ask"}
          data-on={view === "ask"}
          onClick={() => setView("ask")}
          className="factory-focus f30-toggle-btn"
        >
          Questions worth asking <span className="f30-toggle-count">{fv.questions.length}</span>
        </button>
      </div>

      {view === "steps" ? (
        <ol className="f30-steps" role="list" data-depth={fv.depth}>
          {fv.steps.map((s, i) => (
            <li key={s.title} className="f30-step">
              <span className="f30-step-num" aria-hidden="true">
                {i + 1}
              </span>
              <span className="f30-step-text">
                <span className="f30-step-title">{s.title}</span>
                {s.detail && <span className="f30-step-detail">{s.detail}</span>}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="f30-asklist">
          <ul role="list">
            {fv.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
          <p className="f30-health">{fv.healthNote}</p>
        </div>
      )}
    </Card>
  );
}

function BeforeCard({ items, facts }: { items: string[]; facts: First30Plan["firstVisit"]["facts"] }) {
  return (
    <Card id="f30-before" title="Before Day 1" meta={`${items.length} things`} className="f30-before">
      <ul className="f30-checklist" role="list">
        {items.map((item) => (
          <li key={item}>
            <span className="f30-check" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
      {facts.length > 0 && (
        <dl className="f30-facts" aria-label="Getting there">
          {facts.map((f) => (
            <div key={f.id}>
              <dt className="f30-fact-label">{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}

function RoadmapCard({
  plan,
  week,
  onWeek,
  image,
}: {
  plan: First30Plan;
  week: First30Week["id"];
  onWeek: (id: First30Week["id"]) => void;
  image?: First30DaysImage;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = plan.roadmap.find((w) => w.id === week) ?? plan.roadmap[0];
  const ids = plan.roadmap.map((w) => w.id);
  return (
    <Card id="f30-roadmap" title="Your 30-day roadmap" meta="4 weeks" className="f30-roadmap">
      <div
        className="f30-weeks"
        role="tablist"
        aria-label="Weeks"
        onKeyDown={(e) => onTabKey(e, ids, week, onWeek, refs)}
      >
        {plan.roadmap.map((w, i) => (
          <button
            key={w.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`f30-week-${w.id}`}
            aria-selected={w.id === week}
            aria-controls="f30-week-panel"
            tabIndex={w.id === week ? 0 : -1}
            data-active={w.id === week}
            onClick={() => onWeek(w.id)}
            className="factory-focus f30-week"
          >
            <span className="f30-week-index">Week {w.index}</span>
            <span className="f30-week-label">{w.label}</span>
            <span className="f30-week-range">{w.range}</span>
          </button>
        ))}
      </div>
      <div
        key={active.id}
        id="f30-week-panel"
        role="tabpanel"
        aria-labelledby={`f30-week-${active.id}`}
        className="f30-week-panel factory-stagger-in"
        data-media={active.id === "w4" && image ? "true" : undefined}
      >
        <div className="f30-week-text">
          <p className="f30-week-line">{active.line}</p>
          <ul className="f30-week-points" role="list">
            {active.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        {active.id === "w4" && image && (
          <div className="f30-week-media">
            <F30Image image={image} sizes="(min-width: 768px) 160px, 30vw" />
          </div>
        )}
      </div>
    </Card>
  );
}

function HardCard({ hard }: { hard: First30Plan["hard"] }) {
  return (
    <Card id="f30-hard" title="When it gets hard" className="f30-hard">
      <p className="f30-hard-title">{hard.title}</p>
      <p className="f30-hard-line">{hard.line}</p>
      <p className="f30-hard-step">
        <span className="f30-hard-tag">One step now</span>
        {hard.step}
      </p>
    </Card>
  );
}

const SUPPORT_VISIBLE = 3;

function SupportCard({ support }: { support: First30Plan["support"] }) {
  const [more, setMore] = useState(false);
  const shown = more ? support.items : support.items.slice(0, SUPPORT_VISIBLE);
  const hidden = support.items.length - SUPPORT_VISIBLE;
  return (
    <Card id="f30-support" title={support.title} className="f30-support">
      <ul id="f30-support-list" className="f30-support-list" role="list">
        {shown.map((item) => (
          <li key={item.text} data-kind={item.kind}>
            {item.label && <span className="f30-support-label">{item.label}</span>}
            {item.text}
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          aria-expanded={more}
          aria-controls="f30-support-list"
          onClick={() => setMore((v) => !v)}
          className="factory-focus f30-more"
        >
          {more ? "Show fewer" : `${hidden} more`}
        </button>
      )}
    </Card>
  );
}

// ======================================================================
// Message sheet (dialog on desktop, bottom sheet on mobile)

function MessageSheet({
  open,
  onClose,
  message,
  edited,
  onMessage,
  obstacleLabel,
  includeObstacle,
  onIncludeObstacle,
  waHref,
  callHref,
  onCopy,
  copyStatus,
}: {
  open: boolean;
  onClose: () => void;
  message: string;
  edited: boolean;
  onMessage: (v: string | null) => void;
  obstacleLabel: string;
  includeObstacle: boolean;
  onIncludeObstacle: (v: boolean) => void;
  waHref?: string;
  callHref?: string;
  onCopy: () => void;
  copyStatus: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      requestAnimationFrame(() => document.getElementById("f30-message")?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="f30-sheet"
      aria-labelledby="f30-sheet-title"
      onClose={() => open && onClose()}
      onCancel={(e) => {
        // Escape: close through React state so focus is restored consistently.
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="f30-sheet-inner">
        <div className="f30-sheet-head">
          <h2 id="f30-sheet-title" className="f30-sheet-title">
            Plan your first visit
          </h2>
          <button type="button" onClick={onClose} className="factory-focus f30-sheet-close" aria-label="Close">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <p className="f30-sheet-lead">
          Here&apos;s a message you can send. Edit anything you like. Nothing is sent until you press Send
          in WhatsApp.
        </p>

        <label htmlFor="f30-message" className="f30-label f30-sheet-label">
          Your message
        </label>
        <textarea
          id="f30-message"
          className="factory-focus f30-textarea"
          value={message}
          rows={5}
          onChange={(e) => onMessage(e.target.value)}
        />
        <div className="f30-sheet-meta">
          <span>{message.length} characters</span>
          {edited && (
            <button type="button" className="factory-focus f30-reset" onClick={() => onMessage(null)}>
              Reset to suggested
            </button>
          )}
        </div>

        <label className="f30-optin">
          <input
            type="checkbox"
            checked={includeObstacle}
            onChange={(e) => onIncludeObstacle(e.target.checked)}
            className="f30-optin-box"
          />
          <span>
            Mention what might get in the way <span className="f30-optin-sub">({obstacleLabel.toLowerCase()})</span>
          </span>
        </label>

        <div className="f30-sheet-actions">
          {waHref ? (
            <Button
              href={waHref}
              variant="primary"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => emitToolEvent("first30_whatsapp_clicked")}
              className="f30-sheet-primary"
            >
              Open in WhatsApp <span aria-hidden="true">→</span>
            </Button>
          ) : callHref ? (
            <Button href={callHref} variant="primary" className="f30-sheet-primary">
              Call the Gym <span aria-hidden="true">→</span>
            </Button>
          ) : null}
          <ActionButton variant="secondary" onClick={onCopy}>
            Copy message
          </ActionButton>
        </div>
        {!waHref && (
          <p className="f30-sheet-note">WhatsApp isn&apos;t available right now. Copy the message or call instead.</p>
        )}
        <p className="f30-sheet-status" aria-live="polite">
          {copyStatus}
        </p>
      </div>
    </dialog>
  );
}
