/**
 * Contact inquiry email template.
 *
 * A standalone pure renderer: no project imports, no environment access, no
 * credentials. Labels, subject pattern and provenance line are passed in by
 * the caller (app/api/contact/route.ts, from lib/contact.ts), so this file is
 * reusable as-is by any gym clone and testable in isolation.
 *
 * Deliberately a string renderer rather than a React Email component — the
 * project ships zero email dependencies, and one notification does not justify
 * adding a rendering library.
 *
 * Every visitor-supplied value is HTML-escaped here, and the subject can never
 * carry a header break.
 */

export interface ContactInquiryEmailInput {
  /** Normalized, validated submission. `email` is "" when not supplied. */
  values: { name: string; phone: string; email: string; message: string };
  /** Field labels, reused from the Contact section config. */
  labels: { name: string; phone: string; email: string; message: string };
  /** Subject pattern. `{name}` and `{business}` are the supported tokens. */
  subjectTemplate: string;
  /** Provenance line, e.g. "Website contact form". */
  sourceLabel: string;
  /** Gym name, from lib/business.ts. */
  businessName: string;
  /** ISO timestamp of receipt. */
  receivedAt: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/** Escapes the five characters that can break out of HTML text or attributes. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Strips CR/LF and clamps length. A subject line must never be able to carry a
 * header break, whatever a visitor types into the name field.
 */
export function sanitizeSubject(value: string, maxLength = 120): string {
  const flattened = value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  return flattened.length > maxLength ? `${flattened.slice(0, maxLength - 1)}…` : flattened;
}

/** Fills the configured subject pattern and makes it header-safe. */
export function buildInquirySubject(
  subjectTemplate: string,
  values: { name: string; businessName: string }
): string {
  return sanitizeSubject(
    subjectTemplate.replace("{name}", values.name).replace("{business}", values.businessName)
  );
}

const LABEL_STYLE =
  "font:600 11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:0.14em;text-transform:uppercase;color:#71717a;";
const VALUE_STYLE =
  "font:400 15px/1.55 -apple-system,Segoe UI,Arial,sans-serif;color:#18181b;";
const ROW_STYLE = "padding:14px 0;border-bottom:1px solid #e4e4e7;";

function row(label: string, valueHtml: string): string {
  return `<div style="${ROW_STYLE}"><p style="margin:0 0 4px;${LABEL_STYLE}">${escapeHtml(
    label
  )}</p><div style="margin:0;${VALUE_STYLE}">${valueHtml}</div></div>`;
}

/** Renders the inquiry notification: subject, HTML body and plain-text body. */
export function renderContactInquiryEmail(input: ContactInquiryEmailInput): RenderedEmail {
  const { values, labels, sourceLabel, businessName, receivedAt } = input;

  const subject = buildInquirySubject(input.subjectTemplate, {
    name: values.name,
    businessName,
  });

  const rows = [
    row(labels.name, escapeHtml(values.name)),
    row(labels.phone, escapeHtml(values.phone)),
    ...(values.email
      ? [
          row(
            labels.email,
            `<a href="mailto:${escapeHtml(values.email)}" style="color:#18181b;">${escapeHtml(
              values.email
            )}</a>`
          ),
        ]
      : []),
    row(labels.message, escapeHtml(values.message).replace(/\n/g, "<br />")),
  ].join("");

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f4f4f5;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;">
      <div style="padding:20px 24px;border-bottom:2px solid #18181b;">
        <p style="margin:0;${LABEL_STYLE}">${escapeHtml(sourceLabel)}</p>
        <h1 style="margin:6px 0 0;font:600 18px/1.3 -apple-system,Segoe UI,Arial,sans-serif;color:#18181b;">${escapeHtml(
          businessName
        )}</h1>
      </div>
      <div style="padding:8px 24px 20px;">
        ${rows}
        <p style="margin:18px 0 0;font:400 12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;color:#71717a;">
          Submitted from: ${escapeHtml(sourceLabel)}<br />
          Received: ${escapeHtml(receivedAt)}
        </p>
      </div>
    </div>
  </body>
</html>`;

  const text = [
    sourceLabel.toUpperCase(),
    businessName,
    "",
    `${labels.name}: ${values.name}`,
    `${labels.phone}: ${values.phone}`,
    ...(values.email ? [`${labels.email}: ${values.email}`] : []),
    "",
    `${labels.message}:`,
    values.message,
    "",
    `Submitted from: ${sourceLabel}`,
    `Received: ${receivedAt}`,
  ].join("\n");

  return { subject, html, text };
}
