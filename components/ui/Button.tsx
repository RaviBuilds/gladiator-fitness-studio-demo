import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "factory-focus inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold tracking-wide uppercase transition-colors duration-200";

const variants: Record<Variant, string> = {
  // PRIMARY action — the strongest brand signal.
  primary:
    "bg-(--accent) text-(--accent-foreground) hover:bg-(--accent-hover)",
  // SECONDARY action — neutral at rest, secondary brand colour on hover.
  secondary:
    "border border-(--border) text-(--text-primary) hover:border-(--brand-secondary-border) hover:text-(--brand-secondary)",
  // TERTIARY action — text only.
  ghost: "text-(--text-primary) hover:text-(--brand-secondary) underline-offset-4 hover:underline",
};

/**
 * Same visual language as Button but renders a real <button type="submit">
 * for use inside forms (ContactForm). Kept separate from Button, which is
 * link-only, rather than overloading Button with a polymorphic `as` prop.
 */
export function SubmitButton({
  variant = "primary",
  children,
  className = "",
  disabled,
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`${base} ${variants[variant]} disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * Same visual language as Button, but a real <button type="button"> for
 * in-page controls that are not navigation and not form submission (the
 * /start check's Back/Next/Start-over). Kept beside SubmitButton rather than
 * making Button polymorphic, and reuses the exact same base/variants so the
 * control can never drift out of sync with the site button system.
 */
export function ActionButton({
  variant = "primary",
  children,
  className = "",
  disabled,
  onClick,
  ...rest
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "onClick" | "disabled" | "type"
>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * Fixed CTA primitive. Accent-aware but shape/behavior never changes per
 * gym. External hrefs use a plain anchor; internal hrefs use next/link.
 */
export function Button({
  href,
  variant = "primary",
  children,
  className = "",
  ...rest
}: {
  href: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className">) {
  const classes = `${base} ${variants[variant]} ${className}`;
  const isExternal =
    href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:");

  if (isExternal) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
