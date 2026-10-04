import type { WhatsAppConfig } from "./types";

/**
 * Shared WhatsApp deep-link helpers.
 *
 * The site builds `wa.me` links in several places (the homepage action, the
 * Reviews section, the new /start tool). Centralising the construction here
 * keeps a single encoding convention across the whole site instead of
 * repeating the same template literal in each caller.
 *
 * This is deliberately independent of components/sections/intervalLog.ts's
 * `withCtaMessage` (Section 07's own, test-covered helper) — these are the
 * general-purpose builders the rest of the site uses.
 */

/**
 * Build the canonical site-wide WhatsApp href from the business config. Strips
 * every non-digit from the number and URL-encodes the message (the supplied
 * `message`, falling back to the business default) so the link always carries
 * a prefilled text.
 */
export function buildWhatsAppHref(whatsapp: WhatsAppConfig, message?: string): string {
  const digits = whatsapp.number.replace(/[^\d]/g, "");
  const text = encodeURIComponent(message ?? whatsapp.message);
  return `https://wa.me/${digits}?text=${text}`;
}

/**
 * Swap the prefilled `text` on an existing WhatsApp href for a contextual
 * message, leaving a href that carries no `text` parameter (a tel:/custom
 * link) untouched. Normalises URLSearchParams' "+" space encoding back to
 * "%20" so one encoding is used everywhere. Any malformed href is returned
 * unchanged rather than throwing.
 */
export function appendWhatsAppMessage(baseHref: string, message: string): string {
  try {
    const url = new URL(baseHref);
    if (!url.searchParams.has("text")) return baseHref;
    url.searchParams.set("text", message);
    url.search = url.search.replace(/\+/g, "%20");
    return url.toString();
  } catch {
    return baseHref;
  }
}


/**
 * True when a configured WhatsApp number can plausibly form a wa.me link:
 * 8–15 digits once formatting is stripped (E.164 allows at most 15). Tools use
 * this to fall back to a call link / copy-only instead of a broken wa.me URL.
 */
export function isUsableWhatsAppNumber(number: unknown): boolean {
  if (typeof number !== "string") return false;
  if (/[^\d\s+()-]/.test(number)) return false;
  const digits = number.replace(/[^\d]/g, "");
  return digits.length >= 8 && digits.length <= 15;
}
