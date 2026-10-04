/**
 * Tiny, dependency-free tool event emitter. NOT an analytics system.
 *
 * Dispatches a `factory:tool-event` CustomEvent on window and, only if the
 * page already has a `window.dataLayer` array (e.g. a clone that installed a
 * tag manager), pushes the same event there. No provider is loaded, nothing
 * is sent anywhere by this module, and payloads carry enum values only —
 * never free text, message content or personal data.
 */

export const TOOL_EVENT = "factory:tool-event";

export type ToolEventProps = Record<string, string | number | boolean>;

export function emitToolEvent(name: string, props: ToolEventProps = {}): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(TOOL_EVENT, { detail: { name, ...props } }));
    const layer = (window as unknown as { dataLayer?: unknown }).dataLayer;
    if (Array.isArray(layer)) layer.push({ event: name, ...props });
  } catch {
    /* events must never break the tool */
  }
}
