"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button, ActionButton } from "@/components/ui/Button";
import {
  JOURNEY_HORIZONS,
  JOURNEY_QUESTIONS,
  PHASE_IDS,
  buildJourney,
  buildJourneyWhatsAppMessage,
  type JourneyAnswers,
  type JourneyHorizon,
  type JourneyPhaseId,
  type JourneyPlan,
  type JourneyQuestion,
  type JourneyServiceInput,
} from "@/components/sections/fitnessJourneyLogic";
import { appendWhatsAppMessage, buildWhatsAppHref } from "@/lib/whatsapp";
import { writeToolHandoff } from "@/lib/tool-session";
import type { WhatsAppConfig } from "@/lib/types";

/**
 * /journey — the interactive Fitness Journey planner.
 *
 * TWO STATES, ONE SECTION.
 *
 *   PLANNER — an asymmetric split: left, the page's campaign image carrying
 *             the page's single H1 and one supporting paragraph; right, the
 *             planner panel with the first of three questions answerable in
 *             the opening viewport.
 *
 *   JOURNEY — the result, laid out as a JOURNEY BOARD. The image is removed
 *             and the H1 stays mounted as a compact eyebrow line (exactly one
 *             H1 in both states). A fixed board header (H2 → summary chips →
 *             horizon + edit row) sits above a grid of card surfaces:
 *             Current Focus, Next Milestone and the Roadmap (the MEASURING
 *             RULE — the central artifact) are primary, with the single CTA
 *             zone directly beneath; Selected Phase, Your Week and Gym
 *             Support are secondary. Phases are an ARIA tablist driving the
 *             Selected Phase panel.
 *
 * Every derived string comes from components/sections/fitnessJourneyLogic.ts;
 * this file only holds interaction state. It imports no gym data — the gym
 * name, WhatsApp config, call link, verified services and image arrive as
 * props — so a clone gets a correct tool by editing lib/*.ts only.
 *
 * Motion is CSS-only (stagger entrances, rule position transitions); the
 * site-wide prefers-reduced-motion block neutralises it.
 */

const TOTAL = JOURNEY_QUESTIONS.length;
const STEP_LABELS = ["GOAL", "START", "DAYS"] as const;

type Answers = Partial<JourneyAnswers>;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Keep edge labels inside the rule instead of overflowing it. */
function edge(pos: number): "start" | "end" | undefined {
  if (pos <= 12) return "start";
  if (pos >= 88) return "end";
  return undefined;
}

export function FitnessJourney({
  whatsapp,
  gymName,
  membershipHref,
  callHref,
  services,
  image,
  supportingText,
  startHref,
}: {
  whatsapp: WhatsAppConfig;
  gymName: string;
  membershipHref: string;
  callHref?: string;
  services: JourneyServiceInput[];
  image: { src: string; alt: string; objectPosition?: string; objectPositionMobile?: string };
  supportingText: string;
  startHref: string;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [horizon, setHorizon] = useState<JourneyHorizon>(3);
  const [phase, setPhase] = useState<JourneyPhaseId>("foundation");
  const [announcement, setAnnouncement] = useState("");

  const questionRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const pendingFocus = useRef<"question" | "result" | null>(null);

  const isResult = step >= TOTAL;
  const question = !isResult ? JOURNEY_QUESTIONS[step] : null;
  const currentAnswer = question ? answers[question.id] : undefined;

  // Move focus after the state change has rendered (never during render).
  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    (target === "result" ? resultRef : questionRef).current?.focus();
  }, [step]);

  const select = (id: keyof JourneyAnswers, value: string) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const next = () => {
    if (!currentAnswer) return;
    if (step === TOTAL - 1) {
      // Optional handoff for /first-30-days (never required there). /journey
      // has no time question, so it never overwrites /start's time.
      writeToolHandoff({ source: "journey", experience: answers.start, daysPerWeek: answers.days });
      pendingFocus.current = "result";
      setAnnouncement("Your fitness journey is ready. Showing the 3-month view.");
      setHorizon(3);
      setPhase("foundation");
      setStep(TOTAL);
      return;
    }
    const nextQ = JOURNEY_QUESTIONS[step + 1];
    setAnnouncement(`Question ${step + 2} of ${TOTAL}: ${nextQ.prompt}`);
    pendingFocus.current = "question";
    setStep(step + 1);
  };

  const back = () => {
    if (step === 0) return;
    const prevQ = JOURNEY_QUESTIONS[step - 1];
    setAnnouncement(`Question ${step} of ${TOTAL}: ${prevQ.prompt}`);
    pendingFocus.current = "question";
    setStep(step - 1);
  };

  const editAnswers = () => {
    setAnnouncement(`Editing answers. Question 1 of ${TOTAL}: ${JOURNEY_QUESTIONS[0].prompt}`);
    pendingFocus.current = "question";
    setStep(0);
  };

  const restart = () => {
    setAnswers({});
    setHorizon(3);
    setPhase("foundation");
    setAnnouncement(`Starting again. Question 1 of ${TOTAL}: ${JOURNEY_QUESTIONS[0].prompt}`);
    pendingFocus.current = "question";
    setStep(0);
  };

  const changeHorizon = (value: JourneyHorizon) => {
    setHorizon(value);
    setAnnouncement(`Showing ${value}-month journey.`);
  };

  const changePhase = (id: JourneyPhaseId, label: string, range: string) => {
    setPhase(id);
    setAnnouncement(`${label}, ${range.toLowerCase()}.`);
  };

  return (
    <section
      aria-labelledby="journey-heading"
      className="journey-split"
      data-state={isResult ? "result" : "planner"}
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      {/* ---------- BRAND: real image + the page's single, persistent H1 ---------- */}
      <div className="journey-brand">
        <div className="journey-brand-media">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            preload
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="journey-brand-img"
            style={
              {
                "--jp-pos": image.objectPosition ?? "50% 50%",
                "--jp-pos-mobile": image.objectPositionMobile ?? image.objectPosition ?? "50% 50%",
              } as CSSProperties
            }
          />
          <span className="journey-brand-scrim" aria-hidden="true" />
        </div>

        <div className="journey-brand-inner">
          <p className="journey-brand-eyebrow">
            <span className="journey-brand-tick" aria-hidden="true" />
            Fitness journey
          </p>

          <h1 id="journey-heading" className="journey-brand-display">
            Map your <span className="text-(--accent)">fitness journey</span>
          </h1>

          <p className="journey-brand-support">{supportingText}</p>

          <div className="journey-brand-rule" aria-hidden="true">
            <span>Now</span>
            <span>3M</span>
            <span>6M</span>
            <span>12M</span>
          </div>

          <p className="journey-brand-alt">
            Not sure where to start?{" "}
            <Link
              href={startHref}
              className="factory-focus text-(--text-primary) underline underline-offset-4 hover:text-(--brand-secondary)"
            >
              Find your starting point →
            </Link>
          </p>
        </div>
      </div>

      {/* ---------- PLANNER: three questions ---------- */}
      {question && (
        <div className="journey-stage">
          <div className="journey-planner">
            <div className="journey-planner-head">
              <span className="journey-planner-id">Fitness Journey</span>
              <span className="journey-planner-meta" aria-hidden="true">
                03 Steps · ~1 Min
              </span>
              <span className="journey-planner-step" aria-hidden="true">
                {pad(step + 1)} / {pad(TOTAL)}
              </span>
            </div>

            <div
              className="journey-nodes"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={TOTAL}
              aria-valuenow={step + 1}
              aria-label={`Question ${step + 1} of ${TOTAL}`}
            >
              {STEP_LABELS.map((label, i) => (
                <span
                  key={label}
                  className="journey-node"
                  data-state={i < step ? "done" : i === step ? "current" : "upcoming"}
                >
                  <span className="journey-node-dot" aria-hidden="true" />
                  <span className="journey-node-label" aria-hidden="true">
                    {pad(i + 1)} {label}
                  </span>
                </span>
              ))}
            </div>

            <div key={step} className="journey-planner-body">
              <h2
                ref={questionRef}
                tabIndex={-1}
                className="journey-question factory-stagger-in"
                style={{ animationDelay: "30ms" }}
              >
                {question.prompt}
              </h2>

              <QuestionControl
                question={question}
                value={currentAnswer}
                onSelect={(v) => select(question.id, v)}
              />
            </div>

            <div className="journey-planner-nav">
              <ActionButton variant="ghost" onClick={back} disabled={step === 0}>
                <span aria-hidden="true">←</span> Back
              </ActionButton>
              <ActionButton
                variant="primary"
                onClick={next}
                disabled={!currentAnswer}
                className="journey-planner-next"
              >
                {step === TOTAL - 1 ? "Map My Journey" : "Next"}
                <span aria-hidden="true">→</span>
              </ActionButton>
            </div>

            <p className="journey-planner-reassure">No account. No sign-up.</p>
          </div>
        </div>
      )}

      {/* ---------- JOURNEY: the result workspace ---------- */}
      {isResult && (
        <JourneyResult
          plan={buildJourney(answers, horizon, services)}
          phase={phase}
          resultRef={resultRef}
          gymName={gymName}
          whatsapp={whatsapp}
          membershipHref={membershipHref}
          callHref={callHref}
          onHorizon={changeHorizon}
          onPhase={changePhase}
          onEdit={editAnswers}
          onRestart={restart}
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------------ */

function QuestionControl({
  question,
  value,
  onSelect,
}: {
  question: JourneyQuestion;
  value?: string;
  onSelect: (value: string) => void;
}) {
  if (question.control === "scale") {
    return (
      <div className="journey-scale">
        <ul className="journey-scale-row" role="list">
          {question.options.map((option, i) => {
            const selected = value === option.value;
            const [num] = option.label.split(" ");
            return (
              <li
                key={option.value}
                className="factory-stagger-in"
                style={{ animationDelay: `${80 + i * 40}ms` }}
              >
                <button
                  type="button"
                  aria-pressed={selected}
                  data-selected={selected}
                  onClick={() => onSelect(option.value)}
                  className="factory-focus journey-scale-seg"
                >
                  <span className="journey-scale-num">{num}</span>
                  <span className="journey-scale-unit">Days / week</span>
                  <span className="journey-scale-mark" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
        <span className="journey-scale-ticks" aria-hidden="true" />
        <p className="journey-scale-hint">Choose what fits a normal week — not your best week.</p>
      </div>
    );
  }

  return (
    <ul className="journey-tiles" role="list">
      {question.options.map((option, i) => {
        const selected = value === option.value;
        return (
          <li
            key={option.value}
            className="factory-stagger-in"
            style={{ animationDelay: `${80 + i * 40}ms` }}
          >
            <button
              type="button"
              aria-pressed={selected}
              data-selected={selected}
              onClick={() => onSelect(option.value)}
              className="factory-focus journey-tile"
            >
              <span className="journey-tile-index" aria-hidden="true">
                {pad(i + 1)}
              </span>
              <span className="journey-tile-label">{option.label}</span>
              <span className="journey-tile-mark" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------------ */

function JourneyResult({
  plan,
  phase,
  resultRef,
  gymName,
  whatsapp,
  membershipHref,
  callHref,
  onHorizon,
  onPhase,
  onEdit,
  onRestart,
}: {
  plan: JourneyPlan;
  phase: JourneyPhaseId;
  resultRef: React.RefObject<HTMLHeadingElement | null>;
  gymName: string;
  whatsapp: WhatsAppConfig;
  membershipHref: string;
  callHref?: string;
  onHorizon: (h: JourneyHorizon) => void;
  onPhase: (id: JourneyPhaseId, label: string, range: string) => void;
  onEdit: () => void;
  onRestart: () => void;
}) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const detail = plan.phaseDetails[phase];
  const milestoneCp = plan.checkpoints.find((c) => c.kind === "milestone");

  const message = buildJourneyWhatsAppMessage(gymName, plan.answers, plan.horizon, plan.focus);
  const waHref = whatsapp?.number
    ? appendWhatsAppMessage(buildWhatsAppHref(whatsapp), message)
    : undefined;

  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = PHASE_IDS.indexOf(phase);
    let nextIndex: number | null = null;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = (current + 1) % PHASE_IDS.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = (current - 1 + PHASE_IDS.length) % PHASE_IDS.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = PHASE_IDS.length - 1;
        break;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    const p = plan.phases[nextIndex];
    onPhase(p.id, p.label, p.weekRange);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="journey-result factory-stagger-in">
      {/*
        BOARD HEADER — a fixed, block-flow stack:
          identity (H2) → summary chips → controls row (horizon + edit)
        It sits OUTSIDE the card grid and nothing in it depends on the
        selected phase, so the horizon control can never drift next to (or
        visually attach itself to) any card.
      */}
      <header className="journey-board-head">
        <h2 ref={resultRef} tabIndex={-1} className="journey-board-title">
          Your fitness journey
        </h2>
        <ul className="journey-chips" role="list">
          {plan.summary.map((row) => (
            <li key={row.label} className="journey-chip">
              <span className="journey-chip-label">{row.label}</span>
              <span className="journey-chip-value">{row.value}</span>
            </li>
          ))}
        </ul>

        <div className="journey-board-controls">
          {/* Global result control: a native radio group styled as a segmented control */}
          <fieldset className="journey-horizon">
            <legend className="journey-horizon-legend">Journey horizon</legend>
            <div className="journey-horizon-row">
              {JOURNEY_HORIZONS.map((h) => (
                <label
                  key={h.value}
                  className="journey-horizon-opt"
                  data-checked={plan.horizon === h.value}
                >
                  <input
                    type="radio"
                    name="journey-horizon"
                    value={h.value}
                    checked={plan.horizon === h.value}
                    onChange={() => onHorizon(h.value)}
                    className="sr-only"
                  />
                  <span className="journey-horizon-mark" aria-hidden="true" />
                  {h.label}
                </label>
              ))}
            </div>
          </fieldset>

          <ActionButton variant="ghost" onClick={onEdit} className="journey-edit">
            <span aria-hidden="true">←</span> Edit answers
          </ActionButton>
        </div>
      </header>

      <div className="journey-grid">
        {/* PRIMARY — current focus */}
        <section
          aria-labelledby="journey-focus-h"
          className="journey-card journey-focus"
          data-accent="true"
        >
          <div className="journey-card-head">
            <h3 id="journey-focus-h" className="journey-label">
              Current focus
            </h3>
          </div>
          <p className="journey-focus-headline">{plan.focus.headline}</p>
          <p className="journey-focus-line">{plan.focus.line}</p>
          {plan.frequencyNote && (
            <p className="journey-focus-note">
              <span className="journey-focus-note-tag" aria-hidden="true">
                Rhythm
              </span>
              {plan.frequencyNote}
            </p>
          )}
        </section>

        {/* PRIMARY — next milestone (a separate object from focus) */}
        <section
          aria-labelledby="journey-milestone-h"
          className="journey-card journey-milestone"
          data-accent="true"
        >
          <div className="journey-card-head">
            <h3 id="journey-milestone-h" className="journey-label">
              <span className="journey-milestone-glyph" aria-hidden="true" />
              Next milestone
            </h3>
            <span className="journey-milestone-week">Week {plan.milestone.week}</span>
          </div>
          <p className="journey-milestone-text">{plan.milestone.text}</p>
        </section>

        {/* PRIMARY — THE ROADMAP: the measuring rule + phase tabs */}
        <section
          aria-labelledby="journey-roadmap-h"
          className="journey-card journey-roadmap"
          data-tier="primary"
        >
          <div className="journey-card-head">
            <h3 id="journey-roadmap-h" className="journey-label">
              Journey roadmap
            </h3>
            <span className="journey-card-meta" aria-hidden="true">
              {plan.scaleLabel} · {plan.totalWeeks} weeks
            </span>
          </div>

          <div className="journey-roadmap-body">
          <div className="journey-roadmap-visual">
          <div className="journey-rule" data-horizon={plan.horizon} aria-hidden="true">
            <div className="journey-rule-lane">
              <span className="journey-rule-now" style={{ "--pos": 0 } as CSSProperties}>
                Now
              </span>
              {milestoneCp && (
                <span
                  className="journey-rule-flag"
                  data-edge={edge(milestoneCp.pos)}
                  style={{ "--pos": milestoneCp.pos } as CSSProperties}
                >
                  <span className="journey-rule-flag-long">Next milestone · </span>Wk{" "}
                  {milestoneCp.week}
                </span>
              )}
            </div>

            <div className="journey-rule-bands">
              {plan.phases.map((p) => (
                <span
                  key={p.id}
                  className="journey-rule-band"
                  data-phase={p.id}
                  data-active={p.id === phase}
                  style={
                    { "--start": p.startPos, "--end": p.endPos } as CSSProperties
                  }
                >
                  <span className="journey-rule-band-index">{p.index}</span>
                </span>
              ))}
              {plan.checkpoints.map((c) => (
                <span
                  key={`${c.kind}-${c.week}`}
                  className="journey-rule-cp"
                  data-kind={c.kind}
                  style={{ "--pos": c.pos } as CSSProperties}
                />
              ))}
            </div>

            <div className="journey-rule-ticks">
              {plan.ticks.map((t) => (
                <span
                  key={t.week}
                  className="journey-rule-tick"
                  data-major={t.major}
                  style={{ "--pos": t.pos } as CSSProperties}
                >
                  {t.label && (
                    <span className="journey-rule-tick-label" data-edge={edge(t.pos)}>
                      {t.label}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>

          <p className="journey-rule-legend" aria-hidden="true">
            <span className="journey-legend-item" data-kind="milestone">
              Milestone
            </span>
            <span className="journey-legend-item" data-kind="review">
              {plan.horizon === 12 ? "Quarterly reassessment" : "Review"}
            </span>
          </p>

          {/* Text equivalent of the rule. */}
          <ol className="sr-only">
            {plan.phases.map((p) => (
              <li key={p.id}>
                Phase {p.index}, {p.label}: {p.weekRange.toLowerCase()}.
              </li>
            ))}
            {plan.checkpoints.map((c) => (
              <li key={`sr-${c.kind}-${c.week}`}>
                Week {c.week}: {c.label.toLowerCase()}.
              </li>
            ))}
          </ol>
          </div>

          <div className="journey-roadmap-nav">
          <p className="journey-tabs-hint" id="journey-tabs-hint">
            Select a phase to explore
          </p>
          <div
            className="journey-tabs"
            role="tablist"
            aria-label="Journey phases"
            aria-describedby="journey-tabs-hint"
            onKeyDown={onTabKey}
          >
            {plan.phases.map((p, i) => {
              const active = p.id === phase;
              return (
                <button
                  key={p.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`journey-tab-${p.id}`}
                  aria-selected={active}
                  aria-controls="journey-phase-panel"
                  tabIndex={active ? 0 : -1}
                  data-active={active}
                  onClick={() => onPhase(p.id, p.label, p.weekRange)}
                  className="factory-focus journey-tab"
                >
                  <span className="journey-tab-mark" aria-hidden="true" />
                  <span className="journey-tab-name">
                    <span className="journey-tab-index">{p.index}</span> {p.label}
                  </span>
                  <span className="journey-tab-range">{p.weekRange}</span>
                </button>
              );
            })}
          </div>
          </div>
          </div>
        </section>

        {/* PRIMARY — THE single CTA zone (an action strip, not an info card) */}
        <div className="journey-cta">
          <div className="journey-cta-row">
            {waHref ? (
              <Button href={waHref} variant="primary" className="w-full sm:w-auto">
                Discuss My Journey on WhatsApp
                <span aria-hidden="true">→</span>
              </Button>
            ) : callHref ? (
              <Button href={callHref} variant="primary" className="w-full sm:w-auto">
                Call the Gym
                <span aria-hidden="true">→</span>
              </Button>
            ) : null}
            <Button
              href={membershipHref}
              variant="secondary"
              className="journey-cta-secondary w-full sm:w-auto"
            >
              View Membership Options
              <span aria-hidden="true">→</span>
            </Button>
          </div>
          <div className="journey-cta-foot">
            {waHref && (
              <p className="journey-cta-note">
                Your journey choices are included so the gym knows where you&apos;re starting
                from.
              </p>
            )}
            <div className="journey-cta-minor">
              {waHref && callHref && (
                <Button href={callHref} variant="ghost" className="journey-cta-tertiary px-0 py-1">
                  Call the Gym
                </Button>
              )}
              <ActionButton
                variant="ghost"
                onClick={onRestart}
                className="journey-cta-tertiary px-0 py-1"
              >
                <span aria-hidden="true">↺</span> Start again
              </ActionButton>
            </div>
          </div>
        </div>

        {/* SECONDARY — selected phase detail (driven by the roadmap tabs) */}
        <div
          key={`${phase}-${plan.horizon}`}
          id="journey-phase-panel"
          role="tabpanel"
          aria-labelledby={`journey-tab-${phase}`}
          tabIndex={0}
          className="factory-focus journey-card journey-panel"
        >
          <div className="journey-card-head">
            <h3 className="journey-label">Selected phase</h3>
            <span className="journey-panel-range">{detail.weekRange}</span>
          </div>
          <p className="journey-panel-title">
            <span className="journey-panel-index">{detail.index}</span> {detail.label}
          </p>
          <ul className="journey-panel-points" role="list">
            {detail.focusPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <dl className="journey-panel-facts">
            <div>
              <dt>Goal emphasis</dt>
              <dd>{detail.goalEmphasis}</dd>
            </div>
            <div>
              <dt>Checkpoint</dt>
              <dd>{detail.checkpoint}</dd>
            </div>
          </dl>
          <p className="journey-panel-note">{detail.horizonNote}</p>
        </div>

        {/* SECONDARY — your week */}
        <section aria-labelledby="journey-week-h" className="journey-card journey-week">
          <div className="journey-card-head">
            <h3 id="journey-week-h" className="journey-label">
              Your week
            </h3>
            <span className="journey-card-meta">Example rhythm · {plan.weekLabel}</span>
          </div>
          <ol className="journey-week-strip" role="list">
            {plan.week.map((d) => (
              <li key={d.day} className="journey-day" data-kind={d.kind}>
                <span className="journey-day-name" aria-hidden="true">
                  {d.day}
                </span>
                <span className="journey-day-cell" aria-hidden="true">
                  {d.kind === "train" && d.index !== undefined && (
                    <span className="journey-day-index">{pad(d.index)}</span>
                  )}
                  <span className="journey-day-label">{d.label}</span>
                  <span className="journey-day-short">{d.short}</span>
                </span>
                <span className="sr-only">
                  {d.fullDay} —{" "}
                  {d.kind === "train"
                    ? `${d.label.toLowerCase()} session`
                    : d.kind === "optional"
                      ? "optional light movement"
                      : "rest"}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* SECONDARY — gym support (verified services only, full width) */}
        {plan.support.length > 0 && (
          <section aria-labelledby="journey-support-h" className="journey-card journey-support">
            <div className="journey-card-head">
              <h3 id="journey-support-h" className="journey-label">
                How the gym can support this journey
              </h3>
              <span className="journey-card-meta">{gymName}</span>
            </div>
            <ul className="journey-support-list" role="list">
              {plan.support.map((s, i) => (
                <li key={s.id} className="journey-support-item">
                  <span className="journey-support-index" aria-hidden="true">
                    {pad(i + 1)}
                  </span>
                  <span className="journey-support-name">{s.name}</span>
                  <span className="journey-support-desc">{s.description}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* TERTIARY — scope */}
        <p className="journey-disclaimer">
          General educational guidance only — not a medical assessment or a guaranteed
          outcome.
        </p>
      </div>
    </div>
  );
}
