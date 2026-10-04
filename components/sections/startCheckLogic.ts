/**
 * /start — "Find Your Starting Point" logic layer.
 *
 * Every question, option, recommendation rule and derived string the Start
 * Check renders is computed here, in one pure module with no React and no DOM —
 * the same separation precedent as components/sections/reviewSignal.ts. The
 * client component (components/motion/StartCheck.tsx) only holds interaction
 * state and renders; the educational content and the deterministic mapping
 * from answers to a starting point live here where they can be read and
 * reasoned about in isolation.
 *
 * The rule that matters most in this file: NO MEDICAL OR MEASUREMENT CLAIM.
 * There is no height, weight, age, BMI, calorie or heart-rate field anywhere;
 * the recommendation is a plain-language training-structure suggestion derived
 * from five qualitative answers, never a prescription.
 */

export interface StartQuestionOption {
  value: string;
  label: string;
}

export interface StartQuestion {
  id: string;
  prompt: string;
  options: StartQuestionOption[];
}

/**
 * The five questions, in order. Ids are stable keys referenced by StartAnswers
 * and the summary/message builders — never rename them without updating both.
 */
export const START_QUESTIONS: StartQuestion[] = [
  {
    id: "goal",
    prompt: "WHAT ARE YOU TRAINING FOR?",
    options: [
      { value: "fat-loss", label: "FAT LOSS" },
      { value: "strength", label: "BUILD STRENGTH" },
      { value: "muscle", label: "BUILD MUSCLE" },
      { value: "general-fitness", label: "GENERAL FITNESS" },
      { value: "returning", label: "GET BACK INTO TRAINING" },
    ],
  },
  {
    id: "experience",
    prompt: "WHERE ARE YOU RIGHT NOW?",
    options: [
      { value: "new", label: "I'M NEW TO THE GYM" },
      { value: "returning", label: "I USED TO TRAIN" },
      { value: "occasional", label: "I TRAIN OCCASIONALLY" },
      { value: "regular", label: "I TRAIN REGULARLY" },
    ],
  },
  {
    id: "days",
    prompt: "HOW MANY DAYS CAN YOU REALISTICALLY TRAIN?",
    options: [
      { value: "2", label: "2 DAYS" },
      { value: "3", label: "3 DAYS" },
      { value: "4", label: "4 DAYS" },
      { value: "5+", label: "5+ DAYS" },
    ],
  },
  {
    id: "time",
    prompt: "WHEN CAN YOU TRAIN?",
    options: [
      { value: "early-morning", label: "EARLY MORNING" },
      { value: "morning", label: "MORNING" },
      { value: "afternoon", label: "AFTERNOON" },
      { value: "evening", label: "EVENING" },
      { value: "varies", label: "IT VARIES" },
    ],
  },
  {
    id: "support",
    prompt: "WHAT WOULD MAKE STARTING EASIER?",
    options: [
      { value: "routine", label: "A SIMPLE ROUTINE" },
      { value: "trainer", label: "A TRAINER TO GUIDE ME" },
      { value: "membership", label: "A CLEAR MEMBERSHIP OPTION" },
      { value: "first-visit", label: "A FIRST VISIT" },
      { value: "unsure", label: "I'M NOT SURE YET" },
    ],
  },
];

export interface StartAnswers {
  goal: string;
  experience: string;
  days: string;
  time: string;
  support: string;
}

export interface StartRecommendation {
  title: string;
  description: string;
}

/**
 * Map the five answers to a single starting point. A SIMPLE deterministic
 * if/else, not a scoring system: experience is evaluated first because it is
 * the strongest signal for someone deciding where to begin, then goal. No
 * description makes a medical claim or promises a result.
 */
export function getRecommendation(answers: StartAnswers): StartRecommendation {
  if (answers.experience === "new") {
    return {
      title: "FOUNDATION TRAINING",
      description:
        "Start by learning the basic movements and building a consistent habit first. Everything else is easier once showing up is routine.",
    };
  }

  if (answers.experience === "returning") {
    return {
      title: "CONSISTENCY FIRST",
      description:
        "Rebuild gradually rather than picking up where you left off. Consistency matters more than intensity when you're getting back into training.",
    };
  }

  if (answers.goal === "strength") {
    return {
      title: "STRENGTH FOUNDATION",
      description:
        "Begin with a strength-focused starting structure built around a few core lifts you can repeat and progress week to week.",
    };
  }

  if (answers.goal === "muscle") {
    return {
      title: "MUSCLE BUILDING FOUNDATION",
      description:
        "Focus on consistent resistance training across the week, repeating movements often enough to build a steady base.",
    };
  }

  if (answers.goal === "fat-loss") {
    return {
      title: "CONSISTENCY FIRST",
      description:
        "Combine consistent strength work with regular conditioning, kept simple enough to repeat week after week.",
    };
  }

  return {
    title: "BALANCED FOUNDATION",
    description:
      "A balanced mix of strength and cardio gives you a well-rounded starting point you can build on in any direction later.",
  };
}

export interface WeeklyStructure {
  label: string;
  sessions: string[];
}

/**
 * An illustrative weekly session pattern for the chosen number of training
 * days. These are general educational structures, not a personalised plan.
 */
export function getWeeklyStructure(days: string): WeeklyStructure {
  switch (days) {
    case "2":
      return {
        label: "2-Day Starting Structure",
        sessions: ["01 / FULL BODY", "02 / FULL BODY"],
      };
    case "3":
      return {
        label: "3-Day Starting Structure",
        sessions: ["01 / STRENGTH", "02 / CONDITIONING", "03 / FULL BODY"],
      };
    case "4":
      return {
        label: "4-Day Starting Structure",
        sessions: [
          "01 / LOWER",
          "02 / UPPER",
          "03 / CONDITIONING",
          "04 / FULL BODY",
        ],
      };
    default:
      return {
        label: "Balanced Weekly Structure",
        sessions: [
          "01 / LOWER",
          "02 / UPPER",
          "03 / CONDITIONING",
          "04 / FULL BODY",
          "05 / ACTIVE RECOVERY OR CONDITIONING",
        ],
      };
  }
}

/** Static display label for each question id, used by the summary readout. */
const SUMMARY_LABELS: Record<string, string> = {
  goal: "GOAL",
  experience: "EXPERIENCE",
  days: "COMMITMENT",
  time: "PREFERRED TIME",
  support: "WHAT WOULD HELP",
};

/**
 * Resolve the chosen answers to a human-readable {label, value} list for the
 * result summary. A question with no matching answer (or an answer that
 * matches no option) is skipped gracefully rather than throwing or rendering
 * a blank row.
 */
export function formatAnswersForSummary(
  answers: StartAnswers,
  questions: StartQuestion[]
): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];

  for (const question of questions) {
    const selected = (answers as unknown as Record<string, string | undefined>)[question.id];
    if (!selected) continue;
    const option = question.options.find((o) => o.value === selected);
    if (!option) continue;
    rows.push({
      label: SUMMARY_LABELS[question.id] ?? question.id.toUpperCase(),
      value: option.label,
    });
  }

  return rows;
}

/** Resolve one answer id to its human option label, with a graceful fallback. */
function resolveLabel(
  answers: StartAnswers,
  questions: StartQuestion[],
  id: string
): string {
  const selected = (answers as unknown as Record<string, string | undefined>)[id];
  if (!selected) return "Not specified";
  const question = questions.find((q) => q.id === id);
  const option = question?.options.find((o) => o.value === selected);
  return option?.label ?? "Not specified";
}

/**
 * Build the WhatsApp message a visitor sends from the result view.
 *
 * This function only ever has the five quiz answers and the recommendation
 * title — by design there is no height, weight, age or medical field it could
 * include. The structure is fixed so the message reads cleanly in WhatsApp.
 */
export function buildWhatsAppSummaryMessage(
  gymName: string,
  answers: StartAnswers,
  questions: StartQuestion[],
  recommendation: StartRecommendation
): string {
  const goal = resolveLabel(answers, questions, "goal");
  const experience = resolveLabel(answers, questions, "experience");
  const days = resolveLabel(answers, questions, "days");
  const time = resolveLabel(answers, questions, "time");
  const support = resolveLabel(answers, questions, "support");

  return [
    `Hi ${gymName},`,
    "",
    "I used your Find Your Starting Point tool.",
    "",
    `My goal: ${goal}`,
    `Experience: ${experience}`,
    `Training commitment: ${days}`,
    `Preferred time: ${time}`,
    `What would help me start: ${support}`,
    "",
    `My starting point: ${recommendation.title}`,
    "",
    "I'd like to know how I can get started.",
  ].join("\n");
}
