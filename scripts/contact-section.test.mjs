// Zero-dependency tests for Section 10 (Contact / Inquiry) and its server route.
// Run: node --test scripts/contact-section.test.mjs  (Node >= 22.18 type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { business } from "../lib/business.ts";
import {
  contact,
  contactDirectory,
  contactEmailLabels,
  contactFieldErrorMessage,
} from "../lib/contact.ts";
import {
  CONTACT_ELAPSED_FIELD,
  CONTACT_HONEYPOT_FIELD,
  CONTACT_LIMITS,
  CONTACT_MIN_ELAPSED_MS,
  isPlausibleEmail,
  isSuspectedSpam,
  normalizeMultiline,
  validateContactSubmission,
} from "../lib/contact-validation.ts";
import {
  buildInquirySubject,
  escapeHtml,
  renderContactInquiryEmail,
  sanitizeSubject,
} from "../emails/contact-inquiry-email.ts";

const SECTION_SRC = readFileSync(
  new URL("../components/sections/Contact.tsx", import.meta.url),
  "utf8"
);
const FORM_SRC = readFileSync(
  new URL("../components/motion/ContactForm.tsx", import.meta.url),
  "utf8"
);
const ROUTE_SRC = readFileSync(
  new URL("../app/api/contact/route.ts", import.meta.url),
  "utf8"
);
const CONFIG_SRC = readFileSync(new URL("../lib/contact.ts", import.meta.url), "utf8");
const CSS_SRC = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const ENV_EXAMPLE = readFileSync(new URL("../.env.example", import.meta.url), "utf8");

const OK = { name: "Dana Reyes", phone: "+1 555 010 0200", email: "dana@example.com", message: "Hello, I have a question about joining and training times." };

/** Renders the inquiry email with the same composition the route uses. */
const renderEmail = (overrides = {}) =>
  renderContactInquiryEmail({
    values: { ...OK, ...overrides },
    labels: contactEmailLabels(),
    subjectTemplate: contact.delivery.subjectTemplate,
    sourceLabel: contact.delivery.sourceLabel,
    businessName: "Demo Gym",
    receivedAt: "2026-01-01T00:00:00.000Z",
  });

// ------------------------------------------------------------------ validation

test("a complete submission validates and comes back normalized", () => {
  const result = validateContactSubmission(
    { name: "  Dana   Reyes ", phone: " +1 555 010 0200 ", email: " Dana@Example.COM ", message: "  Hello, I have a question about training.  " },
    { collectEmail: true }
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.values, {
    name: "Dana Reyes",
    phone: "+1 555 010 0200",
    email: "dana@example.com",
    message: "Hello, I have a question about training.",
  });
});

test("an empty submission reports every required field at once", () => {
  const result = validateContactSubmission({}, { collectEmail: true });
  assert.equal(result.ok, false);
  assert.deepEqual(result.fieldErrors, {
    name: "required",
    phone: "required",
    message: "required",
  });
});

test("whitespace-only values are not accepted as content", () => {
  const result = validateContactSubmission(
    { name: "   ", phone: "\t\n", message: "     " },
    { collectEmail: true }
  );
  assert.equal(result.ok, false);
  assert.equal(result.fieldErrors.name, "required");
  assert.equal(result.fieldErrors.phone, "required");
  assert.equal(result.fieldErrors.message, "required");
});

test("one missing required field is reported on that field only", () => {
  const result = validateContactSubmission({ ...OK, phone: "" }, { collectEmail: true });
  assert.equal(result.ok, false);
  assert.deepEqual(result.fieldErrors, { phone: "required" });
});

test("a malformed phone number is rejected, a dialable one is not", () => {
  assert.equal(
    validateContactSubmission({ ...OK, phone: "call me" }, { collectEmail: true }).ok,
    false
  );
  assert.equal(
    validateContactSubmission({ ...OK, phone: "12345" }, { collectEmail: true }).ok,
    false
  );
  for (const phone of ["+15550100200", "(555) 010-0200", "555 010 0200", "+91 98765 43210"]) {
    assert.equal(
      validateContactSubmission({ ...OK, phone }, { collectEmail: true }).ok,
      true,
      `expected ${phone} to validate`
    );
  }
});

test("email is optional but validated when supplied", () => {
  assert.equal(validateContactSubmission({ ...OK, email: "" }, { collectEmail: true }).ok, true);
  const bad = validateContactSubmission({ ...OK, email: "dana@example" }, { collectEmail: true });
  assert.equal(bad.ok, false);
  assert.deepEqual(bad.fieldErrors, { email: "invalid" });
  assert.equal(isPlausibleEmail("a@b.co"), true);
  assert.equal(isPlausibleEmail("a@b"), false);
  assert.equal(isPlausibleEmail("a b@c.com"), false);
});

test("the email field is ignored entirely when the gym does not collect it", () => {
  const result = validateContactSubmission({ ...OK, email: "nonsense@@" }, { collectEmail: false });
  assert.equal(result.ok, true);
  assert.equal(result.values.email, "");
});

test("over-length values are rejected rather than silently stored", () => {
  const long = (n) => "x".repeat(n);
  assert.equal(
    validateContactSubmission({ ...OK, name: long(CONTACT_LIMITS.name.max + 1) }, { collectEmail: true })
      .fieldErrors.name,
    "tooLong"
  );
  assert.equal(
    validateContactSubmission({ ...OK, message: long(CONTACT_LIMITS.message.max + 1) }, { collectEmail: true })
      .fieldErrors.message,
    "tooLong"
  );
  assert.equal(
    validateContactSubmission({ ...OK, email: `${long(CONTACT_LIMITS.email.max)}@example.com` }, { collectEmail: true })
      .fieldErrors.email,
    "tooLong"
  );
});

test("non-object payloads never crash the validator", () => {
  for (const input of [null, undefined, 42, "string", [], true]) {
    assert.equal(validateContactSubmission(input, { collectEmail: true }).ok, false);
  }
});

test("control characters cannot survive normalization", () => {
  const result = validateContactSubmission(
    { ...OK, name: "Da\u0000na\u001bReyes", message: "line one\r\nline two\u0007 end" },
    { collectEmail: true }
  );
  assert.equal(result.ok, true);
  assert.match(result.values.name, /^[\w .'-]+$/);
  assert.equal(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(result.values.message), false);
});

test("the message keeps paragraph breaks but collapses blank-line runs", () => {
  assert.equal(normalizeMultiline("a\n\n\n\n b \n\nc"), "a\n\nb\n\nc");
});

// ------------------------------------------------------------------ anti-spam

test("a filled honeypot is treated as a bot", () => {
  assert.equal(isSuspectedSpam({ honeypot: "http://spam.example" }), true);
  assert.equal(isSuspectedSpam({ honeypot: "" }), false);
  assert.equal(isSuspectedSpam({ honeypot: "   " }), false);
});

test("instant submissions are treated as bots, human-speed ones are not", () => {
  assert.equal(isSuspectedSpam({ elapsedMs: 0 }), true);
  assert.equal(isSuspectedSpam({ elapsedMs: CONTACT_MIN_ELAPSED_MS - 1 }), true);
  assert.equal(isSuspectedSpam({ elapsedMs: CONTACT_MIN_ELAPSED_MS }), false);
  assert.equal(isSuspectedSpam({ elapsedMs: 45_000 }), false);
});

test("a missing or garbled timing value can never lock out a real visitor", () => {
  for (const elapsedMs of [undefined, null, "fast", NaN, -1, {}]) {
    assert.equal(isSuspectedSpam({ elapsedMs }), false);
  }
});

// ------------------------------------------------------------- data contract

test("every field label, CTA and status message is configurable data", () => {
  const form = contact.form;
  for (const value of [
    contact.headline,
    contact.supporting,
    contact.primaryCtaLabel,
    form.submitLabel,
    form.submittingLabel,
    form.successTitle,
    form.successBody,
    form.errorMessage,
    form.notConfiguredMessage,
    form.throttledMessage,
    form.validationSummary,
    form.note,
    form.resetLabel,
  ]) {
    assert.equal(typeof value, "string");
    assert.ok(value.trim().length > 0);
  }
  for (const field of ["name", "phone", "email", "message"]) {
    assert.ok(form.fields[field].label.trim().length > 0, `${field} needs a visible label`);
    assert.ok(form.fields[field].index.trim().length > 0);
  }
});

test("required fields carry required copy and email is the only optional one", () => {
  assert.ok(contact.form.fields.name.errors.required);
  assert.ok(contact.form.fields.phone.errors.required);
  assert.ok(contact.form.fields.message.errors.required);
  assert.equal(contact.form.fields.email.errors.required, undefined);
  assert.ok(contact.form.fields.email.optionalLabel);
});

test("the form collects nothing beyond name, phone, email and message", () => {
  assert.deepEqual(Object.keys(contact.form.fields).sort(), ["email", "message", "name", "phone"]);
});

test("validation codes resolve to configured copy, with a safe fallback", () => {
  assert.equal(contactFieldErrorMessage("name", "required"), contact.form.fields.name.errors.required);
  assert.equal(contactFieldErrorMessage("email", "required"), contact.form.validationSummary);
});

test("no response-time promise ships by default", () => {
  assert.equal(contact.form.responseNote, undefined);
  assert.equal(/shortly|within \d|24 hours|same day/i.test(contact.form.successBody), false);
});

test("the contact directory is composed from business data, not from copy", () => {
  const entries = contactDirectory(business);
  assert.ok(entries.length >= 2);
  const phone = entries.find((entry) => entry.id === "phone");
  assert.ok(phone.href.startsWith("tel:"));
  assert.equal(CONFIG_SRC.includes(phone.value), false, "phone must not be duplicated into lib/contact.ts");
  const address = entries.find((entry) => entry.id === "address");
  assert.ok(address.value.length > 0);
  assert.equal(address.href, undefined);
});

test("the directory renders only the channels the business actually has", () => {
  const withoutEmail = contactDirectory({ ...business, email: undefined });
  assert.equal(withoutEmail.some((entry) => entry.id === "email"), false);
  const withEmail = contactDirectory({ ...business, email: "hello@example.com" });
  const entry = withEmail.find((item) => item.id === "email");
  assert.equal(entry.href, "mailto:hello@example.com");
});

test("placeholder business data is flagged, never presented as verified", () => {
  assert.equal(contact.dataVerified, false);
  assert.ok(contact.directory.unverifiedNotice.length > 0);
  assert.match(SECTION_SRC, /!contact\.dataVerified/);
});

test("the config layer holds no secrets and no provider values", () => {
  assert.equal(/re_[A-Za-z0-9]{8,}/.test(CONFIG_SRC), false);
  assert.equal(/RESEND_API_KEY\s*[:=]\s*["'`]/.test(CONFIG_SRC), false);
  assert.equal(CONFIG_SRC.includes("process.env"), false);
  assert.equal(CONFIG_SRC.includes("NEXT_PUBLIC_"), false);
  // Only the *names* of the env vars are recorded.
  assert.equal(contact.delivery.recipientEnvVar, "CONTACT_TO_EMAIL");
  assert.equal(contact.delivery.senderEnvVar, "CONTACT_FROM_EMAIL");
  assert.equal(contact.delivery.apiKeyEnvVar, "RESEND_API_KEY");
});

test("the background art is an existing project asset", () => {
  assert.match(contact.background.src, /^\/assets\//);
  assert.equal(/^https?:/.test(contact.background.src), false);
});

// ---------------------------------------------------------------- email body

test("the subject follows the configured pattern and cannot carry a header break", () => {
  assert.equal(
    buildInquirySubject(contact.delivery.subjectTemplate, {
      name: "Dana Reyes",
      businessName: "Demo Gym",
    }),
    "New website enquiry — Dana Reyes"
  );
  assert.equal(sanitizeSubject("Dana\r\nBcc: victim@example.com"), "Dana Bcc: victim@example.com");
  const clamped = sanitizeSubject(`x${"y".repeat(400)}`, 40);
  assert.equal(clamped.length, 40);
});

test("the subject carries no message content", () => {
  const email = renderEmail();
  assert.equal(email.subject.includes(OK.message), false);
  assert.equal(email.subject.includes(OK.phone), false);
});

test("visitor input is HTML-escaped in the email body", () => {
  const email = renderEmail({
    name: 'Dana "><script>alert(1)</script>',
    message: "<img src=x onerror=alert(1)> & <b>bold</b>",
  });
  assert.equal(email.html.includes("<script>"), false);
  assert.equal(email.html.includes("<img"), false);
  assert.ok(email.html.includes("&lt;script&gt;"));
  assert.ok(email.html.includes("&lt;img src=x onerror=alert(1)&gt;"));
  assert.ok(email.html.includes("&amp;"));
  assert.equal(escapeHtml("<a href=\"x\">'&"), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;");
});

test("the email contains the four fields, the source line and a text alternative", () => {
  const email = renderEmail();
  for (const expected of [OK.name, OK.phone, OK.email, OK.message, "Demo Gym", contact.delivery.sourceLabel]) {
    assert.ok(email.html.includes(expected), `html missing ${expected}`);
    assert.ok(email.text.includes(expected), `text missing ${expected}`);
  }
  assert.ok(email.text.includes("Submitted from:"));
});

test("an omitted email address simply drops its row", () => {
  const email = renderEmail({ email: "" });
  assert.equal(email.html.includes("mailto:"), false);
  assert.equal(email.text.includes(`${contact.form.fields.email.label}:`), false);
});

test("newlines in the message become line breaks, not raw markup", () => {
  const email = renderEmail({ message: "one\ntwo" });
  assert.ok(email.html.includes("one<br />two"));
});

test("the email template is standalone: no project imports, no env access", () => {
  const src = readFileSync(new URL("../emails/contact-inquiry-email.ts", import.meta.url), "utf8");
  assert.equal(/^import /m.test(src), false);
  assert.equal(src.includes("process.env"), false);
});

// -------------------------------------------------------------- server route

test("the route reads the three delivery variables from the server environment only", () => {
  for (const name of ["RESEND_API_KEY", "CONTACT_TO_EMAIL", "CONTACT_FROM_EMAIL"]) {
    assert.ok(
      ROUTE_SRC.includes(name) || CONFIG_SRC.includes(name),
      `${name} must be referenced by the route or its config`
    );
  }
  assert.ok(ROUTE_SRC.includes("process.env[name]"));
  // No client-exposed variable is ever read for delivery.
  assert.equal(/NEXT_PUBLIC_[A-Z]/.test(ROUTE_SRC), false);
  assert.equal(/process\.env\.NEXT_PUBLIC/.test(ROUTE_SRC), false);
  assert.equal(/re_[A-Za-z0-9]{8,}/.test(ROUTE_SRC), false);
});

test("a missing provider configuration is explicit, not a fake success", () => {
  assert.match(ROUTE_SRC, /status: 503/);
  assert.match(ROUTE_SRC, /code: "not_configured"/);
  assert.match(ROUTE_SRC, /notConfiguredMessage/);
  const notConfiguredBlock = ROUTE_SRC.slice(
    ROUTE_SRC.indexOf("if (!apiKey || !recipient || !sender)"),
    ROUTE_SRC.indexOf("const email = renderContactInquiryEmail")
  );
  assert.equal(notConfiguredBlock.includes("ok: true"), false);
});

test("the visitor never controls the sender; a supplied email is reply-to only", () => {
  assert.match(ROUTE_SRC, /from: senderHeader\(sender\)/);
  assert.match(ROUTE_SRC, /replyTo: values\.email \|\| undefined/);
  assert.match(ROUTE_SRC, /reply_to: payload\.replyTo/);
  // `from` is never built from request data.
  assert.equal(/from:\s*(values|payload\.email|body)/.test(ROUTE_SRC), false);
});

test("HTTP semantics: 4xx for input, 429 for throttling, 5xx for delivery", () => {
  assert.match(ROUTE_SRC, /status: 400/);
  assert.match(ROUTE_SRC, /status: 413/);
  assert.match(ROUTE_SRC, /status: 429/);
  assert.match(ROUTE_SRC, /status: 502/);
  assert.match(ROUTE_SRC, /status: 503/);
});

test("provider internals are logged, never returned", () => {
  assert.match(ROUTE_SRC, /console\.error\(`\[contact\] provider send failed/);
  const failureBlock = ROUTE_SRC.slice(ROUTE_SRC.indexOf("if (!result.ok)"));
  assert.match(failureBlock, /error: contact\.form\.errorMessage/);
  assert.equal(failureBlock.includes("diagnostic }"), false);
  assert.equal(/error:\s*(error|String\(error\)|err\.message)/.test(ROUTE_SRC), false);
});

test("the request body is capped before and after reading", () => {
  assert.match(ROUTE_SRC, /content-length/);
  assert.match(ROUTE_SRC, /CONTACT_MAX_REQUEST_BYTES/);
});

test("the route re-validates server-side with the shared rules", () => {
  assert.match(ROUTE_SRC, /validateContactSubmission\(payload/);
  assert.match(ROUTE_SRC, /isSuspectedSpam\(/);
  assert.match(ROUTE_SRC, new RegExp(`payload\\[CONTACT_HONEYPOT_FIELD\\]`));
  assert.match(ROUTE_SRC, new RegExp(`payload\\[CONTACT_ELAPSED_FIELD\\]`));
});

test("only the fixed public asset host is contacted, with a timeout", () => {
  const urls = ROUTE_SRC.match(/https?:\/\/[^"'`\s]+/g) ?? [];
  assert.deepEqual([...new Set(urls)], ["https://api.resend.com/emails"]);
  assert.match(ROUTE_SRC, /AbortSignal\.timeout\(RESEND_TIMEOUT_MS\)/);
});

// --------------------------------------------------------------- client form

test("the form ships no secret and no provider endpoint", () => {
  assert.equal(FORM_SRC.includes("process.env"), false);
  assert.equal(FORM_SRC.includes("resend"), false);
  assert.equal(FORM_SRC.includes("api.resend.com"), false);
  assert.match(FORM_SRC, /fetch\("\/api\/contact"/);
});

test("the form has all four states and blocks duplicate submissions", () => {
  assert.match(FORM_SRC, /"idle" \| "submitting" \| "success" \| "error"/);
  assert.match(FORM_SRC, /if \(status === "submitting"\) return;/);
  assert.match(FORM_SRC, /disabled=\{submitting\}/);
  assert.match(FORM_SRC, /aria-busy=\{submitting\}/);
});

test("entered content survives an error and is cleared only after success", () => {
  const successBranch = FORM_SRC.slice(
    FORM_SRC.indexOf("if (response.ok)"),
    FORM_SRC.indexOf("// Only configured")
  );
  assert.match(successBranch, /form\.reset\(\)/);
  assert.equal(FORM_SRC.split("form.reset()").length - 1, 1);
});

test("feedback is accessible: live regions, alerts and bound field errors", () => {
  assert.match(FORM_SRC, /aria-live="polite"/);
  assert.match(FORM_SRC, /role="alert"/);
  assert.match(FORM_SRC, /role="status"/);
  assert.match(FORM_SRC, /"aria-invalid": error \? true : undefined/);
  assert.match(FORM_SRC, /"aria-describedby": error \? errorId : undefined/);
  assert.match(FORM_SRC, /<label htmlFor=\{id\}/);
});

test("the honeypot is hidden from people and ignored by assistive tech", () => {
  assert.match(FORM_SRC, /factory-contact-honeypot/);
  assert.match(FORM_SRC, /aria-hidden="true"/);
  assert.match(FORM_SRC, /tabIndex=\{-1\}/);
  assert.match(CSS_SRC, /\.factory-contact-honeypot\s*\{[^}]*clip-path: inset\(50%\)/);
});

test("the form validates client-side with the same shared module as the server", () => {
  assert.match(FORM_SRC, /from "@\/lib\/contact-validation"/);
  assert.match(ROUTE_SRC, /from "@\/lib\/contact-validation"/);
});

// ------------------------------------------------------------------- section

test("the section hardcodes no business fact and no WhatsApp link", () => {
  assert.equal(/\+\d[\d\s()-]{6,}/.test(SECTION_SRC), false);
  assert.equal(SECTION_SRC.includes("wa.me"), false);
  assert.equal(SECTION_SRC.includes("Demo Street"), false);
  assert.match(SECTION_SRC, /contactDirectory\(\)/);
  assert.match(SECTION_SRC, /whatsappHref/);
});

test("the composition is asymmetric on the existing 12-column grid", () => {
  assert.match(SECTION_SRC, /lg:grid-cols-12/);
  assert.match(SECTION_SRC, /lg:col-span-5/);
  assert.match(SECTION_SRC, /lg:col-span-7/);
});

test("the background image is decorative and rendered through next/image", () => {
  assert.match(SECTION_SRC, /import Image from "next\/image"/);
  assert.match(SECTION_SRC, /alt=""/);
  assert.match(SECTION_SRC, /opacity-\[0\.12\]/);
  assert.match(SECTION_SRC, /aria-hidden="true"/);
});

test("one h2 for the section, supplied by the shared heading primitive", () => {
  assert.equal(SECTION_SRC.includes("<h1"), false);
  assert.equal(SECTION_SRC.includes("<h2"), false);
  assert.match(SECTION_SRC, /<SectionHeading/);
});

// ----------------------------------------------------------------------- css

test("section styles are scoped and respect reduced motion", () => {
  assert.match(CSS_SRC, /\.factory-contact \{/);
  assert.match(CSS_SRC, /--contact-error:/);
  const block = CSS_SRC.slice(CSS_SRC.indexOf("SECTION 10 — CONTACT"));
  assert.match(block, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(block, /\.factory-contact-progress \{\s*animation: none/);
  // Motion stays finite: no looping, bouncing or alternating animation.
  assert.equal(/infinite|alternate|steps\(|cubic-bezier\([^)]*-\d/.test(block), false);
  // Every selector in the block stays inside the section namespace.
  const selectors = block.replace(/\/\*[\s\S]*?\*\//g, "").match(/^[^\s@}][^{}\n]*\{/gm) ?? [];
  assert.ok(selectors.length > 25, `only ${selectors.length} rules found`);
  for (const raw of selectors) {
    const selector = raw.replace(/\{$/, "").trim();
    if (/^(from|to|\d+%)$/.test(selector)) continue;
    for (const part of selector.split(",")) {
      assert.ok(
        part.trim().includes(".factory-contact"),
        `selector escapes the Contact namespace: "${part.trim()}"`
      );
    }
  }
  assert.equal(/^:root/m.test(block), false);
});

test("inputs are square, dark, and 16px on mobile", () => {
  const input = CSS_SRC.slice(
    CSS_SRC.indexOf(".factory-contact-input {"),
    CSS_SRC.indexOf("textarea.factory-contact-input")
  );
  assert.match(input, /border-radius: 0/);
  assert.match(input, /font-size: 1rem/);
  assert.match(input, /min-height: 3rem/);
  assert.equal(input.includes("box-shadow"), false);
  assert.equal(input.includes("backdrop-filter"), false);
});

test("focus is visible on every field", () => {
  assert.match(FORM_SRC, /factory-contact-input factory-focus/);
  assert.match(CSS_SRC, /\.factory-focus:focus-visible \{/);
});

// ----------------------------------------------------------------- env docs

test(".env.example documents the three Resend variables with no real values", () => {
  for (const name of ["RESEND_API_KEY", "CONTACT_TO_EMAIL", "CONTACT_FROM_EMAIL"]) {
    assert.match(ENV_EXAMPLE, new RegExp(`^${name}=$`, "m"), `${name} must be present and empty`);
  }
  assert.equal(ENV_EXAMPLE.includes("NEXT_PUBLIC_RESEND"), false);
  assert.match(ENV_EXAMPLE, /verified in the Resend account/i);
});

test("the honeypot and timing field names are shared, not duplicated as literals", () => {
  assert.equal(typeof CONTACT_HONEYPOT_FIELD, "string");
  assert.equal(typeof CONTACT_ELAPSED_FIELD, "string");
  assert.match(FORM_SRC, /\[CONTACT_HONEYPOT_FIELD\]/);
  assert.match(FORM_SRC, /\[CONTACT_ELAPSED_FIELD\]/);
});
