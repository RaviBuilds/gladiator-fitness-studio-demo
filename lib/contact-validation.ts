import type { ContactFieldErrorCode, ContactFieldName } from "./types";

/**
 * Shared contact-form validation. Imported by BOTH the client form and the
 * server route handler, so the two can never drift: the browser gets fast
 * feedback, the server re-runs the identical rules and is the only authority.
 *
 * Zero dependencies, no secrets, safe to ship in the client bundle.
 */

/**
 * Honeypot field name. Deliberately plausible-looking to a bot and hidden
 * off-screen for humans. A non-empty value means "not a person".
 */
export const CONTACT_HONEYPOT_FIELD = "contact_reference";

/** Body key carrying how long the visitor spent on the form, in ms. */
export const CONTACT_ELAPSED_FIELD = "elapsedMs";

/**
 * Minimum plausible fill time. Typing a name, a phone number and a message
 * cannot be done in under a second; scripted posts usually are instant.
 * Generous enough that autofill + paste still passes.
 */
export const CONTACT_MIN_ELAPSED_MS = 1200;

/** Hard cap on the request body the endpoint will read at all. */
export const CONTACT_MAX_REQUEST_BYTES = 8 * 1024;

export const CONTACT_LIMITS = {
  name: { min: 2, max: 80 },
  /** `max` counts all characters; `maxDigits`/`minDigits` count digits only. */
  phone: { max: 24, minDigits: 7, maxDigits: 18 },
  email: { max: 160 },
  message: { min: 10, max: 1200 },
} as const;

export type ContactFieldErrors = Partial<Record<ContactFieldName, ContactFieldErrorCode>>;

export interface ContactSubmissionValues {
  name: string;
  phone: string;
  /** Empty string when not collected or not supplied. */
  email: string;
  message: string;
}

export type ContactValidationResult =
  | { ok: true; values: ContactSubmissionValues }
  | { ok: false; fieldErrors: ContactFieldErrors };

/**
 * Control characters that must never survive into an email header or body.
 * \n (\u000A) and \t (\u0009) are intentionally excluded — they are handled
 * per field by the normalizers below.
 */
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Single-line normalization: strip control chars, collapse all whitespace. */
export function normalizeLine(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(CONTROL_CHARS, " ").replace(/\s+/g, " ").trim();
}

/**
 * Multiline normalization for the message: keep paragraph breaks, drop
 * control characters, collapse runs of spaces and of blank lines.
 */
export function normalizeMultiline(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARS, " ")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Digits only, used for phone plausibility checks. */
export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

const PHONE_ALLOWED = /^[+(\d][\d\s().+-]*$/;

/**
 * Pragmatic email shape check. Intentionally not RFC-exhaustive: the goal is
 * to reject obviously malformed input, not to adjudicate exotic addresses.
 */
const EMAIL_SHAPE = /^[^\s@,;:<>"]+@[^\s@,;:<>".]+(\.[^\s@,;:<>".]+)+$/;

export function isPlausibleEmail(value: string): boolean {
  return value.length <= CONTACT_LIMITS.email.max && EMAIL_SHAPE.test(value);
}

/**
 * Validates and normalizes a raw submission from any source. Returns every
 * field error at once so the UI can mark all offending fields in one pass.
 * Error *codes* are returned, never copy — the wording lives in lib/contact.ts.
 */
export function validateContactSubmission(
  input: unknown,
  options: { collectEmail: boolean }
): ContactValidationResult {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<
    string,
    unknown
  >;

  const name = normalizeLine(raw.name);
  const phone = normalizeLine(raw.phone);
  const email = options.collectEmail ? normalizeLine(raw.email).toLowerCase() : "";
  const message = normalizeMultiline(raw.message);

  const fieldErrors: ContactFieldErrors = {};

  if (!name) fieldErrors.name = "required";
  else if (name.length < CONTACT_LIMITS.name.min) fieldErrors.name = "tooShort";
  else if (name.length > CONTACT_LIMITS.name.max) fieldErrors.name = "tooLong";

  if (!phone) {
    fieldErrors.phone = "required";
  } else if (phone.length > CONTACT_LIMITS.phone.max) {
    fieldErrors.phone = "tooLong";
  } else {
    const digits = phoneDigits(phone);
    if (
      !PHONE_ALLOWED.test(phone) ||
      digits.length < CONTACT_LIMITS.phone.minDigits ||
      digits.length > CONTACT_LIMITS.phone.maxDigits
    ) {
      fieldErrors.phone = "invalid";
    }
  }

  if (email) {
    if (email.length > CONTACT_LIMITS.email.max) fieldErrors.email = "tooLong";
    else if (!isPlausibleEmail(email)) fieldErrors.email = "invalid";
  }

  if (!message) fieldErrors.message = "required";
  else if (message.length < CONTACT_LIMITS.message.min) fieldErrors.message = "tooShort";
  else if (message.length > CONTACT_LIMITS.message.max) fieldErrors.message = "tooLong";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return { ok: true, values: { name, phone, email, message } };
}

/**
 * Lightweight bot signal: a filled honeypot, or a submission returned faster
 * than a human could type one. No captcha, no third-party service, nothing a
 * normal visitor can trip. A missing/garbled timing value is treated as
 * human, so the check can never lock out a legitimate submission.
 */
export function isSuspectedSpam(input: {
  honeypot?: unknown;
  elapsedMs?: unknown;
}): boolean {
  if (typeof input.honeypot === "string" && input.honeypot.trim().length > 0) {
    return true;
  }
  const elapsed = input.elapsedMs;
  if (typeof elapsed === "number" && Number.isFinite(elapsed) && elapsed >= 0) {
    return elapsed < CONTACT_MIN_ELAPSED_MS;
  }
  return false;
}
