import { NextResponse } from "next/server";
import { business } from "@/lib/business";
import { contact, contactEmailLabels, contactFieldErrorMessage } from "@/lib/contact";
import {
  CONTACT_ELAPSED_FIELD,
  CONTACT_HONEYPOT_FIELD,
  CONTACT_MAX_REQUEST_BYTES,
  isSuspectedSpam,
  phoneDigits,
  validateContactSubmission,
  type ContactFieldErrors,
} from "@/lib/contact-validation";
import { renderContactInquiryEmail } from "@/emails/contact-inquiry-email";
import type { ContactFieldName } from "@/lib/types";

/**
 * Server-only contact/inquiry endpoint. Delivers submissions to the gym's
 * inbox through the Resend HTTP API.
 *
 * SECURITY CONTRACT
 * - RESEND_API_KEY / CONTACT_TO_EMAIL / CONTACT_FROM_EMAIL are read from
 *   process.env here and nowhere else. None are NEXT_PUBLIC_, so none can
 *   reach the client bundle.
 * - The visitor never controls the sender. `from` comes from
 *   CONTACT_FROM_EMAIL; a supplied email address is only ever used as
 *   `reply_to`.
 * - The request body is length-capped before parsing, then re-validated with
 *   the same rules the client uses (lib/contact-validation.ts).
 * - Responses carry configured, user-safe copy only. Provider payloads, stack
 *   traces, env values and file paths are never returned.
 *
 * WHY NO `resend` SDK: the project's dependency discipline is zero new
 * dependencies (AGENTS.md). Resend's documented HTTP endpoint is a single
 * POST, so the SDK would add a package for one fetch call. Swapping in the
 * SDK later requires changing only `sendWithResend` below.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const RESEND_TIMEOUT_MS = 10_000;

/** Throttle window: a handful of inquiries per IP per window is plenty. */
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_MAX_KEYS = 500;

/**
 * Per-instance throttle. Intentionally in-memory: it needs no dependency and
 * no store, and it blunts casual abuse. On serverless each instance keeps its
 * own counters, so this is a baseline rather than a global guarantee — front
 * it with platform-level protection if a site is ever actively targeted.
 */
const requestLog = new Map<string, number[]>();

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(key) ?? []).filter(
    (at) => now - at < RATE_LIMIT_WINDOW_MS
  );

  if (recent.length >= RATE_LIMIT_MAX) {
    requestLog.set(key, recent);
    return true;
  }

  recent.push(now);
  requestLog.set(key, recent);

  if (requestLog.size > RATE_LIMIT_MAX_KEYS) {
    for (const [existingKey, stamps] of requestLog) {
      if (stamps.every((at) => now - at >= RATE_LIMIT_WINDOW_MS)) {
        requestLog.delete(existingKey);
      }
    }
  }

  return false;
}

/** Trimmed env value, or undefined when unset/blank. */
function env(name: string): string | undefined {
  const value = process.env[name];
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Builds the `from` header. Honours a pre-formatted `Name <addr>` value, and
 * otherwise attaches the gym's name with anything that could break the header
 * removed.
 */
function senderHeader(fromEmail: string): string {
  if (fromEmail.includes("<")) return fromEmail;
  const displayName = business.name
    .replace(/[<>"\\,;:\r\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return displayName ? `${displayName} <${fromEmail}>` : fromEmail;
}

function fieldErrorMessages(fieldErrors: ContactFieldErrors) {
  const messages: Partial<Record<ContactFieldName, string>> = {};
  for (const [field, code] of Object.entries(fieldErrors) as [
    ContactFieldName,
    NonNullable<ContactFieldErrors[ContactFieldName]>,
  ][]) {
    messages[field] = contactFieldErrorMessage(field, code);
  }
  return messages;
}

/** Sends through Resend's HTTP API. Returns a safe, logged-only diagnostic. */
async function sendWithResend(payload: {
  apiKey: string;
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: true } | { ok: false; diagnostic: string }> {
  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${payload.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: payload.from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
      cache: "no-store",
    });

    if (response.ok) return { ok: true };

    // Read a bounded slice for the server log only; never returned to the client.
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    return { ok: false, diagnostic: `status=${response.status} detail=${detail}` };
  } catch (error) {
    const reason = error instanceof Error ? `${error.name}: ${error.message}` : "unknown";
    return { ok: false, diagnostic: `transport=${reason}` };
  }
}

export async function POST(request: Request) {
  const key = clientKey(request);

  if (isRateLimited(key)) {
    return NextResponse.json(
      { error: contact.form.throttledMessage },
      { status: 429, headers: { "Retry-After": "600" } }
    );
  }

  // Cap the body before parsing so an oversized post can't be buffered.
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > CONTACT_MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: contact.form.validationSummary }, { status: 413 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: contact.form.validationSummary }, { status: 400 });
  }

  if (rawBody.length > CONTACT_MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: contact.form.validationSummary }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: contact.form.validationSummary }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: contact.form.validationSummary }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;

  // Anti-spam baseline. Bots get a 200 so they learn nothing; nothing is sent.
  if (
    isSuspectedSpam({
      honeypot: payload[CONTACT_HONEYPOT_FIELD],
      elapsedMs: payload[CONTACT_ELAPSED_FIELD],
    })
  ) {
    console.info("[contact] submission discarded by anti-spam baseline");
    return NextResponse.json({ ok: true });
  }

  const validation = validateContactSubmission(payload, {
    collectEmail: contact.collectEmail,
  });

  if (!validation.ok) {
    return NextResponse.json(
      {
        error: contact.form.validationSummary,
        fieldErrors: fieldErrorMessages(validation.fieldErrors),
      },
      { status: 400 }
    );
  }

  const values = validation.values;
  const apiKey = env(contact.delivery.apiKeyEnvVar);
  const recipient = env(contact.delivery.recipientEnvVar);
  const sender = env(contact.delivery.senderEnvVar);

  // Redacted diagnostic: enough to confirm traffic, no message body, no PII.
  const trace = {
    nameLength: values.name.length,
    phoneDigits: phoneDigits(values.phone).length,
    hasEmail: Boolean(values.email),
    messageLength: values.message.length,
  };

  if (!apiKey || !recipient || !sender) {
    const missing = [
      !apiKey && contact.delivery.apiKeyEnvVar,
      !recipient && contact.delivery.recipientEnvVar,
      !sender && contact.delivery.senderEnvVar,
    ].filter(Boolean);

    // Explicit, not silent: the visitor is told it did not send.
    console.warn(
      `[contact] delivery not configured — missing ${missing.join(", ")}; submission not delivered`,
      trace
    );

    return NextResponse.json(
      { error: contact.form.notConfiguredMessage, code: "not_configured" },
      { status: 503 }
    );
  }

  const email = renderContactInquiryEmail({
    values,
    labels: contactEmailLabels(),
    subjectTemplate: contact.delivery.subjectTemplate,
    sourceLabel: contact.delivery.sourceLabel,
    businessName: business.name,
    receivedAt: new Date().toISOString(),
  });

  const result = await sendWithResend({
    apiKey,
    from: senderHeader(sender),
    to: recipient,
    // Visitor address is a reply target only — never the sender.
    replyTo: values.email || undefined,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  if (!result.ok) {
    console.error(`[contact] provider send failed — ${result.diagnostic}`, trace);
    return NextResponse.json({ error: contact.form.errorMessage }, { status: 502 });
  }

  console.info("[contact] inquiry delivered", trace);
  return NextResponse.json({ ok: true });
}
