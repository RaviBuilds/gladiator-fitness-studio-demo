/**
 * Shared tool session state — versioned sessionStorage helpers.
 *
 * TWO KEYS, TWO OWNERS:
 *
 *   gf.tools.v1   — the shared, OPTIONAL handoff between interactive tools.
 *                   /start and /journey write it when their result appears;
 *                   /first-30-days reads it to prefill (never require) its
 *                   experience / time questions. Start over in a tool never
 *                   clears it.
 *   gf.first30.v1 — /first-30-days' own in-progress state (step + answers),
 *                   so a refresh mid-flow resumes. Cleared by Start over.
 *
 * Pure parse/serialise functions are separated from the thin browser
 * wrappers so they can be unit-tested under Node. Every wrapper is guarded:
 * SSR, disabled storage (privacy mode) or malformed data yield null / no-op,
 * never a thrown error. Values are enum strings only — no free text and no
 * personal data is stored.
 */

export const HANDOFF_KEY = "gf.tools.v1";
export const FIRST30_KEY = "gf.first30.v1";
const VERSION = 1;

export type HandoffSource = "start" | "journey";

export interface ToolHandoff {
  v: 1;
  source: HandoffSource;
  /** Raw experience value from the source tool (mapped by the reader). */
  experience?: string;
  /** Raw preferred-time value (Tool 1 only). */
  timePreference?: string;
  /** "2" | "3" | "4" | "5+" */
  daysPerWeek?: string;
}

export interface First30Stored {
  v: 1;
  step: number;
  /** Phase the visitor was in. */
  phase: "entry" | "flow" | "result";
  answers: Record<string, unknown>;
  includeObstacle: boolean;
}

const SAFE_VALUE = /^[a-z0-9+-]{1,24}$/i;

function safeString(value: unknown): string | undefined {
  return typeof value === "string" && SAFE_VALUE.test(value) ? value : undefined;
}

function parseJson(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

// -------------------------------------------------------------- handoff ---

export function parseToolHandoff(raw: string | null): ToolHandoff | null {
  const data = parseJson(raw);
  if (!data || data.v !== VERSION) return null;
  if (data.source !== "start" && data.source !== "journey") return null;
  const out: ToolHandoff = { v: 1, source: data.source };
  const experience = safeString(data.experience);
  const timePreference = safeString(data.timePreference);
  const daysPerWeek = safeString(data.daysPerWeek);
  if (experience) out.experience = experience;
  if (timePreference) out.timePreference = timePreference;
  if (daysPerWeek) out.daysPerWeek = daysPerWeek;
  return out;
}

export function serializeToolHandoff(handoff: ToolHandoff): string {
  return JSON.stringify(handoff);
}

/**
 * Merge a tool's new values over the previous handoff. A field the writer does
 * not supply (e.g. /journey has no time question) keeps the earlier value, so
 * one tool never wipes another's answer.
 */
export function mergeToolHandoff(
  previous: ToolHandoff | null,
  next: Omit<ToolHandoff, "v">
): ToolHandoff {
  const merged: ToolHandoff = { ...(previous ?? {}), v: 1, source: next.source };
  for (const key of ["experience", "timePreference", "daysPerWeek"] as const) {
    const value = safeString(next[key]);
    if (value) merged[key] = value;
  }
  return merged;
}

// ---------------------------------------------------------- tool state ---

export function parseFirst30State(raw: string | null): First30Stored | null {
  const data = parseJson(raw);
  if (!data || data.v !== VERSION) return null;
  const phase = data.phase;
  if (phase !== "entry" && phase !== "flow" && phase !== "result") return null;
  const step = typeof data.step === "number" && Number.isInteger(data.step) && data.step >= 0 && data.step < 10 ? data.step : 0;
  const answers = data.answers && typeof data.answers === "object" && !Array.isArray(data.answers)
    ? (data.answers as Record<string, unknown>)
    : {};
  return { v: 1, phase, step, answers, includeObstacle: data.includeObstacle === true };
}

export function serializeFirst30State(state: Omit<First30Stored, "v">): string {
  return JSON.stringify({ v: VERSION, ...state });
}

// ---------------------------------------------------- browser wrappers ---

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function safeGet(key: string): string | null {
  try {
    return storage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    storage()?.setItem(key, value);
  } catch {
    /* storage full / disabled — the tools work without it */
  }
}

export function readToolHandoff(): ToolHandoff | null {
  return parseToolHandoff(safeGet(HANDOFF_KEY));
}

export function writeToolHandoff(next: Omit<ToolHandoff, "v">): void {
  safeSet(HANDOFF_KEY, serializeToolHandoff(mergeToolHandoff(readToolHandoff(), next)));
}

export function readFirst30State(): First30Stored | null {
  return parseFirst30State(safeGet(FIRST30_KEY));
}

export function writeFirst30State(state: Omit<First30Stored, "v">): void {
  safeSet(FIRST30_KEY, serializeFirst30State(state));
}

export function clearFirst30State(): void {
  try {
    storage()?.removeItem(FIRST30_KEY);
  } catch {
    /* no-op */
  }
}
