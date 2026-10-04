"use client";

import { useState } from "react";
import Image from "next/image";
import { Button, ActionButton } from "@/components/ui/Button";
import {
  START_QUESTIONS,
  buildWhatsAppSummaryMessage,
  formatAnswersForSummary,
  getRecommendation,
  getWeeklyStructure,
  type StartAnswers,
} from "@/components/sections/startCheckLogic";
import { appendWhatsAppMessage, buildWhatsAppHref } from "@/lib/whatsapp";
import { writeToolHandoff } from "@/lib/tool-session";
import type { WhatsAppConfig } from "@/lib/types";

/**
 * /start — the interactive "Find Your Starting Point" instrument.
 *
 * This component owns the WHOLE /start composition and switches between TWO
 * distinct UI states — it is NOT a single card that merely grows:
 *
 *   QUIZ STATE   — an asymmetric split: left brand/media (~42%) carries the
 *                  page's single H1 + concise supporting paragraph + a real
 *                  facility photograph; right (~58%) is the interactive quiz
 *                  card. The first question is visible and answerable in the
 *                  opening viewport without scrolling through editorial copy.
 *
 *   RESULT STATE — a compact "results workspace": a stable LEFT card ("WHY
 *                  GLADIATOR FITNESS": a compact cropped facility image + 3–4
 *                  verified gym facts) and a RIGHT result panel whose critical
 *                  information (the starting point + concise explanation) is
 *                  PINNED above an internally scrollable details region, with a
 *                  full-width CTA bar BELOW the workspace so the primary
 *                  WhatsApp action is visible without a long page scroll.
 *
 * Interaction/state/logic are UNCHANGED and remain presentation-agnostic: it
 * receives every gym fact it needs as a typed prop (whatsapp config, gym name,
 * membership anchor, call link, the factual gym-fit items, a real brand image
 * and the supporting paragraph) and imports no business/services/pricing data
 * itself, so the same component drops into any clone unchanged.
 *
 * SEO/semantics: exactly ONE <h1> exists in BOTH states — the page headline in
 * the left column. It stays mounted in the result state (visually de-emphasised
 * via the `data-result` surface), never duplicated and never removed. The
 * result's "YOUR STARTING POINT" recommendation title is an <h2>; the result
 * sub-sections are <h2>/<h3> in logical order beneath the single H1.
 *
 * Five single-select questions with explicit Next/Back navigation (answers are
 * preserved when going Back, no auto-advance). Entrance motion is a short CSS
 * transition that the site-wide prefers-reduced-motion block already suppresses.
 */

const TOTAL = START_QUESTIONS.length;

/** A, B, C … for the answer tiles — a clear "these are choices" signal. */
const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

export function StartCheck({
  whatsapp,
  gymName,
  membershipHref,
  callHref,
  gymFitItems,
  brandImage,
  supportingText,
}: {
  whatsapp: WhatsAppConfig;
  gymName: string;
  membershipHref: string;
  callHref?: string;
  gymFitItems: { title: string; description: string }[];
  brandImage: { src: string; alt: string };
  supportingText: string;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<StartAnswers>>({});

  const isResult = step >= TOTAL;
  const question = !isResult ? START_QUESTIONS[step] : null;
  const currentAnswer =
    question !== null
      ? (answers as unknown as Record<string, string | undefined>)[question.id]
      : undefined;
  const isLastQuestion = step === TOTAL - 1;
  const allAnswered = START_QUESTIONS.every(
    (q) => (answers as unknown as Record<string, string | undefined>)[q.id]
  );

  const select = (id: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const next = () => {
    if (!currentAnswer) return;
    if (isLastQuestion) {
      if (allAnswered) {
        // Optional handoff for /first-30-days (never required there).
        writeToolHandoff({
          source: "start",
          experience: answers.experience,
          timePreference: answers.time,
          daysPerWeek: answers.days,
        });
        setStep(TOTAL);
      }
      return;
    }
    setStep((s) => s + 1);
  };

  const back = () => setStep((s) => Math.max(0, s - 1));
  const restart = () => {
    setAnswers({});
    setStep(0);
  };

  return (
    <section
      aria-labelledby="start-check-heading"
      className="start-split"
      data-result={isResult ? "true" : undefined}
    >
      {/* ---------- LEFT COLUMN ----------
          Quiz state: brand + real facility image + the page's single H1.
          Result state: a compact, stable "WHY GLADIATOR FITNESS" card.
          The H1 lives in the quiz-state block, which stays mounted (and
          visually de-emphasised) in the result state so there is always
          exactly one <h1> on the page. */}
      <div className="start-brand">
        {/* The single, persistent H1 + its supporting content. */}
        <div className="start-brand-media" aria-hidden="true">
          <Image
            src={brandImage.src}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="start-brand-img"
          />
          <span className="start-brand-scrim" />
        </div>

        <div className="start-brand-inner">
          <div className="start-brand-eyebrow">
            <span className="start-brand-tick" aria-hidden="true" />
            <span>Find your starting point</span>
          </div>

          <h1 id="start-check-heading" className="start-brand-display">
            <span className="block">You don&apos;t need to know</span>
            <span className="block">where to start.</span>
            <span className="block text-(--accent)">We&apos;ll help you find it.</span>
          </h1>

          <p className="start-brand-support">{supportingText}</p>

          <p className="start-brand-meta" aria-hidden="true">
            5 Questions · ~60 Sec · No Sign-up
          </p>
        </div>
      </div>

      {/* ---------- RIGHT COLUMN — QUIZ STATE ONLY: the interactive card ---------- */}
      {!isResult && (
        <div className="start-stage">
          <div className="start-card">
            {/* Card identity + step/time, always visible at the top. */}
            <div className="start-card-head">
              <span className="start-card-id">Starting Point Check</span>
              <span className="start-card-step" aria-hidden="true">
                <span className="start-card-stepnum">
                  {String(step + 1).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
                </span>
                <span className="start-card-time">~60 Sec</span>
              </span>
            </div>

            {/* Segmented progress rail — one segment per question. */}
            <div
              className="start-rail"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={TOTAL}
              aria-valuenow={step + 1}
              aria-label={`Question ${step + 1} of ${TOTAL}`}
            >
              {START_QUESTIONS.map((q, i) => (
                <span
                  key={q.id}
                  className="start-rail-seg"
                  data-state={
                    i < step ? "done" : i === step ? "current" : "upcoming"
                  }
                />
              ))}
            </div>

            {/* The question + answers swap in an aria-live region. */}
            <div className="start-card-body" aria-live="polite">
              <div key={step} className="start-card-flow">
                <h2
                  className="start-question factory-stagger-in"
                  style={{ animationDelay: "40ms" }}
                >
                  {question!.prompt}
                </h2>

                <ul className="start-tiles" role="list">
                  {question!.options.map((option, i) => {
                    const selected = currentAnswer === option.value;
                    return (
                      <li
                        key={option.value}
                        className="factory-stagger-in"
                        style={{ animationDelay: `${90 + i * 40}ms` }}
                      >
                        <button
                          type="button"
                          aria-pressed={selected}
                          data-selected={selected}
                          onClick={() => select(question!.id, option.value)}
                          className="factory-focus start-tile"
                        >
                          <span className="start-tile-letter" aria-hidden="true">
                            {LETTERS[i] ?? String(i + 1)}
                          </span>
                          <span className="start-tile-label">{option.label}</span>
                          <span className="start-tile-mark" aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Navigation — Next is primary and disabled until answered. */}
            <div className="start-card-nav">
              <ActionButton
                variant="ghost"
                onClick={back}
                disabled={step === 0}
                className="start-nav-back"
              >
                <span aria-hidden="true">←</span> Back
              </ActionButton>
              <ActionButton
                variant="primary"
                onClick={next}
                disabled={!currentAnswer}
                className="start-nav-next"
              >
                {isLastQuestion ? "See My Starting Point" : "Next"}
                <span aria-hidden="true">→</span>
              </ActionButton>
            </div>

            <p className="start-card-reassure">No account. No complicated form.</p>
          </div>
        </div>
      )}

      {/* ---------- RESULT STATE: compact results workspace ----------
          A distinct composition that spans the grid: a stable left "WHY
          GLADIATOR" card, a height-constrained right result panel with pinned
          critical info + internal scroll, and a full-width CTA bar below. */}
      {isResult && (
        <StartResult
          answers={answers as StartAnswers}
          whatsapp={whatsapp}
          gymName={gymName}
          membershipHref={membershipHref}
          callHref={callHref}
          gymFitItems={gymFitItems}
          brandImage={brandImage}
          onRestart={restart}
        />
      )}
    </section>
  );
}

function StartResult({
  answers,
  whatsapp,
  gymName,
  membershipHref,
  callHref,
  gymFitItems,
  brandImage,
  onRestart,
}: {
  answers: StartAnswers;
  whatsapp: WhatsAppConfig;
  gymName: string;
  membershipHref: string;
  callHref?: string;
  gymFitItems: { title: string; description: string }[];
  brandImage: { src: string; alt: string };
  onRestart: () => void;
}) {
  const recommendation = getRecommendation(answers);
  const weekly = getWeeklyStructure(answers.days ?? "3");
  const summary = formatAnswersForSummary(answers, START_QUESTIONS);

  // Collapsed by default: the critical result is visible first; "View full
  // result" reveals the lower-priority details into the scrollable region.
  const [expanded, setExpanded] = useState(false);

  const hasWhatsApp = Boolean(whatsapp?.number);
  const whatsappMessage = buildWhatsAppSummaryMessage(
    gymName,
    answers,
    START_QUESTIONS,
    recommendation
  );
  const waHref = hasWhatsApp
    ? appendWhatsAppMessage(buildWhatsAppHref(whatsapp), whatsappMessage)
    : undefined;

  return (
    <div className="start-workspace factory-stagger-in">
      {/* ----- LEFT: stable "WHY GLADIATOR FITNESS" card (compact) ----- */}
      <aside className="start-why-card">
        <div className="start-why-media" aria-hidden="true">
          <Image
            src={brandImage.src}
            alt=""
            fill
            sizes="(min-width: 1024px) 32vw, 100vw"
            className="start-why-img"
          />
          <span className="start-why-scrim" />
        </div>

        <div className="start-why-inner">
          <span className="factory-eyebrow">Why Gladiator</span>
          <h2 className="start-why-title">Why {gymName}</h2>

          {gymFitItems.length > 0 && (
            <ul className="start-why-list" role="list">
              {gymFitItems.map((item, i) => (
                <li key={item.title} className="start-why-row">
                  <span className="start-why-index" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="start-why-label">{item.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* ----- RIGHT: the result panel -----
          Collapsed by default: the critical result (starting point + concise
          explanation + the key weekly structure) is visible WITHOUT scrolling.
          "View full result" expands the lower-priority details into a
          constrained, internally scrollable region. The conversion CTAs live
          only in the CTA bar below — never inside this panel. */}
      <div
        className="start-result-panel"
        data-expanded={expanded ? "true" : undefined}
        aria-live="polite"
      >
        {/* PINNED — Priority 1 & key result. Always visible, no scroll needed. */}
        <div className="start-result-head">
          <span className="factory-eyebrow">Your starting point</span>
          <h2 className="start-result-title mt-3">{recommendation.title}</h2>
          <p className="start-result-lead mt-4">{recommendation.description}</p>

          {/* YOUR WEEK — the key starting structure, promoted to the pinned
              critical area so it never hides behind the scroll. */}
          <div className="start-result-week mt-6">
            <span className="factory-eyebrow">Your week</span>
            <h3 className="start-result-sub mt-3">{weekly.label}</h3>
            <ul className="mt-3 border-t border-(--border)" role="list">
              {weekly.sessions.map((session) => (
                <li key={session} className="start-session-row">
                  {session}
                </li>
              ))}
            </ul>
          </div>

          {/* The deliberate "there is more" control. Not a generic accordion:
              a full-width bordered action that reads as part of the panel. */}
          <button
            type="button"
            className="factory-focus start-result-toggle mt-6"
            aria-expanded={expanded}
            aria-controls="start-result-details"
            onClick={() => setExpanded((v) => !v)}
          >
            <span>{expanded ? "Hide full result" : "View full result"}</span>
            <span className="start-result-toggle-icon" aria-hidden="true">
              {expanded ? "↑" : "↓"}
            </span>
          </button>
        </div>

        {/* SCROLLABLE DETAILS — Priority 2 & 3. Revealed on expand; keyboard-
            focusable so it can be scrolled; a bottom fade signals more content.
            No conversion CTAs here — see the CTA bar below. */}
        <div
          id="start-result-details"
          className="start-result-scroll"
          hidden={!expanded}
          tabIndex={expanded ? 0 : -1}
          role="group"
          aria-label="Full starting point details"
        >
          <p className="start-result-scrollhint" aria-hidden="true">
            Scroll for more ↓
          </p>

          {/* Weekly structure scope note (the structure itself is pinned above). */}
          <div className="start-result-block">
            <p className="text-xs leading-5 text-(--text-secondary)">
              This is a general educational structure, not a personalised or
              medical prescription. The gym will adapt it to you in person.
            </p>
          </div>

          {/* WHY THIS FITS — editorial numbered fit register. */}
          {gymFitItems.length > 0 && (
            <div className="start-result-block">
              <span className="factory-eyebrow">Why this fits</span>
              <h3 className="start-result-sub mt-3">Why {gymName} fits your start</h3>
              <div className="mt-4 border-t border-(--border)">
                {gymFitItems.map((item, i) => (
                  <div key={item.title} className="start-ledger-row">
                    <span className="start-ledger-index" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="start-ledger-title">{item.title}</p>
                      <p className="start-ledger-body">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Answer summary — demoted to compact technical metadata. */}
          {summary.length > 0 && (
            <div className="start-result-block">
              <span className="factory-eyebrow">Your answers</span>
              <dl className="mt-3 border-t border-(--border)">
                {summary.map((row) => (
                  <div key={row.label} className="start-meta-row">
                    <dt className="start-meta-label">{row.label}</dt>
                    <dd className="start-meta-value">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Scope / disclaimer — Priority 3. */}
          <div className="start-result-block space-y-1">
            <p className="text-xs uppercase tracking-wide text-(--text-secondary)">
              This tool provides general educational fitness guidance only.
            </p>
            <p className="text-xs uppercase tracking-wide text-(--text-secondary)">
              It is not a medical assessment and does not guarantee a fitness
              outcome.
            </p>
          </div>

          {/* Still not sure — Priority 3. Guidance text only; the conversion
              actions are the single CTA bar below, so no buttons duplicate here. */}
          <div className="start-result-block border-t border-(--border) pt-6">
            <h3 className="text-base font-semibold tracking-tight text-(--text-primary)">
              Still not sure?
            </h3>
            <p className="mt-2 text-sm leading-6 text-(--text-secondary)">
              That&apos;s okay — use the actions below to send your starting
              point to the gym or ask them anything you&apos;re unsure about.
            </p>
          </div>
        </div>
      </div>

      {/* ----- CTA BAR — the SINGLE conversion zone. Full width, below the
              workspace, outside the scrollable panel. ----- */}
      <div className="start-cta-bar">
        <div className="start-cta-primary">
          {waHref ? (
            <Button href={waHref} variant="primary" className="w-full sm:w-auto">
              Send My Starting Point on WhatsApp
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
            className="w-full sm:w-auto"
          >
            View Membership Options
            <span aria-hidden="true">→</span>
          </Button>
        </div>

        <div className="start-cta-secondary">
          {/* If WhatsApp is the primary, Call remains available here too. */}
          {waHref && callHref && (
            <Button href={callHref} variant="ghost">
              Call the Gym
              <span aria-hidden="true">→</span>
            </Button>
          )}
          <ActionButton variant="ghost" onClick={onRestart}>
            <span aria-hidden="true">↺</span> Start again
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
