/**
 * Oversized numeral motif used across Programs/Membership/Why Choose Us for
 * visual variety instead of icon+card repetition. Accepts an optional
 * className so callers can layer a state-driven accent tint (e.g. active
 * item emphasis) without forking the component.
 */
export function IndexNumeral({ value, className = "" }: { value: string; className?: string }) {
  return (
    <span
      className={`select-none font-mono text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-none text-(--text-primary)/10 transition-colors duration-300 ${className}`}
      aria-hidden="true"
    >
      {value}
    </span>
  );
}
